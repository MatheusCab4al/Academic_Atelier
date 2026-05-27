// server.js
// Arquivo principal do servidor que gerencia as rotas e conexões.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importa os serviços da camada de execução
const { verificarLogin, registrarUsuario, redefinirSenhaDireto } = require('./execution/authService');
const { criarTurma, listarTurmasPorProfessor, atualizarTurma, deletarTurma } = require('./execution/turmaService');
const { cadastrarAluno, listarAlunosPorTurma, atualizarAluno, deletarAluno } = require('./execution/alunoService');
const { lancarNota, listarNotas, registrarPresenca, listarChamadas } = require('./execution/notasFaltasService');
const { verificarToken } = require('./middlewares/authMiddleware');

const app = express();
const PORTA = process.env.PORT || 3001;

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json()); // Interpreta body JSON das requisições

// ─── Rota de saúde (health check) ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    sistema: 'Academic Atelier Backend',
    versao: '1.0.0',
  });
});

// ─── Rota de Login ───────────────────────────────────────────────────────────
// POST /api/login
// Body esperado: { "email": "...", "password": "..." }
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validação básica dos campos
  if (!email || !password) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  // Envia os dados para o serviço de autenticação validar
  const resultado = await verificarLogin(email, password);

  // Retorna a resposta com o código HTTP correto
  return res.status(resultado.codigoHttp).json(
    resultado.sucesso
      ? { token: resultado.token, usuario: resultado.usuario }
      : { erro: resultado.mensagem }
  );
});

// ─── Rota de Cadastro ────────────────────────────────────────────────────────
// POST /api/cadastro
// Body esperado: { "nome": "...", "email": "...", "password": "..." }
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, password } = req.body;

  // Validação básica dos campos
  if (!nome || !email || !password) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  // Delega a lógica ao authService
  const resultado = await registrarUsuario(nome, email, password);

  // Retorna a resposta
  return res.status(resultado.codigoHttp).json(
    resultado.sucesso
      ? { mensagem: resultado.mensagem, usuarioId: resultado.usuarioId }
      : { erro: resultado.mensagem }
  );
});

// ─── Rota de Redefinição de Senha (Direta) ───────────────────────────────────
// PUT /api/redefinir-senha
// Body esperado: { "email": "...", "novaSenha": "..." }
app.put('/api/redefinir-senha', async (req, res) => {
  const { email, novaSenha } = req.body;

  if (!email || !novaSenha) {
    return res.status(400).json({ erro: 'E-mail e nova senha são obrigatórios.' });
  }

  const resultado = await redefinirSenhaDireto(email, novaSenha);

  return res.status(resultado.codigoHttp).json(
    resultado.sucesso
      ? { mensagem: resultado.mensagem }
      : { erro: resultado.mensagem }
  );
});

// ─── Rotas de Turmas (Protegidas) ────────────────────────────────────────────

// Aplica o middleware de autenticação em todas as rotas de turmas
app.use('/api/turmas', verificarToken);

// POST /api/turmas - Criar nova turma
app.post('/api/turmas', async (req, res) => {
  const {
    nome, serie, turno, anoLetivo, ultimoConteudo, proximaAula,
    pendencias, status, professorId, disciplina
  } = req.body;

  if (!nome || !serie || !professorId) {
    return res.status(400).json({ erro: 'Nome, série e ID do professor são obrigatórios.' });
  }

  const resultado = await criarTurma({
    nome,
    serie,
    turno,
    ano_letivo: anoLetivo,
    ultimo_conteudo: ultimoConteudo,
    proxima_aula: proximaAula,
    pendencias: parseInt(pendencias) || 0,
    status,
    professorId,
    disciplina
  });

  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// GET /api/turmas/:professorId - Listar turmas de um professor
app.get('/api/turmas/:professorId', async (req, res) => {
  const { professorId } = req.params;
  const resultado = await listarTurmasPorProfessor(professorId);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado.turmas : { erro: resultado.mensagem });
});

// PUT /api/turmas/:id - Atualizar uma turma
app.put('/api/turmas/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nome, serie, turno, anoLetivo, ultimoConteudo, proximaAula,
    pendencias, status, disciplina
  } = req.body;

  const resultado = await atualizarTurma(id, {
    nome, serie, turno,
    ano_letivo: anoLetivo,
    ultimo_conteudo: ultimoConteudo,
    proxima_aula: proximaAula,
    pendencias: parseInt(pendencias) || 0,
    status,
    disciplina
  });
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// DELETE /api/turmas/:id - Remover uma turma
app.delete('/api/turmas/:id', async (req, res) => {
  const { id } = req.params;
  const resultado = await deletarTurma(id);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// ─── Rotas de Alunos (Protegidas) ────────────────────────────────────────────

// Aplica o middleware de autenticação em todas as rotas de alunos
app.use('/api/alunos', verificarToken);

// POST /api/alunos - Cadastrar novo aluno
app.post('/api/alunos', async (req, res) => {
  const { nome, email, turmaId } = req.body;
  if (!nome || !turmaId) {
    return res.status(400).json({ erro: 'Nome e ID da turma são obrigatórios.' });
  }
  const resultado = await cadastrarAluno(nome, email, turmaId);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// GET /api/alunos/:turmaId - Listar alunos de uma turma
app.get('/api/alunos/:turmaId', async (req, res) => {
  const { turmaId } = req.params;
  const resultado = await listarAlunosPorTurma(turmaId);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado.alunos : { erro: resultado.mensagem });
});

// PUT /api/alunos/:id - Atualizar os dados de um aluno
app.put('/api/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, media_atual, status, frequencia } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'O nome do aluno é obrigatório para atualização.' });
  }

  const resultado = await atualizarAluno(id, { nome, email, media_atual, status, frequencia });
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// DELETE /api/alunos/:id - Remover um aluno
app.delete('/api/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const resultado = await deletarAluno(id);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// ─── Rotas de Notas e Faltas ─────────────────────────────────────────────────

// POST /api/alunos/:id/notas - Lançar uma nota
app.post('/api/alunos/:id/notas', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor } = req.body;
  
  if (!descricao || valor === undefined) {
    return res.status(400).json({ erro: 'Descrição e valor da nota são obrigatórios.' });
  }

  const resultado = await lancarNota(id, descricao, valor);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// GET /api/alunos/:id/notas - Listar notas do aluno
app.get('/api/alunos/:id/notas', async (req, res) => {
  const { id } = req.params;
  const resultado = await listarNotas(id);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado.notas : { erro: resultado.mensagem });
});

// POST /api/alunos/:id/presencas - Registrar presença/falta
app.post('/api/alunos/:id/presencas', async (req, res) => {
  const { id } = req.params;
  const { dataAula, presente } = req.body;

  if (!dataAula || presente === undefined) {
    return res.status(400).json({ erro: 'Data da aula e status de presença são obrigatórios.' });
  }

  const resultado = await registrarPresenca(id, dataAula, presente);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado : { erro: resultado.mensagem });
});

// GET /api/alunos/:id/presencas - Listar histórico de chamadas do aluno
app.get('/api/alunos/:id/presencas', async (req, res) => {
  const { id } = req.params;
  const resultado = await listarChamadas(id);
  res.status(resultado.codigoHttp).json(resultado.sucesso ? resultado.chamadas : { erro: resultado.mensagem });
});

// ─── Inicialização do servidor ────────────────────────────────────────────────
app.listen(PORTA, () => {
  console.log(`\n[Server] ✅ Academic Atelier Backend rodando na porta ${PORTA}`);
  console.log(`[Server] 🔗 http://localhost:${PORTA}`);
  console.log(`[Server] 📋 Dash: http://localhost:${PORTA}/api/turmas\n`);
});