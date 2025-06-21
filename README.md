# FitVibes - Social Fitness App

FitVibes é um aplicativo social e gamificado para incentivar grupos de pessoas a manterem uma rotina de exercícios físicos através de pressão social positiva, desafios e recompensas simbólicas.

## 🎯 Funcionalidades Principais

- **Grupos de Exercício**: Crie e participe de grupos com amigos, família ou colegas
- **Sistema de Postagens**: Registre suas atividades ou desculpas diariamente
- **Votação Social**: Membros votam na validade das atividades uns dos outros
- **Sistema de Saldos**: Controle simbólico de penalidades por "migués"
- **Conquistas e Streaks**: Sistema de gamificação com streaks globais e por grupo
- **Notificações**: Sistema completo de notificações para conquistas e saldos
- **Perfil Detalhado**: Estatísticas pessoais e histórico de atividades

## 🏗️ Arquitetura Técnica

### Frontend
- **Framework**: React Native com Expo SDK 53
- **Navegação**: Expo Router com file-based routing
- **Estado**: Zustand para gerenciamento de estado
- **UI**: Componentes customizados com MaterialCommunityIcons
- **Tipagem**: TypeScript completo

### Backend
- **Database**: PostgreSQL com Supabase
- **Autenticação**: Supabase Auth com provedores sociais
- **Tempo Real**: Supabase real-time subscriptions
- **Storage**: Supabase Storage para mídia
- **Funções**: PostgreSQL functions para operações complexas

## 🔔 Sistema de Notificações

O sistema de notificações está **totalmente funcional** e inclui:

- ✅ **Notificações automáticas** para achievements (streaks, variedade, social)
- ✅ **Notificações de saldo** (criação, pagamentos)
- ✅ **Interface dedicada** para visualização
- ✅ **Marcação como lida** e navegação contextual
- ✅ **Políticas RLS** corretas para segurança

**Documentação completa**: [docs/Notifications-System.md](docs/Notifications-System.md)

## 🚀 Como Usar

### Pré-requisitos
- Node.js 18+
- Expo CLI
- Conta Supabase

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd FitVibes

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Execute as migrações do banco
npx supabase db push

# Inicie o app
npx expo start
```

### Desenvolvimento
```bash
# Desenvolvimento local
npx expo start

# Build para produção
npx eas build

# Deploy
npx eas deploy
```

## 📁 Estrutura do Projeto

```
fitvibes/
├── app/                      # App entry point e configuração
│   ├── (tabs)/              # Navegação por abas
│   ├── groups/              # Telas relacionadas a grupos
│   ├── services/            # API e serviços externos
│   │   └── supabase.ts      # Cliente Supabase (único)
│   └── notifications.tsx    # Tela de notificações
├── supabase/                # Database e backend
│   ├── migrations/          # Migrações do banco
│   └── functions/           # Edge functions
├── docs/                    # Documentação
└── types/                   # Definições TypeScript
```

## 🔧 Problemas Resolvidos

### Sistema de Notificações
- ✅ **Duplicação de Supabase Client**: Unificado uso de uma única instância
- ✅ **Políticas RLS**: Corrigidas para role `authenticated`
- ✅ **Triggers de Notificação**: Implementados para achievements automáticos
- ✅ **Autenticação Consistente**: Garantido contexto de autenticação correto

## 📊 Status do Projeto

- **Fase 1-8**: ✅ Completas (MVP funcional)
- **Fase 9**: 🔄 Em progresso (Testes e otimização)
- **Fase 10-11**: 📋 Planejadas (Deploy e lançamento)

## 📚 Documentação

- [Contexto e Arquitetura](docs/Context.MD)
- [Plano de Desenvolvimento](docs/DevelopmentPlan.md)
- [Sistema de Notificações](docs/Notifications-System.md)
- [Design e UX](docs/Design-Manus.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para motivar pessoas a se exercitarem juntas!**

# FitVibes Project Structure

This project follows the folder structure and conventions described in `docs/Context.MD` and `docs/DevelopmentPlan.md`, using `src/` as the main source directory for all application code, features, and components.

**State management is handled with [Zustand](https://zustand-demo.pmnd.rs/), not Redux. The `store.ts` and `store/` folder are for Zustand stores.**

# Expo Router Example

Use [`expo-router`](https://docs.expo.dev/router/introduction/) to build native navigation using files in the `app/` directory.

## 🚀 How to use

```sh
npx create-expo-app -e with-router
```

## Deploy

Deploy on all platforms with Expo Application Services (EAS).

- Deploy the website: `npx eas-cli deploy` — [Learn more](https://docs.expo.dev/eas/hosting/get-started/)
- Deploy on iOS and Android using: `npx eas-cli build` — [Learn more](https://expo.dev/eas)

## 📝 Notes

- [Expo Router: Docs](https://docs.expo.dev/router/introduction/)
