import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Suporte — Phone Home" };

const EMAIL = process.env.NEXT_PUBLIC_CONTATO_EMAIL;

export default function SuportePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-sm leading-relaxed text-slate-700">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suporte</h1>
      <p>Precisa de ajuda com um reparo, um pedido ou a sua conta? Fale com a gente:</p>

      <ul className="space-y-3">
        {EMAIL && (
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">E-mail</p>
            <a href={`mailto:${EMAIL}`} className="text-blue-600 underline">
              {EMAIL}
            </a>
          </li>
        )}
        <li className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-900">Site</p>
          <a href="https://iphonehome.com.br" className="text-blue-600 underline">
            iphonehome.com.br
          </a>
        </li>
      </ul>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Dúvidas comuns</h2>
      <p>
        <strong>O valor final ficou diferente do estimado.</strong> Em <em>Meus reparos</em> você pode confirmar ou
        contestar o valor informado pela assistência.
      </p>
      <p>
        <strong>Quero excluir minha conta.</strong> Fale com a gente por um dos canais acima e removeremos seus
        dados pessoais. Dados de pagamentos e serviços já realizados podem ser mantidos de forma anonimizada,
        conforme a nossa <Link href="/privacidade" className="text-blue-600 underline">Política de Privacidade</Link>.
      </p>
    </article>
  );
}
