const jwt = require('jsonwebtoken');
require('dotenv').config();

function verificarToken(req, res, next) {
  // 1. Pega o token do cabeçalho da requisição (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verifica se o token é válido com a mesma chave usada para criá-lo
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave_padrao_trocar_no_env');
    
    // 3. Adiciona as informações do usuário na requisição para que as próximas rotas possam usar
    req.usuario = decoded;
    
    // 4. Passa a requisição adiante para a próxima função/rota
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Acesso negado. Token inválido ou expirado.' });
  }
}

module.exports = { verificarToken };
