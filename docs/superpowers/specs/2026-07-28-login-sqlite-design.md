# Login (e-mail/senha + Google) com SQLite e gate no shop

Data: 2026-07-28

## Objetivo

A landing (`/`) continua pública. A tela de compra (`/produto`) passa a exigir
conta. O clique no `BuyButton` leva quem não está logado para `/login`, e depois
do login a pessoa volta sozinha para o shop.

Duas formas de entrar: **Google (OAuth 2.0)** e **e-mail + senha**. Quem não tem
conta usa `/cadastro` (nome, e-mail, senha).

No carrinho, os campos **Nome** e **E-mail** chegam preenchidos a partir da conta
e continuam editáveis.

## Decisões tomadas (e por quê)

| Decisão | Escolha | Motivo |
|---|---|---|
| Implementação | Na mão, REST via `fetch` | Mesmo padrão que o repo já usa no Mercado Pago (`app/api/checkout/route.ts` fala REST sem SDK). Evita `next-auth@beta`, cuja API ainda muda. |
| Banco | `node:sqlite` (embutido no Node 22) | Zero dependência e zero compilação nativa — relevante porque o Node aqui é portátil, instalado sem admin. Verificado: roda sem flag no v22.23.1. |
| Sessão | JWT assinado em cookie httpOnly | O gate roda no **middleware**, que é Edge runtime, e Edge **não abre SQLite**. Um JWT se verifica sem tocar no banco. |
| Telas | Rotas `/login` e `/cadastro` | O Google redireciona a página inteira; um modal se perderia no retorno. E permite proteger `/produto` contra acesso direto pela URL. |
| Nome no checkout (OAuth) | Vem do Google, editável | Menos atrito. Os dois caminhos (senha e Google) ficam idênticos: prefill de nome+email. |
| Testes | Script de smoke, sem framework | O repo não tem infra de teste; um `.mjs` contra o dev server cobre o essencial sem adicionar dependências de dev. |

Contrapartida aceita no JWT: **não dá para revogar uma sessão pelo servidor**.
Sair limpa o cookie e pronto. Para uma loja de camiseta de evento com sessão de
30 dias, o custo de manter tabela de sessões não se paga.

Ônus aceito no `node:sqlite`: o servidor imprime `ExperimentalWarning: SQLite is
an experimental feature`. Todo o acesso fica isolado em `lib/db.ts`, então trocar
por `better-sqlite3` no futuro é mexer em um arquivo só.

## Dependências novas

- `bcryptjs` + `@types/bcryptjs` — hash de senha em JS puro (não compila nada).
- `jose` — assina/verifica JWT; funciona em Node **e** em Edge (o middleware
  precisa disso), e também verifica o `id_token` do Google contra o JWKS dele.

## Variáveis de ambiente

Adicionar ao `.env.example` (valores reais só em `.env.local`, que já é gitignored):

```
# Segredo para assinar o cookie de sessão. Gere um valor longo e aleatório:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET=

# OAuth do Google — console.cloud.google.com > APIs e Serviços > Credenciais >
# ID do cliente OAuth (tipo "Aplicativo da Web").
# Em "URIs de redirecionamento autorizados" cadastre:
#   http://localhost:3000/api/auth/google/callback
#   https://SEU-DOMINIO/api/auth/google/callback
# Sem estas duas variáveis o botão "Entrar com Google" simplesmente não aparece.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`NEXT_PUBLIC_SITE_URL` já existe e passa a ser usada para montar o `redirect_uri`.

## Banco de dados

Arquivo: `data/app.db`. Adicionar `/data` ao `.gitignore`.

```sql
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- uuid v4
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,      -- sempre normalizado em lowercase
  password_hash TEXT,                      -- NULL quando a conta é só Google
  google_id     TEXT UNIQUE,               -- NULL quando a conta é só e-mail/senha
  created_at    TEXT NOT NULL              -- ISO 8601
);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
```

O `UNIQUE` no e-mail resolve a colisão de contas: quem se cadastrou com senha e
depois clica em "Entrar com Google" usando o mesmo e-mail tem as duas
**vinculadas** (o `google_id` é preenchido na conta existente) em vez de receber
erro. Essa vinculação só acontece quando o `id_token` do Google traz
`email_verified: true` — sem isso, seria possível sequestrar uma conta
registrando um e-mail alheio não verificado no Google.

O schema é criado no boot através de um `CREATE TABLE IF NOT EXISTS` executado na
primeira vez que `lib/db.ts` é importado. Não há sistema de migração: se o schema
mudar depois, o passo é documentado à mão (o banco é pequeno e local).

## Módulos

### `lib/db.ts` (Node runtime)
Abre um `DatabaseSync` singleton (guardado em `globalThis` para sobreviver ao
hot-reload do Next), garante o schema e exporta as consultas tipadas:
`findUserByEmail`, `findUserByGoogleId`, `createUser`, `linkGoogleAccount`.
Nenhum outro módulo fala SQL.

### `lib/session.ts` — puro, Edge-safe
Sem banco e **sem `next/headers`**, para poder ser importado pelo middleware
(que roda em Edge e não tem acesso a `next/headers`).
- `signSession(user)` → JWT HS256 com `{ sub, name, email, provider }`, 30 dias.
- `verifySession(token)` → payload ou `null`.
- `SESSION_COOKIE = "sess"`, e as opções do cookie: `httpOnly: true`,
  `sameSite: "lax"`, `secure` em produção, `path: "/"`, `maxAge` 30 dias.

`sameSite: "lax"` é obrigatório aqui (não `strict`): o retorno do Google é uma
navegação cross-site, e com `strict` o cookie não seria enviado.

### `lib/session-server.ts` — só Node
Fica separado justamente porque importa `next/headers`, o que quebraria o
middleware se estivesse no mesmo arquivo.
- `getSessionUser()` — lê o cookie e devolve o usuário ou `null`. Usada no
  layout e nas páginas server.
- `setSessionCookie(res, user)` / `clearSessionCookie(res)` — usadas nas rotas
  de API.

### `lib/auth-validation.ts`
Validação compartilhada entre as rotas e os formulários, para as mensagens serem
as mesmas dos dois lados:
- nome: `trim`, 2 a 80 caracteres.
- e-mail: `trim` + `toLowerCase`, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- senha: mínimo 8 e **máximo 72 caracteres** — o bcrypt ignora silenciosamente
  tudo além do 72º byte, então o limite é explícito em vez de virar surpresa.

### `lib/google-oauth.ts`
Monta a URL de autorização, faz a troca do `code` por token e verifica o
`id_token`. Exporta `googleConfigured()` (as duas env vars presentes).

## Rotas de API

Todas em Node runtime (encostam no banco), retornando JSON com mensagens em
português.

| Rota | Entrada | Comportamento |
|---|---|---|
| `POST /api/auth/register` | `{name, email, password}` | Valida; se o e-mail já existe → `409` "Esse e-mail já tem uma conta."; senão `bcrypt.hash(password, 10)`, insere, seta o cookie, devolve `{user}`. |
| `POST /api/auth/login` | `{email, password}` | Se o usuário não existe ou a senha não bate → `401` **"E-mail ou senha incorretos."** (mensagem única, para não revelar quais e-mails existem). Se existe mas `password_hash` é `NULL` → `400` "Essa conta entra pelo Google." |
| `POST /api/auth/logout` | — | Expira o cookie. |
| `GET /api/auth/google` | `?next=` | Gera `state` (32 bytes aleatórios) e um PKCE `code_verifier`; guarda os dois + o `next` em cookies httpOnly de 10 minutos; redireciona para `accounts.google.com/o/oauth2/v2/auth` com `scope=openid email profile` e `code_challenge` S256. Sem as env vars → `503`. |
| `GET /api/auth/google/callback` | `?code&state` | Confere o `state` contra o cookie; troca `code`+`code_verifier` por token em `oauth2.googleapis.com/token`; verifica o `id_token` contra o JWKS do Google (`iss`, `aud`, assinatura); faz upsert do usuário; seta o cookie; apaga os cookies temporários; redireciona para o `next`. Qualquer falha → redireciona para `/login?erro=google`. |

O `next` é validado antes de qualquer redirecionamento: só aceita caminhos que
comecem com `/` e não com `//`. Sem isso, `?next=https://site-malicioso` viraria
um open redirect assinado pelo nosso domínio.

**Rate limit no login e no cadastro:** contador em memória (`Map`), 5 tentativas
por 15 minutos por chave `IP + e-mail`, respondendo `429`. É best-effort e se
perde a cada restart — o suficiente para travar força bruta ingênua, e não vale
mais complexidade nesta escala.

### Upsert do Google (ordem exata)
1. `findUserByGoogleId(sub)` → achou, usa.
2. Senão `findUserByEmail(email)`:
   - achou **e** `email_verified` → `linkGoogleAccount(user.id, sub)`, usa.
   - achou **e não** verificado → erro, redireciona para `/login?erro=google`.
3. Senão `createUser({ name, email, google_id: sub, password_hash: null })`.

## O gate

`middleware.ts` na raiz:

```
matcher: ["/produto/:path*", "/api/checkout/:path*"]
```

Lê o cookie, chama `verifySession`. Sem sessão válida:
- rota de página → `redirect` para `/login?next=<pathname>`
- rota de API → `401 { error: "unauthorized" }`

Proteger `/api/checkout` é o que faz o gate ser real: sem isso dá para pular a
tela de login e chamar o endpoint de pagamento direto.

## Estado no client

`lib/store.ts` ganha `user: SessionUser | null` e `setUser`.

`app/layout.tsx` (que já é Server Component) chama `getSessionUser()` e passa o
resultado para um `<SessionHydrator user={...} />` client, que popula o zustand
no mount. Assim não há fetch nem "flash" de estado deslogado.

Isso torna o layout dinâmico (renderização por requisição). Sem impacto prático:
a landing e a PDP já são `"use client"`.

## Telas

- `app/login/page.tsx` — Server Component. Se já houver sessão, redireciona
  direto para o `next` (não faz sentido mostrar o formulário para quem já
  entrou). Senão lê `googleConfigured()` e renderiza `<AuthPanel mode="login" />`.
- `app/cadastro/page.tsx` — idem (inclusive o redirecionamento de quem já tem
  sessão), com `mode="register"`.
- `components/auth/AuthPanel.tsx` — client. Formulário, botão do Google, estados
  de erro/carregando, link para alternar entre entrar e cadastrar.
- `components/auth/AuthShell.tsx` — a moldura visual compartilhada.

### Estética (reusa o que já existe em `globals.css`)

| Elemento | Como |
|---|---|
| Fundo | `var(--void)` (branco gelo), o mesmo do resto do site |
| Arte | lettering `public/designs/front.webp` no topo, dentro de `.relic .relic-ink` |
| Rótulo | `.sacred` — "ENTRAR" / "CRIAR CONTA" em vermelho-sangue letterspaced |
| Título | `.display` (Cinzel caixa-alta) |
| Painel | `.card` |
| Divisor "ou" | `.seam` — a costura dourada |
| Submit | `.btn-magnetic` |
| Google | `.btn-magnetic.btn-ghost` com o "G" em SVG inline (sem asset externo) |
| Inputs | mesmo estilo do campo de e-mail do `CartDrawer` (`border-line`, `focus:border-[var(--ink)]`) |

O `Topbar` e o `ShopHeader` passam a mostrar o primeiro nome do usuário e um
"sair" quando há sessão.

## Carrinho (`components/shop/CartDrawer.tsx`)

- Novo input **Nome** acima do e-mail. Os dois obrigatórios; o botão "Pagar com
  Pix" só habilita com nome válido **e** e-mail válido.
- Ambos inicializam a partir do `user` do store, e continuam editáveis — o nome
  digitado é o de quem vai retirar a camiseta, que pode não ser o titular da
  conta.

## Checkout (`app/api/checkout/route.ts`)

Passa a receber `{items, email, name}`. Valida o `name` com a mesma regra do resto.
Manda `payer: { email, first_name: name }` e inclui o nome na `description` do
pagamento — hoje a reconciliação de quem comprou é feita lendo essa descrição no
painel do Mercado Pago, então o nome ali tem valor operacional imediato.

## Erros

- Falha de rede nos formulários → "Falha de conexão. Tente novamente."
- `429` → "Muitas tentativas. Espere alguns minutos."
- `/login?erro=google` → "Não foi possível entrar com o Google. Tente de novo ou
  use e-mail e senha."
- Google não configurado → o botão não é renderizado (mesmo padrão de degradação
  do `configured: false` do Mercado Pago).

## Validação

`scripts/smoke-auth.mjs`, rodado contra o dev server, na ordem:

1. `GET /produto` sem cookie → espera `307` para `/login`.
2. `POST /api/checkout` sem cookie → espera `401`.
3. `POST /api/auth/register` com e-mail aleatório → `200` + cookie `sess`.
4. `POST /api/auth/register` repetindo o e-mail → `409`.
5. `GET /produto` com o cookie → `200`.
6. `POST /api/auth/login` com senha errada → `401`.
7. `POST /api/auth/login` com senha certa → `200` + cookie.
8. `POST /api/auth/logout` → cookie expirado; `GET /produto` volta a redirecionar.
9. Limpa o usuário de teste do banco ao final.

O fluxo do Google exige clique real e fica num checklist manual no final do plano.

## Fora de escopo

Recuperação de senha, verificação de e-mail, persistência de pedidos no banco e
painel administrativo. São features separadas; entram depois se fizerem falta.

## Riscos conhecidos

1. **Webpack e `node:sqlite`** — builtins com prefixo `node:` são externalizados
   pelo webpack 5, então deve funcionar direto, mas isso é o primeiro item a
   verificar na implementação. Se der problema, adicionar `better-sqlite3` como
   plano B (a API é quase idêntica e o acesso está isolado em `lib/db.ts`).
2. **`data/app.db` não sobrevive a deploy serverless** (Vercel tem filesystem
   efêmero). Enquanto o site rodar local ou em servidor com disco, tudo bem. Se
   for para a Vercel, o banco precisa virar Turso/Postgres — nesse cenário só
   `lib/db.ts` muda.
