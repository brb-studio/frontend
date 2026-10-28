# fiscal-panel Specification

## Purpose
Pantallas de las funciones fiscales opcionales (IVA incluido y facturas CFDI): el ajuste del owner o admin en Ajustes, la cola de solicitudes, y el botón del cliente en Mis citas. El API vive en `../backend/openspec/specs/fiscal/`. Código: `src/features/admin/fiscal-form.tsx`, `src/features/admin/invoices-queue.tsx`, `src/features/account/invoice-request.tsx`.

## Requirements

### Requirement: Ajustes fiscales en Ajustes
El owner y el admin SHALL ver en Ajustes dos interruptores, "Precios con IVA incluido" y "Los clientes pueden pedir factura", apagados si la barbería nunca los encendió. Al activar la facturación SHALL pedir RFC, razón social, régimen fiscal y código postal; el formulario MUST NOT enviar una facturación activa con datos incompletos. Guardar envía un solo `PATCH /tenant`.

#### Scenario: Activar facturación sin datos
- **WHEN** el admin activa la facturación y deja campos vacíos
- **THEN** el servidor responde 422 y el panel muestra el error sin cambiar nada

#### Scenario: Desactivar conserva los datos
- **WHEN** el admin apaga la facturación sin tocar los campos
- **THEN** la barbería queda con facturación apagada y los datos fiscales guardados

### Requirement: Cola de solicitudes de factura
Cuando la facturación está encendida, Ajustes SHALL listar las solicitudes pendientes, las más antiguas primero, con razón social, RFC, importe, régimen, código postal y uso del CFDI. Para cerrar una solicitud el admin captura el UUID del CFDI que emitió en su sistema y pulsa "Marcar emitida", o la cancela. El botón de emitir MUST quedar deshabilitado sin UUID.

#### Scenario: Emitir una factura
- **WHEN** el admin captura un UUID válido y pulsa "Marcar emitida"
- **THEN** la solicitud pasa a "Emitida" y muestra el UUID

#### Scenario: Sin solicitudes
- **WHEN** no hay solicitudes
- **THEN** la sección dice que todavía no hay solicitudes

### Requirement: Pedir factura desde Mis citas
Un cliente SHALL ver "Pedir factura" en cada cita completada solo si la barbería tiene la facturación encendida. El formulario pide RFC, razón social, régimen fiscal (3 dígitos), código postal (5 dígitos) y uso del CFDI (G03 o P01). Al enviarse con éxito, el formulario se reemplaza por un mensaje de confirmación.

#### Scenario: Cita completada en barbería con facturación
- **WHEN** el cliente abre "Pedir factura" en una cita completada y envía datos válidos
- **THEN** ve "Solicitud enviada" y la solicitud aparece para la barbería

#### Scenario: Cita pendiente o barbería sin facturación
- **WHEN** la cita no está completada o la barbería no factura en línea
- **THEN** no aparece el botón

### Requirement: IVA dentro del total
Cuando la barbería tiene IVA encendido, cada cita en Mis citas SHALL mostrar el IVA incluido en su total, calculado por el servidor. Ninguna pantalla MUST recalcular montos por su cuenta.

#### Scenario: Total con IVA
- **WHEN** una cita de 116.00 MXN se muestra con IVA encendido
- **THEN** la línea del total incluye "IVA incl. 16.00"
