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

### Requirement: Pagos con tarjeta en el panel
En `/admin/payments`, owner y admin SHALL ver el estado de la cuenta de Stripe de la barbería y lo que Stripe aún pide, con un botón para activar o continuar el registro en el formulario de Stripe y otro para ver sus depósitos en el panel Express. Al regresar de Stripe, el panel MUST releer el estado desde el API; si el enlace venció, pide uno nuevo solo.

#### Scenario: Enlace de registro vencido
- **WHEN** Stripe regresa al owner a `/admin/payments?stripe=refresh`
- **THEN** el panel pide un enlace nuevo y lo lleva otra vez al formulario

### Requirement: Comisiones pendientes
Si la barbería debe comisiones por reembolsos que hizo, `/admin/payments` SHALL mostrar el monto (`feeDebtMinor` del API) y explicar que se descuenta de sus siguientes cobros en línea. Sin deuda, MUST NOT mostrarse nada.

#### Scenario: Reembolso hecho por la barbería
- **WHEN** el owner reembolsa completa una cita pagada con tarjeta
- **THEN** el panel de pagos muestra la comisión pendiente

### Requirement: Aviso para barberías en dólares
Si la barbería cobra en una moneda distinta de MXN, `/admin/payments` SHALL avisar que Stripe le deposita en pesos a su CLABE, al tipo de cambio del día y con 2% de comisión de conversión, así que lo recibido no coincide exactamente con lo cobrado. Las comisiones pendientes MUST mostrarse en su propia moneda.

#### Scenario: Owner de una barbería en USD
- **WHEN** el owner abre `/admin/payments`
- **THEN** ve el aviso de depósito en pesos y conversión

### Requirement: Anticipo en el panel
Con la cuenta de Stripe activa, owner y admin SHALL configurar el anticipo como porcentaje del precio. La cola de confirmación manual MUST mostrar solo transferencias manuales, nunca pagos en línea.

#### Scenario: Regreso del formulario de Stripe
- **WHEN** el owner vuelve a `/admin/payments?stripe=return`
- **THEN** el panel consulta el estado actual en el API en lugar de suponer que la cuenta ya está lista

### Requirement: Pago visible en la agenda
Cada cita de la agenda SHALL mostrar su pago en una línea: "Anticipo pagado con tarjeta · Resta $187", "Pagado completo por transferencia", "Esperando transferencia", "Pago manual pendiente" o "En disputa". Owner y admin MUST poder reembolsar una cita pagada en línea, con confirmación.

#### Scenario: Barbero en la agenda
- **WHEN** un barbero abre la agenda
- **THEN** ve el estado del pago de sus citas pero no el botón de reembolsar

### Requirement: Mi cuenta en el panel
Cada miembro del equipo SHALL tener una sección Mi cuenta con su nombre, correo y rol, el cambio de contraseña y el botón de cerrar sesión.

#### Scenario: Cambio de contraseña
- **WHEN** un barbero cambia su contraseña desde Mi cuenta
- **THEN** ve la confirmación y sigue con sesión en ese dispositivo
