export type Service = {
  name: string;
  price: string;
  duration: string;
  description: string;
  featured?: boolean;
};

export const business = {
  name: "Crewe Cut Barber",
  tagline: "Traditional service. Clean modern finish.",
  headline: "Edinburgh barbering with sharp fades, clean lines, and a shop people come back to.",
  intro:
    "Crewe Cut Barber keeps it simple: strong everyday cuts, tidy beard work, fair pricing, and a relaxed local shop that is open seven days a week.",
  phone: "0131 629 4160",
  addressLine1: "218 Boswall Parkway",
  addressLine2: "Edinburgh, EH5 2LX",
  mapUrl:
    "https://www.google.com/maps?q=place_id:ChIJk0ZapCTHh0gRIy6q_9C0GL4&place_id=ChIJk0ZapCTHh0gRIy6q_9C0GL4",
  reviewSummary: "4.7 stars from 120 Google reviews",
  hours: [
    { day: "Monday - Saturday", value: "9:00AM - 7:00PM" },
    { day: "Sunday", value: "10:00AM - 6:00PM" }
  ]
};

export const services: Service[] = [
  {
    name: "Haircut",
    price: "£15",
    duration: "35 min",
    description: "Classic short back and sides, tidy modern shape, and a clean finish.",
    featured: true
  },
  {
    name: "Skin or Zero Fade",
    price: "£17",
    duration: "40 min",
    description: "Detailed blend work with a sharper outline and a stronger finish.",
    featured: true
  },
  {
    name: "Scissor Cut",
    price: "£16",
    duration: "35 min",
    description: "For longer texture, shape control, and a more tailored trim."
  },
  {
    name: "Kids Haircut (Under 12)",
    price: "£13",
    duration: "30 min",
    description: "Simple and clean trim for younger clients."
  },
  {
    name: "Kids Skin or Zero Fade",
    price: "£16",
    duration: "35 min",
    description: "Fade service for under-12s with a cleaner modern finish."
  },
  {
    name: "All Over",
    price: "£12",
    duration: "20 min",
    description: "Quick even clipper cut for clients who want it straightforward."
  },
  {
    name: "Hot Towel Shave",
    price: "£17",
    duration: "30 min",
    description: "Traditional shave service with hot towel prep and a close finish."
  },
  {
    name: "Hot Towel Head Shave",
    price: "£17",
    duration: "30 min",
    description: "Close head shave with hot towel prep."
  },
  {
    name: "Beard Trim and Shape Up",
    price: "£13",
    duration: "20 min",
    description: "Beard clean-up, definition, and shape refinement."
  },
  {
    name: "Beard Trim",
    price: "£8",
    duration: "15 min",
    description: "Simple beard length clean-up."
  },
  {
    name: "Shape Up",
    price: "£8",
    duration: "15 min",
    description: "Quick edge-up for a sharper outline."
  },
  {
    name: "Threading",
    price: "£8",
    duration: "15 min",
    description: "Quick detail clean-up."
  },
  {
    name: "Old Age Pensioner (67+)",
    price: "£13",
    duration: "30 min",
    description: "Reduced-price haircut service."
  },
  {
    name: "Double Zero",
    price: "£5",
    duration: "10 min",
    description: "Very short clipper service."
  },
  {
    name: "Nose Wax and Ear Wax",
    price: "£7",
    duration: "10 min",
    description: "Small grooming add-on."
  }
];

export const gallery = [
  {
    image: "/images/storefront.jpg",
    title: "Street-facing storefront",
    text: "The real front of the shop clients already know on Boswall Parkway."
  },
  {
    image: "/images/interior-wide.jpg",
    title: "Full station line",
    text: "Warm lighting, tidy stations, and a shop floor that feels looked after."
  },
  {
    image: "/images/interior-row.jpg",
    title: "Working interior",
    text: "The actual working space, kept clean, straightforward, and ready for a busy day."
  },
  {
    image: "/images/chairs.jpg",
    title: "Chair detail",
    text: "Classic barber setup with a cleaner, more polished presentation."
  },
  {
    image: "/images/cut-detail.jpg",
    title: "Cut result",
    text: "Close-up finish from a real cut done in the shop."
  },
  {
    image: "/images/fade-finish.jpg",
    title: "Fade finish",
    text: "A clean blend with the kind of detail clients notice straight away."
  },
  {
    image: "/images/client-chair.jpg",
    title: "Service in progress",
    text: "A real chair-side moment from an everyday service in the shop."
  }
];

export const highlights = [
  "Open 7 days",
  "Walk-ins welcome",
  "Straightforward pricing",
  "Classic cuts to skin fades"
];

export const reasons = [
  {
    title: "A proper local standard",
    text: "The work stays clean, the finish stays sharp, and the whole experience feels grounded rather than overdone."
  },
  {
    title: "Easy to trust",
    text: "Real shop photos, visible prices, and direct contact make the decision feel easy before a client even walks in."
  },
  {
    title: "Built for regulars",
    text: "Quick access to call, directions, and booking keeps the site useful for both first visits and repeat customers."
  }
];

export const actionCards = [
  {
    title: "Call the shop",
    text: "Best for same-day availability, quick questions, and walk-in checks.",
    link: "tel:01316294160",
    linkLabel: "0131 629 4160"
  },
  {
    title: "Get directions",
    text: "Open the shop in Google Maps and head straight over.",
    link: business.mapUrl,
    linkLabel: "Open Google Maps"
  },
  {
    title: "Send a request",
    text: "Choose the service you want and send a booking request in a minute or two.",
    link: "#booking",
    linkLabel: "Book now"
  }
];

export const faqs = [
  {
    question: "Do I need an appointment?",
    answer: "No. Walk-ins are welcome, and you can also send a booking request if you want the shop to come back to you with a suitable time."
  },
  {
    question: "What services are most popular?",
    answer: "Haircuts, skin or zero fades, beard work, and scissor cuts are the usual go-to services, and they are all listed clearly on the site."
  },
  {
    question: "When is the shop open?",
    answer: "Monday to Saturday from 9:00AM to 7:00PM, and Sunday from 10:00AM to 6:00PM."
  },
  {
    question: "Where is the shop based?",
    answer: "Crewe Cut Barber is at 218 Boswall Parkway, Edinburgh, EH5 2LX."
  }
];
