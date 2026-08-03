# Telefone obrigatório na compra e tela de administrador

Data: 2026-08-03

## Objetivo

Duas mudanças que dependem uma da outra:

1. **Telefone obrigatório no carrinho.** Sem um número válido, o Pix não é
   gerado — nem pelo botão (desabilitado), nem por quem chamar a API direto.
2. **Tela `/admin`**, restrita a e-mails autorizados, com a tabela de todas as
   compras: nome, e-mail, telefone, modelo, valor, tamanho, data e hora.

A segunda exige a primeira **e** exige algo que o projeto ainda não tem:
**persistência de pedidos**. Hoje a reconciliação sai do painel do Mercado Pago,
lendo a descrição do pagamento. Uma tabela no site precisa de uma tabela no
banco.

## Por que uma tabela no Supabase

Três caminhos foram considerados:

| Caminho | Por que não |
|---|---|
| Ler os pagamentos da API do Mercado Pago e parsear a descrição | O telefone não cabe na descrição, o parsing quebra a cada mudança de texto, e o histórico fica preso ao token do MP |
| Arquivo JSON no servidor | Em deploy serverless (Vercel) o arquivo se perde a cada publicação — não serve para produção |
| **Tabela `pedidos` no Postgres do Supabase** | **Escolhido.** O projeto já usa Supabase para o Auth; é o mesmo painel, a mesma conta, zero infraestrutura nova |

### Contrapartidas aceitas

1. **Mais configuração fora do código.** Um SQL para rodar no painel e uma
   variável nova no `.env.local`. Documentado no `.env.example` e aqui.
2. **A chave `service_role` passa a existir no projeto.** Ela ignora RLS e dá
   acesso total ao banco. O risco é real e a mitigação está na invariante 3
   abaixo.
3. **A hibernação do projeto gratuito agora derruba mais coisa.** Antes,
   dormir significava "ninguém entra". Agora significa também "ninguém compra",
   porque o insert do pedido faz parte do checkout. O evento é em 15/10/2026 —
   conferir se o projeto está ativo antes de qualquer divulgação continua sendo
   obrigatório.

## Configuração fora do código (obrigatória, não versionável)

### SQL para rodar no painel (SQL Editor)

```sql
create table public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  payment_id  text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null,
  telefone    text not null,          -- só dígitos: 10 ou 11
  version     text not null,
  fit         text not null,          -- modelo: Regular | Oversized
  size        text not null,
  qty         int  not null check (qty > 0),
  unit_price  int  not null,          -- reais, inteiro
  total       int  not null,          -- qty * unit_price, redundante de propósito
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

`total` é redundante (`qty * unit_price`), e isso é intencional: é o valor
histórico daquele pedido. Se o preço da camiseta mudar em `lib/data.ts`, os
pedidos antigos continuam mostrando o que a pessoa pagou de verdade.

### Variáveis novas no `.env.local`

| Variável | Onde pegar / o que é |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Painel → Project Settings → API → chave `service_role`. **Nunca** com prefixo `NEXT_PUBLIC_` |
| `ADMIN_EMAILS` | Lista de e-mails separados por vírgula que podem abrir `/admin` |

## Invariantes de segurança novas

Somam-se às seis que já estão no CLAUDE.md.

1. **`SUPABASE_SERVICE_ROLE_KEY` nunca leva o prefixo `NEXT_PUBLIC_`.** Com o
   prefixo, o Next embute a chave no bundle do navegador e qualquer visitante
   ganha acesso irrestrito de leitura e escrita ao banco inteiro — inclusive a
   `auth.users`. `lib/supabase/admin.ts` é o único arquivo que a lê, e ele
   nunca é importado por componente client.
2. **RLS fica ligada na tabela `pedidos`, sem nenhuma política.** É o que
   garante que a chave `anon` (essa sim pública, no navegador) não consiga
   listar telefones de terceiros. Criar uma política de leitura "para
   authenticated" expõe os dados de todos os compradores a qualquer pessoa com
   uma conta.
3. **A checagem de admin acontece na página e em cada rota de API, não só no
   middleware.** Mesma razão da invariante 3 já existente: o Next 14.2 teve um
   CVE (`x-middleware-subrequest`) que pulava o matcher inteiro.
4. **Não-admin logado recebe 404, não 403.** Um 403 confirma que a rota existe.
5. **`ADMIN_EMAILS` vazia ou ausente significa "ninguém é admin".** Nunca o
   contrário. Um `if (!lista) return true` transformaria um `.env` esquecido em
   painel público.

## Parte 1 — Telefone

### Validação (`lib/auth-validation.ts`)

Fica junto das outras validações porque o formulário e o servidor precisam
concordar — é a mesma razão que já colocou `isValidName` ali.

| Função | Comportamento |
|---|---|
| `normalizePhone(raw)` | Remove tudo que não é dígito. Se sobrar 12 ou 13 dígitos começando com `55`, descarta o `55` (alguém colou o número com código do país) |
| `isValidPhone(raw)` | Sobre o normalizado: 10 ou 11 dígitos; DDD (2 primeiros) entre 11 e 99; se tiver 11 dígitos, o terceiro tem que ser `9` |
| `formatPhone(raw)` | `(11) 91234-5678` para 11 dígitos, `(11) 1234-5678` para 10. Devolve o próprio input se não for válido |

A regra do nono dígito existe porque todo celular brasileiro de 11 dígitos
começa com `9` depois do DDD — ela pega erro de digitação sem recusar nada
legítimo. Fixos de 10 dígitos continuam aceitos: em cidade pequena pode ser o
único telefone da pessoa.

`MSG.telefone` = a mensagem única em pt-BR, como manda a invariante 5 do
CLAUDE.md. Nenhuma outra string de erro de telefone existe no projeto.

**Guardamos só os dígitos.** A formatação é sempre na exibição — assim buscar
por número no futuro não depende de como a pessoa digitou.

### Carrinho (`components/shop/CartDrawer.tsx`)

Um terceiro campo depois do e-mail, com máscara aplicada enquanto digita
(`formatPhone` a cada tecla, guardando o normalizado no estado). O botão
**Pagar com Pix** já é desabilitado por `!emailOk || !nomeOk`; passa a incluir
`!telOk`.

O aviso de formato aparece só quando a pessoa digitou algo inválido — campo
vazio não recebe alerta, porque brigar com um campo que ninguém tocou ainda é
ruído.

Ao contrário de nome e e-mail, o telefone **não** é preenchido a partir da
conta: ele não existe no `user_metadata` e não vai passar a existir. O
preenchimento automático do navegador cobre a segunda compra, e assim o Supabase
Auth fica intocado.

### Servidor (`app/api/checkout/route.ts`)

`phone` é validado como nome e e-mail já são, devolvendo `invalid_phone` (400)
— traduzido no front, nunca exibido cru. Isso é o que "proíbe a compra": o botão
desabilitado é conveniência, a recusa do servidor é a trava.

O telefone normalizado também vai no `payer.phone` (`area_code` + `number`) do
Mercado Pago, então aparece no painel deles sem custo nenhum.

## Parte 2 — Persistência

### `lib/supabase/admin.ts`

Cliente com a `service_role`, via `createClient` do `@supabase/supabase-js`
(não o `@supabase/ssr`: não há cookie nem sessão aqui). Lança erro explícito se
a variável faltar, em vez de falhar com um 401 confuso do Postgres.

### Gravação (`app/api/checkout/route.ts`)

Depois de o Mercado Pago devolver o pagamento, insere **uma linha por item
validado** — o preço vem de `FITS`, como já vem hoje (invariante 2), então a
tabela do admin herda a mesma garantia: nenhum valor da tabela veio do
navegador.

**Se o insert falhar**, cancelamos o Pix no Mercado Pago (best-effort) e
devolvemos `order_save_failed` (502) pedindo para tentar de novo, em vez de
entregar o QR Code. A alternativa — entregar o Pix e só registrar o erro no log
— deixaria alguém pagando um pedido que não existe na tabela, e é justamente
essa tabela que vai valer na hora de entregar a camiseta no congresso. Um Pix
gerado e não pago expira sozinho em 30 minutos, sem estrago.

### Dois furos que a persistência fecha

Ambos estão documentados como limitação conhecida em
`app/api/checkout/status/route.ts:19`: hoje as rotas sabem que existe *alguém*
logado, não que o pagamento seja dele.

| Rota | Passa a fazer |
|---|---|
| `status` | Confere que existe linha com aquele `payment_id` **e** `user_id` do usuário logado; senão 404. Quando o MP responde `approved`/`rejected`/`cancelled`, atualiza as linhas daquele pagamento |
| `cancel` | Mesma checagem de posse antes de cancelar; marca as linhas como `cancelled` |

São poucas linhas em rotas que já vão ser editadas, e o buraco é de segurança —
entra neste escopo.

## Parte 3 — Tela de admin

### `lib/admin.ts`

```ts
isAdminEmail(email: string | null | undefined, lista = process.env.ADMIN_EMAILS)
```

Compara em minúsculas, sem espaços. Recebe a lista como parâmetro com default
para poder ser testada sem mexer em `process.env`. Lista vazia, ausente ou
e-mail nulo → `false` (invariante 5).

### `app/admin/page.tsx`

Server Component `async`. Resolve a sessão, chama `isAdminEmail`, e devolve
`notFound()` se não for admin. Lê os pedidos com o cliente `service_role`,
ordenados por `created_at` desc.

Middleware: `/admin/:path*` e `/api/admin/:path*` entram no matcher, então
visitante anônimo cai no login (com `?next=/admin`) em vez de tomar 404 — o
admin de verdade normalmente só não está logado ainda. Quem está logado e não é
admin recebe o 404 da própria página.

**Não existe link para `/admin` em nenhum lugar da interface.** A entrada é
digitar a URL (ou salvar nos favoritos). Não é isso que protege a tela — o gate
no servidor protege, link escondido não é segurança — mas evita ter que carregar
um `isAdmin` até o navegador só para decidir se um link aparece. Ver "Fora de
escopo".

### Colunas

`NOME · E-MAIL · TELEFONE · MODELO · TAM · QTD · VALOR · DATA · HORA · STATUS`

- Telefone renderizado com `formatPhone`.
- **Data e hora formatadas no servidor** com
  `Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" })`. Sem o
  fuso explícito, o servidor da Vercel roda em UTC e a hora do pedido sai três
  horas adiantada. Formatar no servidor também evita divergência de hidratação.
- `QTD` e `STATUS` não estavam no pedido original e entram porque sem eles a
  tabela não responde a pergunta que ela existe para responder: quantas
  camisetas fazer, e quem pagou de verdade.

### Resumo no topo

Só sobre pedidos **pagos**: total de camisetas, receita em reais, e a quebra por
tamanho (`P 4 · M 11 · G 7 · GG 2 · XG 1`). É o número que vai para a
estamparia.

### Estados e responsividade

Tabela vazia tem estado próprio ("nenhum pedido ainda"). A tabela vive dentro de
um contêiner `overflow-x-auto` — dez colunas não caberiam num celular, e a
página nunca rola na horizontal. Tokens do tema, mono nos dados, Cinzel no
título, como o resto do site.

## Parte 4 — Botão sincronizar

Se alguém paga o Pix e fecha o navegador antes de o polling confirmar, a linha
fica `pending` para sempre — com o dinheiro na conta. Sem webhook, alguém tem
que perguntar ao Mercado Pago.

`app/api/admin/sync/route.ts` (POST, admin-gated no próprio handler): pega os
`payment_id` distintos ainda `pending`, no máximo **60 por clique** para a
requisição não estourar o tempo limite, consulta cada um no MP e atualiza os que
mudaram. Devolve `{ updated: n }`.

Na tela, um componente client pequeno chama a rota e dá `router.refresh()`.

O webhook (`/api/webhook/mercadopago`) continua sendo a solução definitiva e
continua na lista de pendências do CLAUDE.md: exige URL pública, validação de
assinatura e testes próprios — é projeto separado.

## Testes

Seguindo o padrão do projeto: `node:test`, sem framework, import com extensão
`.ts` explícita.

| Arquivo | Cobre |
|---|---|
| `tests/phone.test.ts` | celular válido, fixo válido, com `+55`, com máscara, curto demais, DDD `09`, 11 dígitos sem o `9`, string vazia, `formatPhone` nos dois tamanhos |
| `tests/admin.test.ts` | e-mail na lista, com maiúsculas, com espaços em volta, fora da lista, lista vazia, lista ausente, e-mail nulo |

`scripts/smoke-auth.mjs` ganha duas checagens contra o dev server: `/admin`
redireciona anônimo para o login, e `/api/admin/sync` responde 401 para anônimo.

Não coberto por teste automático (vai para o checklist manual): abrir `/admin`
logado como admin de verdade, conferir a tabela depois de uma compra real, e o
botão sincronizar corrigindo um pedido pendente.

## Fora de escopo

- **Webhook do Mercado Pago** — o botão sincronizar resolve o caso real agora.
- **Editar ou excluir pedidos na tela de admin** — a fonte da verdade é o
  pagamento no MP; mexer na tabela à mão só cria divergência.
- **Exportar CSV** e **paginação** — algumas centenas de linhas de um evento
  único cabem numa página. Se passar disso, paginação primeiro.
- **Telefone salvo na conta** — decisão explícita: o `user_metadata` fica
  intocado e o autocomplete do navegador cobre a recompra.
- **Link para `/admin` na interface** — decisão explícita: a entrada é digitar
  a URL. A alternativa seria um item "ADMIN" no `UserMenu` visível só para
  admin, o que exigiria um campo `isAdmin` no `SessionUser`, calculado no
  layout e hidratado no store. Descartado: mais superfície (um dado a mais
  cruzando para o navegador, o `SessionUser` e seus testes mexidos) para
  resolver algo que um favorito resolve.
- **Busca e filtro na tabela** — `Ctrl+F` resolve nesse volume.

## Arquivos tocados

| Arquivo | Mudança |
|---|---|
| `lib/auth-validation.ts` | + `normalizePhone`, `isValidPhone`, `formatPhone`, `MSG.telefone` |
| `lib/admin.ts` | novo — `isAdminEmail` |
| `lib/supabase/admin.ts` | novo — cliente `service_role` |
| `components/shop/CartDrawer.tsx` | + campo telefone, máscara, trava do botão, mensagem de `invalid_phone` |
| `app/api/checkout/route.ts` | + validação do telefone, `payer.phone`, insert dos pedidos, rollback do Pix se o insert falhar |
| `app/api/checkout/status/route.ts` | + checagem de posse, + atualização do status na tabela |
| `app/api/checkout/cancel/route.ts` | + checagem de posse, + marcar `cancelled` |
| `app/admin/page.tsx` | novo — gate + resumo + tabela |
| `components/admin/PedidosTable.tsx` | novo — tabela (server-rendered) |
| `components/admin/SyncButton.tsx` | novo — client, chama o sync |
| `app/api/admin/sync/route.ts` | novo |
| `middleware.ts` | + `/admin/:path*` e `/api/admin/:path*` no matcher |
| `tests/phone.test.ts`, `tests/admin.test.ts` | novos |
| `scripts/smoke-auth.mjs` | + 2 checagens |
| `.env.example` | + as duas variáveis e o SQL |
| `CLAUDE.md` | rota nova, invariantes novas, pendências atualizadas |
