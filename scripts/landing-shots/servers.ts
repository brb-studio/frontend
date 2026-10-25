// Starts (and stops) an isolated backend + `next start` pair for the landing screenshots.
// Dedicated ports and database so nothing collides with dev (3000/4000) or e2e (3200/4100).
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const BACKEND_PORT = 4200;
export const FRONTEND_PORT = 3400;
export const MONGO_DB = "brb-showcase";
export const TENANT_HOST = "montecobre.localhost";
export const BACKEND = `http://127.0.0.1:${BACKEND_PORT}`;
export const FRONTEND = `http://127.0.0.1:${FRONTEND_PORT}`;

const frontendDir = path.resolve(import.meta.dirname, "../..");
const backendDir = path.resolve(frontendDir, "../backend");
const nextBin = path.join(frontendDir, "node_modules/next/dist/bin/next");
export const logDir = path.join(tmpdir(), "brb-landing-shots", "logs");

/** Only the variables a process needs to run, so no secret from the shell or a .env leaks in. */
function baseEnv() {
  const keep = [
    "PATH",
    "Path",
    "SystemRoot",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "HOME",
    "APPDATA",
    "LOCALAPPDATA",
    "ComSpec",
    "PATHEXT",
    "WINDIR",
  ];
  const env: Record<string, string> = {};
  for (const key of keep) {
    const value = process.env[key];
    if (value) env[key] = value;
  }
  return env;
}

function bunPath() {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
  const local = path.join(home, ".bun", "bin", "bun.exe");
  return existsSync(local) ? local : "bun";
}

async function up(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitFor(url: string, name: string, ms = 120_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await up(url)) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${name} did not come up at ${url} (logs: ${logDir})`);
}

/** Running `next build`/`next dev` in this frontend (another agent's build would swap .next under us). */
export function nextProcesses(): string[] {
  if (process.platform !== "win32") {
    const out = spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }).stdout;
    return out.split("\n").filter((l) => /next(\.js)?\s+(build|dev)/.test(l));
  }
  const out = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match '\\bnext\\W{0,2}\\s+(build|dev)\\b' } | ForEach-Object { $_.CommandLine }",
    ],
    { encoding: "utf8" },
  ).stdout;
  return out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.includes("Get-CimInstance"));
}

export function build() {
  const busy = nextProcesses();
  if (busy.length) {
    throw new Error(
      `another next build/dev is running; not building over it:\n  ${busy.join("\n  ")}`,
    );
  }
  console.log("› next build (frontend/.next)…");
  const res = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: frontendDir,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
  if (res.status !== 0) throw new Error("next build failed");
}

export type Servers = { stop: () => void };

export async function start(): Promise<Servers> {
  if (await up(`${BACKEND}/health`)) {
    throw new Error(
      `port ${BACKEND_PORT} is busy; stop it or run without --serve`,
    );
  }
  if (await up(`${FRONTEND}/es/login`)) {
    throw new Error(
      `port ${FRONTEND_PORT} is busy; stop it or run without --serve`,
    );
  }
  if (!existsSync(path.join(frontendDir, ".next", "BUILD_ID"))) {
    throw new Error("no production build in frontend/.next: pass --build");
  }
  mkdirSync(logDir, { recursive: true });
  // Throwaway secret shared by both processes: never the one in a .env.
  const secret = randomBytes(32).toString("hex");
  const children: ChildProcess[] = [];
  const log = (name: string) => {
    const fd = openSync(path.join(logDir, `${name}.log`), "w");
    return fd;
  };

  const backendLog = log("backend");
  children.push(
    spawn(bunPath(), ["--no-env-file", "src/main.ts"], {
      cwd: backendDir,
      stdio: ["ignore", backendLog, backendLog],
      env: {
        ...baseEnv(),
        NODE_ENV: "development",
        MONGO_URL: "mongodb://127.0.0.1:27017/?replicaSet=rs0",
        MONGO_DB,
        PORT: String(BACKEND_PORT),
        PLATFORM_DOMAIN: "localhost",
        PROXY_SECRET: secret,
      },
    }),
  );
  const frontendLog = log("frontend");
  children.push(
    spawn(
      process.execPath.endsWith("bun.exe") || process.execPath.endsWith("bun")
        ? "node"
        : process.execPath,
      [nextBin, "start", "-H", "127.0.0.1", "-p", String(FRONTEND_PORT)],
      {
        cwd: frontendDir,
        stdio: ["ignore", frontendLog, frontendLog],
        env: {
          ...baseEnv(),
          NODE_ENV: "production",
          BACKEND_URL: BACKEND,
          TENANT_HOST,
          DEFAULT_TENANT_HOST: TENANT_HOST,
          SITE_URL: FRONTEND,
          PROXY_SECRET: secret,
        },
      },
    ),
  );
  closeSync(backendLog);
  closeSync(frontendLog);

  const stop = () => {
    for (const child of children) {
      if (!child.pid || child.exitCode !== null) continue;
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } else child.kill("SIGTERM");
    }
  };
  try {
    await waitFor(`${BACKEND}/health`, "backend");
    await waitFor(`${FRONTEND}/es/login`, "frontend");
  } catch (error) {
    stop();
    throw error;
  }
  console.log(
    `› servers up: api ${BACKEND} · web ${FRONTEND} · logs ${logDir}`,
  );
  return { stop };
}
