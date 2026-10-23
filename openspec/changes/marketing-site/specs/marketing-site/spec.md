## ADDED Requirements

### Requirement: Landing solo en hosts de marketing
El sitio SHALL mostrar la landing de brb-studio solo cuando el host está en `MARKETING_HOSTS`. Una IP MUST nunca contar como host de marketing. En cualquier otro host, las rutas físicas `/site/*` MUST responder 404.

#### Scenario: Host de marketing
- **WHEN** `MARKETING_HOSTS=www.localhost` y alguien abre `http://www.localhost:3000/es`
- **THEN** ve la landing en español, con la URL `/es`

#### Scenario: La landing no se filtra a una barbería
- **WHEN** alguien abre `http://localhost:3000/site/es` o `http://montecobre.localhost:3000/site/es`
- **THEN** recibe 404

### Requirement: Landing sin barbería ni terceros
La landing MUST NOT llamar al API ni a `getTenant()`, MUST NOT pedir recursos de otro origen y MUST NOT ser instalable como PWA.

#### Scenario: API apagado
- **WHEN** el API no responde y alguien abre la landing
- **THEN** la página carga completa

### Requirement: Solo claims verdaderos
La landing SHALL publicar un único precio (MXN 300 al mes, por transferencia SPEI) y MUST NOT anunciar alta autoservicio, cobro con tarjeta de la suscripción, anticipos en línea, "cero comisiones" ni comisión de plataforma.

#### Scenario: Visitante busca el precio
- **WHEN** alguien llega a la sección de precio
- **THEN** ve "MXN 300 al mes" y que se paga por SPEI, y ningún otro plan

### Requirement: Contacto configurable
El botón "Agenda una demo" SHALL abrir WhatsApp con un mensaje prellenado si existe `MARKETING_WHATSAPP`; si no, un correo a `MARKETING_EMAIL`; si no hay ninguno, la página MUST decir que el contacto se publicará pronto, sin enlaces rotos.

#### Scenario: Sin número todavía
- **WHEN** `MARKETING_WHATSAPP` y `MARKETING_EMAIL` están vacíos
- **THEN** el botón lleva a la sección de contacto, que avisa que pronto se publicarán

### Requirement: Aviso de privacidad propio
El host de marketing SHALL servir en `/{lang}/privacy` el aviso de brb-studio como responsable, distinto del aviso de cada barbería. Los datos de identidad pendientes MUST mostrarse como "Pendiente".

#### Scenario: Pie de página
- **WHEN** alguien sigue "Aviso de privacidad" desde la landing
- **THEN** llega a `/{lang}/privacy` del mismo host con el aviso de brb-studio
