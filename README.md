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
2. Em **Settings → Secrets and variables → Actions**, crie o secret `TGCLOUD_TOKEN` com o token do CLI acima. Não há secret para a chave do OpenRouter.
3. Depois do primeiro deploy, copie a URL do Mini App impressa pelo `push`, configure-a em @BotFather (Mini App / Menu Button) e, se quiser o botão no `/start`, preencha `MINI_APP_URL` em `tgcloud/lib/config.js`.
4. Faça push na `main` (ou rode o workflow manualmente). O workflow faz `push`, `migrate --safe` e `webhook sync`.
5. No Telegram, envie sua chave do OpenRouter (`sk-or-...`) ao bot em conversa privada. Ele a guarda no banco do bot e apaga a mensagem. `/esquecer` remove a chave.

## Segurança

A chave de cada usuário fica na tabela `api_keys` do banco do bot, na nuvem do Telegram. Não fica no repositório, em secrets
nem no HTML do Mini App, que só a usa por meio do endpoint `chat`. Ela é guardada em texto puro, acessível a quem administra o bot.
Use uma chave dedicada com limite de gasto no OpenRouter.

## Teste local

```bash
npm install
npx tgcloud login
npx tgcloud run handlers/message '{ chat: { id: 1 }, text: "oi" }'
```
