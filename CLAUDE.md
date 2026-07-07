# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Landing page + página de produto (marketplace) da **24 Horas de Adoração Store** — camiseta oficial do congresso de jovens. Uma estampa (o Rei no cavalo, Ap 19), duas versões: **Preta** e **Branca**. Estética **dark premium neutra** (preto↔branco, sem outras cores), estilo Nike. Preço **R$ 80**, evento **15/10/2026**.

## Comandos

> **Node é portátil**: fica em `C:\Users\yan.vieira\nodejs` (instalação sem admin). Se `npm`/`node` não estiverem no PATH numa sessão nova, rode antes:
> `$env:Path = "$env:USERPROFILE\nodejs;$env:Path"`

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm run build` — build de produção (**pare o `npm run dev` antes**: build e dev compartilham `.next` e conflitam → erro `Cannot find module './xxx.js'`; se acontecer, `rm -rf .next` e rebuild)
- `npm run start` — sobe o build de produção

## Arquitetura

Next.js 14 (App Router) + TypeScript + Tailwind + React Three Fiber/drei + Framer Motion + Lenis + zustand.

### Rotas
- `app/page.tsx` — **landing** (client). Monta as seções + `Scene3D` (canvas 3D fixo de fundo) + `SmoothScroll` + `Topbar` + `StickyBuyBar`.
- `app/produto/page.tsx` — **PDP marketplace**: `ProductViewer3D` (arrastável) + info (versão/tamanho/quantidade) + `CartDrawer`.
- `app/api/checkout/route.ts` — stub de checkout Stripe (usa `STRIPE_SECRET_KEY` se existir; senão degrada). **Hoje não é chamado** pelo front — os botões de compra navegam para `/produto`.

### Estado (zustand) — `lib/store.ts`
Fonte única de verdade. Campos: `mood` (`night`/`dawn`), `scrollProgress` (0..1, alimenta a cena 3D), `size`, e o **carrinho** (`cart`, `cartOpen`, `addToCart`, `removeFromCart`, `setQty`). `versionLabel(mood)`: night→"Preta", dawn→"Branca".

### Tema (Noite/Amanhecer) — `app/globals.css`
Tokens CSS em `:root` (Noite = fundo preto) e `:root[data-mood="dawn"]` (Amanhecer = fundo branco). O `Topbar` grava `data-mood` no `<html>`. **Todo componente usa os tokens** (`var(--bg)`, `--ink`, `--accent`, etc.), nunca cores fixas — exceto swatches que ilustram as duas versões.

### 3D
- `components/three/Scene3D.tsx` — Canvas **fixo** (`z-index:-10`), luzes que abrem conforme o scroll. Carregado com `dynamic(..., { ssr:false })`.
- `components/three/Shirt.tsx` — carrega `public/tshirt.glb` (placeholder branco), **auto-fit** (centraliza/escala qualquer glb), coreografia por `scrollProgress` (rotação, tilt, zoom, offset à direita no hero e no CTA final) e **tinge o material** por mood (claro na Noite, escuro no Amanhecer).
- `components/shop/ProductViewer3D.tsx` — visualizador da PDP com `OrbitControls`, tingido por `version` (Preta=escura, Branca=clara).

### Padrões visuais importantes
- **`.blend-invert`** (globals.css): `mix-blend-mode: difference` nos títulos-palco (Hero, ArtReveal, FinalCta). Letra branca vira preta sobre áreas claras (e vice-versa), pixel a pixel, inclusive sobre a camiseta 3D. **Pré-requisito**: nada pode isolar o stacking context entre o título e o canvas — por isso as seções-palco **não** têm `z-index` e o `Reveal` **não** usa `filter`.
- **Fonts** (`app/layout.tsx`, via `next/font`): display = **Oswald** (condensada Nike, com acentos — Bebas Neue/Anton falham em À/Ó); corpo = **Inter**; mono = JetBrains Mono. Classe `.display` para títulos caixa-alta.
- Seções da landing são numeradas no eyebrow (`01 — …`). Ao adicionar/remover seção, **renumerar** para manter a sequência.

### Seções da landing — `components/sections/`
Hero · Manifesto · ArtReveal · Features · VersionToggle · Gallery · SizeGuide · Faq · FinalCta · Footer. Seções "palco" (Hero, ArtReveal, FinalCta) têm fundo transparente (mostram o 3D); as demais têm `background: var(--bg)` opaco.

## Pendências
- Trocar `public/tshirt.glb` pelos **2 modelos reais** (com a estampa) — hoje é 1 branco tingido para as duas versões.
- Galeria e miniaturas da PDP usam **placeholders** — trocar por fotos on-body (WebP/AVIF).
- Botão **"Comprar"** do carrinho ainda não faz nada (aguardando definição de checkout/frete/pagamento).
