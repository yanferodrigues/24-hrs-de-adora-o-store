# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Landing page + página de produto (marketplace) da **24 Horas de Adoração Store** — camiseta oficial **VOLTAREI** do congresso de jovens (o Rei no cavalo branco, **Apocalipse 19**). Camiseta preta, uma estampa. Preço **R$ 80** (corte Regular) / **R$ 100** (Oversized), evento **15/10/2026**. Pagamento por **Pix**, **retirada presencial** no congresso.

Estética **"relíquia dourada"**: **branco gelo** + **ouro** (lettering/ilustração da estampa) + **vermelho-sangue** (Apocalipse 19) + preto quente (texto). **Sem 3D** — a landing usa os assets de estampa (com alpha) e fotos.

> **Atenção:** o tema é **claro** (`--void: #eff1ef`). Uma versão anterior deste arquivo descrevia um tema escuro; isso mudou. Confie sempre no `app/globals.css`, não na memória.

## Comandos

> **Node é portátil**: fica em `C:\Users\yan.vieira\nodejs` (instalação sem admin). Se `npm`/`node` não estiverem no PATH numa sessão nova, rode antes:
> `$env:Path = "$env:USERPROFILE\nodejs;$env:Path"`

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm test` — testes unitários com `node --test` (embutido no Node 22, roda `.ts` nativamente, **sem framework instalado**). Ver "Testes" abaixo.
- `npm run smoke` — smoke test do gate de login (12 checagens). **Exige o `npm run dev` rodando em outro terminal.**
- `npm run dev -- -H 0.0.0.0` — dev acessível na **rede local** (abrir no celular): use `http://<IP-do-PC>:3000`. Celular na mesma Wi-Fi; se não abrir, liberar a porta 3000 no Firewall do Windows. Descobrir o IP: `(Get-NetIPAddress -AddressFamily IPv4).IPAddress`
- **Parar o servidor**: `Ctrl + C` na janela. Se subiu em background/travou, `Get-Process node | Stop-Process -Force` (cuidado: mata **todos** os processos `node`).
- `npm run build` — build de produção (**pare o `npm run dev` antes**: build e dev compartilham `.next` e conflitam → erro `Cannot find module './xxx.js'`; se acontecer, `rm -rf .next` e rebuild)
- `npm run start` — sobe o build de produção

## Arquitetura

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion + Lenis + zustand + **Supabase Auth**. **Sem three.js/R3F** (removido — o site é leve).

### Rotas
- `app/page.tsx` — **landing** (client), **pública**: `SmoothScroll` + `Topbar` + seções + `StickyBuyBar`.
- `app/produto/page.tsx` — **PDP marketplace**, **exige login**: galeria de fotos (frente/costas) + info (corte/tamanho/quantidade) + `CartDrawer`.
- `app/login`, `app/cadastro`, `app/recuperar-senha`, `app/nova-senha` — telas de autenticação, todas usando `components/auth/AuthShell.tsx` como moldura.
- `app/auth/callback/route.ts` — retorno do OAuth do Google **e** do link de recuperação de senha (`exchangeCodeForSession`).
- `app/api/checkout/route.ts` — **pagamento Pix via Mercado Pago** (`POST /v1/payments`, `payment_method_id: "pix"`, REST via `fetch`, sem SDK). Usa `MP_ACCESS_TOKEN`; sem a chave responde `{configured:false}`. Recebe `{items, email, name}`, devolve `{qrCode, qrCodeBase64, paymentId, status}`.
- `app/api/checkout/status/route.ts` — `GET ?id=<paymentId>`: status do pagamento (polling do `CartDrawer` até `approved`).
- `app/api/checkout/cancel/route.ts` — cancela um Pix pendente (best-effort).

### Autenticação (Supabase Auth)

Não existe tabela nossa: o Supabase gerencia `auth.users`, então **não há políticas de RLS a configurar**. O nome vive em `user_metadata` — `name` no cadastro por senha, `full_name` no Google — e a leitura passa **sempre** por `toSessionUser` (`lib/supabase/session.ts`).

| Arquivo | Papel |
|---|---|
| `lib/supabase/client.ts` | cliente para componentes client |
| `lib/supabase/server.ts` | cliente para Server Components e Route Handlers (lê `cookies()`) |
| `lib/supabase/middleware.ts` | `updateSession()` — Edge-safe, **não** importa `next/headers` |
| `lib/supabase/session.ts` | `toSessionUser()` — achata o usuário do Supabase para a UI |
| `lib/auth-validation.ts` | validadores puros + `MSG` (todas as mensagens de UI) |
| `middleware.ts` | o gate |

O layout (`app/layout.tsx`) é `async`, resolve a sessão e injeta via `<SessionHydrator>` no store zustand. Isso torna o site **dinâmico** (renderizado por requisição) — sem impacto, já era tudo client.

### Invariantes de segurança — não quebre nenhuma destas

Cada uma custou um achado Critical numa revisão. Se for mexer perto, leia primeiro `docs/superpowers/specs/2026-07-28-login-supabase-design.md`.

1. **`safeNext` resolve com `new URL` contra uma base sentinela** e compara a origem. **Não** troque por lista de caracteres proibidos — essa abordagem já falhou duas vezes (`//host`, `/\host`, `/<tab>/host`). Qualquer `?next=` que vire redirecionamento passa por ele.
2. **Preço, corte, tamanho e quantidade são resolvidos no servidor** a partir de `lib/data.ts`, em `app/api/checkout/route.ts`. O campo `price` do corpo da requisição é **ignorado**. Confiar nele permitia pagar R$ 1 numa camiseta de R$ 80.
3. **As três rotas de `/api/checkout` conferem a sessão no próprio handler**, além do middleware. O middleware sozinho não basta: o Next 14.2 teve um CVE (`x-middleware-subrequest`) que pulava o matcher inteiro. Manter o Next atualizado **e** a checagem redundante.
4. **`updateSession` usa `getUser()`, nunca `getSession()`.** `getSession()` só lê o cookie, que é falsificável.
5. **Nenhuma mensagem crua da API do Supabase chega à tela** — tudo passa por `MSG` (pt-BR). O `error.message` vem em inglês. Esse defeito já apareceu em três lugares.
6. **`MAX_QTY_POR_ITEM`** (`lib/data.ts`) é aplicado no servidor, no store **e** nas duas UIs. Aplicar só embaixo faz a quantidade sumir em silêncio.

### Estado (zustand) — `lib/store.ts`
Campos: `scrollProgress` (0..1, alimenta a barra do `Topbar`), `size`, o **carrinho** (`cart`, `cartOpen`, `addToCart`, `removeFromCart`, `setQty`, `clearCart`) e a **sessão** (`user: SessionUser | null`, `setUser`). Versão única: `"Preta"`.

### Tema — `app/globals.css`
**Tema único claro** (relíquia dourada), tokens CSS em `:root`. **Todo componente usa os tokens** (`var(--bg)`, `--ink`, `--accent`, `--gold`, `--blood`, `--parchment`, etc.), nunca cores fixas. **Única exceção:** as cores de marca do ícone do Google no `AuthPanel`, exigidas pelas diretrizes do Google.

### Padrões visuais importantes
- **Tokens (Tailwind)**: `bg/surface/line/ink/mute/accent` + `void/parchment/gold/gold-lite/gold-deep/blood/blood-lite` (em `tailwind.config.ts`, apontando para as CSS vars).
- **Fonts** (`app/layout.tsx`, via `next/font`): display = **Cinzel**; corpo = **Inter**; mono = **JetBrains Mono** (dados: countdown, cm, preço, eyebrows). Classe `.display` = Cinzel caixa-alta.
- **Utilities-assinatura** (globals.css): `.sacred`, `.seam`, `.gold-text`, `.relic` / `.relic-ink`, `.card`, `.btn-magnetic`, `.btn-ghost`.
- **Classes dos campos de formulário de auth**: `INPUT_CLASS` e `LABEL_CLASS` em `components/auth/fields.ts`. Importe — não duplique a string.

### Seções da landing — `components/sections/`
Hero · PeopleWearing · Manifesto · ArtReveal · Features · Gallery · SizeGuide · Faq · FinalCta · Footer.

## Testes

**Não há framework de teste instalado, e isso é deliberado.** O Node 22 roda `.ts` nativamente e traz `node:test` embutido.

- Testes em `tests/*.test.ts`. Importam com **extensão `.ts` explícita** (`../lib/auth-validation.ts`) — exigência do type stripping do Node. Por isso `tests` está no `exclude` do `tsconfig.json`: sem isso o `next build` reclama do import.
- O script é `node --test "tests/**/*.test.ts"`. **As aspas são obrigatórias.** Passar o diretório (`node --test tests`) falha com `MODULE_NOT_FOUND`.
- `npm run smoke` cobre o gate de ponta a ponta contra o dev server. O que ele **não** cobre — clique real no Google, link de recuperação no e-mail, compra logada — está no checklist manual no fim de `docs/superpowers/plans/2026-07-28-login-supabase.md`.

## Estampa nos assets

- **Designs (com alpha)**: `public/designs/front.webp` (lettering "VOLTAREI" + "APOCALIPSE 19") e `back.webp` (ilustração do Rei) — derivados otimizados dos PNGs originais. **Não** referencie os PNGs pesados (o das costas tem 23MB). Usados no Hero e na ArtReveal dentro de `.relic`. O `front.webp` também é a arte do topo das telas de login e o favicon (`app/icon.png`).
- **Fotos mockup**: `public/imagens/mockup-frente.webp` e `mockup-costas.webp`. Usadas na Galeria e na PDP.

## Configuração fora do código (não versionável)

O login depende de ajustes no **painel do Supabase** que nenhum arquivo deste repo controla. O passo a passo está documentado dentro do `.env.example`. Os pontos que quebram tudo se mudarem:

- **"Confirm email" precisa ficar DESLIGADO** (Authentication → Sign In / Providers → Email). Ligado, o e-mail embutido do plano gratuito não dá conta de dezenas de cadastros na mesma noite. Ligar/desligar também **muda o comportamento do `signUp` para e-mail repetido** — o código trata os dois casos, ver o spec.
- **URI de redirecionamento no Google Cloud** aponta para o Supabase (`https://<ref>.supabase.co/auth/v1/callback`), **não** para o nosso domínio.
- **Projeto gratuito hiberna após 7 dias sem atividade** — conferir se está ativo antes de qualquer divulgação.

Para conferir tudo de uma vez, sem abrir o painel:
`curl -H "apikey: $ANON_KEY" "$SUPABASE_URL/auth/v1/settings"` → `mailer_autoconfirm: true` significa "Confirm email" desligado.

## Documentos de referência

- `docs/superpowers/specs/2026-07-28-login-supabase-design.md` — o **porquê** de cada decisão de auth, incluindo as contrapartidas aceitas.
- `docs/superpowers/plans/2026-07-28-login-supabase.md` — o plano executado, com o **checklist manual** no fim.

## Pendências

- **Checklist manual do login** nunca foi executado: entrar com Google de verdade, link de recuperação chegando no e-mail, comprar logado nas duas formas de conta. Está no fim do arquivo de plano.
- **Branch `feat/login-supabase` não foi mergeada** na `main`.
- **Token do Mercado Pago ainda é de TESTE** (`TEST-…`). Para receber de verdade: trocar pelo `APP_USR-…` **e** cadastrar uma chave Pix na conta do MP (sem ela o Pix não gera). Conferir a taxa em *Seu negócio → Custos* antes de fixar o preço.
- **Chave secreta do OAuth do Google precisa ser rotacionada** — foi exposta num chat.
- Confirmação do Pix é por **polling** no `CartDrawer` (funciona com o navegador aberto). Versão robusta = **webhook** (`/api/webhook/mercadopago`).
- **Sem persistência de pedidos**: a reconciliação sai do painel do Mercado Pago, lendo a descrição do pagamento (que traz nome + corte + tamanho). Consequência: `/api/checkout/cancel` não consegue verificar se quem cancela é o dono do Pix.
- `public/pessoas/` está vazio — a landing mostra molduras vazias. Ver `LEIA-ME.txt` lá dentro.
- `tsconfig.tsbuildinfo` está versionado e suja todo commit; deveria entrar no `.gitignore`.
- `npm audit` acusa 2 high remanescentes (`next` e `postcss` transitivo), sem correção sem breaking change. Analisados como não aplicáveis: são DoS/cache-poisoning/SSRF em recursos que este projeto não usa, e o bypass restante é Pages Router com i18n (aqui é App Router sem i18n).
