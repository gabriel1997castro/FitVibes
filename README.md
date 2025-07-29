# FitVibes - Social Fitness App

FitVibes é um aplicativo social e gamificado para incentivar grupos de pessoas a manterem uma rotina de exercícios físicos através de pressão social positiva, desafios e recompensas simbólicas.

## Images
### IMPORTANT -> IT IS STILL IN PROGRESS. I STARTED JUN 17
<div>
    <img height="600" alt="IMG_9868" src="https://github.com/user-attachments/assets/dccd99d2-511e-4927-b9af-acf4e3601c14" />
    <img height="600" alt="IMG_9869" src="https://github.com/user-attachments/assets/d016662a-91a7-4029-b9ce-51d74095d890" />
    <img height="600" alt="IMG_9870" src="https://github.com/user-attachments/assets/f3d54a87-86ae-42b9-8c00-a79684e1ae39" />
    <img height="600" alt="IMG_9871" src="https://github.com/user-attachments/assets/ab28d963-64db-4e0b-a0d6-8725568ee4ff" />
    <img height="600" alt="IMG_9872" src="https://github.com/user-attachments/assets/3afd2804-9758-4214-9424-46e9182e379e" />
    <img height="600" alt="IMG_9873" src="https://github.com/user-attachments/assets/e0a65363-9bb4-4fd9-ba90-f2ccba3b10da" />
    <img height="600" alt="IMG_9874" src="https://github.com/user-attachments/assets/462c18a8-66d1-41f0-bc9b-408361e03c09" />
    <img height="600" alt="IMG_9875" src="https://github.com/user-attachments/assets/075459a5-f0d0-49c1-b46a-2fbbb7063c2d" />
    <img height="600" alt="IMG_9883" src="https://github.com/user-attachments/assets/e618d180-0170-4b3b-afb8-3242e45a0500" />
    <img height="600" alt="IMG_9884" src="https://github.com/user-attachments/assets/4e94946f-1034-4be2-b022-3d5f0a731f62" />
    <img height="600" alt="IMG_9885" src="https://github.com/user-attachments/assets/200ccc46-257b-47f0-8f32-60cbc037a15e" />

</div>


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

### Google SignIn
In your project's top-level build.gradle file, ensure that Google's Maven repository is included:


```
allprojects {
    repositories {
        google()

        // If you're using a version of Gradle lower than 4.1, you must instead use:
        // maven {
        //     url 'https://maven.google.com'
        // }
    }
}
```
Then, in your app-level build.gradle file, declare Google Play services as a dependency:

```
apply plugin: 'com.android.application'
    ...

    dependencies {
        implementation 'com.google.android.gms:play-services-auth:21.3.0'
    }
```
ref: https://developer.android.com/identity/legacy/gsi

Put also the line with client id in android/app/src/main/res/values/strings.xml
```
<string name="server_client_id">844805817982-92ja2fuknng36v134rfekt0b81qsojf9.apps.googleusercontent.com</string>
```

Add also a web client.

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
- [Brief Detalhado para Design](docs/Design-Brief-Detailed.md)
- [Brief Executivo para Design](docs/Design-Brief-Executive.md)

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

## 🚦 Como funciona o sistema de penalidades e saldos

- **Ciclos de pagamento**: Cada grupo define se o ciclo é semanal (fecha toda segunda) ou mensal (fecha todo dia 1).
- **Penalidades**: Ao perder uma votação (atividade inválida ou desculpa rejeitada), o usuário "deve" um valor simbólico, dividido entre os demais membros ativos do grupo.
- **Consolidação de saldos**: O backend consolida automaticamente os saldos por ciclo e por par de usuários, sem intervenção do frontend.
- **Histórico detalhado**: Cada penalidade é registrada com grupo, data, devedor, credor, motivo e valor.
- **Pagamento simbólico**: Não há transação real; o app permite marcar como pago manualmente.
- **Notificações**: Push ao fechar ciclo, informando os saldos.

## 🗄️ Modelagem de Dados

### Tabela: `payment_history`
| Campo         | Tipo     | Descrição                                 |
|---------------|----------|-------------------------------------------|
| id            | UUID     | Identificador único                       |
| group_id      | UUID     | Grupo onde ocorreu                        |
| post_id       | UUID     | Post/atividade relacionada                |
| from_user_id  | UUID     | Devedor                                   |
| to_user_id    | UUID     | Credor                                    |
| reason        | TEXT     | Motivo da penalidade                      |
| amount        | NUMERIC  | Valor atribuído                           |
| created_at    | TIMESTAMP| Data/hora da penalidade                   |

### Tabela: `balances`/`payments`
| Campo         | Tipo     | Descrição                                 |
|---------------|----------|-------------------------------------------|
| id            | UUID     | Identificador único                       |
| group_id      | UUID     | Grupo                                     |
| from_user_id  | UUID     | Devedor                                   |
| to_user_id    | UUID     | Credor                                    |
| amount        | NUMERIC  | Valor total do ciclo                      |
| cycle_start   | DATE     | Início do ciclo                           |
| cycle_end     | DATE     | Fim do ciclo                              |
| status        | TEXT     | 'pending' ou 'paid'                       |
| created_at    | TIMESTAMP| Data/hora de criação                      |

## 🖥️ UX

### Aba: Saldos
- Header com intervalo do ciclo atual (ex: "Ciclo: 1–7 de julho")
- Lista de dívidas por par (quem deve para quem, valor)
- Botão "Marcar como pago" para cada relação
- Status visual: 💰 (devedor), ⏳ (aguardando), ✔️ (pago)
- Saldos quitados recentemente aparecem em seção separada

### Aba: Histórico
- Lista detalhada de penalidades (data, grupo, devedor, credor, motivo, valor)
- Filtro por grupo ou ciclo
- Contador de valor total acumulado em penalidades

## 🔒 Segurança
- Permissões RLS garantem que apenas usuários autenticados consultem seus próprios saldos e histórico.
- Toda consolidação de saldo é feita exclusivamente pelo backend.

## 📲 Notificações
- Push ao fechar ciclo, informando os saldos e incentivando a regularização.

---
Para detalhes técnicos completos, consulte `docs/Context.MD` e `docs/DevelopmentPlan.md`.
