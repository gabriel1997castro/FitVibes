### **1. Resumo da Ideia**

Um aplicativo social e divertido para incentivar a prática de exercícios em grupos privados, onde os usuários precisam diariamente justificar a ausência de treino com desculpas (ou registrar um treino feito). O grupo vota na validade das desculpas/treinos, usa comentários pré-definidos, e quem “perder” paga uma quantia simbólica aos demais. Gamificação e pressão social são usadas para aumentar a adesão à atividade física.

---

### **2. Pontos Fortes**

- **Gamificação do compromisso:** A competição e as penalidades simbólicas estimulam a participação constante.
- **Pressão social positiva:** O grupo incentiva, fiscaliza e diverte, tornando mais difícil “sumir”.
- **Humor e leveza:** As desculpas e comentários criam um ambiente descontraído, tornando o app divertido e viciante.
- **Interação autêntica:** Desculpas e votos geram interações reais e espontâneas.
- **Notificações push:** Garantem engajamento e lembram os usuários das suas obrigações e votações.
- **Ranking e premiações simbólicas:** Títulos como “rei do migué” e “mais esforçado” tornam a competição amigável.
- **Grupos fechados:** Protege a privacidade, permitindo apenas convidados.
- **Punir inatividade:** Quem não posta nada recebe automaticamente uma “desculpa migué” para votação e penalidade.

---

### **3. Pontos de Melhoria (Incluídos ao Plano)**

- **Categorias sugeridas de desculpas válidas:** Como atestado médico, viagem, evento importante (facilita e padroniza as justificativas).
- **Mensagens pré-definidas obrigatórias:** Para evitar ataques, bullying ou qualquer ofensa, os comentários são sempre de um banco pré-aprovado de frases.
- **Pagamento simbólico, com prazos para acerto:** O app mostra, semanalmente ou mensalmente, quanto cada um deve para quem, e pode zerar os saldos no fechamento do ciclo.
- **Pontuação geral (não zera) e pontuação de “dias sem perder dinheiro”:** Dois sistemas de score para motivar: histórico total e sequência de dias bons.
- **Ranking e histórico:** Melhor desculpa, mais esforçado, rei do migué, etc., baseados em votos e estatísticas.
- **Grupos fechados:** Só entra por convite/link, para garantir privacidade.
- **Punição automática para inatividade:** Não postou, recebe uma desculpa “hoje não treinei porque sou muito migué!”.

---

## **4. MVP — Produto Mínimo Viável**

Para lançar rapidamente e validar a ideia, sugiro o seguinte escopo de MVP:

### **Funcionalidades MVP**

1. **Cadastro/Login**
    - Google, Apple ou e-mail.
2. **Criação/Entrada em grupos fechados**
    - Entrar por convite ou link.
3. **Postar exercício ou desculpa**
    - Selecionar entre exercício realizado ou desculpa (com categorias sugeridas).
    - Mensagens/comments apenas pré-definidas.
4. **Votação diária**
    - Todos devem votar se o exercício/desculpa é válido ou não.
    - Não votar = penalidade automática (incentivo à participação).
5. **Notificações push**
    - Lembrete de postagem, votação, fechamento de ciclo, ranking.
6. **Pagamentos simbólicos**
    - Controle de quem deve quanto para quem, ciclo semanal/mensal.
    - Sem integração bancária no MVP (só controle no app).
7. **Ranking e histórico**
    - Pontuação geral, sequência de dias sem perder dinheiro, títulos simbólicos.
8. **Privacidade e segurança**
    - Grupos privados, denúncias se necessário.

**Obs.:** Upload de foto/vídeo pode ser planejado para versões futuras.

---

## **5. Sugestão de Stack para App**


### **Frontend (Mobile)**

- **React Native** (com Expo para facilitar push notifications e build inicial)
- **TypeScript** sempre
- **React Navigation** (rotas/telas)
- **Expo Notifications** (push notifications)
- **Zustand** (estado, se necessário)
- **AsyncStorage** (dados locais simples)

### **Backend**

### **Tech Stack Backend com Supabase**

#### **1. Banco de Dados**

* **PostgreSQL** gerenciado pelo Supabase

#### **2. Autenticação**

* **Supabase Auth**

  * Suporte nativo a login por Google, Apple, email/senha, magic link, etc.
  * Gerencia sessões, JWT, resets e mais.

#### **3. API**

* **API RESTful automática** gerada pelo Supabase

  * Cada tabela do banco vira um endpoint RESTful seguro, já respeitando roles/permissions
* **API GraphQL** opcional, já pronta (se preferir GraphQL)
* **Realtime** (Websockets) para receber updates de dados ao vivo

#### **4. Funções customizadas (Opcional)**

* **Edge Functions** (serverless, estilo Lambda) para lógica personalizada (exemplo: fechamento de ciclo, cálculos de ranking, notificações, automações)

#### **5. Notificações**

* **Push notifications**:

  * Use [Expo Notifications](https://docs.expo.dev/push-notifications/overview/) para o mobile, salvando o Expo Push Token do usuário na tabela de usuários do Supabase.
  * Para enviar pushes automáticos (ex: cobrança, lembrete), crie uma **Edge Function** no Supabase ou um script serverless externo (ex: n8n, Vercel, Railway) que lê do banco e dispara o push.


#### **Fluxo Prático de Desenvolvimento**

##### **1. Modelagem do banco**

* No painel do Supabase, crie as tabelas:

  * users
  * groups
  * group\_members
  * posts (exercício ou desculpa)
  * votes
  * payments (controle de quem deve pra quem, se quiser)
  * rankings (ou gere por consulta/edge function)
* Configure **policies** (RLS - Row Level Security) para proteger os dados.

##### **2. Integração no app**

* Instale o SDK:

  ```bash
  yarn add @supabase/supabase-js
  ```
* Use o SDK no React Native para autenticar, ler/escrever no banco, ouvir eventos em tempo real, etc.

##### **3. Lógica personalizada**

* Para regras mais complexas (fechar ciclo semanal, cálculo de ranking, envio automático de push),

  * Crie Edge Functions no Supabase
  * Ou integre com n8n e APIs externas

##### **4. Hospedagem**

* O Supabase já hospeda seu banco, API e edge functions automaticamente.

---

#### **Resumo da Stack**

| Camada       | Ferramenta/Serviço        | Observação                    |
| ------------ | ------------------------- | ----------------------------- |
| DB           | Supabase (PostgreSQL)     | Gerenciado, seguro, escalável |
| API          | Supabase REST/GraphQL     | CRUD automático, RLS          |
| Auth         | Supabase Auth             | SSO, JWT, magic link, etc     |
| Realtime     | Supabase Realtime         | Atualização ao vivo           |
| Lógica       | Supabase Edge Functions\* | Lambda para regras especiais  |
| Notificações | Expo Notifications        | Mobile Push                   |

\*Edge Functions e n8n são opcionais e ajudam para lógica avançada, mas para um MVP você pode resolver quase tudo só com Supabase + SDK.

---

#### **Vantagens**

* Zero backend para começar: 100% serverless.
* Escala e segurança nativos.
* Login social fácil.
* CRUD super rápido via SDK no mobile.
* Permissões personalizáveis (RLS).
* Adicione lógica personalizada sem dores.


---

## **6. Fluxo de Usuário (Simplificado)**

1. Usuário entra, se cadastra ou faz login.
2. Cria grupo ou entra por convite.
3. Todos os dias, cada membro posta:
    - Um exercício realizado (ex: “Caminhei 30 minutos”) **ou**
    - Uma desculpa (escolhe da lista: “Estava doente”, “Viajei”, etc.)
4. Grupo recebe push para votar. Todos precisam votar.
5. Votos são computados; comentários são de frases pré-definidas.
6. Quem não posta recebe “desculpa automática” e pode ser penalizado.
7. App calcula dívidas simbólicas entre membros (sem pagamento real no app).
8. Rankings, pontuações e notificações são exibidos.
9. Ao final do ciclo (semana/mês), saldo aparece para todo grupo.

---

## **7. Próximos Passos**

1. **Aprovar/desenhar wireframes das telas do MVP** (posso te ajudar com isso).
2. **Modelar banco de dados** (posso te mandar um modelo inicial).
3. **Definir estrutura de backend** (rotas essenciais).
4. **Montar estrutura do React Native (Expo)**.
5. **Configurar notificações push.**
6. **Testes com grupo pequeno antes do lançamento público.**

---

## **Resumo do Plano**

- App mobile (React Native + TypeScript)
- Backend em Node.js/Express + Prisma/Postgres
- MVP com grupo, postagem, votação, comentários pré-definidos, ranking, notificações, controle de “dívida”
- Gamificação, leveza, segurança e privacidade como valores centrais

## **Wireframes para MiguéFit (MVP) — Descrição Visual**

### 1. **Tela de Boas-vindas / Login**

```
lua
CopyEdit
----------------------------------
|        [LOGO MIGUÉFIT]         |
|    "Fuja do migué, mexa-se!"   |
|--------------------------------|
|   [Entrar com Google]          |
|   [Entrar com Apple]           |
|   [Entrar com E-mail]          |
----------------------------------

```

---

### 2. **Tela de Grupos**

```
less
CopyEdit
----------------------------------
|       Meus Grupos              |
|--------------------------------|
| [Grupo da Academia]    [#]     |
| [Família Fitness]      [#]     |
|--------------------------------|
| [+] Criar novo grupo           |
| [🔗] Entrar em grupo por link  |
----------------------------------

```

---

### 3. **Tela do Grupo**

```
lua
CopyEdit
----------------------------------
|  [Nome/Foto do Grupo]          |
|--------------------------------|
| Membros: [🟢 Ana] [🔴 João]    |
|--------------------------------|
| [Postar exercício/desculpa]    |
|--------------------------------|
| Saldo: Você deve R$X para Y    |
| Ranking semanal:               |
|   🏅 Mais esforçado: Ana       |
|   🤡 Rei do migué: João        |
|   🧠 Melhor desculpa: Bia      |
|--------------------------------|
| [Ver histórico] [Convidar]     |
----------------------------------

```

---

### 4. **Tela de Postagem**

```
less
CopyEdit
----------------------------------
| Você treinou hoje?             |
| [Sim] [Não]                    |
|--------------------------------|
| Se Sim:                        |
| Tipo: [Caminhada] [Corrida]... |
| Duração: [__] min              |
| [Enviar]                       |
|--------------------------------|
| Se Não:                        |
| Motivo:                        |
| ( ) At. Médico ( ) Viagem      |
| ( ) Evento ( ) Cansaço         |
| [Enviar]                       |
----------------------------------

```

---

### 5. **Tela de Votação**

```
lua
CopyEdit
----------------------------------
| Votar nos posts do dia         |
|--------------------------------|
| [Card: Ana]                    |
| "Caminhei 20min" [⏰9:20]      |
| [Válido] [Migué]               |
| Comentário:                    |
| ( ) "Desculpa esfarrapada"     |
| ( ) "Boa, arrasou!"            |
| ( ) "Te entendo, mas bora!"    |
----------------------------------
| [Próximo card...]              |
----------------------------------

```

---

### 6. **Ranking / Histórico**

```
lua
CopyEdit
----------------------------------
| Ranking do grupo               |
|--------------------------------|
| 🏆 Pontuação geral             |
| 🔥 Dias sem perder dinheiro    |
| 🤡 Rei do migué da semana      |
|--------------------------------|
| Histórico:                     |
| Dia | Membro | Post | Votos    |
|-----|--------|------|----------|
| 25  | Ana    | Ex.  | Válido   |
| 25  | João   | Esc. | Migué    |
----------------------------------

```

# React Native

## Flatlist vs Scrollview

Flatlist é melhor, renderiza só o que está na tela. Já o ScrollView renderiza tudo