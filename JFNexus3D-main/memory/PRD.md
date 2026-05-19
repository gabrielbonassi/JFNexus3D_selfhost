# JFNexus3D - 3D Printing Projects Repository

## Problem Statement
Site onde devs (admins) postam projetos de impressão 3D e clientes (users) visualizam, buscam, favoritam e baixam arquivos. Layout estilo Instagram search com tema dark roxo meia noite e azul.

## User Personas
- **Admin (Dev)**: Faz login com email/senha, posta e gerencia projetos
- **User (Cliente)**: Faz login com Google OAuth, navega/favorita/baixa
- **Guest (Convidado)**: Apenas visualiza projetos sem login

## Core Requirements
- Sistema de roles (admin/user/guest)
- Autenticação dupla: JWT (email/senha) + Google OAuth
- CRUD de projetos (apenas admin)
- Upload de arquivos STL/OBJ/3MF (apenas admin)
- Busca por palavras-chave
- Sistema de favoritos
- Página de pagamentos (Stripe)
- Tema dark roxo meia noite + azul

## Implementation Status (Feb 2026)
### Completed
- Backend FastAPI com MongoDB
- Auth: JWT para admin (email/senha) + Emergent Google OAuth
- Seed automático de 2 admins (admin1@jfnexus3d.com, admin2@jfnexus3d.com)
- CRUD de projetos protegido por role
- Upload de arquivos via Object Storage (STL/OBJ/3MF)
- Sistema de favoritos
- Integração Stripe para pagamentos
- Landing page com tema dark
- Página /login com 4 opções (Google, Email, GitHub, Convidado)
- Dashboard com grid Instagram-style
- Página de detalhes com download
- Página de favoritos
- Página de pagamentos com 3 planos
- Branding "JFNexus3D" em todo o app

### Pending / Backlog
- [P1] GitHub OAuth real (atualmente apenas placeholder)
- [P1] Página de gerenciamento de projetos para admins (editar/deletar)
- [P2] Sistema de comentários nos projetos
- [P2] Categorias e filtros avançados
- [P2] Visualizador 3D dos arquivos STL no browser
- [P2] Sistema de notificações
- [P2] Histórico de downloads do usuário
- [P2] Dashboard de analytics para admins

## Architecture
- Backend: FastAPI + MongoDB + Motor (async)
- Frontend: React + Tailwind + Shadcn UI
- Auth: JWT (admin) + Emergent Google OAuth (user)
- Storage: Emergent Object Storage
- Payments: Stripe Checkout
