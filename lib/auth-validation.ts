/**
 * Validação compartilhada entre formulários e servidor, para as mensagens
 * serem idênticas nos dois lados.
 */

export const MSG = {
  nome: "Digite seu nome (pelo menos 2 letras).",
  email: "Digite um e-mail válido.",
  senha: "A senha precisa ter pelo menos 8 caracteres.",
  credenciais: "E-mail ou senha incorretos.",
  emailEmUso: "Esse e-mail já tem uma conta. Entre ou recupere a senha.",
  tentativas: "Muitas tentativas. Espere alguns minutos.",
  oauth:
    "Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha.",
  rede: "Falha de conexão. Tente novamente.",
  cadastro: "Não foi possível criar a conta. Confira os dados e tente de novo.",
} as const;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(raw));
}

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isValidName(raw: string): boolean {
  const n = normalizeName(raw);
  return n.length >= 2 && n.length <= 80;
}

export function isValidPassword(raw: string): boolean {
  return raw.length >= 8;
}

/**
 * Um `?next=` vindo da URL vira destino de redirecionamento. Sem esta trava,
 * `?next=https://site-malicioso` seria um open redirect assinado pelo nosso
 * domínio. Só caminhos internos passam.
 */
export function safeNext(
  raw: string | null | undefined,
  fallback = "/produto"
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  return raw;
}
