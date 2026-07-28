# Login com Supabase Auth e gate no shop

Data: 2026-07-28
Substitui a versão anterior deste spec, que usava auth próprio + Turso.

## Objetivo

A landing (`/`) continua pública. A tela de compra (`/produto`) passa a exigir
conta. O clique no `BuyButton` leva quem não está logado para `/login`, e depois
do login a pessoa volta sozinha para o shop.

Duas formas de entrar: **Google** e **e-mail + senha**. Quem não tem conta usa
`/cadastro` (nome, e-mail, senha). Quem esqueceu a senha usa `/recuperar-senha`.

No carrinho, os campos **Nome** e **E-mail** chegam preenchidos a partir da conta
e continuam editáveis.

## Por que Supabase Auth

O Supabase entrega pronto: hash de senha, fluxo OAuth do Google, sessão em
cookie com refresh, tabela de usuários e recuperação de senha. Isso elimina
`bcryptjs`, `jose`, `AUTH_SECRET`, as rotas `/api/auth/*`, a tabela `users`, o
rate limit caseiro e o banco separado — cerca de 60% do backend do design
anterior, incluindo justamente as partes onde um erro sutil vira falha de
segurança.

O que continua nosso: as telas na estética do site, o gate no middleware e o
prefill do carrinho.

### Contrapartidas aceitas

1. **Projeto gratuito hiberna após 7 dias sem atividade.** O evento é em
   15/10/2026; se o site ficar semanas parado entre divulgações, o banco dorme e
   o login para até alguém reativar no painel. Mitigação registrada abaixo.
2. **Dependência do painel do Supabase.** Parte da configuração (provider do
   Google, e-mails, URLs) não está no código e não é versionável. Por isso este
   spec documenta cada clique necessário — ver "Configuração do painel".
3. **Sem controle sobre o formato da sessão.** O cookie é do Supabase.

## Configuração do painel (obrigatória, não versionável)

| Onde | O quê |
|---|---|
| **New project** | Região **South America (São Paulo)** — menor latência para o público do congresso |
| **Project Settings → API** | Copiar `Project URL` e a chave `anon public` |
| **Authentication → Providers → Google** | Ativar; colar Client ID e Secret já criados no Google Cloud |
| **Authentication → Providers → Email** | **Desmarcar "Confirm email"** |
| **Authentication → URL Configuration** | `Site URL` = domínio de produção. Em *Redirect URLs*, adicionar `http://localhost:3000/**` e `https://SEU-DOMINIO/**` |
| **Google Cloud → Clientes** | Trocar o URI de redirecionamento por `https://SEU-REF.supabase.co/auth/v1/callback` (o Supabase mostra o valor exato na tela do provider) |

### Por que desligar a confirmação de e-mail

O serviço de e-mail embutido do Supabase é limitado a poucos envios por hora no
plano gratuito. Num congresso onde dezenas de pessoas se cadastram na mesma
noite, a fila estoura e ninguém consegue entrar — o cadastro ficaria pendente
esperando um e-mail que não chega.

Consequência assumida: **não há verificação de que o e-mail existe**. Para uma
loja de retirada presencial, onde a conferência acontece olho no olho no dia do
evento, o e-mail é conveniência, não prova de identidade. O custo de um e-mail
digitado errado é a pessoa não receber o comprovante — não é fraude.

A recuperação de senha continua funcionando: são envios raros e individuais, que
cabem folgadamente no limite gratuito.

## Dependências novas

- `@supabase/supabase-js` — cliente de autenticação.
- `@supabase/ssr` — integração com App Router: mantém a sessão em cookies
  legíveis tanto no servidor quanto no middleware.

Nenhuma dependência de hash, JWT ou driver de banco. Nenhuma tabela nossa,
portanto nenhuma política de RLS a configurar.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

As duas são públicas por natureza (vão para o browser) — a proteção real vem do
Supabase, não do sigilo delas.

**Removidas do `.env.local`:** `AUTH_SECRET`, `TURSO_DATABASE_URL`,
`TURSO_AUTH_TOKEN`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` — as credenciais
do Google agora vivem no painel do Supabase, não no projeto.

`NEXT_PUBLIC_SITE_URL` continua sendo usada para montar o `redirectTo` do OAuth.

## Onde ficam os dados do usuário

Em `auth.users`, gerenciada pelo Supabase. Não criamos tabela nenhuma.

- **Cadastro por senha:** o nome vai em `user_metadata.name`, passado no
  `options.data` do `signUp`.
- **Google:** o Supabase preenche `user_metadata.full_name` (e `name`) a partir
  do perfil.

Leitura unificada, usada no carrinho e no header:

```ts
const nome = user.user_metadata.name ?? user.user_metadata.full_name ?? "";
```

**Vinculação de contas:** o Supabase liga automaticamente a conta Google a um
cadastro por senha com o mesmo e-mail, desde que o e-mail esteja confirmado do
lado do Google. É o comportamento que queríamos, sem código.

## Módulos

### `lib/supabase/client.ts`
`createBrowserClient` — usado nos componentes client (formulários).

### `lib/supabase/server.ts`
`createServerClient` lendo `cookies()` de `next/headers` — usado em Server
Components e Route Handlers.

### `lib/supabase/middleware.ts`
`updateSession(request)` — renova o token e devolve a resposta com os cookies
atualizados. Precisa existir separado porque o middleware não tem acesso a
`next/headers`.

### `lib/auth-validation.ts`
Mantido do design anterior, para as mensagens serem as mesmas no formulário e no
servidor:
- nome: `trim`, 2 a 80 caracteres.
- e-mail: `trim` + `toLowerCase`, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- senha: mínimo 8 caracteres (o mesmo mínimo configurado no painel do Supabase).

## Fluxos

| Ação | Chamada |
|---|---|
| Cadastro | `signUp({ email, password, options: { data: { name } } })` |
| Login | `signInWithPassword({ email, password })` |
| Google | `signInWithOAuth({ provider: "google", options: { redirectTo: \`${origin}/auth/callback?next=${next}\` } })` |
| Sair | `signOut()` |
| Esqueci a senha | `resetPasswordForEmail(email, { redirectTo: \`${origin}/auth/callback?next=/nova-senha\` })` |
| Definir nova senha | `updateUser({ password })` |

### `app/auth/callback/route.ts`
Rota única de retorno, usada pelo Google e pelo link de recuperação: troca o
`code` por sessão (`exchangeCodeForSession`) e redireciona para o `next`.

O `next` é validado antes do redirecionamento: só aceita caminhos que comecem
com `/` e não com `//`. Sem isso, `?next=https://site-malicioso` viraria um open
redirect assinado pelo nosso domínio.

Falha na troca → redireciona para `/login?erro=oauth`.

### E-mail já cadastrado — a pegadinha do `signUp`

Para não permitir descobrir quais e-mails existem, o Supabase **responde sucesso**
quando alguém tenta cadastrar um e-mail já usado. O usuário não é criado, mas a
chamada não dá erro.

A forma de detectar é olhar o retorno:

```ts
if (data.user && data.user.identities?.length === 0) {
  // e-mail já tem conta
}
```

Sem esse teste, a tela diria "conta criada" e a pessoa nunca conseguiria entrar.
É o ponto mais fácil de errar nesta implementação.

## O gate

`middleware.ts` na raiz:

```
matcher: ["/produto/:path*", "/api/checkout/:path*"]
```

Chama `updateSession` e depois `supabase.auth.getUser()`. Sem usuário:
- rota de página → `redirect` para `/login?next=<pathname>`
- rota de API → `401 { error: "unauthorized" }`

Usar `getUser()` e não `getSession()` é deliberado: `getSession()` só lê o
cookie, que é falsificável; `getUser()` valida contra o servidor do Supabase. O
custo é uma chamada de rede por requisição protegida — aceitável, porque só duas
rotas passam por aqui e a landing inteira fica de fora.

`/api/checkout` entra no matcher porque, sem isso, dá para pular a tela de login
e chamar o endpoint de pagamento direto — a proteção seria só cosmética.

## Estado no client

`lib/store.ts` ganha `user: SessionUser | null` (`{ id, email, name }`) e
`setUser`.

`app/layout.tsx` (já é Server Component) busca o usuário e passa para um
`<SessionHydrator />` client, que popula o zustand no mount. Sem fetch extra e
sem flash de estado deslogado.

Isso torna o layout dinâmico. Sem impacto prático: a landing e a PDP já são
`"use client"`.

## Telas

- `app/login/page.tsx` — Server Component. Se já houver sessão, redireciona para
  o `next`. Senão renderiza `<AuthPanel mode="login" />`.
- `app/cadastro/page.tsx` — idem, `mode="register"`.
- `app/recuperar-senha/page.tsx` — pede o e-mail e confirma o envio.
- `app/nova-senha/page.tsx` — destino do link do e-mail; define a senha nova.
- `components/auth/AuthShell.tsx` — moldura visual compartilhada pelas quatro.
- `components/auth/AuthPanel.tsx` — client: formulário, botão do Google, erros.
- `components/auth/UserMenu.tsx` — nome + "sair", no `Topbar` e no `ShopHeader`.

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
| Inputs | mesmo estilo do campo de e-mail do `CartDrawer` |

## Carrinho (`components/shop/CartDrawer.tsx`)

- Novo input **Nome** acima do e-mail. Os dois obrigatórios; "Pagar com Pix" só
  habilita com nome **e** e-mail válidos.
- Ambos inicializam a partir do `user` do store e continuam editáveis — o nome
  digitado é o de quem vai retirar a camiseta, que pode não ser o titular da
  conta.

## Checkout (`app/api/checkout/route.ts`)

Passa a receber `{items, email, name}`, valida o `name` com a mesma regra do
resto, e confirma a sessão pelo servidor (além do middleware). Manda
`payer: { email, first_name: name }` e inclui o nome na `description` — hoje a
reconciliação de quem comprou é feita lendo essa descrição no painel do Mercado
Pago, então o nome ali tem valor operacional imediato.

## Erros

| Situação | Mensagem |
|---|---|
| Credenciais erradas | "E-mail ou senha incorretos." |
| E-mail já cadastrado | "Esse e-mail já tem uma conta. Entre ou recupere a senha." |
| Excesso de tentativas (429 do Supabase) | "Muitas tentativas. Espere alguns minutos." |
| `/login?erro=oauth` | "Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha." |
| Falha de rede | "Falha de conexão. Tente novamente." |

O rate limit agora é do Supabase, aplicado no servidor dele — mais confiável que
o contador em memória do design anterior, que se perderia entre invocações
serverless na Vercel.

## Validação

`scripts/smoke-auth.mjs`, rodado contra o dev server:

1. `GET /produto` sem cookie → espera `307` para `/login`.
2. `POST /api/checkout` sem cookie → espera `401`.
3. `GET /` sem cookie → espera `200` (a landing não pode ter sido gateada por engano).
4. `GET /login` → `200` e contém o formulário.

O que o script **não** cobre, e por quê: cadastro e login de verdade produzem
cookies no formato chunked do `@supabase/ssr`, difíceis de forjar fora do
browser; e o Google exige clique humano. Essa parte vai num checklist manual no
fim do plano, executado com o dev server aberto.

## Fora de escopo

Persistência de pedidos no banco e painel administrativo. A reconciliação
continua pelo painel do Mercado Pago, como hoje.

## Riscos conhecidos

1. **Hibernação do projeto gratuito (7 dias sem atividade).** Antes de divulgar
   o site, confirmar no painel que o projeto está ativo. Se virar problema
   recorrente, a saída é um ping automático diário ou o plano pago.
2. **Configuração fora do código.** Provider do Google, "Confirm email" e as
   Redirect URLs vivem no painel. Um projeto Supabase novo (ou restaurado)
   precisa refazer a tabela "Configuração do painel" acima — é por isso que ela
   está neste documento.
3. **URI de redirecionamento do Google muda.** Passa a ser a do Supabase
   (`https://SEU-REF.supabase.co/auth/v1/callback`), não mais a nossa
   `localhost`. Registrar antes de testar, senão o erro é `redirect_uri_mismatch`.
4. **Variáveis precisam existir na Vercel**, não só no `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `NEXT_PUBLIC_SITE_URL` com o domínio real.
