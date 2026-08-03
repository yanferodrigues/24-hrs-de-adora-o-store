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
