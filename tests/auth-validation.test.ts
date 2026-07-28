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
