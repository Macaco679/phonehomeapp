import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso — Phone Home" };

export default function TermosPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-sm leading-relaxed text-slate-700">
      <h1 className="text-2xl font-semibold text-slate-900">Termos de Uso</h1>
      <p className="text-xs text-slate-400">Última atualização: 30 de setembro de 2026</p>

      <p>
        A Phone Home é uma plataforma que aproxima clientes e assistências técnicas de celulares.
        Ao usar o app você concorda com as regras abaixo.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Como funciona</h2>
      <p>
        O cliente agenda um reparo e o pedido entra numa fila aberta; a primeira assistência
        parceira da região que aceitar assume o serviço. O preço exibido na hora do agendamento é
        uma estimativa; o valor final é informado pela assistência ao concluir o serviço e pode ser
        confirmado ou contestado pelo cliente no app.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Assistências parceiras</h2>
      <p>
        Qualquer assistência técnica pode se cadastrar. A Phone Home cobra comissão sobre cada
        serviço concluído, conforme o percentual da conta. A assistência se compromete a declarar o
        valor real cobrado e a quitar as comissões devidas; comissões pendentes além do prazo ou do
        limite definido podem bloquear o recebimento de novos trabalhos. Contas podem ser
        pausadas em caso de fraude ou descumprimento destes termos.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Pagamentos</h2>
      <p>
        Pagamentos pelo app (Pix ou cartão) são processados pelo Mercado Pago. Serviços podem
        também ser pagos presencialmente, quando combinado. Compras da loja seguem as condições
        exibidas no pedido e a legislação de defesa do consumidor.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Responsabilidades</h2>
      <p>
        A execução do reparo é de responsabilidade da assistência que aceitou o serviço, inclusive
        garantia e peças utilizadas. A Phone Home atua como intermediadora e se empenha em resolver
        contestações entre as partes.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Conta e uso adequado</h2>
      <p>
        Você é responsável pelas informações do seu cadastro e pelo acesso à sua conta. É proibido
        usar o app para fraudes, informações falsas ou qualquer atividade ilegal.
      </p>

      <p>
        Dados pessoais são tratados conforme a nossa <a href="/privacidade" className="text-blue-600 underline">Política de Privacidade</a>.
      </p>
    </article>
  );
}
