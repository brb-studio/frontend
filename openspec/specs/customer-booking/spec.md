# customer-booking Specification

## Purpose
La experiencia del cliente: reservar, pagar en línea (tarjeta o transferencia con Stripe) o por transferencia manual si la barbería lo permite, y administrar sus citas. Las reglas de fondo (horarios, precios, cancelación) son del backend (specs `availability`, `booking`, `promotions` y `appointment-payments`). Código: `src/features/booking/`, `src/features/payments/` y `src/features/account/`.

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

### Requirement: Pago en línea al reservar
Si la barbería tiene pagos en línea (`payments.online`), al presionar "Reservar" SHALL abrirse una ventana para elegir cuánto (anticipo o completo, si hay anticipo) y cómo (tarjeta o transferencia), con el monto como texto, nunca como campo editable. Los montos mostrados siguen la regla del API, pero el cobro real MUST salir de la respuesta del API. Sin anticipo obligatorio, también se puede "Reservar sin pagar ahora".

#### Scenario: Barbería que exige anticipo
- **WHEN** la barbería pide 25% y el corte cuesta 250.00
- **THEN** la ventana ofrece "Anticipo · $63.00" y "Pagar completo · $250.00", sin opción de reservar sin pagar

#### Scenario: Cita muy próxima
- **WHEN** la cita empieza antes de que termine el apartado por transferencia (60 minutos)
- **THEN** la transferencia aparece deshabilitada y solo se puede pagar con tarjeta

### Requirement: Barberías que cobran en dólares
Si la barbería cobra en USD, la ventana de pago SHALL ofrecer solo tarjeta (incluidas Apple Pay, Google Pay y Link, según el navegador) y MUST NOT mostrar la transferencia, ni al reservar ni para cambiar de método. Los montos estimados usan el mínimo de USD 0.50 y redondean el anticipo al dólar completo.

#### Scenario: Reserva en una barbería en USD
- **WHEN** un cliente abre la ventana de pago de una barbería que cobra en USD
- **THEN** solo ve la opción de tarjeta

### Requirement: Pagar con tarjeta
El formulario de tarjeta SHALL ser el Payment Element de Stripe, con Stripe.js cargado de `js.stripe.com` y nunca empaquetado. Los datos de la tarjeta MUST ir del navegador a Stripe sin pasar por el frontend ni el API. Mientras no se pague, el cliente puede cambiar a transferencia.

#### Scenario: Tarjeta rechazada
- **WHEN** Stripe rechaza la tarjeta
- **THEN** se muestra el motivo y el cliente puede intentar con otra antes de la hora límite

### Requirement: Pagar por transferencia con Stripe
Con transferencia, la pantalla SHALL mostrar la CLABE que genera Stripe, el banco, la referencia y el monto exacto con botones de copiar, y la hora límite. En los dos métodos, la pantalla MUST consultar el estado cada pocos segundos hasta que el webhook confirme el pago.

#### Scenario: Pago con tarjeta
- **WHEN** Stripe acepta la tarjeta
- **THEN** se muestra "Procesando tu pago…" hasta que el API confirma, y luego el comprobante

#### Scenario: Se acabó el tiempo
- **WHEN** el apartado vence sin pago
- **THEN** se explica que el horario se liberó y que no se cobró nada, con un botón para reservar de nuevo

### Requirement: Monto reembolsable a la vista
Antes de pagar, la ventana de pago SHALL decir cuánto se devuelve si el cliente cancela a tiempo ("Si cancelas a tiempo te devolvemos $X; la comisión bancaria no es reembolsable"), y la confirmación de cancelación de una cita pagada lo repite. El monto MUST ser el `refundableMinor` que devuelve el API, nunca calculado en el navegador.

#### Scenario: Cancelar una cita pagada
- **WHEN** el cliente va a cancelar a tiempo una cita de 300.00 pagada con tarjeta
- **THEN** la confirmación dice que se le devuelven $283.99

### Requirement: Página de pago
`/{lang}/pay/{id}` SHALL retomar un pago: es el regreso de 3-D Secure y el destino de "Completar pago". Un invitado MUST traer su `paymentToken` en `?token=`; un cliente con sesión no lo necesita.

#### Scenario: Regreso de 3-D Secure
- **WHEN** el banco regresa al cliente a la página de pago
- **THEN** la página muestra el estado actual y, una vez confirmado, el comprobante

### Requirement: Comprobante
Una cita pagada SHALL mostrar en la confirmación, en Cuenta y en la página de pago: tipo (anticipo o completo), método (tarjeta con marca y últimos 4, o transferencia), lo pagado y lo que resta pagar en la sucursal. Una cita `pending_payment` MUST aparecer en Próximas con la hora límite, "Completar pago" y "Cancelar".

#### Scenario: Anticipo pagado
- **WHEN** el cliente pagó el anticipo de 63.00 de una cita de 250.00
- **THEN** su cita dice "Anticipo pagado con tarjeta visa •••• 4242 · Resta $187.00"

### Requirement: Pago por transferencia manual
Si la barbería acepta transferencias manuales (`payments.transfer`) y la cita se reservó sin pagar en línea, la confirmación SHALL ofrecer "Pagar por transferencia" con titular, CLABE, importe exacto y vigencia, que el navegador pide al API (un invitado, con su `paymentToken`). El importe y la cuenta MUST venir del API. Pagar es opcional y la cita sigue confirmada.

#### Scenario: Barbería sin transferencias
- **WHEN** `payments.transfer` es falso
- **THEN** la confirmación no ofrece pagar por transferencia

### Requirement: Mis citas
Un cliente con sesión SHALL ver sus citas en Cuenta, y puede cancelar o reprogramar las que el API permita. Para reprogramar, se le ofrecen solo los horarios libres del mismo barbero con la duración original. Después de cancelar o mover una cita, la lista MUST actualizarse.

#### Scenario: Reprogramar una cita
- **WHEN** el cliente elige un horario nuevo para su cita
- **THEN** la cita aparece con la hora nueva sin recargar la página
