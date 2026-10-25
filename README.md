# AI-pi

App web estático publicado no GitHub Pages. Não usa mais servidor externo (Railway).

## Configuração

1. Em **Settings → Secrets and variables → Actions**, crie o secret `OPENROUTER_API_KEY`.
2. Em **Settings → Pages**, defina **Source: GitHub Actions**.
3. Faça push na `main` (ou rode o workflow manualmente). O workflow injeta a chave no `index.html` durante o deploy.

## Aviso de segurança

Como o site é 100% estático, a chave injetada fica **visível no código da página publicada**
(o secret só a esconde do repositório e dos logs). Use uma chave dedicada no OpenRouter, com
limite de gasto baixo, e revogue-a se houver abuso.
