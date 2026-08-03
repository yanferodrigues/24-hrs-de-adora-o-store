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
  novaSenha:
    "Não foi possível salvar a senha. O link pode ter expirado — peça um novo em \"Esqueci minha senha\".",
  telefone: "Digite um telefone com DDD, como (11) 91234-5678.",
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
 * Telefone brasileiro. Guardamos só os dígitos — a formatação é sempre na
 * exibição, para buscar por número não depender de como a pessoa digitou.
 */
export function normalizePhone(raw: string): string {
  const digitos = (raw ?? "").replace(/\D/g, "");
  // Alguém colou com o código do país: 55 + DDD + 8 ou 9 dígitos = 12 ou 13.
  // Em 11 dígitos, "55" é DDD (Santa Maria/RS) e não pode ser removido.
  if (
    (digitos.length === 12 || digitos.length === 13) &&
    digitos.startsWith("55")
  ) {
    return digitos.slice(2);
  }
  return digitos;
}

export function isValidPhone(raw: string): boolean {
  const d = normalizePhone(raw);
  if (d.length !== 10 && d.length !== 11) return false;

  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // Todo celular brasileiro de 11 dígitos começa com 9 depois do DDD. A regra
  // pega erro de digitação sem recusar nada legítimo. Fixo de 10 dígitos
  // continua valendo: em cidade pequena pode ser o único telefone da pessoa.
  if (d.length === 11 && d[2] !== "9") return false;

  return true;
}

/**
 * `(11) 91234-5678`. Progressivo de propósito: é a mesma função que faz a
 * máscara enquanto a pessoa digita no carrinho e que formata a tabela do admin.
 */
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw).slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = `(${d.slice(0, 2)})`;
  if (d.length <= 6) return `${ddd} ${d.slice(2)}`;
  if (d.length <= 10) return `${ddd} ${d.slice(2, 6)}-${d.slice(6)}`;
  return `${ddd} ${d.slice(2, 7)}-${d.slice(7)}`;
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

  // Em vez de tentar adivinhar todas as formas de escapar do nosso domínio
  // (`//host`, `/\host`, `/<tab>/host`, e as que ainda não conhecemos), deixamos
  // o próprio parser de URL decidir — o mesmo que o navegador e o Next usam.
  // Resolvemos contra uma base sentinela: se a origem mudar, o caminho apontava
  // para fora e é descartado. Só devolvemos o que sobra do lado de cá.
  const BASE = "https://sentinela.invalid";
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
