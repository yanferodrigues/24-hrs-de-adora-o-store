/**
 * Smoke test do gate de autenticação. Roda contra o dev server.
 *   Terminal 1: npm run dev
 *   Terminal 2: npm run smoke
 */

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";

let falhas = 0;

function checar(nome, condicao, detalhe) {
  if (condicao) {
    console.log(`  ok   ${nome}`);
  } else {
    console.log(`  FALHA ${nome} -> ${detalhe}`);
    falhas++;
  }
}

async function main() {
  console.log(`Smoke do gate em ${BASE}\n`);

  // 1. A landing precisa continuar pública.
  const landing = await fetch(BASE, { redirect: "manual" });
  checar("GET / responde 200 (landing publica)", landing.status === 200,
    `recebeu ${landing.status}`);

  // 2. /produto sem sessão redireciona para /login.
  const produto = await fetch(`${BASE}/produto`, { redirect: "manual" });
  const local = produto.headers.get("location") ?? "";
  checar("GET /produto sem sessao redireciona",
    produto.status === 307 || produto.status === 302,
    `recebeu ${produto.status}`);
  checar("...e o destino e /login com ?next", local.includes("/login") && local.includes("next="),
    `location = ${local || "(vazio)"}`);

  // 3. A API de checkout precisa recusar sem sessão.
  const checkout = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [], email: "a@b.com", name: "Teste" }),
    redirect: "manual",
  });
  checar("POST /api/checkout sem sessao responde 401", checkout.status === 401,
    `recebeu ${checkout.status}`);

  // 4. A tela de login precisa abrir sem sessão.
  const login = await fetch(`${BASE}/login`, { redirect: "manual" });
  checar("GET /login responde 200", login.status === 200,
    `recebeu ${login.status}`);
  const html = await login.text();
  checar("...e a tela traz o formulario", html.includes("type=\"password\""),
    "nao encontrou campo de senha no HTML");

  // 5. A tela de cadastro precisa abrir sem sessão.
  const cadastro = await fetch(`${BASE}/cadastro`, { redirect: "manual" });
  checar("GET /cadastro responde 200", cadastro.status === 200,
    `recebeu ${cadastro.status}`);
  const cadastroHtml = await cadastro.text();
  checar("...e a tela traz o campo de nome", cadastroHtml.includes('id="nome"'),
    "nao encontrou id=\"nome\" no HTML");

  // 6. A tela de recuperar senha precisa abrir sem sessão.
  const recuperar = await fetch(`${BASE}/recuperar-senha`, { redirect: "manual" });
  checar("GET /recuperar-senha responde 200", recuperar.status === 200,
    `recebeu ${recuperar.status}`);
  const recuperarHtml = await recuperar.text();
  checar("...e a tela traz o campo de e-mail", recuperarHtml.includes('id="email"'),
    "nao encontrou id=\"email\" no HTML");

  // 7. /nova-senha sem sessão redireciona para /recuperar-senha.
  const novaSenha = await fetch(`${BASE}/nova-senha`, { redirect: "manual" });
  const novaSenhaLocal = novaSenha.headers.get("location") ?? "";
  checar("GET /nova-senha sem sessao redireciona",
    novaSenha.status === 307 || novaSenha.status === 302,
    `recebeu ${novaSenha.status}`);
  checar("...e o destino e /recuperar-senha", novaSenhaLocal.includes("/recuperar-senha"),
    `location = ${novaSenhaLocal || "(vazio)"}`);

  // 8. /admin sem sessão redireciona para o login.
  const admin = await fetch(`${BASE}/admin`, { redirect: "manual" });
  const adminLocal = admin.headers.get("location") ?? "";
  checar("GET /admin sem sessao redireciona",
    admin.status === 307 || admin.status === 302,
    `recebeu ${admin.status}`);
  checar("...e o destino e /login com ?next",
    adminLocal.includes("/login") && adminLocal.includes("next="),
    `location = ${adminLocal || "(vazio)"}`);

  // 9. A rota de sincronizar precisa recusar sem sessão.
  const sync = await fetch(`${BASE}/api/admin/sync`, {
    method: "POST",
    redirect: "manual",
  });
  checar("POST /api/admin/sync sem sessao responde 401", sync.status === 401,
    `recebeu ${sync.status}`);

  console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Erro ao rodar o smoke:", e.message);
  console.error("O dev server esta rodando? (npm run dev)");
  process.exit(1);
});
