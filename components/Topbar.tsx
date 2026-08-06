"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import UserMenu from "./auth/UserMenu";

export default function Topbar() {
  const [progress, setProgress] = useState(0);
  // O primeiro frame é escuro (a foto do congresso). Enquanto a barra estiver
  // sobre ele, o degradê claro viraria uma névoa branca em cima da foto e o
  // texto preto sumiria — então ali ela troca para a paleta clara sobre preto.
  const [sobreAFoto, setSobreAFoto] = useState(true);

  useEffect(() => {
    const unsub = useStore.subscribe((s) => setProgress(s.scrollProgress));
    return unsub;
  }, []);

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return; // fora da landing não há foto embaixo: fica no tema claro

    // Vale enquanto o hero ainda estiver atrás da barra. O recuo de 184px no
    // topo desconta a altura da barra mais a faixa clara com que o hero termina
    // — sem ele, a barra continuaria em texto claro justo quando o fundo já
    // virou branco. Observer em vez de listener de scroll: o navegador avisa
    // na virada, sem ler layout a cada quadro do Lenis.
    const io = new IntersectionObserver(
      ([entrada]) => setSobreAFoto(entrada.isIntersecting),
      { rootMargin: "-184px 0px 0px 0px", threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: `${progress * 100}%`,
          background: "var(--blood)",
          zIndex: 71,
          transition: "width .1s linear",
        }}
      />
      <header
        className={`fixed left-0 right-0 top-0 z-[70] flex items-center justify-between px-7 py-4 ${
          sobreAFoto ? "on-shot" : ""
        }`}
        style={{
          background: sobreAFoto
            ? "linear-gradient(180deg, rgba(5,4,3,.6), rgba(0,0,0,0))"
            : "linear-gradient(180deg, var(--bg), rgba(0,0,0,0))",
          backdropFilter: "blur(7px)",
          transition: "background .35s ease",
        }}
      >
        <a
          href="#top"
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink"
        >
          24H DE <b className="font-semibold">ADORAÇÃO</b> SHOP
        </a>
        <UserMenu />
      </header>
    </>
  );
}
