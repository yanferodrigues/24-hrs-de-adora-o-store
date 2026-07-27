"use client";

import { Reveal } from "@/components/Reveal";

export default function Manifesto() {
  return (
    <section className="relative py-32">
      <div className="wrap max-w-3xl text-center">
        <Reveal>
          <p className="seam mb-10">
            <span className="sacred">Apocalipse 19</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <p
            className="display text-parchment"
            style={{
              fontSize: "clamp(1.9rem,5.2vw,3.6rem)",
              lineHeight: 1.16,
              fontWeight: 600,
            }}
          >
            Não é apenas uma camiseta.
            <br />É um{" "}
            <span className="gold-text">lembrete</span>: o Rei está voltando.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-mute">
            &ldquo;Vi o céu aberto, e eis um cavalo branco. Aquele que estava
            montado nele chama-se Fiel e Verdadeiro.&rdquo; Cada peça carrega a
            cena da volta do Rei — para vestir a esperança, não só o tecido.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
