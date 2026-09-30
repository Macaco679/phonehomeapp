import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade — Phone Home" };

const CONTATO =
  process.env.NEXT_PUBLIC_CONTATO_EMAIL ??
  "os canais de atendimento divulgados em iphonehome.com.br";

export default function PrivacidadePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-sm leading-relaxed text-slate-700">
      <h1 className="text-2xl font-semibold text-slate-900">Política de Privacidade</h1>
      <p className="text-xs text-slate-400">Última atualização: 30 de setembro de 2026</p>

      <p>
        A Phone Home conecta clientes que precisam consertar o celular a assistências técnicas
        parceiras. Esta página explica quais dados pedimos, para que usamos e como você pode
        controlá-los, conforme a Lei Geral de Proteção de Dados (LGPD).
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Quais dados coletamos</h2>
      <p>
        Nome, e-mail e telefone (WhatsApp) informados no cadastro ou obtidos da sua conta Google
        (nome e e-mail); endereço e, de forma aproximada, a localização desse endereço; dados do
        aparelho e do reparo solicitado; histórico de pedidos e de pagamentos. Para assistências
        parceiras, também o nome da empresa, endereço, raio de atendimento e dados da equipe.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Para que usamos</h2>
      <p>
        Para criar sua conta, encaminhar seu pedido às assistências da sua região, permitir que
        a assistência vá até você, processar pagamentos, calcular comissões da plataforma, enviar
        avisos sobre o andamento do serviço e prevenir fraudes.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Com quem compartilhamos</h2>
      <p>
        Com a assistência que aceitar o seu pedido (nome, telefone, endereço e dados do aparelho,
        apenas o necessário para o atendimento); com o Mercado Pago, que processa pagamentos
        (Pix e cartão — não armazenamos dados de cartão); e com provedores de infraestrutura
        (hospedagem e banco de dados). Não vendemos seus dados.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Login com Google</h2>
      <p>
        Ao entrar com o Google, recebemos somente seu nome e e-mail para identificar sua conta.
        Não acessamos seus e-mails, contatos, arquivos ou qualquer outro dado da sua conta Google.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e revogar
        consentimentos, a qualquer momento. Alguns dados (como registros financeiros) podem ser
        mantidos pelo prazo exigido em lei. Para exercer seus direitos, fale com a gente por{" "}
        {CONTATO}.
      </p>

      <h2 className="pt-2 text-base font-semibold text-slate-900">Segurança e retenção</h2>
      <p>
        Usamos conexão criptografada e regras de acesso por conta no banco de dados. Mantemos os
        dados enquanto sua conta existir ou pelo tempo necessário para cumprir obrigações legais.
      </p>
    </article>
  );
}
