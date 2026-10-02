import type { Dictionary } from "./en";

const es: Dictionary = {
  meta: {
    description:
      "Barbería premium. Reserva tu corte, encuentra tu sucursal y gestiona tus visitas.",
  },
  a11y: {
    skipToContent: "Saltar al contenido",
  },
  language: {
    label: "Idioma",
  },
  nav: {
    label: "Principal",
    home: "Inicio",
    services: "Servicios",
    branches: "Sucursales",
    account: "Cuenta",
  },
  welcome: {
    title: "Descubre tu mejor versión hoy",
    lead: "Cortes precisos, barbas impecables y un estilo que es solo tuyo.",
    start: "Comenzar",
    sheetTitle: "Te damos la bienvenida",
    sheetLead: "Inicia sesión o crea tu cuenta para reservar en segundos.",
  },
  auth: {
    back: "Volver",
    loginTitle: "Bienvenido de vuelta",
    loginLead: "Inicia sesión para reservar y gestionar tus citas.",
    registerTitle: "Crea tu cuenta",
    registerLead:
      "Reserva más rápido y ten todas tus visitas en un solo lugar.",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone: "Teléfono",
    phoneHint: "Opcional, para recordatorios de tu reserva.",
    password: "Contraseña",
    passwordHint: "Mínimo 8 caracteres.",
    togglePassword: "Mostrar contraseña",
    login: "Iniciar sesión",
    register: "Crear cuenta",
    noAccount: "¿Eres nuevo?",
    toRegister: "Crea una cuenta",
    haveAccount: "¿Ya tienes cuenta?",
    toLogin: "Inicia sesión",
    or: "o",
    guest: "Explorar sin cuenta",
    errors: {
      required: "Este campo es obligatorio.",
      email: "Ingresa un correo válido.",
      passwordMin: "Usa al menos 8 caracteres.",
      passwordMax: "Usa como máximo 128 caracteres.",
      name: "Ingresa tu nombre (de 2 a 80 caracteres).",
      phone: "Ingresa un teléfono válido.",
      unavailable:
        "El inicio de sesión aún no está disponible. Puedes explorar sin cuenta.",
    },
  },
  home: {
    greeting: "Hola",
    lead: "¿Listo para tu próximo corte?",
    heroTitle: "Tu próximo corte, a pocos toques",
    book: "Reservar",
    services: "Servicios populares",
    seeAll: "Ver todos",
    team: "El equipo",
  },
  branch: {
    label: "Sucursal",
    hours: "Horario",
    directions: "Cómo llegar",
    call: "Llamar",
  },
  services: {
    title: "Servicios",
    lead: "Cada servicio empieza con una conversación.",
    minutes: "min",
    duration: "Duración",
    price: "Precio",
    others: "Otros servicios",
    all: "Todos los servicios",
  },
  booking: {
    title: "Reserva tu hora",
    barber: "Barbero",
    date: "Fecha",
    time: "Hora",
    pickTime: "Elige una hora",
    noSlots:
      "Sin horas libres en las próximas dos semanas. Prueba con otro barbero.",
    submit: "Reservar",
    confirmedTitle: "¡Reserva lista!",
    confirmedLead: "Te esperamos. Llega 5 minutos antes.",
    home: "Volver al inicio",
    errors: {
      required: "Elige barbero, fecha y hora.",
      slotTaken: "Esa hora se acaba de ocupar. Elige otra.",
      unavailable:
        "Las reservas en línea aún no están disponibles. Llama a la sucursal para agendar.",
    },
  },
  branches: {
    title: "Sucursales",
    lead: "Elige la que te quede más cerca.",
  },
  account: {
    title: "Cuenta",
    guestTitle: "Estás navegando como invitado",
    guestLead:
      "Inicia sesión o crea una cuenta para reservar y ver tus visitas.",
    instagram: "Síguenos en Instagram",
  },
  notFound: {
    title: "Página no encontrada",
    body: "La página que buscas no existe o cambió de lugar.",
    home: "Volver al inicio",
  },
};

export default es;
