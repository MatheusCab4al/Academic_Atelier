// execution/authService.js
// Lógica de autenticação e gerenciamento de usuários.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

/**
 * Verifica as credenciais do usuário diretamente no MySQL.
 */
async function verificarLogin(email, senha) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return { sucesso: false, codigoHttp: 401, mensagem: 'Credenciais inválidas' };
    }

    const usuario = rows[0];

    if (!usuario.ativo) {
      return { sucesso: false, codigoHttp: 403, mensagem: 'Conta desativada.' };
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return { sucesso: false, codigoHttp: 401, mensagem: 'Credenciais inválidas' };
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET || 'chave_padrao_trocar_no_env',
      { expiresIn: '8h' }
    );

    return {
      sucesso: true,
      codigoHttp: 200,
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    };
  } catch (erro) {
    console.error('[authService] ❌ Erro:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro interno do servidor.' };
  }
}

/**
 * Registra um novo professor/usuário no banco de dados MySQL.
 */
async function registrarUsuario(nome, email, senha) {
  try {
    // 1. Verifica se o e-mail já existe
    const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente.length > 0) {
      return { sucesso: false, codigoHttp: 400, mensagem: 'Este e-mail já está cadastrado.' };
    }

    // 2. Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 3. Insere no banco
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, 'professor']
    );

    return {
      sucesso: true,
      codigoHttp: 201,
      mensagem: 'Conta criada com sucesso!',
      usuarioId: resultado.insertId
    };
  } catch (erro) {
    console.error('[authService] ❌ Erro no cadastro:', erro.message);
    return { sucesso: false, codigoHttp: 500, mensagem: 'Erro interno ao criar conta.' };
  }
}

module.exports = { verificarLogin, registrarUsuario };
