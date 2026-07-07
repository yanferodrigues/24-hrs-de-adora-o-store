import { NextResponse } from "next/server";
import { PRODUCT } from "@/lib/data";

/**
 * Cria uma sessão de checkout do Stripe quando STRIPE_SECRET_KEY estiver definido.
 * Sem a chave, responde { configured: false } para o front degradar com elegância.
 * (Usa a API REST do Stripe via fetch — sem dependência extra no bundle.)
 */
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const { version, size } = await req.json().catch(() => ({}));

  if (!key) {
    return NextResponse.json({ configured: false, url: null });
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/?status=sucesso`);
  params.set("cancel_url", `${origin}/?status=cancelado`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "brl");
  params.set(
    "line_items[0][price_data][unit_amount]",
    String(PRODUCT.price * 100)
  );
  params.set(
    "line_items[0][price_data][product_data][name]",
    `${PRODUCT.brand} — Camiseta ${version ?? ""} (${size ?? "M"})`
  );

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    return NextResponse.json(
      { configured: true, url: null, error: "stripe_error" },
      { status: 502 }
    );
  }

  const session = await resp.json();
  return NextResponse.json({ configured: true, url: session.url });
}
