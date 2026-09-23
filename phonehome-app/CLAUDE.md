@AGENTS.md
@docs/ARCHITECTURE.md

# Phone Home — instruções para trabalhar neste repo

- Next.js 16 (App Router), TypeScript, Tailwind. Sem servidor customizado —
  toda a lógica de dados roda no cliente via `@supabase/supabase-js`,
  protegida por Row Level Security no Postgres (não por checagens no código).
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
