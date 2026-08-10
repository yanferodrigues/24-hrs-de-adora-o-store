export const PRODUCT = {
  brand: "24 Horas de Adoração",
  name: "Camiseta Oficial · Edição do Congresso",
  price: 90, // preço base (corte Regular)
  priceLabel: "R$ 90",
  currency: "BRL",
  eventDate: "2026-08-31T00:00:00-03:00", // 15/10/2026
  eventDateLabel: "31 de Agosto de 2026",
  tagline: "Ele disse: voltarei",
  sizes: ["PP", "P", "M", "G", "GG"],
};

/**
 * Teto de unidades por item. Vive aqui para o carrinho e a API de checkout
 * usarem o mesmo número: se a UI deixasse pedir mais do que o servidor aceita,
 * a pessoa só descobriria o limite na hora de pagar.
 */
export const MAX_QTY_POR_ITEM = 10;

export const CHILD_SIZES = [
  "4 anos",
  "6 anos",
  "8 anos",
  "10 anos",
  "12 anos",
];

// Corte: Regular (base) e Oversized (mais amplo, +R$20)
export const FITS = [
  { id: "Slimfit", label: "Slimfit", price: 90 },
  { id: "Oversized", label: "Oversized", price: 110 },
  { id: "Infantil", label: "Infantil", price: 90 },
] as const;

export const FEATURES = [
  {
    tag: "Tecido",
    title: "Algodão premium 100%",
    body: "Gramatura alta (feita para durar a vigília inteira), toque encorpado e caimento que não deforma na lavagem.",
  },
  {
    tag: "Caimento",
    title: "Corte oversized e Slimfit",
    body: "Ombro caído, corpo amplo e comprimento moderno — o corte que você vai usar muito além do congresso.",
  },
  {
    tag: "Acabamento",
    title: "Gola reforçada, costura dupla",
    body: "Ribana firme que não abre com o tempo, costuras reforçadas nas laterais e etiqueta interna macia.",
  },
  {
    tag: "Estampa",
    title: "Impressão de alta durabilidade",
    body: "O Rei no cavalo e a multidão em impressão premium: cores firmes, sem craquelar, resistente a muitas lavagens.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Ana Clara",
    role: "Líder de juventude",
    stars: 5,
    text: "A qualidade surpreendeu. O tecido é grosso de verdade e a estampa é linda de perto. Nossa igreja inteira quis uma.",
  },
  {
    name: "Pedro Henrique",
    role: "Participante 2025",
    stars: 5,
    text: "Vesti no congresso e não tirei mais. O caimento é perfeito e o preto não desbotou nada depois de várias lavagens.",
  },
  {
    name: "Juliana Reis",
    role: "Voluntária",
    stars: 5,
    text: "Chegou antes do prazo e super bem embalada. A arte do cavalo é impactante — todo mundo pergunta onde comprei.",
  },
  {
    name: "Lucas Andrade",
    role: "Ministro de louvor",
    stars: 5,
    text: "Confortável pra tocar horas seguidas. Parece coisa de marca grande, mas com um propósito que faz diferença.",
  },
];

export const SIZE_GUIDE = [
  { size: "PP", chest: 53, length: 72 },
  { size: "P", chest: 57, length: 76 },
  { size: "M", chest: 60, length: 78 },
  { size: "G", chest: 61, length: 79 },
  { size: "GG", chest: 64, length: 84 },
];

export const FAQ = [
  {
    q: "A entrega chega antes do congresso?",
    a: "Sim. Pedidos feitos com antecedência são despachados para chegar antes de 23 de outubro de 2026. Entre em contato conosco para mais informações de retirada.",
  },
  {
    q: "Quais formas de pagamento?",
    a: "Pix (com confirmação na hora). O pagamento é processado em ambiente seguro.",
  },
  {
    q: "Como lavar sem estragar a estampa?",
    a: "Lave do avesso, com água fria e sabão neutro, e evite secadora. Assim a impressão dura muito mais.",
  },
];
