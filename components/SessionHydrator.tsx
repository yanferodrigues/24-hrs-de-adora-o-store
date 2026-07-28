"use client";

import { useEffect } from "react";
import { useStore, type SessionUser } from "@/lib/store";

/**
 * Recebe do layout (server) o usuário já resolvido e joga no store.
 * Evita um fetch extra no browser e o "flash" de estado deslogado.
 */
export default function SessionHydrator({
  user,
}: {
  user: SessionUser | null;
}) {
  useEffect(() => {
    useStore.getState().setUser(user);
  }, [user]);

  return null;
}
