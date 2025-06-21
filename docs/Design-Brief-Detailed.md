# 🎨 FitVibes - Brief Detalhado para Design

## 📋 Visão Geral do Projeto

**FitVibes** é um aplicativo mobile social e gamificado que transforma exercícios físicos em uma experiência divertida e motivadora através de pressão social positiva. O app conecta grupos de amigos, família ou colegas de trabalho, incentivando a prática regular de exercícios através de desafios, votação social e recompensas simbólicas.

### 🎯 Proposta de Valor
- **Motivação Social**: Pressão positiva de grupo para manter consistência
- **Gamificação**: Sistema de conquistas, streaks e rankings
- **Flexibilidade**: Suporte a diferentes tipos de exercício e desculpas válidas
- **Comunidade**: Conexão real entre pessoas com objetivos similares

---

## 👥 Público-Alvo

### Personas Principais
1. **João, 28 anos, Desenvolvedor**
   - Quer se exercitar mas tem dificuldade com consistência
   - Gosta de apps de produtividade e gamificação
   - Tem grupo de amigos que também querem se exercitar
   - Busca motivação externa e accountability

2. **Maria, 32 anos, Marketing**
   - Já se exercita ocasionalmente mas quer ser mais consistente
   - Gosta de redes sociais e interação com amigos
   - Tem família que apoia seus objetivos fitness
   - Valoriza feedback positivo e celebração de conquistas

3. **Carlos, 25 anos, Estudante**
   - Tempo limitado mas quer manter saúde
   - Gosta de competição saudável com amigos
   - Usa muito smartphone e apps sociais
   - Busca motivação através de desafios e rankings

### Características Demográficas
- **Idade**: 18-45 anos
- **Interesse**: Fitness, saúde, socialização, gamificação
- **Comportamento**: Usuários ativos de redes sociais e apps de produtividade
- **Motivação**: Melhorar saúde, manter consistência, conectar com amigos

---

## 🏗️ Arquitetura de Funcionalidades

### 1. Sistema de Autenticação
- **Login Social**: Google, Apple, Email/Senha
- **Onboarding**: Tutorial interativo das funcionalidades
- **Perfil Básico**: Nome, foto, configurações iniciais

### 2. Gestão de Grupos
- **Criação de Grupos**: Nome, cor temática, emoji, valor de penalidade
- **Convites**: Sistema de códigos de convite para novos membros
- **Configurações**: Edição de parâmetros do grupo
- **Membros**: Lista de participantes com status e estatísticas

### 3. Sistema de Atividades
- **Postagem Diária**: "Treinou hoje?" - SIM/NÃO
- **Tipos de Exercício**: Caminhada, corrida, natação, musculação, yoga, ciclismo, etc.
- **Duração**: Registro de tempo de exercício
- **Desculpas Válidas**: Categorias pré-definidas (médicas, pessoais, profissionais)
- **Multi-Grupo**: Postagem simultânea em múltiplos grupos
- **Auto-Excuse**: Postagem automática se não postar até o final do dia

### 4. Sistema de Votação
- **Votação Social**: Membros votam na validade das atividades
- **Opções**: "Válido" ou "Migué" (desculpa esfarrapada)
- **Comentários**: Frases pré-definidas para feedback
- **Transparência**: Todos veem os votos de todos
- **Independência**: Cada grupo vota independentemente

### 5. Sistema de Saldos
- **Penalidades Simbólicas**: Valor configurável por grupo (ex: R$1,00)
- **Ciclos de Pagamento**: Semanal ou mensal
- **Controle de Pagamentos**: Marcação de pagamentos realizados
- **Notificações**: Alertas de saldos pendentes

### 6. Sistema de Gamificação
- **Streaks Duplos**:
  - **Global**: Dias consecutivos postando em qualquer grupo
  - **Por Grupo**: Dias consecutivos de atividades válidas em grupo específico
- **Conquistas**:
  - Streaks: 1, 7, 14, 30, 60, 100 dias
  - Variedade: Experimentar diferentes tipos de exercício
  - Social: Participação em votações, primeira atividade
- **Rankings**:
  - Mais Esforçado: Baseado em pontos e consistência
  - Rei do Migué: Maior número de desculpas rejeitadas (humorístico)
  - Melhor Desculpa: Desculpas mais criativas
  - Streak Master: Maior sequência atual

### 7. Sistema de Notificações
- **Automáticas**: Conquistas, saldos, lembretes
- **Push**: Lembretes de postagem e votação
- **Contextuais**: Navegação para telas específicas
- **Marcação**: Sistema de leitura

### 8. Perfil e Estatísticas
- **Estatísticas Pessoais**: Streaks, pontos, grupos
- **Histórico**: Timeline de atividades e conquistas
- **Distribuição**: Gráficos de tipos de exercício
- **Rankings**: Posição em cada grupo
- **Conquistas**: Badges e progresso

---

## 🎨 Diretrizes de Design

### Filosofia Visual
- **Energia e Vitalidade**: Cores vibrantes que transmitem movimento e atividade
- **Comunidade e Conexão**: Elementos que enfatizam interação social
- **Diversão e Gamificação**: Interface lúdica que transforma exercício em jogo
- **Acessibilidade**: Design inclusivo para diferentes necessidades

### Paleta de Cores
- **Primárias**:
  - Laranja Energético: #FF6B35 (energia, ação)
  - Rosa Vibrante: #FF1B8D (destaque, CTA)
  - Roxo Dinâmico: #8B5CF6 (gradientes, secundário)
  - Verde Sucesso: #10B981 (positivo, confirmação)
- **Secundárias**:
  - Azul Confiança: #3B82F6 (informação, navegação)
  - Amarelo Atenção: #F59E0B (alertas, notificações)
  - Vermelho Alerta: #EF4444 (negativo, crítico)
- **Neutras**:
  - Branco Puro: #FFFFFF (background, texto)
  - Cinza Claro: #F3F4F6 (backgrounds secundários)
  - Cinza Médio: #6B7280 (texto secundário)
  - Preto Suve: #1F2937 (texto principal)

### Tipografia
- **Fonte Principal**: San Francisco (iOS) / Roboto (Android)
- **Hierarquia**:
  - Títulos: 24-32pt, Bold
  - Subtítulos: 18-22pt, Semibold
  - Corpo: 14-16pt, Regular
  - Secundário: 12-14pt, Regular
- **Características**: Espaçamento generoso, contraste adequado, suporte a acentuação

### Componentes Visuais
- **Botões**: Border-radius 28px, altura 56px, gradientes
- **Cards**: Sombra sutil, border-radius 12px, padding 16px
- **Ícones**: Grid 24x24px, estilo outline, cantos arredondados
- **Animações**: 200-300ms, easing suave, feedback visual

---

## 📱 Estrutura de Telas

### 1. Onboarding e Autenticação
- **Tela de Boas-vindas**: Logo, tagline, gradiente vibrante
- **Login**: Opções sociais, email/senha, design limpo
- **Tutorial**: Passo a passo interativo das funcionalidades

### 2. Navegação Principal (Bottom Tabs)
- **Grupos**: Hub central com lista de grupos
- **Atividades**: Feed de atividades recentes (placeholder)
- **Ranking**: Rankings e conquistas (placeholder)
- **Notificações**: Lista de notificações
- **Perfil**: Estatísticas pessoais e configurações

### 3. Telas de Grupo
- **Lista de Grupos**: Cards com nome, membros, pendências
- **Detalhes do Grupo**: Header colorido, lista de membros, status
- **Postagem**: Interface de decisão SIM/NÃO, seleção de grupos
- **Votação**: Cards de atividades pendentes, botões de voto
- **Saldos**: Lista de saldos, controles de pagamento
- **Configurações**: Edição de parâmetros do grupo

### 4. Telas Específicas
- **Criação de Grupo**: Formulário com campos essenciais
- **Convite**: Código de convite, compartilhamento
- **Perfil Detalhado**: Estatísticas, conquistas, histórico
- **Notificações**: Lista com navegação contextual

---

## 🎮 Elementos de Gamificação

### Conquistas Visuais
- **Badges**: Ícones únicos para cada conquista
- **Progresso**: Barras e anéis de progresso
- **Celebração**: Animações de confete para conquistas
- **Diferenciação**: Streaks globais vs. por grupo

### Rankings e Competição
- **Pódio Visual**: Representação 3D das posições
- **Categorias**: Tabs para diferentes tipos de ranking
- **Troféus**: Iconografia dourada, prateada, bronze
- **Progresso**: Indicadores visuais de pontuação

### Feedback e Motivação
- **Streak Flames**: Chamas que crescem com sequências
- **Progress Rings**: Anéis para metas diárias/semanais
- **Level Up Effects**: Animações para mudanças de nível
- **Social Feedback**: Comentários encorajadores

---

## 🔄 Fluxos de Usuário

### Fluxo Principal Diário
1. **Abertura**: App → Tela de Grupos
2. **Verificação**: Notificações e pendências
3. **Seleção**: Grupo → Tela do Grupo
4. **Postagem**: "Treinou hoje?" → Detalhes → Confirmação
5. **Votação**: Atividades pendentes → Votos → Comentários
6. **Feedback**: Rankings, conquistas, saldos

### Fluxo de Criação de Grupo
1. **Início**: Botão "Criar Grupo"
2. **Configuração**: Nome, cor, emoji, penalidade
3. **Confirmação**: Resumo e criação
4. **Convite**: Geração de código de convite
5. **Compartilhamento**: Envio para amigos

### Fluxo de Conquistas
1. **Trigger**: Atividade válida → Streak incrementado
2. **Verificação**: Threshold atingido → Achievement criado
3. **Notificação**: Push notification + notificação in-app
4. **Celebração**: Animação + badge desbloqueado
5. **Histórico**: Adicionado ao perfil

---

## 📊 Estados da Interface

### Estados de Carregamento
- **Skeleton Screens**: Placeholders animados
- **Progress Indicators**: Spinners e barras
- **Shimmer Effects**: Animação sutil de carregamento

### Estados Vazios
- **Ilustrações**: Arte amigável para estados vazios
- **Calls-to-Action**: Botões claros para primeiras ações
- **Mensagens Motivacionais**: Texto encorajador

### Estados de Erro
- **Indicadores Visuais**: Bordas vermelhas, ícones de alerta
- **Mensagens Claras**: Explicação do problema
- **Ações de Recuperação**: Botões de retry e ajuda

### Estados de Sucesso
- **Confirmações Visuais**: Checkmarks animados
- **Celebrações**: Confetes para conquistas importantes
- **Toast Messages**: Notificações temporárias

---

## 🎯 Requisitos Técnicos

### Plataformas
- **iOS**: iPhone SE até iPhone Pro Max
- **Android**: Dispositivos de 5" até 7"
- **Responsividade**: Adaptação para diferentes tamanhos

### Performance
- **Tempo de Carregamento**: < 2 segundos
- **Transições**: < 300ms
- **Animações**: 60fps consistentes
- **Bateria**: Otimização para uso prolongado

### Acessibilidade
- **Contraste**: Mínimo 4.5:1 para texto
- **Tamanhos de Fonte**: Suporte a Dynamic Type
- **Navegação**: Suporte a VoiceOver/TalkBack
- **Cores**: Não dependência exclusiva de cor

### Integração
- **Supabase**: Autenticação e dados em tempo real
- **Push Notifications**: Notificações locais e remotas
- **Compartilhamento**: Integração com apps nativos
- **Analytics**: Tracking de eventos importantes

---

## 🚀 Critérios de Sucesso

### Métricas de UX
- **Task Completion**: 90%+ para fluxos principais
- **Time on Task**: < 30 segundos para postagem
- **Error Rate**: < 5% para ações críticas
- **User Satisfaction**: NPS > 50

### Métricas de Engajamento
- **Retenção**: 70%+ após 30 dias
- **Daily Active Users**: 60%+ dos usuários registrados
- **Feature Adoption**: 80%+ para funcionalidades core
- **Social Features**: 3+ grupos por usuário ativo

### Métricas de Performance
- **App Launch**: < 2 segundos
- **Screen Transitions**: < 300ms
- **API Response**: < 200ms
- **Crash Rate**: < 1%

---

## 📋 Entregáveis Esperados

### Design System
- **Componentes**: Biblioteca completa de componentes
- **Tokens**: Cores, tipografia, espaçamentos
- **Animações**: Micro-interações e transições
- **Documentação**: Guias de uso e especificações

### Telas Principais
- **Wireframes**: Estrutura e layout
- **Mockups**: Design visual completo
- **Protótipos**: Interações e fluxos
- **Assets**: Ícones, ilustrações, imagens

### Especificações
- **Técnicas**: Dimensões, cores, fontes
- **Interação**: Estados, feedback, navegação
- **Responsividade**: Adaptação para diferentes telas
- **Acessibilidade**: Diretrizes e implementação

---

## 🎨 Inspirações e Referências

### Apps Similares
- **Strava**: Gamificação e comunidade
- **Habitica**: Gamificação de hábitos
- **BeReal**: Autenticidade social
- **Duolingo**: Progresso e conquistas

### Estilos Visuais
- **Gradientes Vibrantes**: Instagram, TikTok
- **Cards Modernos**: Airbnb, Spotify
- **Micro-animações**: Apple, Google Material
- **Tipografia Clara**: Notion, Linear

### Elementos de Gamificação
- **Progresso Visual**: Duolingo, Headspace
- **Conquistas**: Xbox, PlayStation
- **Rankings**: Strava, Fitbit
- **Social Features**: Discord, Slack

---

## 🔮 Visão Futura

### Expansões Planejadas
- **Chat em Grupo**: Comunicação interna
- **Integração Fitness**: Apple Health, Google Fit
- **Desafios Personalizados**: Metas individuais
- **Premium Features**: Estatísticas avançadas

### Escalabilidade
- **Grupos Grandes**: 50+ membros
- **Empresas**: Wellness corporativo
- **Eventos**: Desafios temporários
- **API**: Integração com outros apps

---

**Este brief fornece uma base sólida para criar um design moderno, funcional e envolvente que transforme exercícios em uma experiência social divertida e motivadora. O foco deve estar na usabilidade, gamificação efetiva e criação de uma comunidade engajada.** 