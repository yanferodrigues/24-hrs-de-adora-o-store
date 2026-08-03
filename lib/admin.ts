/**
 * Quem pode abrir /admin. A lista vem de ADMIN_EMAILS no .env.local, separada
 * por vírgula, e é comparada com o e-mail da conta logada.
 *
 * A lista entra por parâmetro (com default) para o teste não precisar mexer em
 * process.env.
 *
 * Lista vazia, ausente ou e-mail nulo devolvem `false`, sempre. O contrário —
 * um `if (!lista) return true` — transformaria um .env esquecido em painel
 * público com os telefones de todos os compradores.
 */
export function isAdminEmail(
  email: string | null | undefined,
  lista: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  const alvo = (email ?? "").trim().toLowerCase();
  if (!alvo) return false;

  return (lista ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(alvo);
}
