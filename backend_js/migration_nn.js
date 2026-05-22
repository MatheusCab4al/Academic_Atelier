// migration_nn.js
// Script para migrar o banco de dados para o modelo de múltiplos professores por turma.

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
    console.log('[Migration] 🚀 Iniciando migração para modelo N:N...');

    // 1. Criar a tabela de vínculos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS professor_turma (
        id INT AUTO_INCREMENT PRIMARY KEY,
        professor_id INT NOT NULL,
        turma_id INT NOT NULL,
        disciplina VARCHAR(100) DEFAULT 'Geral',
        ultimo_conteudo VARCHAR(255) DEFAULT '',
        proxima_aula VARCHAR(255) DEFAULT '',
        pendencias INT DEFAULT 0,
        status ENUM('verde', 'amarelo', 'vermelho') DEFAULT 'verde',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE
      )
    `);
    console.log('[Migration] ✅ Tabela professor_turma criada.');

    // 2. Mover dados existentes
    const [turmasAntigas] = await pool.query('SELECT * FROM turmas');
    
    for (const t of turmasAntigas) {
      if (t.professor_id) {
        await pool.query(
          `INSERT INTO professor_turma 
          (professor_id, turma_id, ultimo_conteudo, proxima_aula, pendencias, status) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [t.professor_id, t.id, t.ultimo_conteudo, t.proxima_aula, t.pendencias, t.status]
        );
      }
    }
    console.log(`[Migration] ✅ ${turmasAntigas.length} vínculos antigos migrados.`);

    // 3. Limpar a tabela de turmas (Remover colunas que agora estão no vínculo)
    // Nota: professor_id precisa ser removido, mas primeiro removemos a FK.
    
    // Pegamos o nome da constraint da FK para remover
    const [constraints] = await pool.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'turmas' AND COLUMN_NAME = 'professor_id'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (constraints.length > 0) {
      const constraintName = constraints[0].CONSTRAINT_NAME;
      await pool.query(`ALTER TABLE turmas DROP FOREIGN KEY ${constraintName}`);
      console.log(`[Migration] ✅ Foreign Key ${constraintName} removida.`);
    }

    await pool.query(`
      ALTER TABLE turmas 
      DROP COLUMN professor_id,
      DROP COLUMN ultimo_conteudo,
      DROP COLUMN proxima_aula,
      DROP COLUMN pendencias,
      DROP COLUMN status
    `);
    console.log('[Migration] ✅ Colunas redundantes removidas da tabela turmas.');

    console.log('[Migration] 🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('[Migration] ❌ Erro na migração:', error.message);
  } finally {
    await pool.end();
  }
}

migrar();
