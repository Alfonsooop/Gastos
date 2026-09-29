/** Sin letras/números que se confunden al dictarlos o leerlos (0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const GROUP_CODE_LENGTH = 6;

/** Código corto para unirse a un grupo, ej: "K7P2QX". */
export function generateGroupCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < GROUP_CODE_LENGTH; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return code;
}

/** Limpia lo que escribe el usuario: " k7p-2qx " → "K7P2QX". */
export function normalizeGroupCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidGroupCode(code: string): boolean {
  return code.length === GROUP_CODE_LENGTH && [...code].every((ch) => ALPHABET.includes(ch));
}
