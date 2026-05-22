// execution/db.js
// Configuração do pool de conexões com o MySQL.
// Centralizamos a conexão aqui para facilitar a manutenção.

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexões: evita abrir/fechar conexão a cada requisição
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'academic_atelier',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verifica a conexão ao inicializar o servidor
async function testarConexao() {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] ✅ Conexão com o MySQL estabelecida com sucesso.');
    conn.release();
  } catch (err) {
    console.error('[DB] ❌ Falha ao conectar ao MySQL:', err.message);
    console.error('[DB] Verifique as credenciais no arquivo .env');
    // Não encerra o processo — o servidor sobe mesmo sem banco (para diagnóstico)
  }
}

testarConexao();

module.exports = pool;
