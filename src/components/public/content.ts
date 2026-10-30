// Contenido de marketing (mock). El catálogo real de servicios viene de GET /api/client/services;
// aquí solo se enriquece con descripción e ícono por id.

export const BUSINESS = {
  name: "Banquetes Elegancia",
  tagline: "Banquetes y coordinación integral de eventos en Mérida",
  phone: "999 123 4567",
  email: "contacto@banqueteselegancia.mx",
  address: "Calle 60 #452, Centro, Mérida, Yucatán",
  hours: "Lunes a sábado · 9:00 a 19:00",
};

export const SERVICE_DETAILS: Record<number, { description: string; icon: string }> = {
  1: { description: "Menús de autor de tres a cinco tiempos, estaciones y bebidas sin alcohol.", icon: "sparkle" },
  2: { description: "Mixología con bartenders certificados y cristalería completa.", icon: "sparkle" },
  3: { description: "Ambientación floral, iluminación y mantelería a juego con tu estilo.", icon: "sparkle" },
  4: { description: "DJ, grupo versátil o trío; audio profesional para ceremonia y fiesta.", icon: "sparkle" },
  5: { description: "Cobertura fotográfica y de video con entrega de álbum digital.", icon: "sparkle" },
  6: { description: "Animadores, cabina de fotos y actividades para todas las edades.", icon: "sparkle" },
  7: { description: "Meseros, capitanes y coordinadores durante todo el evento.", icon: "users" },
  8: { description: "Traslado de mobiliario, equipo e invitados con unidades propias.", icon: "pin" },
};

export const FALLBACK_SERVICE = {
  description: "Servicio profesional coordinado por nuestro equipo de logística.",
  icon: "sparkle",
};

export const STEPS = [
  { title: "Solicita tu cotización", text: "Cuéntanos fecha, número de invitados y servicios. Recibirás un folio al instante." },
  { title: "Revisamos tu evento", text: "Validamos disponibilidad y asignamos a un coordinador de logística." },
  { title: "Recibe tu propuesta", text: "Te contactamos para afinar detalles y te enviamos una propuesta formal." },
  { title: "Confirma y disfruta", text: "Acepta en línea con tu folio; nosotros nos encargamos del resto." },
];

export const STATS = [
  { value: "15+", label: "años de experiencia" },
  { value: "2,400", label: "eventos realizados" },
  { value: "98%", label: "clientes satisfechos" },
];

export const GALLERY = [
  { title: "Bodas en hacienda", tone: "from-wine to-gold" },
  { title: "Eventos corporativos", tone: "from-ink to-wine" },
  { title: "XV años", tone: "from-gold to-wine-dark" },
  { title: "Cenas privadas", tone: "from-wine-dark to-ink" },
];

export const TESTIMONIALS = [
  {
    quote: "Todo salió perfecto: la comida, el servicio y la puntualidad. Nuestros invitados siguen hablando de la cena.",
    author: "Mariana y Luis",
    event: "Boda · 180 invitados",
  },
  {
    quote: "Poder revisar y aceptar la propuesta en línea nos ahorró muchísimo tiempo. Muy profesionales.",
    author: "Grupo Peninsular",
    event: "Evento corporativo · 300 invitados",
  },
  {
    quote: "Nos ayudaron a ajustar el menú dos veces sin problema. El coordinador estuvo al pendiente en todo momento.",
    author: "Familia Canul",
    event: "XV años · 220 invitados",
  },
];

export const FAQ = [
  {
    q: "¿Con cuánta anticipación debo solicitar mi evento?",
    a: "Recomendamos al menos 6 semanas; para temporada alta (noviembre a enero), de 3 a 4 meses.",
  },
  {
    q: "¿Cómo doy seguimiento a mi solicitud?",
    a: "Con el folio que recibes al enviar tu solicitud (formato BD-AAAA-00000) puedes consultar el estado en “Consultar folio”.",
  },
  {
    q: "¿Puedo pedir cambios a la propuesta?",
    a: "Sí. Desde la propuesta puedes solicitar ajustes describiendo lo que necesitas y tu coordinador te enviará una nueva versión.",
  },
  {
    q: "¿Atienden fuera de Mérida?",
    a: "Cubrimos todo Yucatán y la Riviera Maya; el transporte se cotiza según la ubicación.",
  },
];
