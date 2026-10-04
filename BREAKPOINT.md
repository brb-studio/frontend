# Breakpoint (2026-10-03)

Dónde quedó el desarrollo y por dónde seguir. Cómo arrancar, barberías y usuarios demo: [`DEMO.md`](DEMO.md).

## Estado verificado al cerrar

| Repo | Checks | Resultado |
|---|---|---|
| `magicstudio-backend` | `bun run lint && bun run typecheck && bun run test && bun run test:int` | Limpio · 52 unitarios + 88 de integración (MongoDB local real) |
| `magicstudio` | `bun run lint && bun run typecheck && bun run test` | Limpio · 50 unitarios |

Probado a mano contra servidores reales: login de las cuentas demo, una cuenta de Elite rechazada en MagicStudio (401), panel y Cuenta renderizan, proxy de disponibilidad del panel, cita sin reserva creada (con el 15% de primera visita), la misma hora otra vez → `SLOT_TAKEN`, cambio de contraseña (actual incorrecta → 403, las otras sesiones se cierran).

## Hecho en el último tramo

- **Seed demo**: 2 barberías (`magicstudio` USD lifetime, `elite` MXN pro), 9 cuentas con `demo1234`.
- **Variables de entorno** correctas en los dos repos (plantillas en cada `.env.example`):
  - frontend: `BACKEND_URL` con `http://`, `SITE_URL`, `PROXY_SECRET`, `TENANT_HOST` opcional y `TRUSTED_PROXY_HOPS` opcional;
  - backend: Mongo local, `PORT`, `PLATFORM_DOMAIN`, `PROXY_SECRET` (el mismo que en el frontend) y VAPID.
- **Panel → Agenda → "Nueva cita"** para quien llega sin cita o reserva por teléfono (`src/features/admin/new-appointment-form.tsx`).
- **Cuenta → "Cambiar contraseña"** (`src/features/auth/password-form.tsx`, acción `changePassword`).
- **Límites de intentos en MongoDB**:
  - colección `rateLimits`, con un upsert atómico por intento, así que todas las instancias comparten la cuenta;
  - TTL y llaves hasheadas (`magicstudio-backend/src/db/rate-limit.ts`).
- **IP real del visitante**:
  - el frontend toma la IP que escribió su propio proxy, contando `TRUSTED_PROXY_HOPS` desde la derecha de `X-Forwarded-For`, y la manda con `PROXY_SECRET`;
  - el backend solo acepta esa IP si llega con el secreto (comparación en tiempo constante); si no, usa la del socket;
  - `PROXY_SECRET` es obligatorio en producción.

## Después del breakpoint (mismo día)

- **El equipo solo ve el panel**:
  - al entrar, owner, admin, encargado y barberos van a `/es/admin`;
  - si abren una página de cliente o la bienvenida, los manda al panel;
  - los clientes que intentan entrar al panel vuelven a `/es/home`.
- **Panel rediseñado** en su propio grupo de rutas `src/app/[lang]/(admin)`, con la misma URL:
  - en computadora, barra lateral con íconos, nombre de la barbería, usuario y rol, y botón para salir;
  - en el celular, barra de pestañas flotante con "Más";
  - "Hoy" tiene cuatro tarjetas (citas de hoy, siguiente cita, ingresos esperados, avisos sin leer) que se actualizan solas con cada reserva;
  - la sección nueva "Mi cuenta" tiene datos, cambio de contraseña y salir.
- **Fotos**:
  - backend: `POST /v1/images` y `GET /images/:id` (colección `images` en Mongo, tipo validado por bytes, máximo 1 MB);
  - frontend: proxy `/api/images/[id]` y el campo `ImageField`, que comprime a JPEG de 1600 px en el navegador;
  - hay fotos en servicios, paquetes, barberos y sucursales; la foto del barbero también aparece al reservar.
- **Cortes y paquetes**: los paquetes ya se pueden editar, ambos tienen descripción y el nombre de URL se arma solo con el nombre.
- Verificado: backend con 52 unitarios y 92 de integración; frontend con 52 unitarios y build de producción. Redirecciones probadas para cada rol, y foto probada de punta a punta en build de producción (subida, proxy, optimizador de Next y página del cliente). Falta probar en un navegador real la compresión y subida desde el formulario.

## Siguiente, en orden

### 1. Reprogramar una cita desde el panel
- Ya existe: `PATCH /v1/appointments/:id` con `{ startAt, barberId }`. `reschedule()` vuelve a validar dentro de la transacción e ignora la propia cita (`assertFree(..., appointment._id)`).
- Falta en el backend: `GET /v1/appointments/:id/slots?from=&days=&barberId=`. Debe usar la duración guardada en la cita (`bookedMinutes(items)`), no la del catálogo actual. También los servicios que exige (`bookedServiceIds`), para ofrecer solo barberos que los hagan. Y debe excluir la propia cita de los ocupados (si no, su hora y las que se le enciman salen tomadas).
- Falta en el frontend: un botón "Reprogramar" en cada cita confirmada de `agenda-manager.tsx`, con fecha y horarios por barbero (el mismo selector de `new-appointment-form.tsx`) y luego `PATCH`. Hay que agregar la ruta `appointments/:id/slots` a `src/features/admin/paths.ts`.

### 2. Lista de clientes
- Backend: `GET /v1/customers?q=` para owner, admin y manager.
  - Agregar `aggregate` a `scope()` en `src/db/scoped.ts`, que siempre anteponga `{ $match: { tenantId } }`.
  - `$lookup` a `appointments` (`localField: _id → customerId`, con `$match: { tenantId }` adentro) para sacar visitas (`completed`), faltas, gasto total, última visita y próxima cita.
  - Búsqueda con regex escapado sobre nombre, teléfono y correo; límite de 50; collation `es`.
- Frontend: sección "Clientes" con buscador. Agregar a `sections.ts` (por rol), a `paths.ts`, a los diccionarios y a la página `admin/customers`.

### 3. Reportes de ingresos por barbero y día
- Backend: `GET /v1/reports/revenue?from=&to=&branchId=` (fechas locales, máximo 92 días).
  - Owner y admin ven todo; el manager solo su sucursal (`visibleBranchIds`).
  - `$match` por `startAt` en una ventana UTC ensanchada, y luego la fecha local con `$dateToString` usando `timezone: "$timeZone"` (cada cita ya guarda su zona).
  - Agrupar por día y barbero: citas, atendidas, faltas, canceladas, `revenueMinor` (atendidas) y `expectedMinor` (confirmadas + atendidas).
- Frontend: sección "Reportes" con una tabla por día y barbero y sus totales.

### 4. Decisiones pendientes (no borro nada sin tu OK)
- Backend: `src/shared/rate-limit.ts` y su test, el limitador viejo en memoria, quedaron sin uso. ¿Los borro?
- Frontend: los 4 archivos de booking que borré antes. Hay copias de 3 en `Documents/magicstudio-removed-files/`; `slots.test.ts` no tiene copia. ¿Los restauro o los dejo borrados?
- Frontend: `.env.local` repite `BACKEND_URL` y le gana a `.env`. ¿Lo borro?

### 5. Lo que depende de ti
- **Cobro de suscripciones (Stripe)**: cuenta, precios y planes. Los límites actuales por plan son de ejemplo.
- **Deploy**:
  - dominio con comodín (`*.tudominio.com`) y HTTPS, sin el cual no llega push al celular;
  - MongoDB de producción con usuario y TLS;
  - el Dockerfile está sin verificar;
  - fijar `TRUSTED_PROXY_HOPS` según el hosting;
  - `NODE_ENV=production`, que exige `PROXY_SECRET`.
- **Correo o SMS** para "olvidé mi contraseña" y para confirmaciones y recordatorios.
- **Almacenamiento de imágenes** para fotos de barberos y servicios.

### 6. Repos
- Ninguno de los dos CI ha corrido. El paso de e2e del frontend va a fallar: las e2e están en pausa y `playwright.config.ts` y `tests/e2e` siguen esperando el modo demo viejo.
- No hay commits.

## Servidores al cerrar
- Frontend `next dev` en el 3000: el tuyo.
- Backend `bun --watch src/main.ts` en el 4000: lo dejé corriendo en segundo plano para que tu frontend funcione. Si prefieres levantarlo en tu terminal: `lsof -ti tcp:4000 | xargs kill` y luego `bun run dev` en `magicstudio-backend`.
