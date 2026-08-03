import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (user) return response;

  const { pathname, search } = request.nextUrl;

  // API protegida: responde 401 em vez de redirecionar, para o fetch do
  // front conseguir tratar. Sem isto, daria para pular a tela de login e
  // chamar o endpoint de pagamento direto.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

// Aqui só garantimos "tem alguém logado" — anônimo vai para /login?next=… e
// volta depois de entrar. A AUTORIZAÇÃO do /admin (ser admin) é checada na
// própria página e na rota de API, nunca só aqui: o Next 14.2 teve um CVE
// (x-middleware-subrequest) que pulava o matcher inteiro.
export const config = {
  matcher: [
    "/produto/:path*",
    "/api/checkout/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
