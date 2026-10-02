const en = {
  meta: {
    description:
      "Premium barbershop. Book your cut, find your branch and manage your visits.",
  },
  a11y: {
    skipToContent: "Skip to content",
  },
  language: {
    label: "Language",
  },
  nav: {
    label: "Main",
    home: "Home",
    services: "Services",
    branches: "Branches",
    account: "Account",
  },
  welcome: {
    title: "Discover your best look today",
    lead: "Sharp cuts, clean beards and a style that's all yours.",
    start: "Get started",
    sheetTitle: "Welcome",
    sheetLead: "Sign in or create an account to book in seconds.",
  },
  auth: {
    back: "Back",
    loginTitle: "Welcome back",
    loginLead: "Sign in to book and manage your appointments.",
    registerTitle: "Create your account",
    registerLead: "Book faster and keep all your visits in one place.",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    phoneHint: "Optional, for booking reminders.",
    password: "Password",
    passwordHint: "At least 8 characters.",
    togglePassword: "Show password",
    login: "Sign in",
    register: "Create account",
    noAccount: "New here?",
    toRegister: "Create an account",
    haveAccount: "Already have an account?",
    toLogin: "Sign in",
    or: "or",
    guest: "Explore without an account",
    errors: {
      required: "This field is required.",
      email: "Enter a valid email.",
      passwordMin: "Use at least 8 characters.",
      passwordMax: "Use at most 128 characters.",
      name: "Enter your name (2 to 80 characters).",
      phone: "Enter a valid phone number.",
      unavailable:
        "Sign-in isn't available yet. You can explore without an account.",
    },
  },
  home: {
    greeting: "Hello",
    lead: "Ready for your next cut?",
    heroTitle: "Your next cut, a few taps away",
    book: "Book now",
    services: "Popular services",
    seeAll: "See all",
    team: "The team",
  },
  branch: {
    label: "Branch",
    hours: "Hours",
    directions: "Directions",
    call: "Call",
  },
  services: {
    title: "Services",
    lead: "Every service starts with a conversation.",
    minutes: "min",
    duration: "Duration",
    price: "Price",
    others: "Other services",
    all: "All services",
  },
  booking: {
    title: "Book your appointment",
    barber: "Barber",
    date: "Date",
    time: "Time",
    pickTime: "Pick a time",
    noSlots: "No free times in the next two weeks. Try another barber.",
    submit: "Book now",
    confirmedTitle: "You're booked!",
    confirmedLead: "See you there. Please arrive 5 minutes early.",
    home: "Back to home",
    errors: {
      required: "Choose a barber, a date and a time.",
      slotTaken: "That time was just taken. Please pick another one.",
      unavailable:
        "Online booking isn't available yet. Call the branch to book.",
    },
  },
  branches: {
    title: "Branches",
    lead: "Pick the one closest to you.",
  },
  account: {
    title: "Account",
    guestTitle: "You're browsing as a guest",
    guestLead: "Sign in or create an account to book and see your visits.",
    instagram: "Follow us on Instagram",
  },
  notFound: {
    title: "Page not found",
    body: "The page you are looking for does not exist or has moved.",
    home: "Back to home",
  },
};

export type Dictionary = typeof en;
export default en;
