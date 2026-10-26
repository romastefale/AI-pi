# AI-pi

Bot de Telegram com Mini App que conversa via OpenRouter, rodando no **Telegram Serverless**
([documentação](https://core.telegram.org/bots/serverless)). Sem servidor próprio: nada de Railway.

- `app/`: o Mini App (front-end estático, hospedado em `https://app<id>.tgcloud.ai/`)
- `tgcloud/endpoints/chat.js`: endpoint que o Mini App chama (guarda a chave do OpenRouter)
- `tgcloud/handlers/message.js`: responde às mensagens (`/start`, `/reset`, texto livre)
- `tgcloud/lib/openrouter.js`: chamada ao OpenRouter
- `tgcloud/schema.js`: histórico da conversa por chat

## Configuração

1. No [@BotFather](https://t.me/BotFather): seu bot → **Serverless** → ligar. Em **CLI Access**, copie o token (`app<id>:<secret>`).
2. Em **Settings → Secrets and variables → Actions**, crie:
   - `TGCLOUD_TOKEN`: o token do CLI acima
   - `OPENROUTER_API_KEY`: sua chave do OpenRouter
3. Depois do primeiro deploy, copie a URL do Mini App impressa pelo `push`, configure-a em @BotFather (Mini App / Menu Button) e, se quiser o botão no `/start`, preencha `MINI_APP_URL` em `tgcloud/lib/config.js`.
4. Faça push na `main` (ou rode o workflow manualmente). O workflow injeta a chave em `tgcloud/lib/config.js`, faz `push`, `migrate --safe` e `webhook sync`.

## Segurança

A chave do OpenRouter vai para o módulo implantado na nuvem do Telegram (visível só a quem administra o bot
no BotFather/CLI). Não fica no repositório nem no navegador: o Mini App chama o endpoint `chat`. O runtime do Serverless não tem variáveis de ambiente,
por isso a injeção é feita no deploy.

## Teste local

```bash
npm install
npx tgcloud login
npx tgcloud run handlers/message '{ chat: { id: 1 }, text: "oi" }'
```
