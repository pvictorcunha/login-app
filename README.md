# Tela de Login - Node.js + TypeScript

Aplicação de login completa construída com Node.js, TypeScript e Express.

## Funcionalidades

- Tela de login responsiva (HTML/CSS/JS)
- Cadastro de novos usuários
- Autenticação com hash de senha (bcrypt)
- Sessões com express-session
- Rota protegida (dashboard)
- Logout
- Usuário padrão: `admin` / `admin123`

## Estrutura

```
login-app/
├── src/
│   ├── server.ts
│   ├── routes/auth.ts
│   ├── middleware/auth.ts
│   └── types/
├── public/
│   ├── css/style.css
│   └── js/login.js
├── views/
│   ├── login.html
│   └── dashboard.html
├── package.json
└── tsconfig.json
```

## Como rodar

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Rodar em produção
npm start
```

Acesse: http://localhost:3000

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/login | Autentica usuário |
| POST | /api/register | Cria nova conta |
| POST | /api/logout | Encerra sessão |
| GET | /api/me | Retorna usuário logado |

## Observações

- Usuários são armazenados em memória (apenas para demonstração). Em produção, utilize um banco de dados (PostgreSQL, MongoDB, etc.).
- Altere `SESSION_SECRET` via variável de ambiente em produção.
- Ative `secure: true` no cookie em ambiente HTTPS.
