# Demo local: barberías, usuarios y puertos

Guía rápida para probar el portal completo en tu máquina: frontend (este repo) + backend (`../magicstudio-backend`) + MongoDB local.

## Puertos

| Qué | Dirección | Notas |
|---|---|---|
| Frontend (Next.js) | `http://localhost:3000` | Abre MagicStudio (`DEFAULT_TENANT_HOST`). Cada barbería en su subdominio: `http://magicstudio.localhost:3000`, `http://elite.localhost:3000` |
| Backend (API) | `http://127.0.0.1:4000` | `GET /health` → `{"status":"ok"}`. Solo lo llama el servidor de Next, nunca el navegador |
| MongoDB | `127.0.0.1:27017` | Replica set `rs0`. Base `magicstudio` (dev) y `magicstudio_test` (tests). No toca otras bases |

## Arrancar (3 terminales)

```sh
# 1. MongoDB (una vez por arranque de la Mac)
brew services start mongodb-community@8.0

# 2. Backend
cd ~/Documents/magicstudio-backend
bun install
bun run seed      # crea las 2 barberías demo (si ya existen, las salta)
bun run dev       # http://127.0.0.1:4000

# 3. Frontend
cd ~/Documents/magicstudio
bun install
bun run dev       # abre http://localhost:3000 (MagicStudio)
```

Variables ya listas: frontend `.env` (`BACKEND_URL=http://127.0.0.1:4000`, `SITE_URL`, `PROXY_SECRET`, `TENANT_HOST` opcional) y backend `.env` (Mongo local, `PORT=4000`, `PLATFORM_DOMAIN=localhost`, `PROXY_SECRET` (el mismo en los dos repos), llaves VAPID). Las plantillas comentadas están en `.env.example` de cada repo.

## Barberías

| | MagicStudio | Barbería Elite |
|---|---|---|
| URL | http://magicstudio.localhost:3000 | http://elite.localhost:3000 |
| Modelo | Plan `lifetime` (la empresa que compra la app) | Plan `pro` (suscripción) |
| Moneda | USD | MXN |
| Estilo | Acento naranja (default) | Acento azul (theme propio) |
| Sucursales | **Centro** (America/Mexico_City, lun–vie 10–20, sáb 10–18) · **Norte** (America/Tijuana, mar–sáb 11–21) | **Tijuana** (America/Tijuana, lun–sáb 9–19) |
| Servicios | Corte 45 min $35 · Barba 30 min $20 · Afeitado 40 min $30 · Paquete corte + barba $50 | Corte 40 min $250 · Barba 30 min $180 · Fade 50 min $300 · Paquete corte + barba $380 |
| Barberos | Mateo (Centro: corte, barba) · Lucas (Centro: todo) · Andrés (Norte: todo) | Carlos (todo) · Diego (corte, fade) |
| Promociones | 15% primera visita (automática, sin código) · `VERANO`: $5 menos, 100 usos | `BIENVENIDO`: 10% primera visita |

## Usuarios

Contraseña de **todas** las cuentas demo: `demo1234`

Las cuentas son por barbería: una cuenta de Elite no entra en MagicStudio (y al revés).

El equipo (owner, admin, encargado, barberos) entra directo al panel `/es/admin` y no ve la parte de clientes; los clientes nunca ven el panel.

| Barbería | Email | Rol | Qué ve en el panel (`/es/admin`) |
|---|---|---|---|
| MagicStudio | `owner@magicstudio.test` | owner | Todo: agenda, servicios, barberos, sucursales, ausencias, promociones, equipo, ajustes |
| MagicStudio | `admin@magicstudio.test` | admin | Lo mismo que el owner (no puede tocar al owner ni nombrar admins) |
| MagicStudio | `encargado@magicstudio.test` | manager (Centro) | Inicio, agenda, barberos, sucursales y ausencias, solo de Centro |
| MagicStudio | `mateo@magicstudio.test` | barber (Mateo, Centro) | Inicio con avisos en vivo y push, su agenda y sus ausencias |
| MagicStudio | `andres@magicstudio.test` | barber (Andrés, Norte) | Igual que Mateo, para Andrés |
| MagicStudio | `cliente@magicstudio.test` | customer | Reservar con su cuenta, `Cuenta → mis citas`, cancelar |
| Elite | `owner@elite.test` | owner | Todo, de Elite |
| Elite | `carlos@elite.test` | barber (Carlos) | Avisos, agenda y ausencias de Carlos |
| Elite | `cliente@elite.test` | customer | Reservar y ver sus citas en Elite |

## Qué probar

1. **Reservar como invitado**: Servicios → Corte → sucursal → barbero → fecha → hora → nombre y teléfono → Confirmar. Prueba el código `VERANO` o deja que se aplique el 15% de primera visita.
2. **Aviso al barbero en vivo**: en una ventana entra como `mateo@magicstudio.test` y abre el panel. En otra ventana (incógnito) reserva con Mateo. El aviso aparece al instante en el panel de Mateo y su agenda se actualiza sola.
3. **Doble reserva imposible**: dos ventanas intentando la misma hora con el mismo barbero. Una confirma y la otra recibe "Esa hora se acaba de ocupar. Elige otra.".
4. **Cliente con cuenta**: entra como `cliente@magicstudio.test`, reserva, ve la cita en Cuenta y cancélala.
5. **Panel admin** (`http://localhost:3000/es/admin`): como owner sube fotos a servicios, paquetes, barberos y sucursales (se comprimen en el navegador), crea un corte o un paquete nuevo, cambia horarios de una sucursal, da de alta una ausencia (no deja si choca con citas), crea una promoción, invita a alguien del equipo (te da una contraseña temporal) y cambia el color del tema en Ajustes.
6. **Multi-tenant**: abre `elite.localhost:3000`. Otro nombre, otro color, precios en MXN y otros barberos, con el mismo código.

## Notificaciones en el celular (push)

- El backend ya tiene llaves VAPID en su `.env` local (`bun run vapid:keys` genera otras).
- En la misma computadora funciona directo: Panel → "Activar notificaciones en el teléfono" → aceptar el permiso.
- En un celular real hace falta **HTTPS** (service workers y push solo funcionan en contextos seguros; `localhost` es la única excepción y solo en la misma máquina). Publica el frontend con un dominio HTTPS (o un túnel) y, si el host no es el de la barbería, fija `TENANT_HOST=magicstudio.localhost` en `.env.local`. Para el túnel usa `bun run build && bun run start` (el servidor de desarrollo bloquea hosts que no conoce).
- **iPhone** (iOS 16.4+): Safari → Compartir → "Agregar a inicio", abre la app desde el ícono y activa las notificaciones en el panel. Safari no da push a páginas sin instalar.
- **Android** (Chrome): funciona desde el navegador; instalarla (menú → "Instalar app") la hace sentir nativa.

## Empezar de cero

`bun run seed` solo agrega las barberías que falten. Para dejar la base dev vacía y volver a sembrar (borra todo lo de `magicstudio`, nada más):

```sh
mongosh --quiet "mongodb://127.0.0.1:27017/?replicaSet=rs0" --eval 'db.getSiblingDB("magicstudio").dropDatabase()'
cd ~/Documents/magicstudio-backend && bun run seed
```

## Estado

Hecho: backend fases 1–8 (tenants, sucursales, cuentas y roles, barberos y ausencias, catálogo y paquetes, disponibilidad, reservas sin doble booking, promociones, avisos en vivo + Web Push), frontend conectado (TanStack Query, sesión httpOnly, reserva real, mis citas, panel admin por rol, PWA instalable).


Lo que falta y por dónde seguir: [`BREAKPOINT.md`](BREAKPOINT.md).
