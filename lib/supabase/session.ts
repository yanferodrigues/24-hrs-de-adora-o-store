import type { User } from "@supabase/supabase-js";
import type { SessionUser } from "@/lib/store";

/**
 * Achata o usuário do Supabase no formato que a UI consome.
 * O cadastro por senha grava `name`; o Google grava `full_name`.
 */
export function toSessionUser(user: User | null): SessionUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    "";
  return { id: user.id, email: user.email ?? "", name };
}
