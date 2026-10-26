// OPENROUTER_API_KEY é substituída pelo workflow de deploy (.github/workflows/deploy.yml)
// com o secret do GitHub Actions. Não coloque a chave real aqui nem faça commit dela.
export const OPENROUTER_API_KEY = '__OPENROUTER_API_KEY__';
export const OPENROUTER_MODEL = 'openrouter/free';
export const HISTORY_LIMIT = 24;

// URL do Mini App (https://app<id>.tgcloud.ai/, impressa pelo `tgcloud push`).
// Se preenchida, /start mostra um botão para abri-lo.
export const MINI_APP_URL = '';
