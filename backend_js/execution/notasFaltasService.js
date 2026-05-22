// execution/notasFaltasService.js
// Lida com a inserção de notas, chamadas e cálculos automáticos de média e frequência.

const pool = require('./db');

/**
 * Função utilitária para atualizar a media_atual e frequencia do aluno
 * na tabela 'alunos'. É chamada automaticamente após inserir uma nota ou falta.
 */
async function atualizarEstatisticasAluno(alunoId) {
  try {
    // 1. Calcula a nova média (média aritmética simples de todas as notas)
    const [notas] = await pool.query('SELECT valor FROM notas WHERE aluno_id = ?', [alunoId]);
    let novaMedia = 0;
    if (notas.length > 0) {
      const soma = notas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
      novaMedia = soma / notas.length;
    }

    // 2. Calcula a nova frequência (porcentagem de presenças / total de chamadas)
    const [chamadas] = await pool.query('SELECT presente FROM aulas_chamada WHERE aluno_id = ?', [alunoId]);
    let novaFrequencia = 100; // Começa com 100%
    if (chamadas.length > 0) {
      const presencas = chamadas.filter(c => c.presente === 1).length;
      novaFrequencia = (presencas / chamadas.length) * 100;
    }

    // 3. Define o status visual (ex: verde >= 7 e freq >= 75)
    let novoStatus = 'verde';
    if (novaMedia < 5 || novaFrequencia < 50) {
      novoStatus = 'vermelho';
    } else if (novaMedia < 7 || novaFrequencia < 75) {
      novoStatus = 'amarelo';
    }

    // 4. Atualiza o banco
    await pool.query(
      'UPDATE alunos SET media_atual = ?, frequencia = ?, status = ? WHERE id = ?',
      [novaMedia.toFixed(2), Math.round(novaFrequencia), novoStatus, alunoId]
    );

  } catch (erro) {
    console.error('[notasFaltasService] ❌ Erro ao recalcular estatísticas do aluno:', erro.message);
  }
}

/**
 * Lança uma nova nota para o aluno
 */
async function lancarNota(alunoId, descricao, valor) {
  try {
    const [resultado] = await pool.query(
      'INSERT INTO notas (aluno_id, descricao, valor) VALUES (?, ?, ?)',
      [alunoId, descricao, parseFloat(valor)]
    );

    // Atualiza as estatísticas
    await atualizarEstatisticasAluno(alunoId);

    return { sucesso: true, codigoHttp: 201, mensagem: 'Nota lançada com sucesso!', notaId: resultado.insertId };
  } catch (erro) {
    console.error('[notasFaltasService] ❌ Erro ao lançar nota:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao lançar nota no banco.' };
  }
}

/**
 * Lista todas as notas de um aluno
 */
async function listarNotas(alunoId) {
  try {
    const [rows] = await pool.query(
      'SELECT id, descricao, valor, data_lancamento FROM notas WHERE aluno_id = ? ORDER BY data_lancamento DESC',
      [alunoId]
    );
    return { sucesso: true, codigoHttp: 200, notas: rows };
  } catch (erro) {
    console.error('[notasFaltasService] ❌ Erro ao listar notas:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao buscar notas do aluno.' };
  }
}

/**
 * Registra a presença ou falta em uma aula específica
 */
async function registrarPresenca(alunoId, dataAula, presente) {
  try {
    const isPresente = presente ? 1 : 0;
    const [resultado] = await pool.query(
      'INSERT INTO aulas_chamada (aluno_id, data_aula, presente) VALUES (?, ?, ?)',
      [alunoId, dataAula, isPresente]
    );

    // Atualiza as estatísticas
    await atualizarEstatisticasAluno(alunoId);

    return { sucesso: true, codigoHttp: 201, mensagem: 'Chamada registrada com sucesso!', chamadaId: resultado.insertId };
  } catch (erro) {
    console.error('[notasFaltasService] ❌ Erro ao registrar presença:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao registrar presença no banco.' };
  }
}

/**
 * Lista o histórico de chamadas de um aluno
 */
async function listarChamadas(alunoId) {
  try {
    const [rows] = await pool.query(
      'SELECT id, data_aula, presente FROM aulas_chamada WHERE aluno_id = ? ORDER BY data_aula DESC',
      [alunoId]
    );
    return { sucesso: true, codigoHttp: 200, chamadas: rows };
  } catch (erro) {
    console.error('[notasFaltasService] ❌ Erro ao listar chamadas:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro ao buscar histórico de chamadas.' };
  }
}

module.exports = { lancarNota, listarNotas, registrarPresenca, listarChamadas };
