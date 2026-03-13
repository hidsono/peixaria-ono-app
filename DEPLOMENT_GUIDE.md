# Guia de Implantação - Sistema Peixaria Ono

Este guia contém os passos para colocar o sistema rodando no seu PC Servidor para acesso externo via celular.

## 1. Preparação dos Arquivos
Copie os seguintes arquivos/pastas para o servidor:
- `src/`
- `public/`
- `prisma/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `ecosystem.config.js`
- `.env`

## 2. Instalação no Servidor
No terminal do servidor, execute:
```bash
# 1. Instalar dependências
npm install

# 2. Configurar Banco de Dados
npx prisma db push

# 3. Gerar Build de Produção
npm run build

# 4. Iniciar com PM2 (Para rodar 24h)
pm2 start ecosystem.config.js
```

## 3. Acesso Externo (Cloudflare Tunnel)
Se você já usa Cloudflare Tunnel no seu servidor, basta adicionar uma nova rota no painel da Cloudflare (Zero Trust):
- **Service Type**: HTTP
- **URL**: `http://localhost:3005`
- **Hostname**: `peixaria.seudominio.com` (ou o nome que preferir)

## 4. Acesso pelo Celular
Basta abrir o navegador no celular e digitar o endereço que você configurou no Cloudflare. O sistema já está todo otimizado para a tela do smartphone!
