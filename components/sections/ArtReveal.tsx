"use client";

import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const points = [
  { label: "O Cavaleiro", desc: "Fiel e Verdadeiro, montado no cavalo branco (Ap 19)." },
  { label: "A multidão", desc: "Reis e povos entregam suas coroas em adoração." },
  {
    label: "O Rei dos reis",
    desc: "No manto e na coxa, o nome escrito: Rei dos reis e Senhor dos senhores (Ap 19.16).",
  },
];

export default function ArtReveal() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
        {/* a arte das costas, como relíquia dourada iluminada */}
        <Reveal className="order-1 justify-self-center lg:order-none">
          <div className="relic w-[min(80vw,460px)]">
            <Image
              src="/designs/back.webp"
              alt="O Rei no cavalo branco com a multidão em adoração — Apocalipse 19"
              width={1444}
              height={2048}
              sizes="(max-width: 1024px) 80vw, 460px"
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        <div className="order-2 lg:order-none">
          <Reveal>
            <p className="sacred mb-5">A Arte</p>
            <h2
              className="display text-parchment"
              style={{ fontSize: "clamp(2.1rem,5.5vw,4rem)", lineHeight: 1.02 }}
            >
              A <span className="gold-text">volta</span> do Rei <span className="gold-text">Jesus</span>
            </h2>
            <span aria-hidden className="blood-mark mt-6" />
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mute">
              Nas costas, a ilustração completa de Apocalipse 19: o Rei dos reis
              e Senhor dos senhores, a espada em chamas, os exércitos e todo
              joelho que se dobra. Impressão premium, cores firmes que não
              craquelam.
            </p>
          </Reveal>

          <div className="mt-10 flex flex-col divide-y divide-line border-y border-line">
            {points.map((p, i) => (
              <Reveal key={p.label} delay={0.15 + i * 0.08}>
                <div className="grid grid-cols-[10rem_1fr] items-baseline gap-4 py-4 max-sm:grid-cols-1 max-sm:gap-1">
                  <div className="text-sm font-semibold text-parchment">
                    {p.label}
                  </div>
                  <div className="text-sm text-mute">{p.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
