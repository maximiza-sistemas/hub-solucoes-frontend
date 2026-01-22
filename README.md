# Hub Soluções - Frontend

Interface web para o Hub de Gestão de Soluções Municipais.

## 🚀 Tecnologias

- React 19
- TypeScript
- Vite
- React Router DOM
- Zustand (gerenciamento de estado)
- Bootstrap 5
- Recharts (gráficos)

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

A API do backend deve estar rodando em `http://localhost:3001`.

Para alterar a URL da API, edite o arquivo `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3001/api'
```

## ▶️ Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura

```
src/
├── components/    # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
│   ├── admin/     # Páginas do administrador
│   ├── municipio/ # Páginas do município
│   └── landing/   # Landing page
├── services/      # Serviços de API
├── stores/        # Estado global (Zustand)
├── types/         # Tipos TypeScript
└── lib/           # Utilitários
```

## 🔗 Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Login |
| `/admin/dashboard` | Dashboard admin |
| `/admin/municipios` | Gestão de municípios |
| `/admin/usuarios` | Gestão de usuários |
| `/admin/solucoes` | Gestão de soluções |
| `/municipio/:id/dashboard` | Dashboard do município |
