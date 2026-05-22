/**
 * URL base da API — detecta ambiente automaticamente.
 * Local (Live Server / arquivo local): http://localhost:3001
 * Produção (Vercel): defina API_PRODUCTION_URL abaixo quando o backend estiver hospedado.
 */
const API_PRODUCTION_URL = '';

function isAmbienteLocal() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '';
}

function getApiBaseUrl() {
  if (isAmbienteLocal()) {
    return 'http://localhost:3001';
  }
  if (API_PRODUCTION_URL) {
    return API_PRODUCTION_URL.replace(/\/$/, '');
  }
  return '';
}

function apiUrl(caminho) {
  const path = caminho.startsWith('/') ? caminho : `/${caminho}`;
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('API_PRODUCTION_URL não configurada em frontend_real/js/api.js');
  }
  return `${base}${path}`;
}

function mensagemErroConexao() {
  if (isAmbienteLocal()) {
    return 'Erro ao conectar com o servidor. Inicie o backend: na pasta backend_js, execute "npm run dev".';
  }
  if (!API_PRODUCTION_URL) {
    return 'Backend não configurado para produção. Defina API_PRODUCTION_URL em js/api.js ou use o site localmente com o servidor rodando.';
  }
  return 'Erro ao conectar com o servidor.';
}
