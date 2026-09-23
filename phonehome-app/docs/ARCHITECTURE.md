# Arquitetura — Phone Home App

## Modelo

Marketplace multi-tenant: qualquer assistência técnica se cadastra (cadastro
aberto) e passa a receber trabalhos da fila aberta. A Phone Home participa
como uma assistência entre as outras, além de operar a plataforma e cobrar
comissão por serviço realizado.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS. Todas as
  páginas de dados são Client Components — não há camada de servidor própria;
  o Postgres com RLS é o único ponto de controle de acesso.
- **Backend**: Supabase (Postgres + Auth + Realtime), projeto `IphoneHome`
  (`ymzzrnctrcdnpijznjxq`), compartilhado com outras automações da Phone Home
  (bot de WhatsApp/n8n, dados da DBianco, etc.) — por isso todas as tabelas
  deste app usam o prefixo `marketplace_`.
- **Deploy**: Vercel.

## Modelo de dados (prefixo `marketplace_`)

| Tabela | O que guarda |
| --- | --- |
| `assistencias` | Perfil de cada assistência parceira: nome, endereço, raio de atendimento, especialidades, % de comissão |
| `usuarios` | Pessoas vinculadas a uma assistência (`dono` ou `tecnico`) |
| `clientes` | Clientes finais que agendam reparos |
| `trabalhos` | Cada agendamento — nasce na fila aberta (`assistencia_id` nulo, `status = 'fila'`) e ganha uma assistência quando alguém aceita |
| `estoque` | Peças por assistência |
| `movimentos_estoque` | Entradas/saídas de peça (ainda não ligado automaticamente às OS — ver "Próximos passos") |
| `caixa` | Lançamentos de receita, comissão da plataforma e despesa, por assistência |

## Fila aberta e proteção contra "sequestro" de trabalho

Como qualquer assistência pode ver e aceitar um trabalho em `status = 'fila'`,
existe um risco real de duas assistências tentarem aceitar o mesmo trabalho
ao mesmo tempo, ou uma assistência tentar alterar um trabalho que já é de
outra. Isso é resolvido em duas camadas:

1. **RLS** (`trabalhos_select` / `trabalhos_update`) — controla quem pode
   *tentar* ler ou atualizar uma linha.
2. **Trigger `marketplace_trabalhos_before_update`** — controla o que a
   atualização pode efetivamente mudar: um cliente só pode cancelar um
   trabalho que ainda está `fila`; uma assistência só pode "aceitar" um
   trabalho que ainda está sem dono, e só pode seguir atualizando um trabalho
   que já é dela. Isso é o que garante a regra "primeiro que aceitar, leva"
   mesmo com duas assistências tentando ao mesmo tempo.

As funções auxiliares `marketplace_current_assistencia_id()` e
`marketplace_current_cliente_id()` são `SECURITY DEFINER` (para poder
consultar `marketplace_usuarios`/`marketplace_clientes` de dentro de uma
policy sem recursão) e têm `EXECUTE` revogado de `PUBLIC`, liberado só para
`authenticated`.

## Comissão

Quando uma assistência finaliza um trabalho (`/dashboard/os`), o app cria dois
lançamentos em `caixa`: um de receita (valor cheio) e um de
`comissao_plataforma` (negativo, calculado pela `taxa_comissao_pct` da
assistência). Isso funciona bem quando o pagamento é registrado pelo app. Para
pagamento combinado por fora, a plataforma depende da assistência lançar o
valor certo — não há hoje nenhuma verificação ou trava contra sub-declaração
(ver "Próximos passos").

## Próximos passos (antes de ir para clientes reais)

- [ ] Pagamento dentro do app (Pix/cartão) — hoje o formulário de "Finalizar"
      só registra a forma de pagamento, não processa cobrança de verdade.
- [ ] Regra para reduzir o risco de sub-declaração de pagamentos feitos por
      fora do app (ex.: bloquear novos trabalhos da fila se o caixa estiver
      pendente).
- [ ] Ligar baixa de estoque automática quando uma OS é finalizada (hoje
      `estoque` e `movimentos_estoque` existem mas são só manuais).
- [ ] Fila aberta hoje não filtra por proximidade/raio de atendimento — toda
      assistência vê todo trabalho em `fila`, independente da distância.
- [ ] Convite de técnicos: hoje só o próprio usuário se vincula a uma
      assistência no cadastro; não há fluxo do dono convidar um técnico.
- [ ] E-mail de confirmação do Supabase Auth está no padrão do projeto — vale
      revisar o template e decidir se confirmação é obrigatória.
