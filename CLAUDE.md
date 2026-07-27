# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Landing page + página de produto (marketplace) da **24 Horas de Adoração Store** — camiseta oficial **VOLTAREI** do congresso de jovens (o Rei no cavalo branco, **Apocalipse 19**). Camiseta preta, uma estampa. Preço **R$ 80**, evento **15/10/2026**.

Estética **"relíquia dourada"**: preto quente + **ouro** (lettering/ilustração da estampa) + **vermelho-sangue** (Apocalipse 19) + **pergaminho** (texto). A arte dourada aparece brilhando no escuro, como relíquia iluminada. **Sem 3D** — a landing usa os assets de estampa (com alpha) e fotos.

## Comandos

> **Node é portátil**: fica em `C:\Users\yan.vieira\nodejs` (instalação sem admin). Se `npm`/`node` não estiverem no PATH numa sessão nova, rode antes:
> `$env:Path = "$env:USERPROFILE\nodejs;$env:Path"`

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm run dev -- -H 0.0.0.0` — dev acessível na **rede local** (abrir no celular): use `http://<IP-do-PC>:3000`. Celular na mesma Wi-Fi; se não abrir, liberar a porta 3000 no Firewall do Windows. Descobrir o IP: `(Get-NetIPAddress -AddressFamily IPv4).IPAddress`
- **Parar o servidor**: `Ctrl + C` na janela. Se subiu em background/travou, `Get-Process node | Stop-Process -Force` (cuidado: mata **todos** os processos `node`).
- `npm run build` — build de produção (**pare o `npm run dev` antes**: build e dev compartilham `.next` e conflitam → erro `Cannot find module './xxx.js'`; se acontecer, `rm -rf .next` e rebuild)
- `npm run start` — sobe o build de produção

## Arquitetura

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion + Lenis + zustand. **Sem three.js/R3F** (removido — o site é leve).

### Rotas
- `app/page.tsx` — **landing** (client): `SmoothScroll` + `Topbar` + seções + `StickyBuyBar`.
- `app/produto/page.tsx` — **PDP marketplace**: galeria de fotos (frente/costas) + info (corte/tamanho/quantidade) + `CartDrawer`.
- `app/api/checkout/route.ts` — **pagamento Pix via Mercado Pago** (`POST /v1/payments`, `payment_method_id: "pix"`, REST via `fetch`, sem SDK). Usa `MP_ACCESS_TOKEN`; sem a chave responde `{configured:false}`. Recebe `{items, email}`, devolve `{qrCode, qrCodeBase64, paymentId, status}`. **Só Pix**, **retirada no evento** (sem frete/endereço).
- `app/api/checkout/status/route.ts` — `GET ?id=<paymentId>`: status do pagamento (polling do `CartDrawer` até `approved`). Token só no servidor.
- `app/api/checkout/cancel/route.ts` — cancela um Pix pendente no Mercado Pago (best-effort).

### Estado (zustand) — `lib/store.ts`
Campos: `scrollProgress` (0..1, alimenta a barra de progresso do `Topbar`), `size`, e o **carrinho** (`cart`, `cartOpen`, `addToCart`, `removeFromCart`, `setQty`, `clearCart`). Versão única: `"Preta"`.

### Tema — `app/globals.css`
**Tema único escuro** (relíquia dourada), tokens CSS em `:root`. **Todo componente usa os tokens** (`var(--bg)`, `--ink`, `--accent`, `--gold`, `--blood`, `--parchment`, etc.), nunca cores fixas. Tokens legados (`--bg`, `--ink`, `--mute`, `--accent`, `--line`…) foram remapeados para a paleta dourada, então CartDrawer/ShopHeader/StickyBuyBar/PDP reskinam automaticamente.

### Padrões visuais importantes
- **Tokens (Tailwind)**: `bg/surface/line/ink/mute/accent` + novos `void/parchment/gold/gold-lite/gold-deep/blood/blood-lite` (em `tailwind.config.ts`, apontando para as CSS vars).
- **Fonts** (`app/layout.tsx`, via `next/font`): display = **Cinzel** (serifa romana/inscricional, monumental — cobre acentos PT-BR À/Ã/Ç/Ó); corpo = **Inter**; mono = **JetBrains Mono** (dados: countdown, cm, preço, eyebrows). Classe `.display` = Cinzel caixa-alta.
- **Utilities-assinatura** (globals.css): `.sacred` (tag Cinzel vermelho-sangue letterspaced — eco do "APOCALIPSE 19"), `.seam` (costura/divisor sagrado dourado), `.gold-text` (texto em folha de ouro), `.relic` (halo dourado radial atrás da arte), `.card` (superfície escura com hairline quente), `.btn-magnetic` (botão dourado com glow).
- Rótulos de seção usam `.sacred` (não são numerados — não é uma sequência).

### Seções da landing — `components/sections/`
Hero · Manifesto · ArtReveal · Features · Gallery · SizeGuide · Faq · FinalCta · Footer. Todas com fundo transparente sobre o `--void` do body (que tem um halo quente radial fixo no topo). O **Hero** mostra o lettering VOLTAREI dourado (`front.webp`) brilhando; a **ArtReveal** mostra a ilustração do Rei (`back.webp`) como relíquia.

## Estampa nos assets

- **Designs (com alpha, brilham no escuro)**: `public/designs/front.webp` (lettering "VOLTAREI" dourado + "APOCALIPSE 19" vermelho) e `back.webp` (ilustração completa do Rei) — derivados otimizados (com alpha) dos PNGs originais em `public/designs/`. **Não** referencie os PNGs pesados (o das costas tem 23MB); use os `.webp`. Usados direto no Hero e na ArtReveal, dentro de um wrapper `.relic`.
- **Fotos mockup**: `public/imagens/mockup-frente.webp` e `mockup-costas.webp` (camiseta preta em fundo cinza de estúdio). Usadas na **Galeria** (2 fotos + 2 close-ups por crop/zoom) e na **PDP** (estágio + thumbnails frente/costas).

## Pendências
- **Checkout Pix está pronto** (Mercado Pago), mas depende do usuário criar `.env.local` com `MP_ACCESS_TOKEN` e cadastrar uma chave Pix na conta. Validar o fluxo ponta a ponta com token de **TESTE** antes de ir a produção.
- Confirmação do Pix hoje é por **polling** no `CartDrawer` (funciona enquanto o navegador está aberto). Versão robusta = **webhook** (`/api/webhook/mercadopago`) — pendente.
- Sem **persistência de pedidos** (banco): reconciliação de quem comprou/qual tamanho é feita pelo painel do Mercado Pago (descrição do pagamento traz corte + tamanho).
