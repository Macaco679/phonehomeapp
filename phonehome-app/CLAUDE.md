@AGENTS.md
@docs/ARCHITECTURE.md

# Phone Home — instruções para trabalhar neste repo

- Next.js 16 (App Router), TypeScript, Tailwind. Dados rodam no cliente via
  `@supabase/supabase-js`, protegidos por RLS/triggers/RPCs no Postgres (não por
  checagens no código). Única parte server-side: `src/app/api/pagamentos/*`
  (Mercado Pago), que usa a service role — nunca a exponha ao cliente.
- Comissão, caixa, baixa de estoque e `pago_em_app` são feitos pelo banco
  (trigger em `marketplace_trabalhos`); não replique isso no front.
- Banco: projeto Supabase `IphoneHome` (`ymzzrnctrcdnpijznjxq`), compartilhado
  com outras automações da Phone Home. Todas as tabelas deste app usam o
  prefixo `marketplace_` — nunca crie uma tabela sem esse prefixo aqui.
- Qualquer mudança de schema é uma migration nomeada (via Supabase MCP
  `apply_migration` ou o CLI do Supabase), nunca um `execute_sql` solto para
  DDL.
- RLS é a fonte de verdade da segurança: cliente só vê os próprios
  `marketplace_trabalhos`/`marketplace_clientes`; assistência só vê o que é
  dela mais a fila aberta (`status = 'fila'`). O trigger
  `marketplace_trabalhos_before_update` impede uma parte "sequestrar" o
  trabalho da outra — não contorne isso direto no client.
- Depois de qualquer migration, rode o advisor de segurança do Supabase
  (`get_advisors`, type `security`) antes de considerar a mudança pronta.
