# Diretriz: Autenticação de Usuários (SOP)

## Objetivo
Autenticar usuários do sistema Academic Atelier utilizando e-mail e senha armazenados no banco de dados MySQL.

## Ferramentas e Scripts Obrigatórios
- **Conexão ao banco**: SEMPRE usar `execution/db.js` (pool de conexões). NUNCA criar conexões manuais fora deste script.
- **Verificação de usuário**: SEMPRE usar `execution/authService.js`. NUNCA escrever SQL diretamente nas rotas.

## Estrutura da Tabela MySQL Esperada
```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('admin', 'professor', 'aluno') DEFAULT 'aluno',
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Regras de Negócio
1. A senha NUNCA deve ser armazenada em texto puro — somente o hash gerado pelo `bcryptjs`.
2. Um token JWT deve ser retornado em caso de sucesso. O frontend deve armazená-lo no `localStorage`.
3. Usuários com `ativo = 0` devem receber erro 403 (conta desativada).
4. O token JWT expira em 8 horas.

## Códigos de Resposta HTTP Esperados
| Situação | Código | Mensagem |
|---|---|---|
| Login bem-sucedido | 200 | `{ token, usuario }` |
| E-mail/senha inválidos | 401 | `{ erro: "Credenciais inválidas" }` |
| Conta desativada | 403 | `{ erro: "Conta desativada" }` |
| Erro interno/banco | 500 | `{ erro: "Erro interno do servidor" }` |

## Atualizações e Melhorias
- Qualquer alteração nesta diretriz deve ser documentada com data e justificativa.
- Novos campos na tabela `usuarios` devem ser refletidos em `authService.js` e nesta diretriz.

## Log de Alterações
| Data | Alteração | Responsável |
|---|---|---|
| 2026-04-08 | Criação inicial da diretriz | Sistema |
