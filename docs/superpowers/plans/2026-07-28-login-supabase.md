# Login com Supabase Auth — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exigir conta para acessar `/produto` e o checkout, com login por Google ou e-mail/senha, mantendo a landing pública e preenchendo nome+e-mail do comprador no carrinho.

**Architecture:** O Supabase Auth cuida de senha, OAuth, sessão e usuários. O `@supabase/ssr` mantém a sessão em cookies legíveis no servidor e no middleware. O `middleware.ts` é o único ponto de bloqueio, cobrindo `/produto` e `/api/checkout`. Nenhuma tabela nossa, portanto nenhuma política de RLS.

**Tech Stack:** Next.js 14.2.15 (App Router), TypeScript, Tailwind, framer-motion, zustand, `@supabase/supabase-js` ^2.111.0, `@supabase/ssr` ^0.12.4.

## Global Constraints

- **Node portátil:** se `npm` não estiver no PATH, rodar antes `$env:Path = "$env:USERPROFILE\nodejs;$env:Path"`.
- **Parar o `npm run dev` antes de qualquer `npm run build`** — build e dev compartilham `.next` e conflitam.
- **Todo componente usa os tokens CSS** (`var(--bg)`, `--ink`, `--gold`, `--blood`, `--line`…), nunca cores fixas. **Única exceção:** o ícone do Google no `AuthPanel`, cujas cores de marca (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) são exigidas pelas diretrizes do Google e não podem ser tematizadas.
- **As classes de input e label dos formulários de auth vivem em `components/auth/fields.ts`** e são importadas pelas três telas. Não duplicar a string de className.
- **Textos de UI em português do Brasil.**
- **Sem dependência de teste:** os testes usam `node --test`, embutido no Node 22, rodando `.ts` nativamente.
- **Imports em arquivos de teste precisam da extensão `.ts` explícita** (exigência do type stripping do Node). Por isso `tests/` fica fora do `tsconfig.json`.
- **Chaves:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` já estão preenchidas no `.env.local`.
- **Painel do Supabase verificado ao vivo em 28/07/2026** (`GET /auth/v1/settings`): provider Google ativo, URI de redirecionamento aceita pelo Google, cadastro liberado e **"Confirm email" desligado** (`mailer_autoconfirm: true`). Nada pendente de configuração — o cadastro loga direto, sem e-mail de confirmação.
- **`user_metadata`:** cadastro por senha grava `name`; o Google grava `full_name`. A leitura sempre passa por `toSessionUser`.

---

### Task 1: Fundação — dependências, clientes Supabase e validação

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json:20`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `lib/auth-validation.ts`
- Test: `tests/auth-validation.test.ts`

**Interfaces:**
- Consumes: nada (primeira task).
- Produces:
  - `createClient()` de `lib/supabase/client.ts` → `SupabaseClient` (browser)
  - `createClient()` de `lib/supabase/server.ts` → `SupabaseClient` (server, lê cookies)
  - `updateSession(request: NextRequest)` → `Promise<{ response: NextResponse; user: User | null }>`
  - `normalizeEmail(raw: string): string`
  - `isValidEmail(raw: string): boolean`
  - `normalizeName(raw: string): string`
  - `isValidName(raw: string): boolean`
  - `isValidPassword(raw: string): boolean`
  - `safeNext(raw: string | null | undefined, fallback?: string): string`
  - `MSG` — objeto com as mensagens de erro

- [ ] **Step 1: Instalar as dependências**

```bash
npm install @supabase/supabase-js@^2.111.0 @supabase/ssr@^0.12.4
```

- [ ] **Step 2: Excluir `tests/` do TypeScript**

Em `tsconfig.json`, trocar a linha `"exclude": ["node_modules"]` por:

```json
  "exclude": ["node_modules", "tests"]
```

Motivo: os arquivos de teste importam com extensão `.ts` explícita (`../lib/auth-validation.ts`), que o `moduleResolution: "bundler"` rejeita. Fora do `include`, o `next build` não os typecheca e o Node os executa normalmente.

- [ ] **Step 3: Adicionar o script de teste ao `package.json`**

Na seção `"scripts"`, acrescentar:

```json
    "test": "node --test \"tests/**/*.test.ts\"",
    "smoke": "node scripts/smoke-auth.mjs"
```

As aspas internas são obrigatórias. Verificado: `node --test tests` (diretório) falha com `MODULE_NOT_FOUND` — o runner tenta carregar a pasta como módulo. Só o padrão glob entre aspas funciona, e as aspas impedem que o shell o expanda antes do Node.

- [ ] **Step 4: Escrever o teste que falha**

Criar `tests/auth-validation.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEmail,
  isValidEmail,
  normalizeName,
  isValidName,
  isValidPassword,
  safeNext,
} from "../lib/auth-validation.ts";

test("normalizeEmail apara espaços e baixa a caixa", () => {
  assert.equal(normalizeEmail("  Yan@Email.COM "), "yan@email.com");
});

test("isValidEmail aceita e-mail comum e recusa lixo", () => {
  assert.equal(isValidEmail("yan@email.com"), true);
  assert.equal(isValidEmail("  Yan@Email.COM "), true);
  assert.equal(isValidEmail("yan@email"), false);
  assert.equal(isValidEmail("yan.com"), false);
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("a b@c.com"), false);
});

test("normalizeName colapsa espaços repetidos", () => {
  assert.equal(normalizeName("  Yan   Felipe  "), "Yan Felipe");
});

test("isValidName exige de 2 a 80 caracteres", () => {
  assert.equal(isValidName("Yan"), true);
  assert.equal(isValidName(" Y "), false);
  assert.equal(isValidName(""), false);
  assert.equal(isValidName("a".repeat(80)), true);
  assert.equal(isValidName("a".repeat(81)), false);
});

test("isValidPassword exige 8 caracteres", () => {
  assert.equal(isValidPassword("12345678"), true);
  assert.equal(isValidPassword("1234567"), false);
});

test("safeNext só aceita caminho interno", () => {
  assert.equal(safeNext("/produto"), "/produto");
  assert.equal(safeNext("/produto?a=1"), "/produto?a=1");
  assert.equal(safeNext(null), "/produto");
  assert.equal(safeNext(""), "/produto");
  // open redirect: os dois casos abaixo sairiam do nosso domínio
  assert.equal(safeNext("//site-malicioso.com"), "/produto");
  assert.equal(safeNext("https://site-malicioso.com"), "/produto");
  assert.equal(safeNext("/nova-senha", "/login"), "/nova-senha");
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com `Cannot find module` apontando para `lib/auth-validation.ts`.

- [ ] **Step 6: Escrever `lib/auth-validation.ts`**

```ts
/**
 * Validação compartilhada entre formulários e servidor, para as mensagens
 * serem idênticas nos dois lados.
 */

export const MSG = {
  nome: "Digite seu nome (pelo menos 2 letras).",
  email: "Digite um e-mail válido.",
  senha: "A senha precisa ter pelo menos 8 caracteres.",
  credenciais: "E-mail ou senha incorretos.",
  emailEmUso: "Esse e-mail já tem uma conta. Entre ou recupere a senha.",
  tentativas: "Muitas tentativas. Espere alguns minutos.",
  oauth:
    "Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha.",
  rede: "Falha de conexão. Tente novamente.",
} as const;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(raw));
}

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isValidName(raw: string): boolean {
  const n = normalizeName(raw);
  return n.length >= 2 && n.length <= 80;
}

export function isValidPassword(raw: string): boolean {
  return raw.length >= 8;
}

/**
 * Um `?next=` vindo da URL vira destino de redirecionamento. Sem esta trava,
 * `?next=https://site-malicioso` seria um open redirect assinado pelo nosso
 * domínio. Só caminhos internos passam.
 */
export function safeNext(
  raw: string | null | undefined,
  fallback = "/produto"
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  return raw;
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

```bash
npm test
```

Esperado: `# pass 6` e `# fail 0`.

- [ ] **Step 8: Criar `lib/supabase/client.ts`**

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para componentes client (formulários de login/cadastro). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 9: Criar `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente Supabase para Server Components e Route Handlers. */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components não podem escrever cookies. Tudo bem: o
            // middleware já renovou a sessão antes de chegar aqui.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 10: Criar `lib/supabase/middleware.ts`**

```ts
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
  } = await supabase.auth.getUser();

  return { response, user };
}
```

- [ ] **Step 11: Verificar que o projeto ainda compila**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json lib/supabase lib/auth-validation.ts tests
git commit -m "feat(auth): clientes Supabase e validacao compartilhada"
```

---

### Task 2: O gate — middleware e script de smoke

**Files:**
- Create: `middleware.ts`
- Create: `scripts/smoke-auth.mjs`

**Interfaces:**
- Consumes: `updateSession` de `lib/supabase/middleware.ts`; `safeNext` de `lib/auth-validation.ts`.
- Produces: bloqueio de `/produto` e `/api/checkout`; `npm run smoke`.

- [ ] **Step 1: Criar `middleware.ts` na raiz do projeto**

```ts
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

export const config = {
  matcher: ["/produto/:path*", "/api/checkout/:path*"],
};
```

Atenção: o matcher **não** inclui `/`, `/login`, `/cadastro` nem `/auth/callback`. A landing precisa continuar pública e as telas de login não podem exigir login.

- [ ] **Step 2: Criar `scripts/smoke-auth.mjs`**

```js
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

  console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Erro ao rodar o smoke:", e.message);
  console.error("O dev server esta rodando? (npm run dev)");
  process.exit(1);
});
```

- [ ] **Step 3: Rodar o smoke e confirmar que falha nos itens certos**

Com `npm run dev` em outro terminal:

```bash
npm run smoke
```

Esperado neste momento: passam os itens 1 e 2 (`/` e `/produto`); **falham** os de `/login` (a tela ainda não existe, dá 404). O item do 401 deve passar.

Este é o ponto do plano em que o gate já funciona e as telas ainda não.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts scripts/smoke-auth.mjs
git commit -m "feat(auth): gate de /produto e /api/checkout no middleware"
```

---

### Task 3: Sessão no client — store, mapeamento e hidratação

**Files:**
- Modify: `lib/store.ts:17-32` (interface) e `:34-40` (estado inicial)
- Create: `lib/supabase/session.ts`
- Create: `components/SessionHydrator.tsx`
- Modify: `app/layout.tsx:37-53`
- Test: `tests/session.test.ts`

**Interfaces:**
- Consumes: `createClient` de `lib/supabase/server.ts`.
- Produces:
  - `SessionUser` = `{ id: string; email: string; name: string }` (exportado de `lib/store.ts`)
  - `useStore().user: SessionUser | null` e `useStore().setUser(u: SessionUser | null): void`
  - `toSessionUser(user: User | null): SessionUser | null` de `lib/supabase/session.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/session.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toSessionUser } from "../lib/supabase/session.ts";

test("toSessionUser devolve null sem usuario", () => {
  assert.equal(toSessionUser(null), null);
});

test("toSessionUser le o nome do cadastro por senha", () => {
  const u = toSessionUser({
    id: "abc",
    email: "yan@email.com",
    user_metadata: { name: "Yan Felipe" },
  } as never);
  assert.deepEqual(u, { id: "abc", email: "yan@email.com", name: "Yan Felipe" });
});

test("toSessionUser cai para full_name, que e o que o Google grava", () => {
  const u = toSessionUser({
    id: "abc",
    email: "yan@email.com",
    user_metadata: { full_name: "Yan Felipe" },
  } as never);
  assert.equal(u?.name, "Yan Felipe");
});

test("toSessionUser devolve nome vazio quando nao ha metadata", () => {
  const u = toSessionUser({
    id: "abc",
    email: "yan@email.com",
    user_metadata: {},
  } as never);
  assert.equal(u?.name, "");
});

test("toSessionUser tolera e-mail ausente", () => {
  const u = toSessionUser({ id: "abc", user_metadata: {} } as never);
  assert.equal(u?.email, "");
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com `Cannot find module` apontando para `lib/supabase/session.ts`.

- [ ] **Step 3: Criar `lib/supabase/session.ts`**

```ts
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
```

- [ ] **Step 4: Adicionar o usuário ao store**

Em `lib/store.ts`, acrescentar acima de `interface StoreState`:

```ts
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}
```

Dentro de `interface StoreState`, acrescentar depois de `setSize`:

```ts
  /** ---- Sessão ---- */
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
```

Dentro do `create<StoreState>`, acrescentar depois de `setSize`:

```ts
  user: null,
  setUser: (user) => set({ user }),
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

```bash
npm test
```

Esperado: todos os testes passam (`# fail 0`).

- [ ] **Step 6: Criar `components/SessionHydrator.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useStore, type SessionUser } from "@/lib/store";

/**
 * Recebe do layout (server) o usuário já resolvido e joga no store.
 * Evita um fetch extra no browser e o "flash" de estado deslogado.
 */
export default function SessionHydrator({
  user,
}: {
  user: SessionUser | null;
}) {
  useEffect(() => {
    useStore.getState().setUser(user);
  }, [user]);

  return null;
}
```

- [ ] **Step 7: Ligar no `app/layout.tsx`**

Acrescentar aos imports do topo:

```tsx
import { createClient } from "@/lib/supabase/server";
import { toSessionUser } from "@/lib/supabase/session";
import SessionHydrator from "@/components/SessionHydrator";
```

Trocar a assinatura e o corpo do `RootLayout` (hoje em `app/layout.tsx:37-53`) por:

```tsx
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <SessionHydrator user={toSessionUser(user)} />
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
```

Nota: isso torna o layout dinâmico (renderizado por requisição). Sem impacto — a landing e a PDP já são `"use client"`.

- [ ] **Step 8: Verificar compilação e que a landing continua de pé**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro. Com o dev server rodando, abrir `http://localhost:3000` e confirmar que a landing carrega normalmente.

- [ ] **Step 9: Commit**

```bash
git add lib/store.ts lib/supabase/session.ts components/SessionHydrator.tsx app/layout.tsx tests/session.test.ts
git commit -m "feat(auth): sessao do Supabase disponivel no store"
```

---

### Task 4: Moldura visual, tela de login e menu do usuário

**Files:**
- Create: `components/auth/fields.ts`
- Create: `components/auth/AuthShell.tsx`
- Create: `components/auth/AuthPanel.tsx`
- Create: `components/auth/UserMenu.tsx`
- Create: `app/login/page.tsx`
- Modify: `components/Topbar.tsx:29-42`
- Modify: `components/shop/ShopHeader.tsx:20-44`

**Interfaces:**
- Consumes: `createClient` (client e server), `MSG`, `isValidEmail`, `isValidPassword`, `safeNext`, `useStore`.
- Produces:
  - `INPUT_CLASS: string` e `LABEL_CLASS: string` de `components/auth/fields.ts` — usados aqui e nas Tasks 7 e 8
  - `<AuthShell rotulo titulo children rodape />`
  - `<AuthPanel mode="login" | "register" next />`
  - `<UserMenu />`

Nota: o spec previa uma prop `googleEnabled`, herdada do design anterior, em que
as credenciais do Google ficavam em variáveis de ambiente que o Server Component
conseguia ler. Com o Supabase, o provider é ligado no painel — não há nada no
ambiente para consultar, e a prop seria sempre `true`. Foi removida em vez de
virar código morto. Já está verificado que o provider está ativo.

- [ ] **Step 1: Criar `components/auth/fields.ts`**

As três telas de auth (login/cadastro, recuperar senha, nova senha) usam os
mesmos campos. A classe mora aqui uma vez só.

```ts
/** Estilo dos campos das telas de autenticação. */
export const INPUT_CLASS =
  "w-full rounded-lg border border-line bg-transparent px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-mute-2 focus:border-[var(--gold)]";

export const LABEL_CLASS =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-mute-2";
```

- [ ] **Step 2: Criar `components/auth/AuthShell.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Moldura compartilhada por login, cadastro e recuperação de senha. */
export default function AuthShell({
  rotulo,
  titulo,
  children,
  rodape,
}: {
  rotulo: string;
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: "var(--bg)" }}
    >
      <Link href="/" className="relic relic-ink mb-10 block w-full max-w-[280px]">
        <Image
          src="/designs/front.webp"
          alt="VOLTAREI — Apocalipse 19"
          width={2048}
          height={832}
          priority
          className="h-auto w-full"
        />
      </Link>

      <div className="card w-full max-w-[400px] px-7 py-8">
        <p className="sacred mb-2">{rotulo}</p>
        <h1 className="display mb-7 text-3xl">{titulo}</h1>
        {children}
      </div>

      {rodape && (
        <div className="mt-6 text-center text-sm text-mute">{rodape}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Criar `components/auth/AuthPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  MSG,
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeEmail,
  normalizeName,
} from "@/lib/auth-validation";
import { INPUT_CLASS, LABEL_CLASS } from "./fields";

/**
 * Ícone do Google em SVG inline — o site não carrega assets externos.
 * As cores são as da marca, exigidas pelas diretrizes do Google: é a única
 * exceção à regra de usar só tokens do tema.
 */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.4z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.8 6.9 2.3 9.8l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.3 30 2 24 2 15.4 2 7.9 7 4.3 14.2l7.3 5.7c1.8-5.2 6.6-9.1 12.4-9.1z" />
    </svg>
  );
}

export default function AuthPanel({
  mode,
  next,
}: {
  mode: "login" | "register";
  next: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const registrando = mode === "register";

  async function entrarComGoogle() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setErro(MSG.oauth);
      setCarregando(false);
    }
    // Em caso de sucesso o browser navega para o Google; não desligamos o
    // "carregando" para o botão não voltar ao normal durante a saída.
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (registrando && !isValidName(nome)) return setErro(MSG.nome);
    if (!isValidEmail(email)) return setErro(MSG.email);
    if (!isValidPassword(senha)) return setErro(MSG.senha);

    setCarregando(true);
    try {
      if (registrando) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizeEmail(email),
          password: senha,
          options: { data: { name: normalizeName(nome) } },
        });

        // O Supabase responde SUCESSO quando o e-mail já existe, para não
        // deixar ninguém descobrir quais e-mails estão cadastrados. A única
        // pista é a lista de identities vir vazia.
        if (!error && data.user && data.user.identities?.length === 0) {
          setErro(MSG.emailEmUso);
          return;
        }
        if (error) {
          setErro(error.status === 429 ? MSG.tentativas : error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(email),
          password: senha,
        });
        if (error) {
          setErro(error.status === 429 ? MSG.tentativas : MSG.credenciais);
          return;
        }
      }

      router.replace(next);
      router.refresh();
    } catch {
      setErro(MSG.rede);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={carregando}
        className="btn-magnetic btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleIcon />
        Entrar com Google
      </button>

      <div className="seam my-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          ou
        </span>
      </div>

      <form onSubmit={enviar} noValidate>
        {registrando && (
          <div className="mb-4">
            <label className={LABEL_CLASS} htmlFor="nome">
              Nome completo
            </label>
            <input
              id="nome"
              className={INPUT_CLASS}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Yan Felipe"
              autoComplete="name"
            />
          </div>
        )}

        <div className="mb-4">
          <label className={LABEL_CLASS} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            className={INPUT_CLASS}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
          />
        </div>

        <div className="mb-5">
          <label className={LABEL_CLASS} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            className={INPUT_CLASS}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder={registrando ? "mínimo 8 caracteres" : "••••••••"}
            autoComplete={registrando ? "new-password" : "current-password"}
          />
        </div>

        {erro && (
          <p className="mb-4 text-center text-xs" style={{ color: "var(--blood)" }}>
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="btn-magnetic w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {registrando ? "Criando conta…" : "Entrando…"}
            </>
          ) : registrando ? (
            "Criar conta"
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      {!registrando && (
        <p className="mt-5 text-center">
          <Link
            href="/recuperar-senha"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2 underline underline-offset-4 transition-colors hover:text-ink"
          >
            Esqueci minha senha
          </Link>
        </p>
      )}
    </>
  );
}
```

- [ ] **Step 4: Criar `app/login/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthPanel from "@/components/auth/AuthPanel";
import { createClient } from "@/lib/supabase/server";
import { safeNext, MSG } from "@/lib/auth-validation";

export const metadata = { title: "Entrar · VOLTAREI" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; erro?: string };
}) {
  const next = safeNext(searchParams.next);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Quem já entrou não tem o que fazer nesta tela.
  if (user) redirect(next);

  return (
    <AuthShell
      rotulo="Apocalipse 19"
      titulo="Entrar"
      rodape={
        <>
          Ainda não tem conta?{" "}
          <Link
            href={`/cadastro?next=${encodeURIComponent(next)}`}
            className="gold-text underline underline-offset-4"
          >
            Criar conta
          </Link>
        </>
      }
    >
      {searchParams.erro === "oauth" && (
        <p className="mb-4 text-center text-xs" style={{ color: "var(--blood)" }}>
          {MSG.oauth}
        </p>
      )}
      <AuthPanel mode="login" next={next} />
    </AuthShell>
  );
}
```

- [ ] **Step 5: Criar `components/auth/UserMenu.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

/** Nome de quem está logado + sair. Nada quando não há sessão. */
export default function UserMenu() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const router = useRouter();

  if (!user) return null;

  const primeiroNome = (user.name || user.email).split(" ")[0];

  async function sair() {
    await createClient().auth.signOut();
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:inline">
        {primeiroNome}
      </span>
      <button
        onClick={sair}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2 underline underline-offset-4 transition-colors hover:text-ink"
      >
        Sair
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Ligar o `UserMenu` no `Topbar`**

Em `components/Topbar.tsx`, acrescentar ao topo:

```tsx
import UserMenu from "./auth/UserMenu";
```

E, dentro do `<header>`, logo depois do `</a>` do link "24H DE ADORAÇÃO SHOP":

```tsx
        <UserMenu />
```

O `<header>` já tem `justify-between`, então o menu encosta na direita sem mudança de layout.

- [ ] **Step 7: Ligar o `UserMenu` no `ShopHeader`**

Em `components/shop/ShopHeader.tsx`, acrescentar ao topo:

```tsx
import UserMenu from "@/components/auth/UserMenu";
```

Trocar o `<button>` do carrinho por um contêiner que junte os dois — ou seja, envolver o botão existente:

```tsx
        <div className="flex items-center gap-4">
          <UserMenu />
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Abrir carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold tabular-nums"
                style={{ background: "var(--accent)", color: "var(--accent-on)" }}
              >
                {count}
              </span>
            )}
          </button>
        </div>
```

- [ ] **Step 8: Rodar o smoke — agora deve passar inteiro**

```bash
npm run smoke
```

Esperado: `Tudo certo.` — inclusive os dois itens de `/login`, que falhavam na Task 2.

- [ ] **Step 9: Conferir a tela no navegador**

Com o dev server rodando, abrir `http://localhost:3000/produto`. Esperado: redireciona para `/login?next=%2Fproduto`, mostrando o lettering VOLTAREI, o painel com o botão do Google, a costura dourada e o formulário.

- [ ] **Step 10: Commit**

```bash
git add components/auth app/login components/Topbar.tsx components/shop/ShopHeader.tsx
git commit -m "feat(auth): tela de login e menu do usuario"
```

---

### Task 5: Tela de cadastro

**Files:**
- Create: `app/cadastro/page.tsx`

**Interfaces:**
- Consumes: `AuthShell`, `AuthPanel` (com `mode="register"`), `safeNext`, `createClient` (server).
- Produces: rota `/cadastro`.

- [ ] **Step 1: Criar `app/cadastro/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthPanel from "@/components/auth/AuthPanel";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth-validation";

export const metadata = { title: "Criar conta · VOLTAREI" };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeNext(searchParams.next);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next);

  return (
    <AuthShell
      rotulo="Apocalipse 19"
      titulo="Criar conta"
      rodape={
        <>
          Já tem conta?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="gold-text underline underline-offset-4"
          >
            Entrar
          </Link>
        </>
      }
    >
      <AuthPanel mode="register" next={next} />
    </AuthShell>
  );
}
```

- [ ] **Step 2: Testar o cadastro no navegador**

Abrir `http://localhost:3000/cadastro`, preencher nome, um e-mail novo e uma senha de 8+ caracteres.

Esperado: cria a conta e cai em `/produto`, já com o primeiro nome aparecendo no header.

Se "Confirm email" ainda estiver ligado no painel do Supabase, o cadastro é criado mas **não** loga — a pessoa fica presa esperando o e-mail. É o item pendente das Global Constraints.

- [ ] **Step 3: Testar a pegadinha do e-mail repetido**

Sair, voltar em `/cadastro` e tentar cadastrar **o mesmo e-mail** de novo.

Esperado: a mensagem "Esse e-mail já tem uma conta. Entre ou recupere a senha."

Se aparecer "conta criada" e nada acontecer, a checagem de `identities?.length === 0` no `AuthPanel` não está funcionando — é o erro mais provável desta implementação.

- [ ] **Step 4: Testar o login com a conta criada**

Em `/login`, entrar com o mesmo e-mail e senha. Depois testar com a senha errada.

Esperado: senha certa entra e vai para `/produto`; senha errada mostra "E-mail ou senha incorretos."

- [ ] **Step 5: Commit**

```bash
git add app/cadastro
git commit -m "feat(auth): tela de cadastro"
```

---

### Task 6: Login com Google

**Files:**
- Create: `app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createClient` (server), `safeNext`. O botão já existe no `AuthPanel` desde a Task 4.
- Produces: rota `/auth/callback`, destino do retorno do Google e do link de recuperação de senha.

- [ ] **Step 1: Criar `app/auth/callback/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth-validation";

/**
 * Retorno do Google e do link de recuperação de senha: troca o `code` por
 * sessão e manda a pessoa para o destino.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?erro=oauth`);
}
```

Conferir que `/auth/callback` **não** está no matcher do `middleware.ts` — se estiver, o retorno do Google é bloqueado antes de criar a sessão, e o login entra num laço infinito.

- [ ] **Step 2: Testar o fluxo do Google no navegador**

Abrir `http://localhost:3000/login` e clicar em "Entrar com Google".

Esperado: vai para a tela de contas do Google, volta para `/produto` logado, e o primeiro nome aparece no header.

- [ ] **Step 3: Conferir que o nome veio do Google**

Abrir o carrinho (`/produto` → adicionar item). O nome ainda não aparece preenchido — isso é a Task 8. Por ora, confirmar no header que o `UserMenu` mostra o primeiro nome da conta Google, o que prova que `full_name` chegou no `user_metadata`.

- [ ] **Step 4: Commit**

```bash
git add app/auth
git commit -m "feat(auth): retorno do OAuth do Google"
```

---

### Task 7: Recuperação de senha

**Files:**
- Create: `app/recuperar-senha/page.tsx`
- Create: `components/auth/ResetForm.tsx`
- Create: `app/nova-senha/page.tsx`
- Create: `components/auth/NovaSenhaForm.tsx`

**Interfaces:**
- Consumes: `AuthShell`, `createClient` (client), `MSG`, `isValidEmail`, `isValidPassword`.
- Produces: rotas `/recuperar-senha` e `/nova-senha`.

- [ ] **Step 1: Criar `components/auth/ResetForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MSG, isValidEmail, normalizeEmail } from "@/lib/auth-validation";

import { INPUT_CLASS, LABEL_CLASS } from "./fields";

export default function ResetForm() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!isValidEmail(email)) return setErro(MSG.email);

    setCarregando(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(
        normalizeEmail(email),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/nova-senha")}`,
        }
      );
      if (error) {
        setErro(error.status === 429 ? MSG.tentativas : MSG.rede);
        return;
      }
      // Sempre confirma, mesmo que o e-mail não exista: dizer "esse e-mail
      // não tem conta" deixaria descobrir quem está cadastrado.
      setEnviado(true);
    } catch {
      setErro(MSG.rede);
    } finally {
      setCarregando(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck size={40} className="gold-text" />
        <p className="text-sm leading-relaxed text-mute">
          Se existir uma conta com esse e-mail, o link para criar uma senha nova
          já está a caminho. Confira também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label
        className={LABEL_CLASS}
        htmlFor="email"
      >
        E-mail da conta
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        className={INPUT_CLASS}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@email.com"
        autoComplete="email"
      />

      {erro && (
        <p className="mt-4 text-center text-xs" style={{ color: "var(--blood)" }}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={carregando}
        className="btn-magnetic mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {carregando ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar link"
        )}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Criar `app/recuperar-senha/page.tsx`**

```tsx
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetForm from "@/components/auth/ResetForm";

export const metadata = { title: "Recuperar senha · VOLTAREI" };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      rotulo="Apocalipse 19"
      titulo="Recuperar senha"
      rodape={
        <Link href="/login" className="gold-text underline underline-offset-4">
          Voltar para o login
        </Link>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
```

- [ ] **Step 3: Criar `components/auth/NovaSenhaForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MSG, isValidPassword } from "@/lib/auth-validation";

import { INPUT_CLASS, LABEL_CLASS } from "./fields";

export default function NovaSenhaForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!isValidPassword(senha)) return setErro(MSG.senha);

    setCarregando(true);
    try {
      const { error } = await createClient().auth.updateUser({
        password: senha,
      });
      if (error) {
        setErro(error.message);
        return;
      }
      router.replace("/produto");
      router.refresh();
    } catch {
      setErro(MSG.rede);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label
        className={LABEL_CLASS}
        htmlFor="senha"
      >
        Nova senha
      </label>
      <input
        id="senha"
        type="password"
        className={INPUT_CLASS}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="mínimo 8 caracteres"
        autoComplete="new-password"
      />

      {erro && (
        <p className="mt-4 text-center text-xs" style={{ color: "var(--blood)" }}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={carregando}
        className="btn-magnetic mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {carregando ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Salvando…
          </>
        ) : (
          "Salvar senha"
        )}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Criar `app/nova-senha/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import NovaSenhaForm from "@/components/auth/NovaSenhaForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nova senha · VOLTAREI" };

export default async function NovaSenhaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Só chega aqui quem veio do link do e-mail, que já criou a sessão no
  // /auth/callback. Sem sessão, não há o que trocar.
  if (!user) redirect("/recuperar-senha");

  return (
    <AuthShell rotulo="Apocalipse 19" titulo="Nova senha">
      <NovaSenhaForm />
    </AuthShell>
  );
}
```

- [ ] **Step 5: Testar o fluxo completo**

Sair da conta, ir em `/login` → "Esqueci minha senha" → informar o e-mail cadastrado na Task 5.

Esperado: tela de confirmação; o e-mail chega; clicar no link cai em `/nova-senha`; salvar uma senha nova leva a `/produto` logado; e a senha nova funciona no `/login`.

Se o e-mail não chegar, conferir o limite de envio do plano gratuito no painel do Supabase (Authentication → Logs).

- [ ] **Step 6: Commit**

```bash
git add app/recuperar-senha app/nova-senha components/auth/ResetForm.tsx components/auth/NovaSenhaForm.tsx
git commit -m "feat(auth): recuperacao de senha"
```

---

### Task 8: Nome no carrinho e no checkout

**Files:**
- Modify: `components/shop/CartDrawer.tsx:39-51` (estado e validação), `:341-360` (formulário)
- Modify: `app/api/checkout/route.ts:20-67`

**Interfaces:**
- Consumes: `useStore().user`, `isValidName`, `normalizeName`, `createClient` (server).
- Produces: `POST /api/checkout` passa a aceitar `{ items, email, name }`.

- [ ] **Step 1: Adicionar nome e prefill ao `CartDrawer`**

Nos imports, acrescentar:

```tsx
import { isValidName, normalizeName } from "@/lib/auth-validation";
```

Junto dos outros seletores do store (perto de `const cart = useStore(...)`):

```tsx
  const user = useStore((s) => s.user);
```

Depois de `const [email, setEmail] = useState("");`, acrescentar:

```tsx
  const [nome, setNome] = useState("");
```

Depois da linha `const emailOk = ...`, acrescentar:

```tsx
  const nomeOk = isValidName(nome);
```

E logo abaixo, o preenchimento automático:

```tsx
  // A sessão chega depois da primeira renderização (o SessionHydrator roda
  // num efeito), então preenchemos quando ela aparece — sem nunca sobrescrever
  // o que a pessoa já digitou.
  useEffect(() => {
    if (!user) return;
    setNome((n) => n || user.name);
    setEmail((e) => e || user.email);
  }, [user]);
```

- [ ] **Step 2: Passar o nome para a API**

Dentro de `gerarPix`, trocar a primeira linha da função:

```tsx
    if (!emailOk || cart.length === 0) return;
```

por:

```tsx
    if (!emailOk || !nomeOk || cart.length === 0) return;
```

E no `body` do `fetch`, trocar:

```tsx
        body: JSON.stringify({ items: cart, email }),
```

por:

```tsx
        body: JSON.stringify({ items: cart, email, name: normalizeName(nome) }),
```

- [ ] **Step 3: Adicionar o campo Nome ao formulário**

Em `components/shop/CartDrawer.tsx`, logo **antes** do bloco `<label>` do e-mail (hoje na linha 341), inserir:

```tsx
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-mute-2">
                    Nome de quem vai retirar
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Yan Felipe"
                    autoComplete="name"
                    className="mb-3 w-full rounded-lg border border-line bg-transparent px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-mute-2 focus:border-[var(--gold)]"
                  />
```

E no botão "Pagar com Pix", trocar:

```tsx
                    disabled={!emailOk || loading}
```

por:

```tsx
                    disabled={!emailOk || !nomeOk || loading}
```

- [ ] **Step 4: Validar o nome e conferir a sessão na API**

Em `app/api/checkout/route.ts`, acrescentar aos imports:

```ts
import { createClient } from "@/lib/supabase/server";
import { isValidName, normalizeName } from "@/lib/auth-validation";
```

Trocar a desestruturação do corpo (linha 23) por:

```ts
  const { items, email, name } = (await req.json().catch(() => ({}))) as {
    items?: CartItem[];
    email?: string;
    name?: string;
  };
```

Logo depois do `if (!key)`, acrescentar a checagem de sessão:

```ts
  // O middleware já bloqueia esta rota, mas confirmamos aqui também: é a
  // única garantia se o matcher for mexido por engano no futuro.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
```

Depois da validação de e-mail, acrescentar:

```ts
  if (!name || !isValidName(name)) {
    return NextResponse.json(
      { configured: true, error: "invalid_name" },
      { status: 400 }
    );
  }
```

Trocar a montagem da descrição por uma que inclua o nome:

```ts
  const comprador = normalizeName(name);
  const description = items
    .map((i) => `Camiseta ${i.version} ${i.fit ?? "Regular"} (${i.size}) x${i.qty}`)
    .join(" · ");
```

E, no corpo do `fetch` do Mercado Pago, trocar:

```ts
      description: `${description} · 24 Horas de Adoração`,
      payer: { email },
```

por:

```ts
      description: `${comprador} · ${description} · 24 Horas de Adoração`,
      payer: { email, first_name: comprador },
```

O nome entra na descrição porque a reconciliação de quem comprou é feita lendo esse campo no painel do Mercado Pago.

- [ ] **Step 5: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

- [ ] **Step 6: Testar o carrinho no navegador**

Logado, abrir `/produto`, adicionar uma camiseta ao carrinho.

Esperado:
- os campos **Nome** e **E-mail** aparecem já preenchidos com os dados da conta;
- apagar o nome desabilita o botão "Pagar com Pix";
- editar o nome funciona normalmente;
- com nome e e-mail válidos, o Pix é gerado (o `MP_ACCESS_TOKEN` de teste gera o QR).

Testar nas duas contas: a criada por senha na Task 5 e a do Google na Task 6. As duas devem preencher nome e e-mail.

- [ ] **Step 7: Rodar o smoke e os testes uma última vez**

```bash
npm test && npm run smoke
```

Esperado: ambos passam.

- [ ] **Step 8: Commit**

```bash
git add components/shop/CartDrawer.tsx app/api/checkout/route.ts
git commit -m "feat(checkout): nome do comprador no carrinho e no pagamento"
```

---

## Checklist manual final

O que o smoke não consegue cobrir, porque exige browser e clique humano:

- [ ] Landing `/` abre sem pedir login.
- [ ] `/produto` sem sessão manda para `/login?next=%2Fproduto`.
- [ ] Cadastro com e-mail novo entra direto e volta para `/produto`.
- [ ] Cadastro repetindo o e-mail mostra "Esse e-mail já tem uma conta".
- [ ] Login com senha errada mostra "E-mail ou senha incorretos".
- [ ] Login com senha certa volta para `/produto`.
- [ ] "Entrar com Google" completa e traz o nome da conta Google.
- [ ] Conta Google e conta por senha com **o mesmo e-mail** entram na mesma conta.
- [ ] "Esqueci minha senha" envia o e-mail e o link leva a `/nova-senha`.
- [ ] Sair limpa a sessão e `/produto` volta a pedir login.
- [ ] Carrinho preenche nome e e-mail nas duas formas de login.
- [ ] Pix é gerado com nome e e-mail válidos.

## Antes de publicar na Vercel

- [x] Desligar "Confirm email" no Supabase — já feito e verificado em 28/07/2026.
- [ ] Cadastrar na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (domínio real), `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [ ] No Supabase, Authentication → URL Configuration: `Site URL` = domínio real, e `https://SEU-DOMINIO/**` nas Redirect URLs.
- [ ] Conferir que o projeto Supabase não está hibernado (pausa após 7 dias sem atividade).
