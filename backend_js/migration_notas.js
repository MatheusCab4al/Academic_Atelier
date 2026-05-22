// migration_notas.js
// Script para rodar isoladamente e criar as tabelas de notas e aulas_chamada sem apagar os dados atuais.

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrar() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academic_atelier',
  });

  try {
    console.log('[Migration] 🚀 Iniciando criação das tabelas de Notas e Faltas...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          aluno_id INT NOT NULL,
          descricao VARCHAR(100) NOT NULL,
          valor DECIMAL(4,2) NOT NULL,
          data_lancamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
      )
    `);
    console.log('[Migration] ✅ Tabela de "notas" criada.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS aulas_chamada (
          id INT AUTO_INCREMENT PRIMARY KEY,
          aluno_id INT NOT NULL,
          data_aula DATE NOT NULL,
          presente TINYINT(1) DEFAULT 1,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
      )
    `);
    console.log('[Migration] ✅ Tabela de "aulas_chamada" criada.');

    console.log('\n[Migration] 🎉 Migração de notas e faltas concluída com sucesso!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n[Migration] ❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

migrar();
