# Como rodar o App de Gestão Financeira

## Pré-requisitos
- Node.js 18+
- Docker + Docker Compose
- Chave da API Anthropic (Claude): https://console.anthropic.com

---

## 1. Subir o banco de dados e Evolution API

```bash
docker-compose up -d
```

Isso sobe:
- PostgreSQL na porta 5432
- Evolution API na porta 8080

---

## 2. Configurar o backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env` com suas chaves:
- `ANTHROPIC_API_KEY` → sua chave do Claude
- `EVOLUTION_API_KEY` → mesma chave do docker-compose (`sua-chave-aqui`)
- `EVOLUTION_INSTANCE` → nome da instância (ex: `financa`)

Instale as dependências e suba o banco:

```bash
npm install
npm run db:migrate
npm run db:seed   # cria usuário admin e categorias padrão
npm run dev
```

Backend rodando em: http://localhost:3333

---

## 3. Configurar o frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend rodando em: http://localhost:5173

Login inicial:
- Email: `admin@financa.com`
- Senha: `admin123`

---

## 4. Configurar o WhatsApp (Evolution API)

Acesse: http://localhost:8080/manager

1. Crie uma instância com o nome `financa`
2. Conecte via QR Code com seu WhatsApp
3. Configure o webhook para apontar para:
   `http://SEU_IP:3333/webhook/evolution`
4. Ative o evento: `MESSAGES_UPSERT`

Pronto! Agora o WhatsApp já processa mensagens financeiras com IA.

---

## Comandos do WhatsApp

| Mensagem | O que faz |
|---|---|
| "Gastei 50 no mercado" | Registra despesa |
| "Recebi 3000 de salário" | Registra receita |
| "Meu saldo" | Mostra saldo do mês |
| "Resumo do mês" | Relatório com IA |
| "Ver histórico" | Últimas 5 transações |
| "ajuda" | Lista comandos |

---

## Estrutura do projeto

```
App Financa/
├── backend/          # API Node.js + Fastify + Prisma
├── frontend/         # React + Tailwind + Recharts
└── docker-compose.yml
```
