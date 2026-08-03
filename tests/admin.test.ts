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
