import type { LandingDictionary } from "./landing-en";

const landingEs: LandingDictionary = {
  meta: {
    title: "brb-studio · Reservas, caja y clientes para barberías",
    description:
      "Reservas en línea sin citas dobles, una caja que cuadra al cierre y una tarjeta de sellos para que tus clientes vuelvan. Para una silla o varias sucursales, con el nombre de tu barbería. Desde MXN 600 al mes.",
    ogAlt: "brb-studio: tu barbería, en orden. Aunque no estés.",
  },
  a11y: {
    skip: "Saltar al contenido",
    home: "brb-studio, inicio",
    nav: "Principal",
    language: "Idioma",
    footer: "Pie de página",
    menu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },
  nav: {
    product: "Producto",
    pricing: "Planes",
    contact: "Contacto",
  },
  cta: {
    demo: "Agenda una demo",
    sample: "Ver una barbería de ejemplo",
    whatsapp:
      "Hola, tengo una barbería con __ sucursales y quiero conocer brb-studio.",
    whatsappSolo:
      "Hola, trabajo solo en mi barbería y quiero conocer brb-studio.",
    soloLink: "¿Trabajas solo? Escríbenos",
    emailSubject: "Demo de brb-studio",
    emailBody: "Hola, tengo una barbería y quiero conocer brb-studio.",
    pending:
      "Muy pronto publicaremos aquí nuestro WhatsApp y correo de contacto.",
    newTab: "(abre WhatsApp)",
    notice:
      "Si nos escribes, brb-studio usa tu nombre y tus datos de contacto solo para responderte y agendar la demo.",
    noticeLink: "Aviso de privacidad",
  },
  hero: {
    time: "21:04",
    eyebrow: "Software para barberías",
    title: ["Tu barbería, en", "orden.", "Aunque no estés."],
    sub: "Reservas en línea sin citas dobles, tu caja cuadrada al cierre y clientes que vuelven. Para una silla o para varias sucursales, con tu nombre y tu color.",
    strip: "Montecobre Barber Co. · Polanco · Providencia · San Pedro",
    stripNote: "Barbería de ejemplo, datos ficticios",
  },
  booking: {
    time: "09:12",
    label: "Reserva",
    title: ["Cinco pasos. Una hora que solo puede ser de", "uno."],
    sub: "Tu cliente elige servicio, sucursal, barbero, día y hora libre. Si dos van por el mismo lugar, uno confirma y el otro elige otra hora.",
    steps: [
      { title: "Sucursal", body: "La que le queda cerca." },
      { title: "Barbero", body: "Cada uno con su monograma." },
      { title: "Día", body: "El que le acomode." },
      {
        title: "Hora",
        body: "Solo horas libres, en el horario de la sucursal.",
      },
      {
        title: "Confirma",
        body: "Con el precio final y la promoción que aplique.",
      },
    ],
    taken: "Esa hora se acaba de ocupar. Elige otra.",
    takenLabel: "Lo que ve el segundo cliente",
    reminder:
      "Un día antes y dos horas antes, le llega un recordatorio por correo y notificación del teléfono.",
    stripLabel: "Los cinco pasos de la reserva",
  },
  solo: {
    time: "11:40",
    label: "En la silla",
    title: ["Para el barbero que es su propio", "jefe."],
    body: "Eres el dueño y también cortas. Un toque en «Sí, yo también atiendo» y tus clientes reservan contigo. Tu día en el teléfono, y cuando entra una cita, suena aunque la app esté cerrada. Sigues siendo el dueño.",
    footnote:
      "En iPhone, las notificaciones requieren agregar la app a la pantalla de inicio (iOS 16.4 o posterior).",
  },
  branches: {
    time: "14:05",
    label: "Otra sucursal",
    title: ["Cada sucursal con su", "reloj."],
    body: "Cada sucursal con su zona horaria, su horario y su equipo. Y encargados que solo ven la suya. Lo que entra, aparece en el panel al instante.",
    clocksLabel: "Ejemplo: dos sucursales, dos zonas horarias",
    clocks: [
      { city: "Ciudad de México", zone: "America/Mexico_City" },
      { city: "Tijuana", zone: "America/Tijuana" },
    ],
    rolesLabel: "Roles",
    roles: ["Dueño", "Administrador", "Encargado", "Barbero", "Cliente"],
  },
  loyalty: {
    time: "17:30",
    label: "Vuelve",
    title: ["La tarjeta de sellos que no se", "pierde."],
    body: "Cambia la tarjeta de papel por una en su cuenta: «cada 6.ª visita, 50 % en tu corte». Se cuenta sola con sus citas, y una falta no suma. Y tú ves a cada cliente: cuántas veces vino, cuántas faltó, cuánto ha gastado y cuándo vuelve.",
    card: "Tu tarjeta de lealtad",
    progress: "4 de 6 visitas",
    stampsLabel: "Tarjeta de sellos: {n} de {total} visitas",
    note: "Tu lista de clientes muestra los 50 más recientes y encuentra a cualquiera por nombre, correo o teléfono.",
    widget: {
      label: "Widget de sellos en el iPhone",
      name: "Cada 6.ª visita",
      reward: "50 % en tu corte",
      caption:
        "En la pantalla de inicio del iPhone, el cliente ve sus sellos sin abrir la app.",
    },
  },
  ledger: {
    time: "21:04",
    label: "Cierre",
    title: ["Cierra el día", "cuadrado."],
    body: "Al terminar cada corte marcas cómo pagó: efectivo, tarjeta o transferencia. Al cierre, la caja te dice cuánto debe haber, por método y por persona. Cuentas, comparas, a casa.",
    second:
      "Y cuando quieras ver el mes: ingresos por día, ticket promedio y lo que te queda tras las comisiones de tus barberos.",
    receipt: {
      caption: "Corte de caja de ejemplo · sucursal Polanco",
      method: "Método",
      amount: "Monto",
      rows: [
        ["Efectivo", "MXN 2,450.00"],
        ["Tarjeta", "MXN 4,180.00"],
        ["Transferencia", "MXN 1,100.00"],
      ],
      total: "Debe haber",
      totalAmount: "MXN 7,730.00",
      note: "Cifras de ejemplo. La caja es un reporte: tú cuentas el cajón y comparas.",
    },
  },
  brand: {
    time: "—",
    label: "Tu marca",
    title: ["Tu nombre en la", "puerta."],
    body: "Tu subdominio, tu color, tus fotos. Tus clientes ven tu barbería, no la nuestra, y pueden agregarla a su pantalla de inicio como una app.",
    legend: "Prueba un color",
    swatches: [
      { name: "Naranja", value: "orange" },
      { name: "Azul", value: "blue" },
      { name: "Verdín", value: "verdin" },
    ],
    specimen: "Montecobre",
    specimenSub: "Barber Co.",
  },
  rest: {
    title: ["Lo demás, también", "resuelto."],
    items: [
      {
        title: "Promociones",
        body: "Descuento en la primera visita y códigos con límite de usos.",
      },
      {
        title: "Lista de espera",
        body: "«Avísame si se libera», con enlace directo cuando se abre un lugar.",
      },
      {
        title: "Ausencias",
        body: "No se pueden guardar encima de citas agendadas.",
      },
      {
        title: "Productos apartados",
        body: "Tu cliente los aparta con un código de recogida y los recoge en mostrador.",
      },
      {
        title: "Pagos a barberos",
        body: "La comisión de cada quien, calculada.",
      },
      {
        title: "Privacidad para tus clientes",
        body: "Aviso de privacidad y «Borrar mi cuenta» dentro de su cuenta.",
      },
      {
        title: "Español e inglés",
        body: "Cada visitante ve la app en su idioma.",
      },
    ],
  },
  start: {
    title: ["Empezar es una", "conversación."],
    steps: [
      "Configuramos contigo sucursales, servicios, barberos y tu color.",
      "Si atiendes tú, te das de alta como barbero en un paso.",
      "Compartes el enlace.",
    ],
  },
  plans: {
    title: ["Paga por estar", "donde", "están tus clientes."],
    lede: "Tu barbería en la web, en la App Store y en Google Play, con tu propio nombre, ícono y color. Elige dónde quieres estar.",
    firstLabel: "Para empezar",
    firstTitle: "Tu primer plan es de 3 meses",
    laterLabel: "Después",
    laterTitle: "Sigue mes a mes, o paga 6 meses de una vez",
    per: "{months} meses",
    monthly: "al mes",
    equals: "Sale a {amount} al mes.",
    recommended: "Todo incluido",
    from: "Desde",
    payment: "Pago por transferencia SPEI, antes de que empiece cada periodo.",
    currency: "Precios en pesos mexicanos.",
    items: {
      firstIos: {
        name: "iPhone + Web",
        price: "MXN 1,800",
        months: 3,
        perMonth: "MXN 600",
        includes: [
          "Tu app en la App Store",
          "Tu sitio de reservas en la web",
          "Panel del equipo en la web y en la app",
        ],
      },
      firstAndroid: {
        name: "Android + Web",
        price: "MXN 1,800",
        months: 3,
        perMonth: "MXN 600",
        includes: [
          "Tu app en Google Play",
          "Tu sitio de reservas en la web",
          "Panel del equipo en la web y en la app",
        ],
      },
      monthly: {
        name: "Mes a mes",
        price: "MXN 600",
        includes: [
          "Las mismas plataformas de tu primer plan",
          "Sin compromiso más allá del mes que pagas",
        ],
      },
      sixAll: {
        name: "iPhone + Android + Web",
        price: "MXN 3,600",
        months: 6,
        perMonth: "MXN 600",
        includes: [
          "Tu app en la App Store y en Google Play",
          "Tu sitio de reservas en la web",
          "Todas las plataformas, un solo pago",
        ],
      },
      sixApps: {
        name: "iPhone + Android",
        price: "MXN 3,200",
        months: 6,
        perMonth: "unos MXN 533",
        includes: [
          "Tu app en la App Store y en Google Play",
          "Sin sitio de reservas en la web",
        ],
      },
    },
  },
  platforms: {
    title: ["La misma barbería en", "cada", "pantalla."],
    lede: "La web y la app comparten la cuenta, la agenda y los datos: un cliente que reserva en la web ve su cita en la app, y al revés.",
    web: {
      name: "Web",
      sub: "Cualquier navegador, sin instalar nada",
      points: [
        "La dirección propia de tu barbería, para compartir por enlace o QR",
        "Panel del equipo pensado para la computadora, con menú lateral",
        "Pago en línea con tarjeta, con Stripe",
        "Se puede agregar a la pantalla de inicio desde el navegador",
      ],
    },
    app: {
      name: "App para iPhone y Android",
      sub: "La misma app, en la App Store y en Google Play",
      points: [
        "Una app propia con tu nombre, ícono y color, no la nuestra",
        "Notificaciones nativas de reservas, cambios y recordatorios",
        "Escanea el QR de los apartados con la cámara del teléfono",
        "Todo el panel del equipo en tu bolsillo",
      ],
    },
    tableTitle: "Qué hace cada una",
    feature: "Función",
    yes: "Sí",
    no: "No",
    soon: "Próximamente",
    rows: [
      {
        name: "Reserva en línea para tus clientes",
        web: "yes",
        ios: "yes",
        android: "yes",
      },
      {
        name: "Panel del equipo (agenda, caja, catálogo, equipo)",
        web: "yes",
        ios: "yes",
        android: "yes",
      },
      {
        name: "App propia en la tienda, con tu nombre e ícono",
        web: "no",
        ios: "yes",
        android: "yes",
      },
      {
        name: "Notificaciones en el teléfono",
        web: "partial",
        ios: "yes",
        android: "yes",
      },
      {
        name: "Escanear el QR de los apartados",
        web: "yes",
        ios: "yes",
        android: "yes",
      },
      {
        name: "Pago en línea con tarjeta",
        web: "yes",
        ios: "soon",
        android: "soon",
      },
      {
        name: "Pago por transferencia",
        web: "yes",
        ios: "yes",
        android: "yes",
      },
      {
        name: "Funciona en la computadora",
        web: "yes",
        ios: "no",
        android: "no",
      },
      { name: "Sin instalar nada", web: "yes", ios: "no", android: "no" },
    ],
    partial: "Parcial",
    partialNote:
      "En la web, las notificaciones llegan en Android, y en iPhone solo después de agregar el sitio a la pantalla de inicio.",
  },
  closing: {
    title: ["Mira una barbería", "funcionando."],
    titleNoSample: ["Hablemos de tu", "barbería."],
    subBoth: "Abre la de ejemplo o agenda 20 minutos con nosotros.",
    subDemo: "Agenda 20 minutos con nosotros.",
    subSample: "Abre la barbería de ejemplo y recórrela.",
  },
  contactForm: {
    label: "Escríbenos",
    title: "Cuéntanos de tu barbería",
    name: "Tu nombre",
    shop: "Nombre de la barbería",
    phone: "WhatsApp o teléfono",
    size: "¿Cuántas sillas?",
    sizes: ["1 silla", "2 a 4 sillas", "5 o más", "Varias sucursales"],
    message: "Mensaje (opcional)",
    messageHint: "¿Qué te gustaría resolver primero?",
    submit: "Enviar mensaje",
    sending: "Enviando…",
    sentTitle: "¡Listo, {name}!",
    sentBody:
      "Recibimos tu mensaje. Te escribimos por WhatsApp en menos de 24 horas.",
    again: "Enviar otro mensaje",
    demo: "Formulario de demostración: no envía ni guarda datos.",
  },
  footer: {
    privacy: "Aviso de privacidad",
    contact: "Contacto",
    credits: "Fotos: Unsplash (Licencia Unsplash).",
    sample:
      "Montecobre Barber Co. es una barbería de ejemplo; sus capturas usan datos inventados.",
    rights: "© {year} brb-studio",
  },
  shots: {
    pending: "Captura próximamente",
    welcome:
      "Pantalla de bienvenida de Montecobre Barber Co. en un teléfono: foto de la barbería y el botón para empezar.",
    "booking-branch": "Reserva, paso 2: elegir la sucursal.",
    "booking-barber": "Reserva, paso 3: barberos con su monograma.",
    "booking-date": "Reserva, paso 4: días con lugar.",
    "booking-time": "Reserva, paso 5: cuadrícula de horas libres.",
    "booking-confirm":
      "Confirmación de la reserva con servicio, barbero, hora y precio.",
    "become-barber":
      "Tarjeta «¿También atiendes clientes?» en Mi día del dueño.",
    "my-day": "Mi día: las citas del barbero en orden, en el teléfono.",
    branches: "Lista de sucursales de la barbería en el panel.",
    agenda: "Agenda del día de una sucursal en el panel.",
    loyalty: "Tarjeta de lealtad en la cuenta del cliente, 4 de 6 visitas.",
    customers: "Lista de clientes con visitas, faltas, gasto y próxima cita.",
    counter:
      "Completar una cita: botones para marcar efectivo, tarjeta o transferencia.",
    cash: "Caja del día: totales por método, por persona y cada movimiento.",
    revenue:
      "Ingresos de este mes: barras por día, ingresos, lo que te queda tras comisiones y ticket promedio.",
    settings: "Ajustes: elegir el color de la barbería.",
    "app-home":
      "Inicio de la app de Montecobre Barber Co. en un iPhone: botón para reservar y la sucursal con su horario.",
    "app-staff":
      "Panel del equipo en la app: citas de hoy, ingresos esperados y la agenda en vivo.",
  },
  privacy: {
    title: "Aviso de privacidad",
    metaTitle: "Aviso de privacidad · brb-studio",
    description:
      "Cómo usa brb-studio los datos que compartes al contactarnos, y tus derechos ARCO.",
    updated: "Última actualización: {date}",
    pending: "Pendiente",
    draft:
      "Borrador pendiente de revisión legal. Los datos marcados «Pendiente» se completarán antes del lanzamiento.",
    back: "Volver al inicio",
    controller: {
      title: "Quién es responsable de tus datos",
      body: "{name} («brb-studio») es responsable de los datos personales que se recaban a través de este sitio.",
      address: "Domicilio: {address}.",
      contact: "Contacto de privacidad: {contact}.",
    },
    data: {
      title: "Qué datos usamos",
      body: [
        "Si nos escribes por WhatsApp o correo: tu nombre, tu teléfono o correo y lo que nos cuentes de tu barbería.",
        "Este sitio no usa cookies propias ni herramientas de analítica o publicidad.",
        "No usamos datos personales sensibles.",
      ],
    },
    purposes: {
      title: "Para qué los usamos",
      body: [
        "Responderte, agendar y darte la demo que pides.",
        "Si contratas brb-studio: configurar tu barbería y contactarte sobre tu suscripción.",
      ],
      note: "No vendemos tus datos ni los usamos para publicidad de terceros.",
    },
    processors: {
      title: "Quién más los maneja",
      body: "WhatsApp (Meta) o tu proveedor de correo transportan los mensajes que nos envías. El sitio se aloja en Vercel. No entregamos tus datos a terceros para sus propios fines.",
    },
    shops: {
      title: "Si eres cliente de una barbería",
      body: "Cada barbería que usa brb-studio es responsable de los datos de sus clientes y publica su propio aviso de privacidad en su app. brb-studio maneja esos datos solo por encargo de la barbería.",
    },
    rights: {
      title: "Tus derechos ARCO",
      body: "Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso, y revocar tu consentimiento, escribiendo al contacto de privacidad de arriba. Te responderemos en los plazos de ley.",
    },
    changes: {
      title: "Cambios a este aviso",
      body: "Publicaremos cualquier cambio en esta página con su fecha de actualización.",
    },
  },
  notFound: {
    title: "Esta página no existe.",
    body: "Quizá el enlace es viejo. En el inicio está todo.",
    back: "Volver al inicio",
  },
};

export default landingEs;
