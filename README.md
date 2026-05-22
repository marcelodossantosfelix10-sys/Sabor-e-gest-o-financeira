# Sabor & Gestão Financeira

Aplicativo de gestão para confeitaria com controle de estoque, encomendas, compras, finanças e relatórios.

## Visão Geral

Este projeto usa React 19, Vite, Tailwind CSS e Firebase para autenticação e gerenciamento de dados. O objetivo é centralizar as operações de uma confeitaria em uma interface clara e responsiva.

## Execução local

1. Instale as dependências:
   `npm install`
2. Crie o arquivo de ambiente:
   `cp .env.example .env.local`
3. Verifique o Firebase em `firebase-applet-config.json` e adicione domínios autorizados no Console do Firebase.
4. Inicie o servidor de desenvolvimento:
   `npm run dev`

## Scripts disponíveis

- `npm run dev` — inicia o ambiente de desenvolvimento
- `npm run build` — gera o build de produção
- `npm run preview` — pré-visualiza o build localmente
- `npm run lint` — executa verificação do TypeScript
- `npm test` — executa testes com Vitest
- `npm run test:ci` — executa testes em modo CI

## Testes e CI

O repositório já está preparado para usar Vitest e testes de interface com React Testing Library.

## Considerações de UX e acessibilidade

- A navegação foi organizada com `aria-label` para melhor suporte a leitores de tela.
- O fluxo de login agora está separado em componente próprio para melhorar manutenção.
- O botão de logout usa `type="button"` para evitar comportamento inesperado.

## Deploy

Recomendado para serviços compatíveis com Vite, como Vercel. Verifique as variáveis de ambiente e a configuração do Firebase antes do deploy.
