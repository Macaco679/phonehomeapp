# Phone Home — App

Plataforma multi-assistência para conserto de celular: clientes agendam pelo
app, o pedido cai numa fila aberta, e a primeira assistência técnica parceira
disponível aceita e assume o serviço. Cada assistência (incluindo a própria
Phone Home) tem seu próprio painel para controlar ordens de serviço, estoque
e caixa.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security, Realtime)
- Deploy: Vercel

## Rodando localmente

```bash
npm install
npm run dev
```

As variáveis de ambiente do Supabase já estão em `.env.local` (projeto
`IphoneHome`, banco compartilhado com outras automações da Phone Home — as
tabelas deste app usam o prefixo `marketplace_` para não colidir com nada).

## Estrutura

- `src/app/` — páginas (App Router)
  - `/agendar`, `/meus-reparos` — fluxo do cliente
  - `/dashboard/*` — painel da assistência (fila, OS, estoque, caixa)
  - `/login`, `/cadastro` — autenticação (cliente ou assistência)
- `src/lib/supabase/client.ts` — cliente Supabase (browser)
- `src/lib/types.ts` — tipos e constantes compartilhadas
- `src/hooks/use-auth.ts` — sessão + perfil (cliente ou usuário de assistência)

Mais detalhes de arquitetura e decisões em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Status

MVP funcional: cadastro/login, agendamento com fila aberta, aceite de
trabalhos, progressão de status da OS, estoque básico e caixa com comissão da
plataforma. Ver "Próximos passos" em `docs/ARCHITECTURE.md` para o que falta
antes de ir para clientes reais.
