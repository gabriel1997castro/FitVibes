## 🎨 **Descrição Completa para o Design do App — FitVibes**

---

### 🏋️‍♂️ **Nome do App:**

**FitVibes**

---

### 🌟 **Objetivo do App:**

FitVibes é um aplicativo social e gamificado para incentivar grupos de pessoas (amigos, família, colegas) a manterem uma rotina de exercícios físicos. O app combina humor, pressão social positiva, desafios e recompensas simbólicas.

---

### 🧑‍💻 **Personas (público-alvo):**

* Jovens adultos
* Pessoas que querem incentivo para se exercitar
* Grupos de amigos, times, famílias e empresas
* Público que gosta de apps de desafio, gamificação, hábitos e saúde

---

### 🚩 **Fluxo Principal do Usuário:**

---

### **1. Tela de Boas-vindas / Login**

* Logo e nome: **FitVibes**
* Slogan: **"Treine com a galera, entre na vibe fit!"**
* Opções de login:

  * Google
  * Apple
  * E-mail
* Visual colorido, com fundo vibrante (exemplo: laranja ou roxo)

---

### **2. Tela de Lista de Grupos (Home)**

* Lista dos grupos do usuário (cards com nome, número de membros e alerta de pendências)
* Botões:

  * **Criar novo grupo**
  * **Entrar com convite**
* Notificação de pendência: Exemplo: **"Você ainda não postou hoje!"**
* Destaque visual para grupos com votação pendente ou saldo pendente
* Acesso ao saldo geral

---

### **3. Tela de Criação de Grupo**

* Campos para:

  * Nome do grupo
  * Cor ou tema do grupo (opcional)
  * Ícone ou emoji do grupo
  * Valor da penalidade simbólica por migué (ex: R\$1,00 por voto inválido)
  * Frequência de fechamento de ciclo de pagamento: semanal ou mensal
* Botão **"Criar Grupo"**
* Confirmação de sucesso

---

### **4. Tela de Configuração do Grupo**

* Opções para o administrador:

  * Editar nome do grupo
  * Alterar valor das penalidades
  * Gerenciar membros (expulsar ou convidar)
  * Alterar frequência de ciclo de pagamento
  * Link de convite para compartilhar com novos membros
* Botão: **"Salvar configurações"**

---

### **5. Tela do Grupo (Detalhes)**

* Nome e imagem do grupo
* Lista de membros com status diário:

  * ✔️ Treinou
  * ❌ Deu desculpa
  * ⏰ Não postou (gera migué automático)
* Botão: **"Postar atividade ou desculpa"**
* Saldo financeiro (quanto cada um deve)
* Ranking semanal:

  * Mais esforçado
  * Rei do Migué
  * Melhor desculpa
* Histórico de postagens recentes
* Botão: **"Ver ranking completo"**

---

### **6. Tela de Postagem**

* Pergunta: **"Você treinou hoje?"**
* Se SIM:

  * Tipo de exercício (dropdown): Caminhada, Corrida, Natação, etc.
  * Duração (campo numérico ou slider)
  * Botão: **"Enviar"**
* Se NÃO:

  * Motivo da desculpa (escolha entre categorias pré-definidas):
    Ex: Atestado médico, Viagem, Evento importante, Cansaço, etc.
  * Botão: **"Enviar"**
* Caso o usuário não poste até o final do dia, o app posta automaticamente:
  **"Hoje não treinei porque fui muito migué!"**

---

### **7. Tela de Votação**

* Lista de posts de todos os membros no dia
* Para cada membro:

  * Card com o exercício ou desculpa
  * Botões: **"Válido"** ou **"Migué"**
  * Campo para escolher um comentário pré-definido (ex: "Desculpa esfarrapada", "Boa, continue assim!", "Bora amanhã!")
* Exibição de votos pendentes
* Push notification se o usuário esquecer de votar

---

### **8. Tela de Ranking**

* Pontuação geral acumulada
* Quantidade de dias seguidos sem migué
* Ranking dos últimos 7 dias
* Títulos simbólicos:

  * 🥇 Mais Esforçado
  * 🤡 Rei do Migué
  * 🧠 Melhor Desculpa
* Histórico detalhado por dia

---

### **9. Tela de Saldos/Pagamentos**

* Lista de quanto cada um deve a quem
* Saldo por ciclo (semanal ou mensal)
* Botão: **"Marcar pagamento como feito"** (controle apenas, sem transação real)
* Notificação de fechamento de ciclo

---

### **10. Telas Complementares**

* **Notificações push**

  * Lembretes de postar
  * Lembretes de votar
  * Fechamento de ciclo
  * Novos membros no grupo
* **Perfil do Usuário** (futuro):

  * Histórico pessoal
  * Foto/avatar
  * Estatísticas próprias

---

## 📚 Contexto Técnico — FitVibes

Este arquivo reúne o esquema de banco de dados e a estrutura de pastas recomendada para o app FitVibes, com base nos requisitos de gamificação, grupos, postagens, votações, rankings e saldos.

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    notification_token TEXT,
    points INTEGER DEFAULT 0,
    global_streak_days INTEGER DEFAULT 0,
    global_streak_record INTEGER DEFAULT 0
);
```

### Groups Table
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme_color VARCHAR(7),
    emoji VARCHAR(10),
    penalty_amount DECIMAL(10,2) DEFAULT 1.00,
    payment_cycle VARCHAR(10) CHECK (payment_cycle IN ('weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);
```

### Group Members Table
```sql
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    UNIQUE(group_id, user_id)
);
```

### Activities Table
```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) CHECK (type IN ('exercise', 'excuse', 'auto_excuse')),
    exercise_type VARCHAR(50),
    duration_minutes INTEGER,
    excuse_category VARCHAR(50),
    excuse_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'invalid')),
    UNIQUE(group_id, user_id, date)
);
```

### Votes Table
```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id),
    voter_id UUID REFERENCES users(id),
    is_valid BOOLEAN NOT NULL,
    comment_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, voter_id)
);
```

### Balances Table
```sql
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id),
    user_id UUID REFERENCES users(id),
    owed_to_user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Group Invites Table
```sql
CREATE TABLE group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id),
    invited_by UUID REFERENCES users(id),
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES users(id)
);
```

### Achievements Table
```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    group_id UUID REFERENCES groups(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    group_id UUID REFERENCES groups(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Database Relationships

- **One-to-Many:**
  - User → Activities (one user can have many activities)
  - Group → Activities (one group can have many activities)
  - Group → Group Members (one group can have many members)
  - Activity → Votes (one activity can have many votes)
  - User → Notifications (one user can have many notifications)
- **Many-to-Many:**
  - Users ↔ Groups (through group_members)
  - Users ↔ Activities (through votes)
- **One-to-One:**
  - Activity → Balance (each activity may result in one balance entry)
  - User → Daily Activity (one user can have one activity per day per group)

---

## 🔑 Indexes and Performance

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
-- Group member lookups
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
-- Activity lookups
CREATE INDEX idx_activities_group_id_date ON activities(group_id, date);
CREATE INDEX idx_activities_user_id_date ON activities(user_id, date);
-- Vote lookups
CREATE INDEX idx_votes_activity_id ON votes(activity_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
-- Balance lookups
CREATE INDEX idx_balances_group_id_cycle ON balances(group_id, cycle_start_date, cycle_end_date);
CREATE INDEX idx_balances_user_id ON balances(user_id);
-- Achievement lookups
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_group_id ON achievements(group_id);
-- Notification lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

---

## 🏆 Achievements System

### Streak Types
1. **Global Streak**: Tracks consecutive days where user posted in at least one group
   - Stored in `users.global_streak_days`
   - Record stored in `users.global_streak_record`
   - Only increments once per day, regardless of how many groups user posted in
   - Triggered by `update_global_streak_on_valid_activity()` function

2. **Group Streak**: Tracks consecutive days of valid activities in a specific group
   - Stored in `group_members.streak_days`
   - Each group has its own streak counter
   - Triggered by `update_streak_days_on_valid_activity()` function

### Achievement Types
- **Global Streak Achievements**: Triggered when `global_streak_days` reaches thresholds (1, 7, 14, 30, 60, 100)
- **Group Streak Achievements**: Triggered when `group_members.streak_days` reaches thresholds (1, 7, 14, 30, 60, 100)
- **Variety Achievements**: Triggered when user tries different exercise types (1, 5, 10 types)
- **Social Achievements**: Triggered by voting participation, group leadership, first activity, etc.

### Multi-Group Posting
- Users can select multiple groups when posting an activity
- Backend creates separate activity records for each selected group using `create_activity_for_multiple_groups()` function
- Each group votes independently on their respective activity
- Global streak only increments once per day if user posted in at least one group

---

## 🏗️ Current Project Architecture

### Frontend Stack
- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router with file-based routing
- **State Management**: Zustand for global state
- **UI Components**: Custom components with MaterialCommunityIcons
- **Styling**: StyleSheet with consistent design system
- **TypeScript**: Full type safety throughout the application

### Backend Stack
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth with social providers (Google, Apple)
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage for media files
- **Functions**: PostgreSQL functions for complex operations
- **Row Level Security**: Comprehensive RLS policies

### Key Technical Features Implemented

#### 1. Multi-Group Activity Posting
```sql
-- Function to post activity to multiple groups
CREATE OR REPLACE FUNCTION public.create_activity_for_multiple_groups(
    p_user_id UUID,
    p_groups UUID[],
    p_type VARCHAR(20),
    p_exercise_type VARCHAR(50) DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_excuse_category VARCHAR(50) DEFAULT NULL,
    p_excuse_text TEXT DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
```

#### 2. Dual Streak System
```sql
-- Global streak trigger
CREATE TRIGGER trigger_update_global_streak
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.update_global_streak_on_valid_activity();

-- Group streak trigger
CREATE TRIGGER trigger_update_streak_days
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_days_on_valid_activity();
```

#### 3. User Profile Statistics
```sql
-- Function to get comprehensive user stats
CREATE OR REPLACE FUNCTION public.get_user_profile_stats(p_user_id UUID)
RETURNS TABLE (
    global_streak_days INTEGER,
    global_streak_record INTEGER,
    total_groups INTEGER,
    total_points INTEGER,
    total_activities INTEGER,
    exercise_distribution JSONB
)
```

#### 4. Achievement System
- Automatic achievement detection and awarding
- Visual differentiation between global and group achievements
- Real-time achievement notifications
- Achievement progress tracking

---

## 📁 Current Folder Structure

```
fitvibes/
├── app/                      # App entry point and configuration
│   ├── (tabs)/              # Tab-based navigation screens
│   │   ├── groups.tsx       # Groups list screen
│   │   ├── activities.tsx   # Activities feed (placeholder)
│   │   ├── ranking.tsx      # Rankings screen (placeholder)
│   │   ├── notifications.tsx # Notifications screen
│   │   ├── profile.tsx      # User profile with achievements
│   │   └── _layout.tsx      # Tab navigation layout
│   ├── groups/              # Group-related screens
│   │   ├── [id]/           # Dynamic group routes
│   │   │   ├── post.tsx    # Activity posting screen
│   │   │   ├── vote.tsx    # Voting screen
│   │   │   ├── balance.tsx # Balance/payments screen
│   │   │   └── settings.tsx # Group settings screen
│   │   ├── [id].tsx        # Group details screen
│   │   └── create.tsx      # Group creation screen
│   ├── screens/            # Reusable screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── GroupListScreen.tsx
│   │   ├── CreateGroupScreen.tsx
│   │   └── GroupSettingsScreen.tsx
│   ├── features/           # Feature-specific logic
│   │   └── achievements/   # Achievement system
│   │       └── index.ts    # Achievement logic
│   ├── services/           # API and external services
│   │   ├── supabase.ts     # Supabase client
│   │   └── achievementsService.ts # Achievement API
│   ├── types/              # TypeScript type definitions
│   │   └── achievements.ts # Achievement types
│   ├── lib/                # Utility functions
│   ├── contexts/           # React contexts
│   ├── _layout.tsx         # Root layout with auth
│   ├── index.tsx           # Entry point
│   ├── home.tsx            # Home screen
│   ├── login.tsx           # Login route
│   ├── register.tsx        # Register route
│   ├── join.tsx            # Join group route
│   ├── notifications.tsx   # Notifications screen
│   ├── store.ts            # Zustand store
│   └── theme.ts            # Theme configuration
├── supabase/               # Database and backend
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge functions
│   └── config.toml         # Supabase configuration
├── assets/                 # Static assets
├── docs/                   # Documentation
├── types/                  # Global TypeScript types
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── app.json                # Expo configuration
└── README.md               # Project documentation
```

---

## 🚀 Development Roadmap

### ✅ Completed Phases (1-8)
1. **Project Setup and Authentication** - Complete
2. **Core Features - Groups** - Complete
3. **Activities and Posts** - Complete with multi-group support
4. **Voting System** - Complete
5. **Balance and Payments** - Complete
6. **Gamification and Achievements** - Complete
7. **Profile and Statistics** - Complete
8. **Advanced Features** - Complete

### 🔄 Current Phase (9)
**Testing and Optimization**
- Unit and integration testing
- Performance optimization
- Security auditing
- UI/UX polish

### 📋 Upcoming Phases (10-11)
**Deployment and Launch**
- Production environment setup
- App store submission
- Marketing preparation
- User feedback integration

---

## 🎯 Key Achievements

### Technical Achievements
- **Multi-group posting**: Users can post activities to multiple groups simultaneously
- **Dual streak system**: Global streak (across all groups) + group-specific streaks
- **Real-time updates**: Live data synchronization across all screens
- **Optimized queries**: Efficient SQL functions for complex data aggregation
- **Secure architecture**: Comprehensive RLS policies and input validation
- **Achievement system**: Automatic detection and visual differentiation
- **Comprehensive profile**: Detailed statistics and achievements display
- **Notification system**: Complete achievement and balance notifications with proper authentication

### User Experience Achievements
- **Intuitive navigation**: File-based routing with Expo Router
- **Smooth interactions**: Real-time updates and focus listeners
- **Visual feedback**: Achievement badges, progress indicators, status updates
- **Multi-platform**: iOS and Android support with Expo
- **Social features**: Group management, voting, balance tracking

### Performance Achievements
- **Fast loading**: Optimized database queries and efficient data fetching
- **Responsive UI**: Smooth animations and transitions
- **Efficient state management**: Zustand for minimal re-renders
- **Type safety**: Full TypeScript implementation
- **Error handling**: Comprehensive error boundaries and user feedback

---

## 🔧 Development Guidelines

### Code Standards
- ✅ TypeScript for type safety
- ✅ Functional components with hooks
- ✅ Proper error handling and user feedback
- ✅ Comprehensive documentation
- ✅ Git flow branching strategy

### Testing Strategy
- Unit tests for utility functions and components
- Integration tests for API interactions
- End-to-end tests for critical user flows
- Performance testing for database queries
- Security testing for authentication and authorization

### Performance Targets
- ✅ App launch < 2 seconds
- ✅ Screen transitions < 300ms
- ✅ API response time < 200ms
- [ ] Offline functionality
- [ ] Battery usage optimization

### Security Measures
- ✅ Row Level Security (RLS) policies
- ✅ Input validation and sanitization
- ✅ Secure authentication with Supabase
- ✅ Protected routes and navigation
- ✅ Data encryption in transit and at rest

---

## 📊 Success Metrics

### Technical Metrics
- **Code Coverage**: Target 80%+ for critical paths
- **Performance**: < 2s app launch, < 300ms transitions
- **Security**: Zero critical vulnerabilities
- **Reliability**: 99.9% uptime target

### User Experience Metrics
- **User Retention**: 70%+ after 30 days
- **Daily Active Users**: 60%+ of registered users
- **Feature Adoption**: 80%+ for core features
- **User Satisfaction**: NPS > 50

### Business Metrics
- **User Growth**: 40%+ organic growth via invites
- **Engagement**: 5+ activities per user per week
- **Social Features**: 3+ groups per active user
- **Achievement Completion**: 70%+ achievement unlock rate

---

## 🚀 Next Steps

### Immediate Priorities
1. **Complete Testing Phase**
   - Comprehensive unit and integration tests
   - Performance optimization
   - Security audit completion

2. **Deployment Preparation**
   - Production environment setup
   - App store asset preparation
   - CI/CD pipeline configuration

3. **Launch Strategy**
   - Beta testing with real users
   - Marketing material creation
   - Analytics and monitoring setup

### Future Enhancements
1. **Advanced Features**
   - Chat functionality within groups
   - Integration with fitness devices
   - AI-powered insights and recommendations
   - Premium subscription model

2. **Scale and Growth**
   - International expansion
   - Enterprise features
   - API for third-party integrations
   - Community features and challenges

---

**Documento atualizado em:** Junho 2025  
**Versão:** 2.0  
**Status:** MVP Completo - Fase de Testes e Otimização 