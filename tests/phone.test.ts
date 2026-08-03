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
