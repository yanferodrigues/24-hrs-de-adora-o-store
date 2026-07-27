# Designs na camiseta 3D + fotos mockup no site

Data: 2026-07-27

## Objetivo

Colocar os designs reais da estampa na camiseta 3D (landing e PDP) e inserir as
fotos mockup profissionais nos pontos certos do site.

## Assets (já em `public/`)

- `public/designs/Voltarei frente apocalipse 19.png` — RGBA, 3508×4961, ~2MB.
  Conteúdo visível (alpha bbox) é uma faixa de lettering "VOLTAREI / APOCALIPSE 19"
  dourado. Fundo transparente com RGB residual maroon (pode causar franja se
  filtrado) → tratar com `alphaTest`.
- `public/designs/voltarei costas apocalipse 19.png` — RGBA, 3508×4961, **~23MB**.
  Ilustração completa do Rei no cavalo (Ap 19), ocupa quase toda a arte. Precisa
  ser otimizada antes de virar textura.
- `public/imagens/mockup preto 1.jpg` — foto flat-lay da **frente** (camiseta preta).
- `public/imagens/mockup preto.jpg` — foto flat-lay das **costas** (camiseta preta).

Só existem fotos da versão **Preta**. Decisão: fotos são **version-agnostic**
(usadas como imagens editoriais/produto, sem amarrar à versão selecionada).

## GLB

`public/tshirt.glb` — modelo Sketchfab, 4 malhas (`Object_0..3`), todas com
`POSITION + NORMAL + TEXCOORD_0`, material único `FABRIC_1_FRONT_4193`. Normais
presentes → `THREE.DecalGeometry` projeta bem. Carregado e auto-fit em
`components/three/Shirt.tsx` (fundo da landing) e
`components/shop/ProductViewer3D.tsx` (PDP).

## Parte A — Designs no 3D (decals)

### A1. Otimização de textura
Gerar derivados otimizados (mantendo alpha), preservando os originais:
- `public/designs/front.png` — ~2048px no maior lado.
- `public/designs/back.png` — ~2048px no maior lado (crítico: origem tem 23MB).

### A2. Aplicação (Shirt.tsx e ProductViewer3D.tsx)
Dentro do `useMemo` que clona/normaliza a cena:
1. Identificar a **malha do corpo** = a de maior bounding box entre as 4.
2. Projetar **2 decals** com `THREE.DecalGeometry(mesh, position, orientation, size)`:
   - **Frente**: lettering no peito, projetor apontando +Z (ajustar após ver render).
   - **Costas**: ilustração nas costas, projetor apontando −Z.
3. Material de cada decal: `MeshStandardMaterial` com `map = textura`,
   `transparent: true`, `alphaTest: ~0.4` (elimina franja maroon), `polygonOffset:
   true` + `polygonOffsetFactor: -4`, `depthWrite: false`, `roughness` alta,
   `metalness: 0`. Textura: `colorSpace = SRGB`, `anisotropy` alto.
4. Os meshes de decal são adicionados **como filhos do wrapper** (mesmo espaço da
   camiseta) → giram/escalam junto na coreografia de scroll.
5. Tingimento Preta/Branca do tecido permanece; decals ficam por cima e são iguais
   nas duas versões.

### A3. Tuning
Iterar com `npm run dev` + screenshots para acertar `position`, `size` e
`orientation` de cada projetor (front/back, altura no peito, escala da arte).
Definir os valores finais como constantes nomeadas nos dois componentes (mesma
fonte de verdade — extrair para um helper `lib/shirtDecals.ts` se divergirem).

## Parte B — Fotos mockup no site (version-agnostic)

### B1. Otimização
Gerar WebP ~1400px:
- `public/imagens/mockup-frente.webp`
- `public/imagens/mockup-costas.webp`

### B2. Galeria (`components/sections/Gallery.tsx`)
Trocar os 4 tiles placeholder por layout editorial com as 2 fotos reais (frente em
destaque + costas), mantendo o grid responsivo, borda, cantos e o hover-zoom
(`group-hover:scale-105`). Usar `next/image`. Legendas curtas mantidas.

### B3. ArtReveal (`components/sections/ArtReveal.tsx`)
Adicionar a **foto das costas** (a ilustração) como elemento visual junto ao texto.
Restrição crítica: o `<h2 class="blend-invert">` **não** pode ficar dentro de
wrapper que isole stacking context. A foto vai num **container próprio** (coluna/
bloco à parte), sem envolver o título nem aplicar `filter/opacity/transform` num
ancestral comum do título e do canvas.

### B4. PDP (`app/produto/page.tsx`)
Converter a galeria (hoje só 3D + thumbs placeholder) num **estágio + thumbnails**:
- Estado local `view: "3d" | "frente" | "costas"` (default `"frente"`).
- Estágio principal renderiza a mídia selecionada: foto (`next/image`) ou
  `<ProductViewer3D />` quando `view==="3d"`.
- Faixa de thumbnails = **[3D · foto frente · foto costas]**, com destaque na ativa
  (borda `var(--ink)`), como o padrão atual.
- Atende "imagem principal = foto" e mantém o 3D com os designs acessível.

## Fora de escopo (YAGNI)

- Trocar o GLB placeholder pelos 2 modelos reais com estampa.
- Foto da versão Branca (não existe ainda).
- Persistência de pedidos / webhook.

## Riscos

- **Projeção do decal**: orientação front/back e escala dependem do GLB; mitigado
  por tuning iterativo visual. Fallback (se ficar ruim): plano curvo — não adotado.
- **Franja maroon** no lettering: mitigada por `alphaTest`.
- **Peso do PNG das costas (23MB)**: resolvido na otimização A1 antes de usar como
  textura.
