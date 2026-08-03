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
