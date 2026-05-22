// execution/alunoService.js
// Aqui fica a lógica para salvar e buscar dados dos alunos.

const pool = require('./db');

/**
 * Cadastra um novo aluno em uma turma no banco MySQL.
 */
async function cadastrarAluno(nome, email, turmaId) {
  try {
    const [resultado] = await pool.query(
      'INSERT INTO alunos (nome, email, turma_id) VALUES (?, ?, ?)',
      [nome, email, turmaId]
    );

    return {
      sucesso: true,
      codigoHttp: 201,
      mensagem: 'Aluno cadastrado com sucesso!',
      alunoId: resultado.insertId
    };
  } catch (erro) {
    console.error('[alunoService] ❌ Erro ao cadastrar aluno:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao cadastrar aluno no banco.' };
  }
}

/**
 * Lista alunos de uma turma específica no MySQL.
 */
async function listarAlunosPorTurma(turmaId) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, media_atual, status, frequencia FROM alunos WHERE turma_id = ?',
      [turmaId]
    );

    return { sucesso: true, codigoHttp: 200, alunos: rows };
  } catch (erro) {
    console.error('[alunoService] ❌ Erro ao listar alunos:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao buscar alunos no servidor.' };
  }
}

module.exports = { cadastrarAluno, listarAlunosPorTurma };

/**
 * Atualiza os dados de um aluno no MySQL.
 */
async function atualizarAluno(id, dados) {
  try {
    const { nome, email, media_atual, status, frequencia } = dados;
    await pool.query(
      `UPDATE alunos 
       SET nome = ?, email = ?, media_atual = ?, status = ?, frequencia = ? 
       WHERE id = ?`,
      [nome, email || null, parseFloat(media_atual) || 0, status || 'verde', parseInt(frequencia) || 100, id]
    );

    return { sucesso: true, codigoHttp: 200, mensagem: 'Aluno atualizado com sucesso!' };
  } catch (erro) {
    console.error('[alunoService] ❌ Erro ao atualizar aluno:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao atualizar aluno no banco.' };
  }
}

/**
 * Deleta um aluno no MySQL pelo ID.
 */
async function deletarAluno(id) {
  try {
    const [resultado] = await pool.query('DELETE FROM alunos WHERE id = ?', [id]);
    
    if (resultado.affectedRows === 0) {
      return { sucesso: false, codigoHttp: 404, mensagem: 'Aluno não encontrado.' };
    }

    return { sucesso: true, codigoHttp: 200, mensagem: 'Aluno removido com sucesso!' };
  } catch (erro) {
    console.error('[alunoService] ❌ Erro ao deletar aluno:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao deletar aluno no banco.' };
  }
}

module.exports = { cadastrarAluno, listarAlunosPorTurma, atualizarAluno, deletarAluno };
