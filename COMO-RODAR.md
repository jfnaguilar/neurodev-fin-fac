# NeuroDev Financeiro SRV — Como Rodar

## Opção A: Desenvolvimento Local (recomendado para testar)

### 1. Subir PostgreSQL e Redis via Docker
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Configurar variáveis de ambiente
O arquivo `.env.local` já está pré-configurado para desenvolvimento:
```
DATABASE_URL="postgresql://neurodev:neurodev2026@localhost:5432/neurodev_fin?schema=public"
NEXTAUTH_SECRET="neurodev-fin-secret-key-2026-dev-mode-ok"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Instalar dependências (se ainda não fez)
```bash
npm install --legacy-peer-deps
```

### 4. Gerar cliente Prisma e criar o banco
```bash
npm run db:generate
npm run db:push
```

### 5. Rodar o seed (dados iniciais)
```bash
npm run db:seed
```

### 6. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

**Login de desenvolvimento:**
- E-mail: `admin@neurodev.com`
- Senha: `admin123`

---

## Opção B: Docker Completo (produção / testes integrados)

### 1. Build e subir todos os serviços
```bash
docker-compose up -d --build
```

Isso irá:
- Subir PostgreSQL (porta 5432)
- Subir Redis (porta 6379)
- Fazer build da aplicação Next.js
- Rodar migrations e seed automaticamente
- Subir a aplicação (porta 3000)

### 2. Verificar status
```bash
docker-compose ps
docker-compose logs app
docker-compose logs migrate
```

### 3. Parar tudo
```bash
docker-compose down
# Para remover volumes também:
docker-compose down -v
```

---

## Usuários de Teste

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@neurodev.com | admin123 | Administrador (acesso total) |
| financeiro@neurodev.com | fin123 | Financeiro |
| aprovador@neurodev.com | apr123 | Aprovador de alçada |

---

## Comandos Úteis

```bash
# Visualizar banco via Prisma Studio
npm run db:studio

# Resetar banco e rodar seed novamente
npm run db:reset

# Verificar TypeScript
npx tsc --noEmit

# Build de produção local
npm run build && npm start
```

---

## Portas

| Serviço | Porta |
|---------|-------|
| Next.js App | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Prisma Studio | 5555 |
