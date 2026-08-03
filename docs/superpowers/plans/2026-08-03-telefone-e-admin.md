# Telefone obrigatório e tela de admin — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Exigir telefone válido antes de gerar o Pix e criar `/admin`, restrita por lista de e-mails, com a tabela de todos os pedidos (nome, e-mail, telefone, modelo, valor, tamanho, data, hora).

**Arquitetura:** A validação do telefone entra em `lib/auth-validation.ts` como função pura, usada pelo formulário e pelo servidor — o botão desabilitado é conveniência, a recusa da API é a trava. A tabela do admin exige persistência, que hoje não existe: uma tabela `pedidos` no Postgres do Supabase, escrita e lida **só** pelo servidor com a chave `service_role`, com RLS ligada e nenhuma política. Uma linha por item do carrinho. Como passa a existir um vínculo pagamento→usuário, as rotas `status` e `cancel` ganham checagem de posse.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Supabase (Auth + Postgres), Mercado Pago via REST, `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-03-telefone-e-admin-design.md` — leia antes de começar, em especial "Invariantes de segurança novas".

## Restrições globais

Valem para **todas** as tarefas:

- **Node é portátil.** Se `npm`/`node` não estiverem no PATH: `$env:Path = "$env:USERPROFILE\nodejs;$env:Path"`
- **`npm test`** = `node --test "tests/**/*.test.ts"`. As aspas são obrigatórias. Os imports em `tests/` usam **extensão `.ts` explícita** (`../lib/admin.ts`) — exigência do type stripping do Node.
- **Nenhuma dependência nova.** `@supabase/supabase-js` já é dependência direta (`package.json:15`).
- **Sem framework de teste.** `node:test` + `node:assert/strict`, como em `tests/auth-validation.test.ts`.
- **Todo componente usa tokens CSS** (`var(--ink)`, `var(--line)`, `var(--bg)`, `var(--mute)`, `var(--blood)`…), nunca cor fixa. Fontes: `.display` (Cinzel) em títulos, `font-mono` em dados.
- **Nenhuma mensagem crua de API chega à tela.** Toda string de erro visível vem de `MSG` em `lib/auth-validation.ts`, em pt-BR.
- **Preço, corte, tamanho e quantidade são resolvidos no servidor** contra `lib/data.ts`. O corpo do POST nunca decide valor.
- **`SUPABASE_SERVICE_ROLE_KEY` nunca leva prefixo `NEXT_PUBLIC_`.** Só `lib/supabase/admin.ts` a lê, e esse arquivo nunca é importado por componente client.
- **Pare o `npm run dev` antes de `npm run build`** — os dois compartilham `.next` e conflitam.
- **Mensagens de commit em pt-BR, sem acentuação** (padrão do repositório), terminando com:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/auth-validation.ts` | *(modificar)* + `normalizePhone`, `isValidPhone`, `formatPhone`, `MSG.telefone` |
| `lib/admin.ts` | *(criar)* `isAdminEmail` — quem pode abrir `/admin`. Nada além disso |
| `lib/pedidos.ts` | *(criar)* o tipo `PedidoRow` e `resumirPagos` (lógica pura do resumo, testável sem banco) |
| `lib/supabase/admin.ts` | *(criar)* cliente `service_role`. Só o cliente, sem query |
| `components/shop/CartDrawer.tsx` | *(modificar)* campo de telefone com máscara, trava do botão, tratamento de `invalid_phone`/`order_save_failed`/404 no polling |
| `app/api/checkout/route.ts` | *(modificar)* valida telefone, manda `payer.phone`, grava os pedidos, cancela o Pix se a gravação falhar |
| `app/api/checkout/status/route.ts` | *(modificar)* checagem de posse + atualiza o status na tabela |
| `app/api/checkout/cancel/route.ts` | *(modificar)* checagem de posse + marca `cancelled` |
| `app/admin/page.tsx` | *(criar)* Server Component: gate de autorização + busca dos pedidos |
| `components/admin/PedidosTable.tsx` | *(criar)* apresentação: resumo + tabela. Sem acesso a banco |
| `components/admin/SyncButton.tsx` | *(criar)* único componente client do admin |
| `app/api/admin/sync/route.ts` | *(criar)* reconsulta os pendentes no Mercado Pago |
| `middleware.ts` | *(modificar)* `/admin` e `/api/admin` no matcher |
| `tests/phone.test.ts`, `tests/admin.test.ts`, `tests/pedidos.test.ts` | *(criar)* |
| `scripts/smoke-auth.mjs` | *(modificar)* +3 checagens |
| `.env.example`, `CLAUDE.md` | *(modificar)* documentação |

---

### Task 1: Validação de telefone

**Files:**
- Modify: `lib/auth-validation.ts` (acrescentar no fim; `MSG` está nas linhas 6-19)
- Test: `tests/phone.test.ts` (criar)

**Interfaces:**
- Consumes: nada.
- Produces: `normalizePhone(raw: string): string`, `isValidPhone(raw: string): boolean`, `formatPhone(raw: string): string`, `MSG.telefone: string`.

- [ ] **Step 1: Escreva o teste que falha**

Crie `tests/phone.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  isValidPhone,
  formatPhone,
} from "../lib/auth-validation.ts";

test("normalizePhone deixa só dígitos", () => {
  assert.equal(normalizePhone("(11) 91234-5678"), "11912345678");
  assert.equal(normalizePhone(" 11 9 1234 5678 "), "11912345678");
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("abc"), "");
});

test("normalizePhone descarta o código do país quando alguém cola +55", () => {
  assert.equal(normalizePhone("+55 11 91234-5678"), "11912345678"); // 13 dígitos
  assert.equal(normalizePhone("55 11 3333-4444"), "1133334444"); // 12 dígitos, fixo
  // 11 dígitos começando com 55 é DDD 55 (Santa Maria/RS), não código de país
  assert.equal(normalizePhone("55 99123-4567"), "55991234567");
});

test("isValidPhone aceita celular de 11 e fixo de 10", () => {
  assert.equal(isValidPhone("(11) 91234-5678"), true);
  assert.equal(isValidPhone("11912345678"), true);
  assert.equal(isValidPhone("(11) 3333-4444"), true);
  assert.equal(isValidPhone("+55 21 99876-5432"), true);
});

test("isValidPhone recusa tamanho errado", () => {
  assert.equal(isValidPhone(""), false);
  assert.equal(isValidPhone("119123456"), false); // 9 dígitos
  assert.equal(isValidPhone("119123456789"), false); // 12 dígitos sem o 55
});

test("isValidPhone recusa DDD inexistente", () => {
  assert.equal(isValidPhone("0912345678"), false); // DDD 09
  assert.equal(isValidPhone("1012345678"), false); // DDD 10
  assert.equal(isValidPhone("1112345678"), true); // DDD 11 é o menor válido
});

test("isValidPhone exige o nono dígito no celular", () => {
  // todo celular brasileiro de 11 dígitos começa com 9 depois do DDD
  assert.equal(isValidPhone("11812345678"), false);
  assert.equal(isValidPhone("11912345678"), true);
});

test("formatPhone formata os dois tamanhos", () => {
  assert.equal(formatPhone("11912345678"), "(11) 91234-5678");
  assert.equal(formatPhone("1133334444"), "(11) 3333-4444");
});

test("formatPhone acompanha a digitação (máscara progressiva)", () => {
  assert.equal(formatPhone(""), "");
  assert.equal(formatPhone("1"), "1");
  assert.equal(formatPhone("11"), "11");
  assert.equal(formatPhone("119"), "(11) 9");
  assert.equal(formatPhone("119123"), "(11) 9123");
  assert.equal(formatPhone("1191234"), "(11) 9123-4");
  // dígito 12 em diante é descartado: não existe telefone brasileiro maior
  assert.equal(formatPhone("119123456789"), "(11) 91234-5678");
});
```

- [ ] **Step 2: Rode e confirme que falha**

```
npm test
```
Esperado: FALHA com `SyntaxError` / "does not provide an export named 'normalizePhone'".

- [ ] **Step 3: Implemente**

Acrescente no fim de `lib/auth-validation.ts`:

```ts
/**
 * Telefone brasileiro. Guardamos só os dígitos — a formatação é sempre na
 * exibição, para buscar por número não depender de como a pessoa digitou.
 */
export function normalizePhone(raw: string): string {
  const digitos = (raw ?? "").replace(/\D/g, "");
  // Alguém colou com o código do país: 55 + DDD + 8 ou 9 dígitos = 12 ou 13.
  // Em 11 dígitos, "55" é DDD (Santa Maria/RS) e não pode ser removido.
  if (
    (digitos.length === 12 || digitos.length === 13) &&
    digitos.startsWith("55")
  ) {
    return digitos.slice(2);
  }
  return digitos;
}

export function isValidPhone(raw: string): boolean {
  const d = normalizePhone(raw);
  if (d.length !== 10 && d.length !== 11) return false;

  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // Todo celular brasileiro de 11 dígitos começa com 9 depois do DDD. A regra
  // pega erro de digitação sem recusar nada legítimo. Fixo de 10 dígitos
  // continua valendo: em cidade pequena pode ser o único telefone da pessoa.
  if (d.length === 11 && d[2] !== "9") return false;

  return true;
}

/**
 * `(11) 91234-5678`. Progressivo de propósito: é a mesma função que faz a
 * máscara enquanto a pessoa digita no carrinho e que formata a tabela do admin.
 */
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw).slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = `(${d.slice(0, 2)})`;
  if (d.length <= 6) return `${ddd} ${d.slice(2)}`;
  if (d.length <= 10) return `${ddd} ${d.slice(2, 6)}-${d.slice(6)}`;
  return `${ddd} ${d.slice(2, 7)}-${d.slice(7)}`;
}
```

E acrescente em `MSG` (dentro do objeto, antes do `} as const;`):

```ts
  telefone: "Digite um telefone com DDD, como (11) 91234-5678.",
```

- [ ] **Step 4: Rode e confirme que passa**

```
npm test
```
Esperado: PASS em todos, incluindo os testes antigos de `auth-validation`.

- [ ] **Step 5: Commit**

```bash
git add lib/auth-validation.ts tests/phone.test.ts
git commit -m "feat(validacao): telefone brasileiro com mascara progressiva

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Telefone obrigatório no carrinho e na API

Entrega independente: a compra já fica proibida sem telefone, antes de existir qualquer persistência.

**Files:**
- Modify: `components/shop/CartDrawer.tsx` (imports linha 20; estado linhas 45-55; `gerarPix` linhas 67-122; `fechar` linhas 198-210; campos linhas 422-463)
- Modify: `app/api/checkout/route.ts` (imports linha 4; leitura do corpo linhas 63-67; validações linhas 90-102; chamada ao MP linhas 135-141)

**Interfaces:**
- Consumes: `normalizePhone`, `isValidPhone`, `formatPhone`, `MSG.telefone` (Task 1).
- Produces: a API passa a aceitar `phone` no corpo do POST e a responder `{ error: "invalid_phone" }` com status 400.

- [ ] **Step 1: Servidor — valide o telefone**

Em `app/api/checkout/route.ts`, troque a linha de import:

```ts
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "@/lib/auth-validation";
```

Inclua `phone` na desestruturação do corpo:

```ts
  const { items, email, name, phone } = (await req.json().catch(() => ({}))) as {
    items?: RawCartItem[];
    email?: string;
    name?: string;
    phone?: string;
  };
```

Troque a validação de e-mail (que hoje repete a regex inline) por `isValidEmail` e acrescente a do telefone, logo depois da validação de nome:

```ts
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { configured: true, error: "invalid_email" },
      { status: 400 }
    );
  }

  if (!name || !isValidName(name)) {
    return NextResponse.json(
      { configured: true, error: "invalid_name" },
      { status: 400 }
    );
  }

  // É esta recusa que "proíbe a compra" sem telefone. O botão desabilitado no
  // carrinho é conveniência; quem chamar a API direto para aqui.
  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json(
      { configured: true, error: "invalid_phone" },
      { status: 400 }
    );
  }
```

Depois de `const comprador = normalizeName(name);`, acrescente:

```ts
  const contato = normalizeEmail(email);
  const telefone = normalizePhone(phone);
```

E no corpo enviado ao Mercado Pago, troque o `payer` para levar o telefone (aparece no painel deles de graça):

```ts
      payer: {
        email: contato,
        first_name: comprador,
        phone: {
          area_code: telefone.slice(0, 2),
          number: telefone.slice(2),
        },
      },
```

- [ ] **Step 2: Carrinho — estado e máscara**

Em `components/shop/CartDrawer.tsx`, troque o import da linha 20:

```ts
import {
  MSG,
  formatPhone,
  isValidName,
  isValidPhone,
  normalizePhone,
  normalizeName,
} from "@/lib/auth-validation";
```

Acrescente o estado depois de `const [nome, setNome] = useState("");`:

```ts
  const [tel, setTel] = useState(""); // sempre só dígitos
```

E o validador, junto de `emailOk`/`nomeOk`:

```ts
  const telOk = isValidPhone(tel);
```

- [ ] **Step 3: Carrinho — o campo**

Depois do `<input type="email" …>` (linha ~437-444), acrescente:

```tsx
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-mute-2">
                    Seu telefone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formatPhone(tel)}
                    onChange={(e) => setTel(normalizePhone(e.target.value))}
                    placeholder="(11) 91234-5678"
                    autoComplete="tel"
                    className="mb-1 w-full rounded-lg border border-line bg-transparent px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-mute-2 focus:border-[var(--ink)]"
                  />
                  {/* Só avisa quem digitou algo errado. Campo vazio não recebe
                      alerta: brigar com um campo que ninguém tocou é ruído. */}
                  <p
                    className="mb-3 text-[11px]"
                    style={{ color: "var(--blood-lite)" }}
                  >
                    {tel.length > 0 && !telOk ? MSG.telefone : " "}
                  </p>
```

O telefone **não** é preenchido a partir da conta (o `useEffect` das linhas 60-64 continua só com nome e e-mail): ele não existe no `user_metadata` e não vai passar a existir — o autocomplete do navegador cobre a recompra.

- [ ] **Step 4: Carrinho — trava do botão e envio**

Na chamada do fetch dentro de `gerarPix`, inclua o telefone:

```ts
        body: JSON.stringify({
          items: cart,
          email,
          name: normalizeName(nome),
          phone: tel,
        }),
```

Na primeira linha de `gerarPix`, inclua o telefone na guarda:

```ts
    if (!emailOk || !nomeOk || !telOk || cart.length === 0) return;
```

Trate a recusa do servidor, junto dos outros `data.error`:

```ts
      if (data.error === "invalid_phone") {
        setError(MSG.telefone);
        return;
      }
```

E no `disabled` do botão (linha ~452):

```tsx
                    disabled={!emailOk || !nomeOk || !telOk || loading}
```

Em `fechar()`, dentro do `if (step === "pago")`, acrescente `setTel("");` — diferente de nome e e-mail, não há valor de conta para onde voltar.

- [ ] **Step 5: Verifique**

```
npm test
npm run build
```
Esperado: testes PASS e build sem erro de tipo. (Pare o `npm run dev` antes do build.)

Depois, com `npm run dev` rodando, logado, em `/produto`: adicione ao carrinho e confirme que **Pagar com Pix** fica desabilitado até o telefone ficar completo, e que digitar `1181234` mostra a mensagem.

- [ ] **Step 6: Commit**

```bash
git add components/shop/CartDrawer.tsx app/api/checkout/route.ts
git commit -m "feat(checkout): telefone obrigatorio para gerar o Pix

A trava real e a recusa da API (invalid_phone); o botao desabilitado no
carrinho e conveniencia. O numero tambem vai no payer.phone do Mercado Pago.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `isAdminEmail`

**Files:**
- Create: `lib/admin.ts`
- Test: `tests/admin.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `isAdminEmail(email: string | null | undefined, lista?: string): boolean`.

- [ ] **Step 1: Escreva o teste que falha**

Crie `tests/admin.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminEmail } from "../lib/admin.ts";

test("isAdminEmail aceita quem está na lista", () => {
  const lista = "yan@gmail.com,outro@gmail.com";
  assert.equal(isAdminEmail("yan@gmail.com", lista), true);
  assert.equal(isAdminEmail("outro@gmail.com", lista), true);
});

test("isAdminEmail ignora caixa e espaços", () => {
  const lista = " Yan@Gmail.COM , outro@gmail.com ";
  assert.equal(isAdminEmail("yan@gmail.com", lista), true);
  assert.equal(isAdminEmail("  YAN@gmail.com  ", lista), true);
});

test("isAdminEmail recusa quem não está na lista", () => {
  assert.equal(isAdminEmail("estranho@gmail.com", "yan@gmail.com"), false);
  // não vale prefixo nem substring
  assert.equal(isAdminEmail("yan@gmail.com.br", "yan@gmail.com"), false);
  assert.equal(isAdminEmail("n@gmail.com", "yan@gmail.com"), false);
});

test("lista vazia ou ausente significa que ninguém é admin", () => {
  // um .env esquecido nunca pode virar painel publico
  assert.equal(isAdminEmail("yan@gmail.com", ""), false);
  assert.equal(isAdminEmail("yan@gmail.com", undefined), false);
  assert.equal(isAdminEmail("yan@gmail.com", "   "), false);
  assert.equal(isAdminEmail("yan@gmail.com", ",,,"), false);
});

test("e-mail ausente nunca é admin", () => {
  const lista = "yan@gmail.com";
  assert.equal(isAdminEmail(null, lista), false);
  assert.equal(isAdminEmail(undefined, lista), false);
  assert.equal(isAdminEmail("", lista), false);
  assert.equal(isAdminEmail("   ", lista), false);
});
```

- [ ] **Step 2: Rode e confirme que falha**

```
npm test
```
Esperado: FALHA com `ERR_MODULE_NOT_FOUND` para `../lib/admin.ts`.

- [ ] **Step 3: Implemente**

Crie `lib/admin.ts`:

```ts
/**
 * Quem pode abrir /admin. A lista vem de ADMIN_EMAILS no .env.local, separada
 * por vírgula, e é comparada com o e-mail da conta logada.
 *
 * A lista entra por parâmetro (com default) para o teste não precisar mexer em
 * process.env.
 *
 * Lista vazia, ausente ou e-mail nulo devolvem `false`, sempre. O contrário —
 * um `if (!lista) return true` — transformaria um .env esquecido em painel
 * público com os telefones de todos os compradores.
 */
export function isAdminEmail(
  email: string | null | undefined,
  lista: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  const alvo = (email ?? "").trim().toLowerCase();
  if (!alvo) return false;

  return (lista ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(alvo);
}
```

- [ ] **Step 4: Rode e confirme que passa**

```
npm test
```
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin.ts tests/admin.test.ts
git commit -m "feat(admin): isAdminEmail com lista em ADMIN_EMAILS

Lista vazia ou ausente significa que ninguem e admin, nunca o contrario.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Tabela `pedidos`, cliente `service_role` e gravação

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `lib/pedidos.ts`
- Test: `tests/pedidos.test.ts`
- Modify: `app/api/checkout/route.ts` (depois de `const payment = await resp.json();`, linha ~151)
- Modify: `components/shop/CartDrawer.tsx` (tratamento de `order_save_failed`)
- Modify: `.env.example`

**Pré-requisito manual (fora do código):** rodar o SQL abaixo no painel do Supabase (SQL Editor) e preencher `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (Project Settings → API → `service_role`). Sem isso a gravação falha e **nenhuma compra passa** — é o comportamento correto, mas confunde se você esquecer.

```sql
create table public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  payment_id  text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null,
  telefone    text not null,
  version     text not null,
  fit         text not null,
  size        text not null,
  qty         int  not null check (qty > 0),
  unit_price  int  not null,
  total       int  not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

alter table public.pedidos enable row level security;
-- Nenhuma política, de propósito: RLS ligada + zero políticas significa que
-- `anon` e `authenticated` não leem nem escrevem nada. Só a `service_role`,
-- que ignora RLS, toca esta tabela — e ela só existe no servidor.

create index pedidos_payment_id_idx on public.pedidos (payment_id);
create index pedidos_created_at_idx on public.pedidos (created_at desc);
```

**Interfaces:**
- Consumes: `normalizePhone`, `normalizeEmail` (Task 2), `FITS`/`PRODUCT` de `lib/data.ts`.
- Produces:
  - `createAdminClient(): SupabaseClient` — cliente `service_role`.
  - `interface PedidoRow` — o formato de uma linha da tabela.
  - `resumirPagos(pedidos: PedidoRow[], tamanhos: readonly string[]): Resumo` com `{ camisetas: number; receita: number; porTamanho: { size: string; qty: number }[] }`. **Os tamanhos entram por parâmetro de propósito:** se `lib/pedidos.ts` importasse `PRODUCT` de `@/lib/data`, o `npm test` quebraria — o `node --test` faz type stripping mas não resolve o alias `@/` do `tsconfig.json`. (Os testes atuais só escapam disso porque `lib/supabase/session.ts` importa `@/lib/store` como `import type`, que é apagado antes de rodar.) Quem passa a lista é o componente, que já vive no mundo do Next.
  - A API passa a responder `{ error: "order_save_failed" }` com status 502.

- [ ] **Step 1: Escreva o teste que falha (resumo)**

Crie `tests/pedidos.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirPagos, type PedidoRow } from "../lib/pedidos.ts";

function pedido(over: Partial<PedidoRow>): PedidoRow {
  return {
    id: "1",
    payment_id: "p1",
    user_id: "u1",
    nome: "Yan",
    email: "yan@gmail.com",
    telefone: "11912345678",
    version: "Preta",
    fit: "Regular",
    size: "M",
    qty: 1,
    unit_price: 90,
    total: 90,
    status: "approved",
    created_at: "2026-08-03T21:00:00Z",
    ...over,
  };
}

/** Mesma lista de `PRODUCT.sizes`, na mesma ordem. */
const TAMANHOS = ["P", "M", "G", "GG", "XG"];

test("resumirPagos conta só o que foi pago", () => {
  const r = resumirPagos(
    [
      pedido({ qty: 2, total: 180, status: "approved" }),
      pedido({ qty: 5, total: 450, status: "pending" }),
      pedido({ qty: 3, total: 270, status: "cancelled" }),
    ],
    TAMANHOS
  );
  assert.equal(r.camisetas, 2);
  assert.equal(r.receita, 180);
});

test("resumirPagos soma a receita pelo total gravado, não pelo preço atual", () => {
  // preço histórico: se lib/data.ts mudar, o pedido antigo continua valendo
  const r = resumirPagos(
    [pedido({ qty: 1, unit_price: 80, total: 80 })],
    TAMANHOS
  );
  assert.equal(r.receita, 80);
});

test("resumirPagos quebra por tamanho na ordem recebida", () => {
  const r = resumirPagos(
    [
      pedido({ size: "GG", qty: 1, total: 90 }),
      pedido({ size: "P", qty: 4, total: 360 }),
      pedido({ size: "P", qty: 1, total: 90 }),
      pedido({ size: "M", qty: 2, total: 180, status: "pending" }),
    ],
    TAMANHOS
  );
  assert.deepEqual(
    r.porTamanho.map((t) => `${t.size}:${t.qty}`),
    ["P:5", "M:0", "G:0", "GG:1", "XG:0"]
  );
});

test("resumirPagos com lista vazia devolve zeros", () => {
  const r = resumirPagos([], TAMANHOS);
  assert.equal(r.camisetas, 0);
  assert.equal(r.receita, 0);
  assert.equal(r.porTamanho.length, 5);
  assert.equal(
    r.porTamanho.every((t) => t.qty === 0),
    true
  );
});
```

- [ ] **Step 2: Rode e confirme que falha**

```
npm test
```
Esperado: FALHA com `ERR_MODULE_NOT_FOUND` para `../lib/pedidos.ts`.

- [ ] **Step 3: Implemente `lib/pedidos.ts`**

```ts
/**
 * Uma linha da tabela `pedidos` — um item de um pedido. Um Pix com dois cortes
 * gera duas linhas, com nome/e-mail/telefone/data repetidos.
 */
export interface PedidoRow {
  id: string;
  payment_id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string;
  version: string;
  fit: string;
  size: string;
  qty: number;
  unit_price: number;
  total: number;
  status: string;
  created_at: string;
}

export interface Resumo {
  camisetas: number;
  receita: number;
  porTamanho: { size: string; qty: number }[];
}

/**
 * O que interessa para mandar imprimir: quantas camisetas pagas, quanto entrou
 * e quantas de cada tamanho. Só `approved` conta — pendente pode nunca virar
 * dinheiro.
 *
 * A receita sai do `total` gravado, não de `lib/data.ts`: se o preço mudar, os
 * pedidos antigos continuam valendo o que a pessoa pagou.
 *
 * `tamanhos` entra por parâmetro (quem chama passa `PRODUCT.sizes`) porque
 * importar `@/lib/data` aqui quebraria o `npm test`: o `node --test` não
 * resolve o alias `@/` do tsconfig. De quebra, a função fica testável sem
 * depender do catálogo.
 */
export function resumirPagos(
  pedidos: PedidoRow[],
  tamanhos: readonly string[]
): Resumo {
  const pagos = pedidos.filter((p) => p.status === "approved");

  const porTamanho = tamanhos.map((size) => ({
    size,
    qty: pagos
      .filter((p) => p.size === size)
      .reduce((n, p) => n + p.qty, 0),
  }));

  return {
    camisetas: pagos.reduce((n, p) => n + p.qty, 0),
    receita: pagos.reduce((n, p) => n + p.total, 0),
    porTamanho,
  };
}
```

Note que o arquivo **não importa nada**. Isso é de propósito: qualquer import de valor com o alias `@/` aqui faria `npm test` falhar com `Cannot find package '@'`.

- [ ] **Step 4: Rode e confirme que passa**

```
npm test
```
Esperado: PASS.

- [ ] **Step 5: Crie o cliente `service_role`**

Crie `lib/supabase/admin.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave `service_role`: ignora RLS e enxerga a tabela `pedidos`
 * inteira. É o único jeito de ler/escrever essa tabela, porque ela tem RLS
 * ligada e nenhuma política.
 *
 * NUNCA importe este arquivo de um componente client, e NUNCA renomeie a
 * variável para NEXT_PUBLIC_*. Qualquer uma das duas coisas embute a chave no
 * bundle do navegador, e com ela qualquer visitante lê e escreve o banco
 * inteiro — inclusive auth.users.
 *
 * Usa `@supabase/supabase-js` direto (não o `@supabase/ssr`): aqui não há
 * cookie nem sessão de usuário para propagar.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Erro explícito em vez de um 401 confuso do Postgres três camadas abaixo.
  if (!url || !key) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local — ver .env.example"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 6: Grave os pedidos no checkout**

Em `app/api/checkout/route.ts`, acrescente o import:

```ts
import { createAdminClient } from "@/lib/supabase/admin";
```

Depois de `const tx = payment?.point_of_interaction?.transaction_data;`, antes do `return`, insira:

```ts
  // Uma linha por item. Os valores vêm de `validos`, que já foi resolvido
  // contra lib/data.ts — a tabela do admin herda a mesma garantia de que
  // nenhum preço veio do navegador.
  const { error: dbError } = await createAdminClient().from("pedidos").insert(
    validos.map((i) => ({
      payment_id: String(payment.id),
      user_id: user.id,
      nome: comprador,
      email: contato,
      telefone,
      version: i.version,
      fit: i.fit,
      size: i.size,
      qty: i.qty,
      unit_price: i.price,
      total: i.qty * i.price,
      status: payment.status ?? "pending",
    }))
  );

  // Se o pedido não entrou na tabela, não entregamos o QR: é essa tabela que
  // vai valer na hora de entregar a camiseta no congresso, e alguém pagando um
  // pedido que não existe nela é pior do que uma venda perdida. Cancelamos o
  // Pix (best-effort) — um Pix não pago expira sozinho em 30 minutos.
  if (dbError) {
    console.error("[checkout] falha ao gravar o pedido:", dbError.message);
    await fetch(`https://api.mercadopago.com/v1/payments/${payment.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    }).catch(() => {});
    return NextResponse.json(
      { configured: true, error: "order_save_failed" },
      { status: 502 }
    );
  }
```

- [ ] **Step 7: Trate a recusa no carrinho**

Em `components/shop/CartDrawer.tsx`, junto dos outros `data.error` em `gerarPix`:

```ts
      if (data.error === "order_save_failed") {
        setError(
          "Não conseguimos registrar seu pedido agora e por isso o Pix não foi gerado. Tente de novo em instantes — nada foi cobrado."
        );
        return;
      }
```

- [ ] **Step 8: Documente as variáveis no `.env.example`**

Acrescente no fim:

```
# ---------------- Tela de admin (/admin) e persistencia de pedidos ----------------
# Quem pode abrir /admin. E-mails da CONTA de login, separados por virgula.
# A comparacao ignora espaco e maiuscula. Vazio = ninguem e admin (404 para todos).
ADMIN_EMAILS=

# Chave "service_role" (Project Settings > API). Ignora RLS: e o que permite o
# servidor gravar e ler a tabela `pedidos`.
# NUNCA use o prefixo NEXT_PUBLIC_ aqui. Com ele a chave vai para o bundle do
# navegador e qualquer visitante ganha acesso total ao banco, inclusive auth.users.
SUPABASE_SERVICE_ROLE_KEY=
#
# Antes do primeiro uso, rode no painel (SQL Editor) o SQL da tabela `pedidos`
# que esta em docs/superpowers/plans/2026-08-03-telefone-e-admin.md (Task 4).
# A tabela fica com RLS ligada e NENHUMA politica, de proposito: assim a chave
# anon (publica, no navegador) nao consegue listar telefone de terceiros.
```

- [ ] **Step 9: Verifique**

```
npm test
npm run build
```
Esperado: PASS e build limpo.

Com o SQL rodado e a chave no `.env.local`, reinicie o `npm run dev` e faça uma compra de teste até o QR aparecer. No painel do Supabase (Table Editor → `pedidos`) deve haver uma linha por item, com `status = pending`.

- [ ] **Step 10: Commit**

```bash
git add lib/supabase/admin.ts lib/pedidos.ts tests/pedidos.test.ts app/api/checkout/route.ts components/shop/CartDrawer.tsx .env.example
git commit -m "feat(pedidos): persiste cada item do pedido no Supabase

Tabela pedidos com RLS ligada e nenhuma politica: so a service_role toca.
Se a gravacao falhar o Pix e cancelado e o QR nao e entregue - a tabela e o
que vai valer na entrega, entao pagar um pedido inexistente e pior do que
perder a venda.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Tela `/admin`

**Files:**
- Create: `app/admin/page.tsx`
- Create: `components/admin/PedidosTable.tsx`
- Modify: `middleware.ts` (matcher, linha 25)

**Interfaces:**
- Consumes: `isAdminEmail` (Task 3), `createAdminClient`, `PedidoRow`, `resumirPagos` (Task 4), `formatPhone` (Task 1).
- Produces: `PedidosTable({ pedidos, falhouLeitura }: { pedidos: PedidoRow[]; falhouLeitura: boolean })`.

- [ ] **Step 1: Abra a rota no middleware**

Em `middleware.ts`, troque o matcher:

```ts
export const config = {
  matcher: [
    "/produto/:path*",
    "/api/checkout/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
```

Isso só garante "tem alguém logado" — anônimo vai para `/login?next=/admin` e volta depois de entrar. A **autorização** (ser admin) é checada na página e na rota de API, nunca só aqui: o Next 14.2 teve um CVE (`x-middleware-subrequest`) que pulava o matcher inteiro.

- [ ] **Step 2: A tabela (apresentação)**

Crie `components/admin/PedidosTable.tsx` — **Server Component, sem `"use client"`**:

```tsx
import { formatPhone } from "@/lib/auth-validation";
import { resumirPagos, type PedidoRow } from "@/lib/pedidos";
import { PRODUCT } from "@/lib/data";
import SyncButton from "./SyncButton";

/**
 * Data e hora são formatadas aqui, no servidor, com o fuso fixo em São Paulo.
 * Sem o fuso explícito o servidor de produção (UTC) mostraria a hora do pedido
 * três horas adiantada. Formatar no servidor também evita divergência de
 * hidratação, já que o relógio do visitante não participa.
 */
const FMT_DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const FMT_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

/** Status do Mercado Pago em pt-BR. Tela só de admin, então um status novo do
 *  MP aparece cru — é diagnóstico útil, não mensagem para comprador. */
const STATUS: Record<string, string> = {
  approved: "Pago",
  pending: "Pendente",
  in_process: "Em análise",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Devolvido",
};

const TH =
  "whitespace-nowrap px-3 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2";
const TD = "whitespace-nowrap px-3 py-3 text-sm text-ink";

export default function PedidosTable({
  pedidos,
  falhouLeitura,
}: {
  pedidos: PedidoRow[];
  falhouLeitura: boolean;
}) {
  // A ordem do catálogo é a ordem da quebra por tamanho.
  const resumo = resumirPagos(pedidos, PRODUCT.sizes);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="wrap py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute-2">
              24 Horas de Adoração
            </p>
            <h1 className="display mt-2 text-3xl text-ink">Pedidos</h1>
          </div>
          <SyncButton />
        </div>

        {falhouLeitura && (
          <p className="mt-6 text-sm" style={{ color: "var(--blood)" }}>
            Não foi possível carregar os pedidos agora. Recarregue a página.
          </p>
        )}

        {/* Resumo: só o que foi pago — é o número que vai para a estamparia. */}
        <div className="card mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2">
              Camisetas pagas
            </p>
            <p className="display mt-1 text-2xl text-ink tabular-nums">
              {resumo.camisetas}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2">
              Recebido
            </p>
            <p className="display mt-1 text-2xl text-ink tabular-nums">
              R$ {resumo.receita}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2">
              Por tamanho
            </p>
            <p className="mt-1 font-mono text-sm text-ink tabular-nums">
              {resumo.porTamanho
                .map((t) => `${t.size} ${t.qty}`)
                .join("  ·  ")}
            </p>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <p className="mt-10 text-sm text-mute">
            Nenhum pedido ainda. Assim que alguém gerar um Pix, ele aparece
            aqui.
          </p>
        ) : (
          /* Dez colunas não cabem num celular: a tabela rola dentro do próprio
             contêiner, e a página nunca rola na horizontal. */
          <div className="mt-8 overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>Nome</th>
                  <th className={TH}>E-mail</th>
                  <th className={TH}>Telefone</th>
                  <th className={TH}>Modelo</th>
                  <th className={TH}>Tam.</th>
                  <th className={TH}>Qtd.</th>
                  <th className={TH}>Valor</th>
                  <th className={TH}>Data</th>
                  <th className={TH}>Hora</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => {
                  const quando = new Date(p.created_at);
                  return (
                    <tr key={p.id} className="border-b border-line-soft last:border-0">
                      <td className={TD}>{p.nome}</td>
                      <td className={TD}>{p.email}</td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        {formatPhone(p.telefone)}
                      </td>
                      <td className={TD}>{p.fit}</td>
                      <td className={`${TD} font-mono`}>{p.size}</td>
                      <td className={`${TD} font-mono tabular-nums`}>{p.qty}</td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        R$ {p.total}
                      </td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        {FMT_DATA.format(quando)}
                      </td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        {FMT_HORA.format(quando)}
                      </td>
                      <td className={`${TD} font-mono text-[11px] uppercase tracking-wider`}>
                        {STATUS[p.status] ?? p.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: A página (gate + dados)**

Crie `app/admin/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import PedidosTable from "@/components/admin/PedidosTable";
import type { PedidoRow } from "@/lib/pedidos";

export const metadata = { title: "Pedidos · 24 Horas de Adoração" };
// A tabela muda a cada compra: nada de cache.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // O middleware garante que existe sessão; aqui decidimos autorização.
  // A checagem é repetida de propósito — o Next 14.2 teve um CVE que pulava
  // o matcher do middleware inteiro.
  const {
    data: { user },
  } = await createClient().auth.getUser();

  // 404, não 403: um 403 confirmaria que a rota existe.
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    // A mensagem crua do Postgres não vai para a tela: só o fato.
    console.error("[admin] falha ao ler pedidos:", error.message);
  }

  return (
    <PedidosTable
      pedidos={(data ?? []) as PedidoRow[]}
      falhouLeitura={Boolean(error)}
    />
  );
}
```

- [ ] **Step 4: `SyncButton` provisório (para compilar)**

A tabela importa `SyncButton`, implementado na Task 7. Crie `components/admin/SyncButton.tsx` agora com o botão desabilitado, para esta tarefa fechar compilando:

```tsx
"use client";

/** Preenchido na Task 7 — sincroniza os pendentes com o Mercado Pago. */
export default function SyncButton() {
  return (
    <button
      type="button"
      disabled
      className="btn-magnetic btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
    >
      Sincronizar status
    </button>
  );
}
```

- [ ] **Step 5: Verifique**

```
npm test
npm run build
```
Esperado: PASS e build limpo.

Com `npm run dev`:
- Logado com o e-mail de `ADMIN_EMAILS`, `/admin` abre com o resumo e a tabela.
- Logado com outra conta, `/admin` dá 404.
- Sem sessão (janela anônima), `/admin` redireciona para o login e volta depois.

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx components/admin/PedidosTable.tsx components/admin/SyncButton.tsx middleware.ts
git commit -m "feat(admin): tela /admin com a tabela de pedidos

Gate de autorizacao na propria pagina (nao so no middleware) e 404 para quem
nao e admin. Data e hora formatadas no servidor no fuso de Sao Paulo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Checagem de posse em `status` e `cancel`

Fecha a limitação documentada em `app/api/checkout/status/route.ts:19-23` e `cancel/route.ts:20-23`: hoje as rotas sabem que existe *alguém* logado, não que o pagamento seja dele.

**Files:**
- Modify: `app/api/checkout/status/route.ts`
- Modify: `app/api/checkout/cancel/route.ts`
- Modify: `components/shop/CartDrawer.tsx` (polling — tratar 404)

**Interfaces:**
- Consumes: `createAdminClient` (Task 4).
- Produces: as duas rotas passam a responder `{ error: "not_found" }` com status 404 quando o `payment_id` não é do usuário logado.

- [ ] **Step 1: `status` — posse e atualização**

Em `app/api/checkout/status/route.ts`, acrescente o import:

```ts
import { createAdminClient } from "@/lib/supabase/admin";
```

Substitua o comentário de "LIMITAÇÃO CONHECIDA" (linhas 19-23) por uma nota de que a posse agora é verificada, e depois da leitura do `id` acrescente:

```ts
  // Agora existe vínculo pagamento→usuário, então conferimos a posse. Sem
  // isso, qualquer pessoa logada leria o status de um pagamento cujo id ela
  // adivinhasse.
  const admin = createAdminClient();
  const { data: linhas } = await admin
    .from("pedidos")
    .select("id")
    .eq("payment_id", String(id))
    .eq("user_id", user.id)
    .limit(1);

  if (!linhas || linhas.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
```

E antes do `return`, depois de ler `payment`:

```ts
  // Guarda o desfecho: é o que faz a tela do admin sair de "Pendente" sem
  // depender de ninguém clicar em sincronizar.
  if (payment?.status && payment.status !== "pending") {
    const { error } = await admin
      .from("pedidos")
      .update({ status: payment.status })
      .eq("payment_id", String(id));
    if (error) {
      console.error("[status] falha ao atualizar o pedido:", error.message);
    }
  }
```

- [ ] **Step 2: `cancel` — posse e marcação**

Em `app/api/checkout/cancel/route.ts`, mesmo import, e depois da validação do `id`:

```ts
  const admin = createAdminClient();
  const { data: linhas } = await admin
    .from("pedidos")
    .select("id")
    .eq("payment_id", String(id))
    .eq("user_id", user.id)
    .limit(1);

  if (!linhas || linhas.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
```

E depois do `fetch` de cancelamento, antes do `return`:

```ts
  if (resp.ok) {
    const { error } = await admin
      .from("pedidos")
      .update({ status: "cancelled" })
      .eq("payment_id", String(id));
    if (error) {
      console.error("[cancel] falha ao marcar cancelado:", error.message);
    }
  }
```

Substitua também o comentário de "LIMITAÇÃO CONHECIDA" pela nota de que a posse é verificada.

- [ ] **Step 3: Carrinho — o polling precisa parar no 404**

Sem isto, um 404 devolve `{ error }` sem `status`, e o polling gira para sempre em "Aguardando pagamento…". Em `components/shop/CartDrawer.tsx`, no `setInterval` do polling, depois do trecho que trata `res.status === 401`:

```ts
        // O pagamento não é desta conta (ou a linha do pedido não existe).
        // Sem este ramo o polling giraria para sempre, porque `data.status`
        // viria indefinido.
        if (res.status === 404) {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(
            "Não conseguimos acompanhar este pagamento por aqui. Se você já pagou, confira antes de pagar de novo."
          );
          return;
        }
```

- [ ] **Step 4: Verifique**

```
npm test
npm run build
```
Esperado: PASS e build limpo.

Com `npm run dev`, logado: gere um Pix e confirme que o polling continua funcionando (a tela não vai para o aviso de 404). Depois clique em "Cancelar e voltar ao carrinho" e confirme no Table Editor que as linhas daquele `payment_id` ficaram `cancelled`.

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/status/route.ts app/api/checkout/cancel/route.ts components/shop/CartDrawer.tsx
git commit -m "fix(checkout): status e cancel conferem quem e o dono do pagamento

Com a tabela pedidos existe vinculo pagamento->usuario, o que fecha a
limitacao documentada nas duas rotas. O polling do carrinho passa a parar
no 404 em vez de girar para sempre.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Botão sincronizar

Se alguém paga e fecha o navegador antes de o polling confirmar, a linha fica `pending` com o dinheiro na conta. Sem webhook, alguém tem que perguntar ao Mercado Pago.

**Files:**
- Create: `app/api/admin/sync/route.ts`
- Modify: `components/admin/SyncButton.tsx` (substituir o provisório da Task 5)

**Interfaces:**
- Consumes: `isAdminEmail` (Task 3), `createAdminClient` (Task 4).
- Produces: `POST /api/admin/sync` → `{ updated: number; checked: number }`, ou `{ configured: false }` sem `MP_ACCESS_TOKEN`.

- [ ] **Step 1: A rota**

Crie `app/api/admin/sync/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

/**
 * Reconsulta no Mercado Pago os pedidos ainda pendentes e corrige o status.
 * Existe porque a confirmação é por polling no navegador: quem paga e fecha a
 * aba deixa a linha em `pending` para sempre. O webhook resolveria de vez e
 * segue na lista de pendências do CLAUDE.md.
 *
 * POST /api/admin/sync → { updated, checked }
 */

/** Teto por clique, para a requisição não estourar o tempo limite da função. */
const MAX_POR_CLIQUE = 60;

export async function POST() {
  // Checagem repetida de propósito (o middleware não basta — ver invariante 3
  // do CLAUDE.md). 404 para não confirmar que a rota existe.
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const key = process.env.MP_ACCESS_TOKEN;
  if (!key) {
    return NextResponse.json({ configured: false });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pedidos")
    .select("payment_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[sync] falha ao listar pendentes:", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 502 });
  }

  // Um Pix com vários itens tem várias linhas com o mesmo payment_id: uma
  // consulta por pagamento, não por linha.
  const ids = [...new Set((data ?? []).map((r) => r.payment_id))].slice(
    0,
    MAX_POR_CLIQUE
  );

  let updated = 0;
  for (const id of ids) {
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!resp.ok) continue;

    const payment = await resp.json();
    if (!payment?.status || payment.status === "pending") continue;

    const { error: upErr } = await admin
      .from("pedidos")
      .update({ status: payment.status })
      .eq("payment_id", id);

    if (upErr) {
      console.error(`[sync] falha ao atualizar ${id}:`, upErr.message);
      continue;
    }
    updated++;
  }

  return NextResponse.json({ updated, checked: ids.length });
}
```

- [ ] **Step 2: O botão**

Substitua o conteúdo de `components/admin/SyncButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Único componente client da tela de admin. Reconsulta os pendentes no Mercado
 * Pago e recarrega a página (Server Component) para a tabela refletir.
 */
export default function SyncButton() {
  const router = useRouter();
  const [rodando, setRodando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function sincronizar() {
    setRodando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAviso("Não foi possível sincronizar agora.");
        return;
      }
      if (data.configured === false) {
        setAviso("O pagamento ainda não está configurado (falta o token).");
        return;
      }

      setAviso(
        data.updated > 0
          ? `${data.updated} pedido(s) atualizado(s).`
          : `Nada mudou (${data.checked} pendente(s) conferido(s)).`
      );
      router.refresh();
    } catch {
      setAviso("Falha de conexão. Tente novamente.");
    } finally {
      setRodando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={sincronizar}
        disabled={rodando}
        className="btn-magnetic btn-ghost flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {rodando ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <RefreshCw size={15} />
        )}
        {rodando ? "Sincronizando…" : "Sincronizar status"}
      </button>
      {aviso && (
        <span
          role="status"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute"
        >
          {aviso}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verifique**

```
npm test
npm run build
```
Esperado: PASS e build limpo.

Com `npm run dev`, em `/admin` como admin: clique em **Sincronizar status** com um Pix pendente na tabela. Esperado: aviso "Nada mudou (1 pendente conferido)" se ele segue pendente. Para o caminho feliz, pague um Pix de teste com a aba fechada e sincronize — a linha deve virar **Pago**.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/sync/route.ts components/admin/SyncButton.tsx
git commit -m "feat(admin): botao para sincronizar pendentes com o Mercado Pago

Cobre quem paga e fecha a aba antes do polling confirmar. Uma consulta por
pagamento (nao por linha) e teto de 60 por clique.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Smoke test e documentação

**Files:**
- Modify: `scripts/smoke-auth.mjs` (acrescentar antes do `console.log` final, linha ~80)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: as rotas das Tasks 5 e 7.
- Produces: nada de código.

- [ ] **Step 1: Acrescente as checagens no smoke**

Em `scripts/smoke-auth.mjs`, antes da linha `console.log(falhas === 0 ? …)`:

```js
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
```

- [ ] **Step 2: Rode o smoke**

Com `npm run dev` num terminal:

```
npm run smoke
```
Esperado: `Tudo certo.` com 15 checagens (as 12 antigas + 3).

- [ ] **Step 3: Atualize o `CLAUDE.md`**

Quatro edições:

1. Em **Rotas**, acrescente depois da linha de `app/produto/page.tsx`:

```markdown
- `app/admin/page.tsx` — **tela de pedidos**, restrita a `ADMIN_EMAILS`: resumo (camisetas pagas, receita, quebra por tamanho) + tabela de todos os itens vendidos. Não há link para ela em nenhum lugar da interface, de propósito.
- `app/api/admin/sync/route.ts` — reconsulta no Mercado Pago os pedidos `pending` e corrige o status (teto de 60 por clique).
```

2. Em **Autenticação**, acrescente à tabela de arquivos:

```markdown
| `lib/admin.ts` | `isAdminEmail()` — quem pode abrir `/admin` |
| `lib/supabase/admin.ts` | cliente `service_role` (ignora RLS; **só servidor**) |
| `lib/pedidos.ts` | tipo `PedidoRow` + `resumirPagos()` |
```

3. Em **Invariantes de segurança**, acrescente os itens 7 a 10:

```markdown
7. **`SUPABASE_SERVICE_ROLE_KEY` nunca leva prefixo `NEXT_PUBLIC_`**, e só `lib/supabase/admin.ts` a lê. Com o prefixo, a chave vai para o bundle do navegador e qualquer visitante ganha acesso total ao banco, inclusive `auth.users`.
8. **A tabela `pedidos` fica com RLS ligada e nenhuma política.** É isso que impede a chave `anon` (pública, no navegador) de listar telefone de terceiros. Criar uma política de leitura "para authenticated" expõe os dados de todos os compradores a qualquer pessoa com conta.
9. **A checagem de admin acontece na página e em cada rota de API**, não só no middleware — mesma razão da invariante 3. Não-admin recebe **404**, não 403: um 403 confirma que a rota existe.
10. **`ADMIN_EMAILS` vazia ou ausente significa "ninguém é admin"**, nunca o contrário — um `.env` esquecido não pode virar painel público.
```

4. Em **Pendências**, reescreva o item de persistência e o do webhook:

```markdown
- **Confirmação do Pix continua por polling** no `CartDrawer` (funciona com o navegador aberto). Quem paga e fecha a aba fica `pending` até alguém clicar em **Sincronizar status** no `/admin`. Versão robusta segue sendo o **webhook** (`/api/webhook/mercadopago`).
- **Pedidos agora são persistidos** na tabela `pedidos` do Supabase (uma linha por item). O SQL de criação está em `docs/superpowers/plans/2026-08-03-telefone-e-admin.md` (Task 4) — projeto novo ou restaurado precisa rodar de novo.
```

Remova da lista de pendências a linha "**Sem persistência de pedidos**: a reconciliação sai do painel do Mercado Pago…", já resolvida.

5. Em **Configuração fora do código**, acrescente:

```markdown
- **A tabela `pedidos` precisa existir** (SQL no plano da Task 4) e a `SUPABASE_SERVICE_ROLE_KEY` precisa estar no `.env.local`. Sem as duas, **nenhuma compra passa**: o checkout recusa o Pix quando não consegue gravar o pedido.
```

- [ ] **Step 4: Verificação final**

```
npm test
npm run build
```
E com o dev rodando: `npm run smoke`.

Esperado: testes PASS, build limpo, smoke "Tudo certo.".

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-auth.mjs CLAUDE.md
git commit -m "docs: smoke do gate de admin e CLAUDE.md atualizado

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Checklist manual (não coberto por teste automático)

Depois da Task 8, com o SQL rodado e as duas variáveis no `.env.local`:

- [ ] Comprar sem preencher o telefone: o botão **Pagar com Pix** fica desabilitado.
- [ ] Digitar `11 8123-45678` (celular sem o nono dígito): aparece a mensagem, botão segue travado.
- [ ] Chamar a API direto sem telefone e confirmar 400 (o teto real):
      `curl -X POST http://localhost:3000/api/checkout -H "Content-Type: application/json" -d '{"items":[],"email":"a@b.com","name":"Teste"}'` → sem sessão isso dá 401, que já é recusa; para ver o 400 use o DevTools do navegador logado.
- [ ] Comprar de verdade (Pix de teste) e conferir no `/admin`: nome, e-mail, telefone formatado, modelo, tamanho, quantidade, valor, data e hora no fuso de São Paulo.
- [ ] Pedido com dois cortes gera duas linhas com a mesma data/hora.
- [ ] Abrir `/admin` logado com conta que **não** está em `ADMIN_EMAILS`: 404.
- [ ] Abrir `/admin` em janela anônima: vai para o login e volta para `/admin` depois de entrar.
- [ ] Pagar um Pix com a aba fechada e clicar em **Sincronizar status**: a linha vira **Pago**.
- [ ] Abrir `/admin` num celular: a tabela rola dentro do quadro e a página não rola na horizontal.
- [ ] Conferir no DevTools (aba Network → resposta do documento) que a `service_role` **não** aparece em nenhum bundle: buscar por `service_role` e pelos primeiros caracteres da chave nos arquivos de `_next/static`.
