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
    qty: pagos.filter((p) => p.size === size).reduce((n, p) => n + p.qty, 0),
  }));

  return {
    camisetas: pagos.reduce((n, p) => n + p.qty, 0),
    receita: pagos.reduce((n, p) => n + p.total, 0),
    porTamanho,
  };
}
