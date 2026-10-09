# staff-panel Specification

## Purpose
El panel del equipo (owner, admin, encargado y barberos): quién entra, qué secciones ve cada rol, cómo se navega y qué hace cada pantalla principal. El API aplica los mismos permisos en cada petición; ver `../backend/openspec/specs`. Código: `src/app/[lang]/(admin)/` y `src/features/admin/`.

## Requirements

### Requirement: Solo el equipo entra al panel
`/{lang}/admin` SHALL mandar a `/{lang}/login` a quien no tiene sesión y a `/{lang}/home` a un cliente. Una sección que el rol no tiene MUST responder 404, para no revelar que existe.

#### Scenario: Cliente abre el panel
- **WHEN** un cliente con sesión abre `/es/admin`
- **THEN** termina en `/es/home`

#### Scenario: Barbero abre Servicios
- **WHEN** un barbero abre `/es/admin/services`
- **THEN** la respuesta es 404

### Requirement: El equipo no ve la tienda
Al iniciar sesión, el equipo SHALL entrar directo a `/{lang}/admin` y los clientes a `/{lang}/home`. Si alguien del equipo con sesión abre la bienvenida, el login, el registro o cualquier página de cliente (inicio, servicios, sucursales, cuenta), MUST terminar en el panel.

#### Scenario: Barbero abre la app instalada
- **WHEN** un barbero con sesión abre `/es`
- **THEN** termina en `/es/admin`

### Requirement: Secciones por rol
Cada rol SHALL ver solo sus secciones:
- `owner`: todas, incluida Suscripción.
- `admin`: todas menos Suscripción.
- `manager`: Hoy, Agenda, Barberos, Sucursales, Tiempo libre y Mi cuenta.
- `barber`: Hoy, Agenda, Tiempo libre y Mi cuenta.

#### Scenario: Menú de un encargado
- **WHEN** un manager abre el panel
- **THEN** el menú no muestra Servicios, Promociones, Equipo, Ajustes ni Suscripción

### Requirement: Navegación agrupada
El menú SHALL agrupar las secciones en Día a día, Catálogo, Negocio y Tú, mostrando solo los grupos con secciones del rol. En computadora es una barra lateral que se desplaza si no cabe. En el teléfono es una barra de pestañas sólida y fija abajo. Si el rol tiene más de 5 secciones, la barra muestra las primeras 4 y "Más"; "Más" abre una hoja opaca sobre la barra, que se cierra con Esc, tocando fuera o al elegir una sección.

#### Scenario: Owner en el teléfono
- **WHEN** el owner abre el panel en un teléfono
- **THEN** ve Hoy, Agenda, Servicios, Barberos y Más, y en Más el resto de sus secciones agrupadas

#### Scenario: Barbero en el teléfono
- **WHEN** un barbero abre el panel en un teléfono
- **THEN** ve sus 4 secciones como pestañas, sin "Más"

### Requirement: Resumen del día
La sección Hoy SHALL mostrar cuatro datos, que se actualizan solos cuando llega un aviso en vivo:
- Citas de hoy: confirmadas y completadas del día del dispositivo.
- La siguiente cita confirmada que aún no termina.
- Ingresos esperados del día.
- Avisos sin leer.

También muestra la activación de notificaciones push y la agenda de 7 días con avisos en vivo.

#### Scenario: Llega una reserva
- **WHEN** un cliente reserva para hoy con el barbero que tiene el panel abierto
- **THEN** sin recargar, sube el contador de citas de hoy y aparece el aviso

### Requirement: Nueva cita desde la agenda
La agenda SHALL permitir registrar a quien llega sin cita o reserva por teléfono. El flujo es:
1. Elegir sucursal, servicio o paquete, y fecha.
2. Elegir un horario libre por barbero, con las reglas del staff (sin anticipación mínima).
3. Capturar nombre y teléfono del cliente.

Al confirmar, la agenda MUST mostrar el día de la cita nueva.

#### Scenario: Horario ocupado mientras se capturaba
- **WHEN** otro cliente toma el horario antes de confirmar
- **THEN** se muestra el error del API y la cita no se crea

### Requirement: Mi cuenta en el panel
Cada miembro del equipo SHALL tener una sección Mi cuenta con su nombre, correo y rol, el cambio de contraseña y el botón de cerrar sesión.

#### Scenario: Cambio de contraseña
- **WHEN** un barbero cambia su contraseña desde Mi cuenta
- **THEN** ve la confirmación y sigue con sesión en ese dispositivo
