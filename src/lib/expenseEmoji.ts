const RULES: [RegExp, string][] = [
  [/bar|birra|cerveza|trago|fernet|vino|bebida|escabio/, '🍻'],
  [/cine|peli|entrada|teatro|show|recital/, '🎬'],
  [/taxi|uber|cabify|remis|colectivo|nafta|peaje|auto|viaje|pasaje/, '🚕'],
  [/cena|almuerzo|comida|restaurant|resto|pasta|pizza|hamburguesa|sushi|parrilla/, '🍝'],
  [/asado|carne|choripan/, '🥩'],
  [/super|mercado|compras|chino/, '🛒'],
  [/caf[eé]|desayuno|merienda|medialuna/, '☕'],
  [/helado/, '🍦'],
  [/hotel|alojamiento|airbnb|caba[ñn]a|hostel/, '🏠'],
  [/boliche|fiesta|disco/, '🪩'],
  [/regalo/, '🎁'],
];

/** Elige un emoji a partir de la descripción del gasto. */
export function getExpenseEmoji(description: string): string {
  const text = description.toLowerCase();
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? '🧾';
}
