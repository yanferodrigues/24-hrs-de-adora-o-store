import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave `service_role`: ignora RLS e enxerga a tabela `pedidos`
 * inteira. É o único jeito de ler/escrever essa tabela, porque ela tem RLS
 * ligada e nenhuma política.
 *
 * NUNCA importe este arquivo de um componente client, e NUNCA renomeie a
 * variável para NEXT_PUBLIC_*. Qualquer uma das duas coisas embute a chave no
 * bundle do navegador, e com ela qualquer visitante lê e escreve o banco
 * inteiro — inclusive auth.users.
 *
 * Usa `@supabase/supabase-js` direto (não o `@supabase/ssr`): aqui não há
 * cookie nem sessão de usuário para propagar.
 */
/**
 * As credenciais existem? Serve para recusar a compra ANTES de criar o
 * pagamento no Mercado Pago: sem isso, `createAdminClient()` lançaria só
 * depois, com o Pix já criado, e o rollback nunca rodaria — sobraria um QR
 * órfão pagável.
 */
export function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Erro explícito em vez de um 401 confuso do Postgres três camadas abaixo.
  if (!url || !key) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local — ver .env.example"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
