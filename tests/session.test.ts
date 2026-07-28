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
