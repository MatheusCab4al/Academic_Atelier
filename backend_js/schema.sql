-- schema.sql
-- Script para criação do banco de dados e tabela de usuários (professores)

-- 1. Cria o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS academic_atelier;
USE academic_atelier;

-- 2. Cria a tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('professor', 'admin') DEFAULT 'professor',
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserção de um usuário teste (senha original: 123456)
-- O hash abaixo foi gerado pelo bcryptjs.
INSERT INTO usuarios (nome, email, senha_hash, perfil) 
VALUES ('Professor Teste', 'teste@teste.com', '$2a$10$X7vW.tYpA9vJ/pXQ/hU/U.6Z5M7.z0/u4M.wS0/z0/u4M.wS0/z0/', 'professor')
ON DUPLICATE KEY UPDATE email = email;

-- 4. Cria a tabela de turmas
-- Cada turma pertence a um professor (usuarios.id)
CREATE TABLE IF NOT EXISTS turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    serie VARCHAR(50) NOT NULL,
    turno VARCHAR(20) DEFAULT 'Matutino',
    ano_letivo VARCHAR(10) DEFAULT '2024',
    ultimo_conteudo VARCHAR(255) DEFAULT '',
    proxima_aula VARCHAR(255) DEFAULT '',
    pendencias INT DEFAULT 0,
    status ENUM('verde', 'amarelo', 'vermelho') DEFAULT 'verde',
    professor_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Cria a tabela de alunos
-- Cada aluno pertence a uma turma específica
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    turma_id INT NOT NULL,
    media_atual DECIMAL(4,2) DEFAULT 0.00,
    status ENUM('verde', 'amarelo', 'vermelho') DEFAULT 'verde',
    frequencia INT DEFAULT 100,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE
);

-- 6. Cria a tabela de notas (histórico de avaliações)
CREATE TABLE IF NOT EXISTS notas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    valor DECIMAL(4,2) NOT NULL,
    data_lancamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

-- 7. Cria a tabela de aulas_chamada (histórico de presença)
CREATE TABLE IF NOT EXISTS aulas_chamada (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    data_aula DATE NOT NULL,
    presente TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

-- 8. Inserção de dados exemplo para testes
INSERT INTO turmas (nome, serie, professor_id) VALUES ('9º Ano C', 'Fundamental II', 1) ON DUPLICATE KEY UPDATE nome = nome;
INSERT INTO alunos (nome, email, turma_id, media_atual, status, frequencia) 
VALUES ('Ana Maria Oliveira', 'ana@email.com', 1, 9.5, 'verde', 98) ON DUPLICATE KEY UPDATE nome = nome;
