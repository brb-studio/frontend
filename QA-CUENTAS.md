# QA local: barberías y cuentas de prueba

Datos para probar la app a mano y anotar bugs. Todo vive en el MongoDB **local** (`127.0.0.1:27017`, replica set `rs0`, base `magicstudio`); nada toca el cluster.

**Contraseña de todas las cuentas: `demo1234`**

Las cuentas son por barbería: una cuenta de Elite no entra en MagicStudio (y al revés).

## Sembrar / volver a empezar

```sh
cd backend
bun run seed:qa
```

- Cada vez que se corre **borra y vuelve a crear** las 3 barberías (MagicStudio, Elite, GhostBarber). Lo que hayas agregado a mano en cualquiera de ellas **se pierde**. Otras barberías de la base no se tocan.
- La agenda es relativa a "ahora": vuelve a correrlo cuando quieras datos frescos (citas de hoy, caja del día, lista de espera).
- No usar junto con `bun run seed` (ese crea un MagicStudio básico distinto; `seed:qa` lo reemplaza si lo encuentra).

URLs (con el frontend en `bun run dev`):

| Barbería | URL | Estado |
|---|---|---|
| MagicStudio | http://magicstudio.localhost:3000 (o `http://localhost:3000`) | Bien establecida, ~1 año de uso |
| Barbería Elite | http://elite.localhost:3000 | A medias, ~3 semanas de uso |
| GhostBarber | http://ghostbarber.localhost:3000 | Recién creada, vacía |

Panel del equipo: `/es/admin`. Clientes: reservar y `Cuenta → mis citas`.

---

## 1. MagicStudio: bien establecida

Plan `pro`, MXN, acento verde, 3 sucursales **en Tijuana** (Zona Río, Playas y Otay; hora de Tijuana), 10 barberos, 82 clientes y ~3,900 citas (un año hacia atrás y dos semanas hacia adelante): completadas, canceladas, no-shows, cobros en caja (efectivo/tarjeta/transferencia), comisiones, 2 pagos de comisión (payouts), 9 productos con stock y 41 pedidos, lista de espera (7), ausencias (6), notificaciones (84), lealtad y fotos.

| Email | Rol | Nombre | Notas |
|---|---|---|---|
| `owner@magicstudio.test` | owner | Ricardo Montes | Ve todo. También corta en Zona Río mar–jue (perfil de barbero sin comisión) |
| `admin@magicstudio.test` | admin | Daniela Ferrer | Como el owner, sin tocar al owner ni nombrar admins |
| `polanco@magicstudio.test` | manager | Mariana Robles | Encargada de **Zona Río** (el email conserva el nombre interno de la sucursal) |
| `providencia@magicstudio.test` | manager | Héctor Ibarra | Encargado de **Playas** |
| `sanpedro@magicstudio.test` | manager | Paola Cantú | Encargada de **Otay** |
| `emilio@magicstudio.test` | barber | Emilio Varela | Zona Río · 50 % comisión · head barber |
| `santiago@magicstudio.test` | barber | Santiago Ríos | Zona Río · 45 % |
| `iker@magicstudio.test` | barber | Iker Montaño | Zona Río · 40 % |
| `rodrigo@magicstudio.test` | barber | Rodrigo Llamas | Playas · 45 % |
| `mauricio@magicstudio.test` | barber | Mauricio Ochoa | Playas · 45 % |
| `valeria@magicstudio.test` | barber | Valeria Cuevas | Playas · 50 % |
| `andres@magicstudio.test` | barber | Andrés Garza Leal | Otay · 45 % |
| `joaquin@magicstudio.test` | barber | Joaquín Treviño | Otay · 40 % |
| `luisfernando@magicstudio.test` | barber | Luis Fernando Salas | Otay · 45 % |
| `cliente@magicstudio.test` | customer | Sebastián Herrera | Cliente frecuente: 9 citas pasadas, 2 próximas, lealtad 4/6, un pedido de producto apartado |
| `c001@clientes.magicstudio.test` … `c070@clientes.magicstudio.test` | customer | varios | 70 clientes más con cuenta (además hay 10 invitados sin cuenta y 1 cliente eliminado) |

Promociones: Primera visita (automática) · Cada 6.ª visita 50 % (lealtad, automática) · `COBRE100` ($100 menos) · `RITUAL` (10 % en el paquete Ritual) · `BUENFIN` · `VERANO` (inactiva, ya venció).

## 2. Barbería Elite: a medias

Plan `pro`, MXN, acento azul, sucursales en **Ciudad de México** (a propósito: es la única con otra hora que Tijuana, para probar zonas horarias; ahí la app muestra "Hora de la sucursal"). Configurada a medias, como una barbería que apenas empezó:

- **Elite Roma** (lun–sáb 9–19) en uso, y **Elite Coyoacán** recién dada de alta, **sin barberos**.
- Servicios: Corte $250 (con foto y descripción), Barba $180 (con foto, sin descripción), Fade $300 (sin foto ni descripción), Perfilado de ceja (**desactivado**). Paquete Corte + barba $380 sin foto.
- **Carlos** tiene cuenta, foto y 40 % de comisión. **Diego** no tiene cuenta, foto ni comisión, y tiene vacaciones de dentro de 3 a 5 días.
- Sin productos, sin portada, sin SPEI.
- ~100 citas en 3 semanas, de menos a más (completadas con cobro en caja, algunas canceladas y no-shows), más algunas próximas.
- Promoción `BIENVENIDO`: 10 % en la primera visita.

| Email | Rol | Nombre | Notas |
|---|---|---|---|
| `owner@elite.test` | owner | Jorge Elizondo | |
| `carlos@elite.test` | barber | Carlos Mendoza | Roma |
| `cliente@elite.test` | customer | Luis Ángel Ruiz | 2 cortes pasados con Carlos, 1 próximo |
| `c01@clientes.elite.test` … `c05@clientes.elite.test` | customer | varios | Más 2 clientes invitados sin cuenta |

## 3. GhostBarber: recién creada

Exactamente lo que deja `tenant:create`: plan **trial** (14 días, límite 1 sucursal y 3 barberos) y su owner. Sin sucursales, servicios, barberos, horarios ni tema. Es para hacer todo el arranque a mano: sucursal, horarios, servicios, barberos, invitar equipo, promociones, tema, y luego la primera reserva.

| Email | Rol | Nombre |
|---|---|---|
| `owner@ghostbarber.test` | owner | Dueño GhostBarber |

Los clientes se registran desde la propia barbería. Para probar multi-tenant, regístrate con el mismo email en otra barbería: son cuentas separadas.

---

## Bugs encontrados

Anota aquí lo que vayas viendo (barbería, cuenta, pasos, qué esperabas, qué pasó):

1.
