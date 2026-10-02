# Arquitetura — Phone Home App

## Modelo

Marketplace multi-tenant: qualquer assistência técnica se cadastra (cadastro
aberto) e passa a receber trabalhos da fila aberta. A Phone Home participa
como uma assistência entre as outras, além de operar a plataforma e cobrar
comissão por serviço realizado.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS. As páginas
  de dados são Client Components; o Postgres com RLS/triggers/RPCs é o ponto de
  controle de acesso. A única camada de servidor própria são as rotas
  `src/app/api/pagamentos/*` (Mercado Pago).
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
| `caixa` | Lançamentos de receita, comissão da plataforma e despesa, por assistência (receita/comissão gerados pelo banco) |
| `trabalho_pecas` | Peças usadas em cada OS — baixa automática do `estoque` |
| `precos` / `config` / `admins` | Tabela de preço estimado, regras de comissão e lista de administradores |
| `convites` | Convites de técnicos por e-mail |
| `produtos` / `pedidos` / `pedido_itens` | Loja de peças e acessórios |
| `pagamentos` | Cobranças Mercado Pago (trabalho ou pedido) |

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

## Comissão e proteção contra sub-declaração

A comissão **não é mais calculada no app**. Quando a assistência conclui uma OS
(`status = 'concluido'`, exige `em_reparo` antes), o trigger do banco:

1. trava `valor_final` e `forma_pagamento` (não podem mais mudar);
2. calcula `comissao_pct` (da assistência) e `comissao_valor`;
3. cria os lançamentos em `marketplace_caixa` (receita + comissão) — o app não
   escreve mais isso;
4. baixa o estoque das peças lançadas em `marketplace_trabalho_pecas`;
5. define `acerto_status` (`pendente` até a plataforma quitar).

O **cliente confirma ou contesta o valor final** em `/meus-reparos`
(`marketplace_confirmar_valor`); contestações aparecem em `/admin`.

Travas contra pagar menos comissão:

- Pagamento feito pelo app (Mercado Pago) é marcado como pago só pelo webhook
  (service role); a assistência não consegue setar `pago_em_app`.
- Comissão de serviço presencial fica `pendente`. Se o total pendente passar de
  `limite_comissao_pendente` (padrão R$ 150) ou alguma comissão tiver mais de
  `dias_tolerancia_comissao` dias (padrão 7), `marketplace_assistencia_bloqueada`
  fica verdadeiro e a assistência **não consegue aceitar novos trabalhos**
  (trigger) até quitar. O admin quita em `/admin` (`marketplace_admin_quitar`).
- Esses limites, o % padrão e as instruções de pagamento ficam em
  `marketplace_config` e são editáveis em `/admin`.

## Fila por raio

O endereço do cliente (no agendamento) e da assistência (cadastro/configurações)
é geocodificado no navegador com OpenStreetMap/Nominatim (`src/lib/geo.ts`) e
guardado em `latitude/longitude`. A policy de SELECT da fila usa
`marketplace_na_area(lat, lng)` (haversine em SQL): a assistência só enxerga
trabalhos em `fila` dentro do `raio_atendimento_km`. Sem coordenadas, o
trabalho/assistência cai na regra "vê tudo" para não travar o fluxo.

## Pagamento no app (Mercado Pago)

`POST /api/pagamentos/checkout` (route handler, autentica pelo token do
Supabase) cria uma preferência do Checkout Pro (Pix + cartão) para um
**trabalho concluído** ou **pedido da loja** e devolve o `init_point`.
`POST /api/pagamentos/webhook` recebe o aviso do Mercado Pago, **busca o
pagamento na API do MP** (não confia no corpo), confere valor e
`external_reference` (= `marketplace_pagamentos.id`) e marca como pago usando o
cliente de service role (`src/lib/supabase/admin.ts`).

Variáveis de ambiente (Vercel): `MERCADOPAGO_ACCESS_TOKEN`,
`SUPABASE_SERVICE_ROLE_KEY`; opcionais `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_CONTATO_EMAIL`. Sem elas o checkout responde 503
("Pagamento online ainda não está configurado").

## Loja de peças e acessórios

`/loja` (cliente, carrinho em `localStorage` via `use-carrinho`), `/meus-pedidos`,
e `/dashboard/loja` (cada assistência cadastra produtos e acompanha pedidos).
Pedido é criado por RPC (`marketplace_criar_pedido`), que valida preço/estoque
no servidor; status avança por `marketplace_atualizar_pedido`.
Cada produto tem `tipo` (tela, bateria, cabo… — lista em `TIPOS_PRODUTO`,
`src/lib/types.ts`) para os filtros da vitrine e `preco_de` opcional (preço
riscado; o banco exige `preco_de > preco`). Sem `imagem_url`, a loja mostra a
ilustração do tipo (`src/lib/ilustracoes.ts`). Não há comissão
da plataforma sobre a loja (não foi definida).

## Preço estimado

`marketplace_precos` (marca/modelo/reparo, `*` = todos) é editada em `/admin`;
`src/lib/precos.ts` escolhe o mais específico e o `/agendar` mostra na hora.

## Equipe

O dono cria convites por e-mail em `/dashboard/equipe`
(`marketplace_convites`). Quem se cadastra (e-mail ou Google) com esse e-mail
vê o convite em `/completar-cadastro` e entra como técnico via
`marketplace_aceitar_convite`. OS podem ser atribuídas a um técnico e
`/dashboard/relatorios` mostra produção por técnico.

## Admin da plataforma

`marketplace_admins` (lista de e-mails) + `marketplace_is_admin()`. `/admin`:
acertos pendentes, contestações, taxa/status por assistência, tabela de
preços e regras de comissão.

## Segurança — o que o banco garante

Tudo via RLS + triggers; o front só reflete. Corrigido na v2: ninguém vira
`dono` de assistência existente; assistência não altera a própria taxa nem
`pago_em_app`; cliente/outra assistência não lê a fila fora da área;
usuário não se promove. Após qualquer migration, rodar `get_advisors`.

## Cadastro e login

Cadastro por e-mail/senha (`/cadastro`) só cria o usuário no Supabase Auth;
a linha de perfil (`marketplace_clientes` ou `marketplace_assistencias` +
`marketplace_usuarios`) só pode ser gravada com uma sessão autenticada (é o
que a policy `with_check (auth_user_id = auth.uid())` exige). A confirmação de
e-mail está **desligada** no Supabase (out/2026) porque o SMTP padrão só entrega
para membros da equipe — então `signUp` já devolve sessão e o fluxo segue direto
para `/completar-cadastro`. Se a confirmação for religada (com SMTP próprio),
`signUp` volta a não retornar sessão — por isso os dados do formulário ficam guardados neste navegador
(`localStorage`, chave `phonehome_pending_signup`) e a página
`/completar-cadastro` termina o cadastro sozinha assim que a pessoa confirma
o e-mail e volta autenticada (é para onde `emailRedirectTo` aponta).
Se o e-mail já existe (ex.: entrou com Google), `signUp` não cria conta nem
manda e-mail e devolve `identities: []` — o `/cadastro` detecta isso e avisa.

Login com Google usa `supabase.auth.signInWithOAuth({ provider: "google" })`
e também redireciona para `/completar-cadastro` — que pede tipo (cliente ou
assistência) + os dados obrigatórios que o Google não fornece (telefone,
endereço) para quem ainda não tem perfil, e simplesmente segue adiante para
quem já tem. O provider Google já está ativo no Supabase (Client ID/Secret do
projeto Google Cloud `phone-home-509600`; redirect
`https://ymzzrnctrcdnpijznjxq.supabase.co/auth/v1/callback`).

## Próximos passos

- [ ] Configurar no Vercel `MERCADOPAGO_ACCESS_TOKEN` e
      `SUPABASE_SERVICE_ROLE_KEY` e apontar o webhook do Mercado Pago para
      `/api/pagamentos/webhook`.
- [ ] Preencher instruções de pagamento da comissão (Pix) em `/admin`.
- [ ] Revisar `/termos` e `/privacidade` com advogado (texto genérico).
- [ ] Repasse automático (split) ao invés de acerto manual pelo admin.
- [ ] Notificações (e-mail/WhatsApp) de novo trabalho na fila.
- [ ] Domínio próprio (iphonehome.com.br) e publicação do app Google OAuth.
