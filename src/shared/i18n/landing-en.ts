/**
 * Copy for the brb-studio marketing site (not the tenant app). Every claim here must hold in the
 * product today: see openspec/changes/marketing-site/proposal.md, "Claims we do not make".
 */
const landingEn = {
  meta: {
    title: "brb-studio · Booking, cash desk and customers for barbershops",
    description:
      "Online booking with no double bookings, a cash desk that adds up at closing and a stamp card that brings customers back. For one chair or many branches, under your shop's name. MXN 300 a month.",
    ogAlt: "brb-studio: your barbershop, in order. Even when you're not there.",
  },
  a11y: {
    skip: "Skip to content",
    home: "brb-studio, home",
    nav: "Main",
    language: "Language",
    footer: "Footer",
  },
  nav: {
    product: "Product",
    pricing: "Pricing",
    contact: "Contact",
  },
  cta: {
    demo: "Book a demo",
    sample: "See a sample shop",
    whatsapp:
      "Hi, I have a barbershop with __ branches and I'd like to see brb-studio.",
    whatsappSolo:
      "Hi, I work on my own at my barbershop and I'd like to see brb-studio.",
    soloLink: "Do you work alone? Write to us",
    emailSubject: "brb-studio demo",
    emailBody: "Hi, I have a barbershop and I'd like to see brb-studio.",
    pending: "Our WhatsApp and email go live soon. We'll publish them here.",
    newTab: "(opens WhatsApp)",
    notice:
      "If you write to us, brb-studio uses your name and contact details only to answer you and schedule the demo.",
    noticeLink: "Privacy notice",
  },
  hero: {
    time: "21:04",
    eyebrow: "Software for barbershops",
    title: ["Your barbershop, in", "order.", "Even when you're not there."],
    sub: "Online booking with no double bookings, a cash desk that adds up at closing and customers who come back. For one chair or many branches, with your name and your color.",
    strip: "Montecobre Barber Co. · Polanco · Providencia · San Pedro",
    stripNote: "Sample shop, fictional data",
  },
  booking: {
    time: "09:12",
    label: "Booking",
    title: ["Five steps. One slot, and it belongs to only", "one."],
    sub: "Customers pick service, branch, barber, day and a free time. If two go for the same slot, one confirms and the other picks another time.",
    steps: [
      { title: "Branch", body: "The one closest to them." },
      { title: "Barber", body: "Each one with their monogram." },
      { title: "Day", body: "The one that suits them." },
      { title: "Time", body: "Free slots only, in the branch's time." },
      { title: "Confirm", body: "With the final price and any promotion." },
    ],
    taken: "That time was just taken. Pick another.",
    takenLabel: "What the second customer sees",
    reminder:
      "A day before and two hours before, they get a reminder by email and phone notification.",
    stripLabel: "The five booking steps",
  },
  solo: {
    time: "11:40",
    label: "In the chair",
    title: ["For the barber who runs their own", "shop."],
    body: "You own the shop and you cut. One tap on “Yes, I take clients too” and customers book with you. Your day on your phone, and a new booking rings even with the app closed. You're still the owner.",
    footnote:
      "On iPhone, notifications need the app added to the Home Screen (iOS 16.4 or later).",
  },
  branches: {
    time: "14:05",
    label: "Another branch",
    title: ["Each branch with its own", "clock."],
    body: "Each branch with its own timezone, hours and team. And managers who only see their own. New bookings show up in the panel instantly.",
    clocksLabel: "Example: two branches, two timezones",
    clocks: [
      { city: "Mexico City", zone: "America/Mexico_City" },
      { city: "Tijuana", zone: "America/Tijuana" },
    ],
    rolesLabel: "Roles",
    roles: ["Owner", "Admin", "Manager", "Barber", "Customer"],
  },
  loyalty: {
    time: "17:30",
    label: "They come back",
    title: ["The stamp card that never gets", "lost."],
    body: "Swap the paper card for one in their account: “every 6th visit, 50% off your cut”. It counts itself from their bookings, and a no-show doesn't count. And you see every customer: visits, no-shows, spend and next appointment.",
    card: "Your loyalty card",
    progress: "4 of 6 visits",
    stampsLabel: "Stamp card: {n} of {total} visits",
    note: "Your customer list shows the latest 50 and finds anyone by name, email or phone.",
  },
  ledger: {
    time: "21:04",
    label: "Closing",
    title: ["Close the day", "balanced."],
    body: "When a cut is done you mark how they paid: cash, card or transfer. At closing, the cash desk tells you what should be there, by method and by person. Count, compare, go home.",
    second:
      "And when you want the month: revenue per day, average ticket and what's left after your barbers' commissions.",
    receipt: {
      caption: "Example cash count · Polanco branch",
      method: "Method",
      amount: "Amount",
      rows: [
        ["Cash", "MXN 2,450.00"],
        ["Card", "MXN 4,180.00"],
        ["Transfer", "MXN 1,100.00"],
      ],
      total: "Should be there",
      totalAmount: "MXN 7,730.00",
      note: "Example figures. The cash desk is a report: you count the drawer and compare.",
    },
  },
  brand: {
    time: "—",
    label: "Your brand",
    title: ["Your name on the", "door."],
    body: "Your subdomain, your color, your photos. Customers see your shop, not ours, and can add it to their home screen like an app.",
    legend: "Try a color",
    swatches: [
      { name: "Orange", value: "orange" },
      { name: "Blue", value: "blue" },
      { name: "Verdigris", value: "verdin" },
    ],
    specimen: "Montecobre",
    specimenSub: "Barber Co.",
  },
  rest: {
    title: ["The rest, handled", "too."],
    items: [
      {
        title: "Promotions",
        body: "A discount on the first visit and codes with a usage cap.",
      },
      {
        title: "Waitlist",
        body: "“Tell me if it frees up”, with a direct link when a slot opens.",
      },
      {
        title: "Time off",
        body: "It can't be saved over booked appointments.",
      },
      {
        title: "Reserved products",
        body: "Customers set them aside with a pickup code and collect them at the counter.",
      },
      {
        title: "Barber payouts",
        body: "Each barber's commission, calculated.",
      },
      {
        title: "Your customers' privacy",
        body: "A privacy notice and “Delete my account” built into their account.",
      },
      {
        title: "Spanish and English",
        body: "Each visitor sees the app in their language.",
      },
    ],
  },
  start: {
    title: ["Getting started is a", "conversation."],
    steps: [
      "We set up branches, services, barbers and your color with you.",
      "If you cut too, you add yourself as a barber in one step.",
      "You share the link.",
    ],
    priceLabel: "Price",
    price: "MXN 300",
    period: "a month",
    payment: "Paid by SPEI bank transfer.",
    plan: "One plan for every shop.",
    trial: "You start with a 14-day trial.",
  },
  closing: {
    title: ["See a barbershop", "running."],
    titleNoSample: ["Let's talk about your", "shop."],
    subBoth: "Open the sample shop or book 20 minutes with us.",
    subDemo: "Book 20 minutes with us.",
    subSample: "Open the sample shop and look around.",
  },
  footer: {
    privacy: "Privacy notice",
    contact: "Contact",
    credits: "Photos: Unsplash (Unsplash License).",
    sample:
      "Montecobre Barber Co. is a fictional sample shop; its screenshots use made-up data.",
    rights: "© {year} brb-studio",
  },
  shots: {
    pending: "Screenshot coming soon",
    welcome:
      "Montecobre Barber Co. welcome screen on a phone: shop photo and the button to get started.",
    "booking-branch": "Booking, step 2: choosing the branch.",
    "booking-barber": "Booking, step 3: barbers shown as monograms.",
    "booking-date": "Booking, step 4: days with room.",
    "booking-time": "Booking, step 5: grid of free times.",
    "booking-confirm":
      "Booking confirmation with service, barber, time and price.",
    "become-barber": "“Do you take clients too?” card in the owner's My day.",
    "my-day": "My day: the barber's appointments in order, on a phone.",
    branches: "List of the shop's branches in the admin panel.",
    agenda: "One branch's agenda for the day in the admin panel.",
    loyalty: "Loyalty card in the customer's account, 4 of 6 visits.",
    customers:
      "Customer list with visits, no-shows, spend and next appointment.",
    counter:
      "Completing an appointment: buttons to mark cash, card or transfer.",
    cash: "Cash desk for the day: totals by method, by person and every movement.",
    revenue:
      "Revenue this month: bars per day, revenue, what's left after commissions and average ticket.",
    settings: "Settings: choosing the shop's theme color.",
  },
  privacy: {
    title: "Privacy notice",
    metaTitle: "Privacy notice · brb-studio",
    description:
      "How brb-studio uses the data you share when you contact us, and your ARCO rights.",
    updated: "Last updated: {date}",
    pending: "Pending",
    draft:
      "Draft pending legal review. Items marked “Pending” will be completed before launch.",
    back: "Back to home",
    controller: {
      title: "Who is responsible for your data",
      body: "{name} (“brb-studio”) is responsible for the personal data collected through this website.",
      address: "Address: {address}.",
      contact: "Privacy contact: {contact}.",
    },
    data: {
      title: "What data we use",
      body: [
        "If you write to us by WhatsApp or email: your name, your phone number or email, and what you tell us about your barbershop.",
        "This website sets no cookies of its own and uses no analytics or advertising tools.",
        "We do not use sensitive personal data.",
      ],
    },
    purposes: {
      title: "What we use it for",
      body: [
        "Answering you, scheduling and giving the demo you ask for.",
        "If you hire brb-studio: setting up your barbershop and contacting you about your subscription.",
      ],
      note: "We do not sell your data or use it for third-party advertising.",
    },
    processors: {
      title: "Who else handles it",
      body: "WhatsApp (Meta) or your email provider carry the messages you send us. The website is hosted on Vercel. We do not share your data with third parties for their own purposes.",
    },
    shops: {
      title: "If you are a customer of a barbershop",
      body: "Each barbershop that uses brb-studio is responsible for its customers' data and publishes its own privacy notice in its app. brb-studio handles that data only on the barbershop's behalf, as a processor.",
    },
    rights: {
      title: "Your ARCO rights",
      body: "You can access, rectify or cancel your data, object to its use and revoke your consent by writing to the privacy contact above. We will reply within the legal deadlines.",
    },
    changes: {
      title: "Changes to this notice",
      body: "We will publish any change on this page with its update date.",
    },
  },
  notFound: {
    title: "This page doesn't exist.",
    body: "Maybe the link is old. The home page has everything.",
    back: "Back to home",
  },
};

export type LandingDictionary = typeof landingEn;
export type ShotCopyId = Exclude<keyof LandingDictionary["shots"], "pending">;

export default landingEn;
