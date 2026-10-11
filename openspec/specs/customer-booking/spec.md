# customer-booking Specification

## Purpose
La experiencia del cliente: reservar, pagar por transferencia si la barbería lo permite y administrar sus citas. Las reglas de fondo (horarios, precios, cancelación) son del backend (specs `availability`, `booking`, `promotions` y `appointment-payments`). Código: `src/features/booking/` y `src/features/account/`.

## Requirements

### Requirement: Flujo de reserva
La reserva SHALL seguir este orden:
1. Sucursal, barbero, fecha y hora.
2. Si no hay sesión, nombre y teléfono.
3. Código promocional opcional, con cotización en vivo.
4. Confirmar.

Los horarios MUST refrescarse solos cada 30 segundos mientras la página está abierta, y también después de reservar.

#### Scenario: Alguien más tomó el horario
- **WHEN** el API responde `SLOT_TAKEN` al confirmar
- **THEN** se muestra "Esa hora se acaba de ocupar. Elige otra." y los horarios se vuelven a cargar

### Requirement: Pago por transferencia opcional
Si la barbería acepta transferencias (`payments.transfer`) y la cita tiene total mayor a 0, la confirmación SHALL ofrecer "Pagar por transferencia": al abrirla, el navegador pide los datos al API y muestra titular, CLABE (con botón de copiar), el importe exacto y la vigencia, y aclara que la barbería confirma el pago cuando llegue el dinero. El importe y la cuenta MUST venir siempre del API. Un invitado pide los datos con el `paymentToken` de su reserva. Pagar es opcional: el cliente puede cerrar la ventana o elegir pagar en sucursal y la cita sigue confirmada. En Cuenta, la cita muestra "Pago por confirmar" o "Pagada" según el estado.

#### Scenario: Barbería sin transferencias
- **WHEN** `payments.transfer` es falso
- **THEN** la confirmación no ofrece pagar

### Requirement: Mis citas
Un cliente con sesión SHALL ver sus citas en Cuenta, y puede cancelar o reprogramar las que el API permita. Para reprogramar, se le ofrecen solo los horarios libres del mismo barbero con la duración original. Después de cancelar o mover una cita, la lista MUST actualizarse.

#### Scenario: Reprogramar una cita
- **WHEN** el cliente elige un horario nuevo para su cita
- **THEN** la cita aparece con la hora nueva sin recargar la página
