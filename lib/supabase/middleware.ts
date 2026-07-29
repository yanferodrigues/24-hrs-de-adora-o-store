import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Renova o token e devolve a resposta já com os cookies atualizados.
 * Vive separado de `server.ts` porque o middleware roda em Edge e não tem
 * acesso a `next/headers`.
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() e não getSession(): getSession só lê o cookie, que é
  // falsificável. getUser valida contra o servidor do Supabase.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Sem sessão, `getUser()` também devolve erro — isso é rotina e não vira log.
  // O que interessa é o resto: projeto Supabase hibernado, chave errada, rede
  // caída. Nesses casos todo mundo é mandado para /login sem nenhuma pista de
  // por quê, e durante o evento esta linha é o que distingue "a pessoa não
  // está logada" de "o Supabase está fora do ar".
  if (error && error.name !== "AuthSessionMissingError") {
    console.error(
      "[auth] getUser falhou no middleware:",
      error.status ?? "",
      error.message
    );
  }

  return { response, user };
}
