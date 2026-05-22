// execution/turmaService.js
// Aqui fica a lógica para salvar e buscar dados das turmas.

const pool = require('./db');

/**
 * Cria ou vincula uma turma a um professor.
 */
async function criarTurma(dados) {
  const { nome, serie, turno, ano_letivo, disciplina, ultimo_conteudo, proxima_aula, pendencias, status, professorId } = dados;
  
  try {
    // 1. Verifica se a turma base já existe
    let [turmasExistentes] = await pool.query(
      'SELECT id FROM turmas WHERE nome = ? AND serie = ? AND turno = ? AND ano_letivo = ?',
      [nome, serie, turno, ano_letivo]
    );

    let turmaId;
    if (turmasExistentes.length > 0) {
      turmaId = turmasExistentes[0].id;
    } else {
      // Cria a turma se não existir
      const [novaTurma] = await pool.query(
        'INSERT INTO turmas (nome, serie, turno, ano_letivo) VALUES (?, ?, ?, ?)',
        [nome, serie, turno, ano_letivo]
      );
      turmaId = novaTurma.insertId;
    }

    // 2. Cria o vínculo do professor com esta turma e matéria
    const [resultado] = await pool.query(
      `INSERT INTO professor_turma 
      (professor_id, turma_id, disciplina, ultimo_conteudo, proxima_aula, pendencias, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [professorId, turmaId, disciplina || 'Geral', ultimo_conteudo, proxima_aula, pendencias, status]
    );

    return {
      sucesso: true,
      codigoHttp: 201,
      mensagem: 'Turma vinculada com sucesso!',
      vinculoId: resultado.insertId
    };
  } catch (erro) {
    console.error('[turmaService] ❌ Erro ao criar/vincular turma:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao processar vínculo da turma.' };
  }
}

/**
 * Lista todas as turmas que possuem vínculo com o professor logado.
 */
async function listarTurmasPorProfessor(professorId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        pt.id as vinculo_id, 
        t.id as turma_id, 
        t.nome, 
        t.serie, 
        t.turno, 
        t.ano_letivo, 
        pt.disciplina, 
        pt.ultimo_conteudo, 
        pt.proxima_aula, 
        pt.pendencias, 
        pt.status, 
        pt.criado_em 
       FROM professor_turma pt
       JOIN turmas t ON pt.turma_id = t.id
       WHERE pt.professor_id = ? 
       ORDER BY pt.criado_em DESC`,
      [professorId]
    );

    return { sucesso: true, codigoHttp: 200, turmas: rows };
  } catch (erro) {
    console.error('[turmaService] ❌ Erro ao listar turmas:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao buscar turmas no servidor.' };
  }
}

/**
 * Atualiza os dados do vínculo do professor (progresso, status, etc.).
 */
async function atualizarTurma(vinculoId, dados) {
  const { disciplina, ultimo_conteudo, proxima_aula, pendencias, status } = dados;
  try {
    await pool.query(
      `UPDATE professor_turma SET 
        disciplina = ?, 
        ultimo_conteudo = ?, 
        proxima_aula = ?, 
        pendencias = ?, 
        status = ?
       WHERE id = ?`,
      [disciplina, ultimo_conteudo, proxima_aula, pendencias, status, vinculoId]
    );

    return { sucesso: true, codigoHttp: 200, mensagem: 'Dados da matéria atualizados!' };
  } catch (erro) {
    console.error('[turmaService] ❌ Erro ao atualizar vínculo:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao atualizar dados da matéria.' };
  }
}

/**
 * Remove o vínculo do professor com a turma (não apaga a turma em si).
 */
async function deletarTurma(vinculoId) {
  try {
    await pool.query('DELETE FROM professor_turma WHERE id = ?', [vinculoId]);
    return { sucesso: true, codigoHttp: 200, mensagem: 'Vínculo removido com sucesso!' };
  } catch (erro) {
    console.error('[turmaService] ❌ Erro ao deletar vínculo:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao desvincular turma.' };
  }
}

module.exports = { criarTurma, listarTurmasPorProfessor, atualizarTurma, deletarTurma };
