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

---

## 🔄 Database Relationships

- **One-to-Many:**
  - User → Activities (one user can have many activities)
  - Group → Activities (one group can have many activities)
  - Group → Group Members (one group can have many members)
  - Activity → Votes (one activity can have many votes)
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
```

---

## 🏆 Achievements System

### Streak Types
1. **Global Streak**: Tracks consecutive days where user posted in at least one group
   - Stored in `users.global_streak_days`
   - Record stored in `users.global_streak_record`
   - Only increments once per day, regardless of how many groups user posted in

2. **Group Streak**: Tracks consecutive days of valid activities in a specific group
   - Stored in `group_members.streak_days`
   - Each group has its own streak counter

### Achievement Triggers
- **Global Streak Achievements**: Triggered when `global_streak_days` reaches thresholds (1, 7, 14, 30, 60, 100)
- **Group Streak Achievements**: Triggered when `group_members.streak_days` reaches thresholds (1, 7, 14, 30, 60, 100)
- **Variety Achievements**: Triggered when user tries different exercise types
- **Social Achievements**: Triggered by voting participation, group leadership, etc.

### Multi-Group Posting
- Users can select multiple groups when posting an activity
- Backend creates separate activity records for each selected group
- Each group votes independently on their respective activity
- Global streak only increments once per day if user posted in at least one group

## 📁 Folder Structure

```
fitvibes/
├── app/                      # App entry point and configuration
│   ├── index.tsx             # Main entry (welcome/login)
│   ├── _layout.tsx           # Expo Router layout
│   ├── store.ts              # Zustand store configuration
│   ├── theme.ts              # Theme configuration
│   ├── services/             # API and external services
│   ├── screens/              # Screen components (auth, groups, activities, profile)
│   ├── components/           # Reusable UI components
│   ├── features/             # Feature-specific logic (auth, groups, activities, voting, achievements)
│   ├── hooks/                # Custom React hooks
│   ├── navigation/           # Navigation configuration
│   ├── store/                # Zustand/state management
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── android/                  # Android specific files
├── ios/                      # iOS specific files
├── __tests__/                # Test files
├── .env                      # Environment variables
├── app.json                  # Expo configuration
├── babel.config.js           # Babel configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
``` 

## 🚀 Development Roadmap

### Phase 1: Project Setup and Authentication (Week 1)
1. **Initial Setup**
   - Initialize React Native project with Expo
   - Set up TypeScript configuration
   - Configure ESLint and Prettier
   - Set up folder structure
   - Initialize Git repository

2. **Database Setup**
   - Set up PostgreSQL database
   - Create initial tables (users, groups)
   - Set up database migrations
   - Configure connection pooling

3. **Authentication System**
   - Implement user registration
   - Implement login with email/password
   - Add social login (Google, Apple)
   - Set up JWT authentication
   - Create protected routes

### Phase 2: Core Features - Groups (Week 2)
1. **Group Management**
   - Create group creation flow
   - Implement group settings
   - Add group member management
   - Create group invite system
   - Implement group search

2. **Group UI**
   - Design and implement group list screen
   - Create group detail screen
   - Add group settings screen
   - Implement group member list
   - Add group invite UI

### Phase 3: Activities and Posts (Week 3)
1. **Activity System**
   - Create activity posting flow
   - Implement exercise type selection
   - Add duration tracking
   - Create excuse system
   - Implement auto-excuse feature

2. **Activity UI**
   - Design activity feed
   - Create activity posting screen
   - Implement activity detail view
   - Add activity history
   - Create activity statistics

### Phase 4: Voting System (Week 4)
1. **Voting Logic**
   - Implement voting mechanism
   - Create vote validation
   - Add comment system
   - Implement vote notifications
   - Create vote history

2. **Voting UI**
   - Design voting interface
   - Create vote confirmation
   - Add vote results view
   - Implement vote notifications
   - Create vote statistics

### Phase 5: Balance and Payments (Week 5)
1. **Balance System**
   - Implement balance tracking
   - Create payment cycle system
   - Add balance calculations
   - Implement payment marking
   - Create balance notifications

2. **Balance UI**
   - Design balance screen
   - Create payment history
   - Add balance statistics
   - Implement payment marking UI
   - Create balance notifications

### Phase 6: Gamification and Achievements (Week 6)
1. **Achievement System**
   - Implement achievement logic
   - Create achievement types
   - Add achievement triggers
   - Implement streak system
   - Create achievement notifications

2. **Achievement UI**
   - Design achievement screen
   - Create achievement badges
   - Add achievement progress
   - Implement achievement notifications
   - Create achievement statistics

### Phase 7: Testing and Optimization (Week 7)
1. **Testing**
   - Write unit tests
   - Implement integration tests
   - Add end-to-end tests
   - Perform security testing
   - Conduct performance testing

2. **Optimization**
   - Optimize database queries
   - Implement caching
   - Add performance monitoring
   - Optimize image loading
   - Implement lazy loading

### Phase 8: Deployment and Launch (Week 8)
1. **Deployment**
   - Set up production environment
   - Configure CI/CD pipeline
   - Set up monitoring
   - Configure backups
   - Set up SSL certificates

2. **Launch Preparation**
   - Create app store listings
   - Prepare marketing materials
   - Set up analytics
   - Create user documentation
   - Plan launch strategy

### Phase 9: Post-Launch (Ongoing)
1. **Monitoring and Maintenance**
   - Monitor app performance
   - Track user feedback
   - Fix reported bugs
   - Implement improvements
   - Update documentation

2. **Feature Expansion**
   - Plan new features
   - Implement user requests
   - Add premium features
   - Expand social features
   - Add new gamification elements

## 📋 Development Guidelines

### Code Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write comprehensive documentation
- Follow Git flow branching strategy

### Testing Requirements
- Maintain 80% code coverage
- Write tests for all new features
- Perform regular security audits
- Conduct performance testing
- Test on multiple devices

### Documentation
- Keep README updated
- Document all API endpoints
- Maintain changelog
- Create user guides
- Document deployment process

### Performance Targets
- App launch < 2 seconds
- Screen transitions < 300ms
- API response time < 200ms
- Offline functionality
- Battery usage optimization 