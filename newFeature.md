## 🧠 **Novo Comportamento Desejado (resumo em alto nível)**

1. Usuários podem postar **várias atividades no mesmo dia**, mas:

   * **Somente 1 atividade válida por grupo** conta para o `streak_days` do grupo.
   * **Somente 1 atividade válida no total** conta para o `streak_days` global.
   * Atividades **inválidas** não quebram streak imediatamente, pois o usuário pode “corrigir” com uma nova válida antes do fim do dia.

2. Após passar da meia-noite (UTC ou por grupo/local), o sistema avalia:

   * Se **o grupo** não teve nenhuma atividade válida de nenhum membro → `streak_days` do grupo é zerado.
   * Se **o usuário** não teve nenhuma atividade válida em nenhum grupo → `streak_days_global` do usuário é zerado.

---

## ✅ **Regras detalhadas para streaks**

### ✅ Regras de Postagem

* O usuário pode postar quantas vezes quiser por dia.
* Cada post passa por votação como já acontece hoje.
* O `streak_days` só aumenta se:

  * **pelo menos 1** atividade **for validada pelo grupo**
  * A validação acontecer antes do corte do dia (meia-noite).
* Só a **primeira atividade válida** do dia conta para o streak (o restante serve para o feed e histórico, mas não influencia streak).

---

### 🔁 Reprocessamento diário (função automática após meia-noite)

#### **Executada diariamente por job programado:**

* A função:

  * Roda 1x ao dia (por exemplo, às 03:00 UTC)
  * Verifica as **atividades do dia anterior**
  * Atualiza os `streak_days` (grupo e global) com base nas seguintes regras:

---

## ⚙️ **Lógica para atualizar `streak_days` por grupo**

Para cada grupo:

```sql
IF EXISTS (
  SELECT 1
  FROM activities
  WHERE group_id = X
    AND date = CURRENT_DATE - 1
    AND status = 'valid'
)
THEN
  INCREMENT streak_days for group X
ELSE
  RESET streak_days to 0 for group X
END IF;
```

---

## ⚙️ **Lógica para atualizar `streak_days_global` por usuário**

Para cada usuário:

```sql
IF EXISTS (
  SELECT 1
  FROM activities
  WHERE user_id = Y
    AND date = CURRENT_DATE - 1
    AND status = 'valid'
)
THEN
  INCREMENT streak_days_global for user Y
ELSE
  RESET streak_days_global to 0 for user Y
END IF;
```

---

## ✅ **Evita furos como:**

* Usuário que foi penalizado injustamente por ter feito um post inválido, mas depois corrigiu com um post válido.
* Usuário ou grupo que perde streak por um erro de horário ou ordem dos votos.
* Só 1 atividade válida conta por grupo e por dia → evita “farm de streak”.

---

## 💡 Extras opcionais (futuramente)

* Permitir ao usuário escolher qual atividade do dia é “principal” (se várias forem válidas).
* Criar feedback do tipo:

  > “Atividade validada! Streak mantido 😎”
  > “Faltam votos para definir sua atividade de hoje!”
  > “Cuidado! Se ninguém do grupo postar até meia-noite, o streak será zerado.”

---

## 📌 Requisitos para implementar:

* Campo `streak_days` em `group_members` (por grupo)
* Campo `streak_days_global` em `users` (ou `profiles`)
* Trigger que só atualiza `streak_days` se:

  * A atividade foi validada **e**
  * É a **primeira válida do dia** para aquele grupo ou globalmente
* Função de rotina (job agendado ou Edge Function diária) que:

  * Percorre todos os grupos e usuários
  * Verifica se algum post válido foi feito no dia anterior
  * Reseta streaks quando necessário

---

## ✅ Resumo estruturado

| Requisito                   | Comportamento                                                             |
| --------------------------- | ------------------------------------------------------------------------- |
| Múltiplas postagens por dia | Permitido, mas só uma válida conta para streak                            |
| Atividade inválida          | Não zera streak se ainda for possível postar válida antes da meia-noite   |
| Zerar streak (grupo)        | Se **ninguém** do grupo postou algo válido no dia anterior                |
| Zerar streak (global)       | Se o usuário **não teve nenhuma** atividade válida no dia anterior        |
| Votação atrasada            | Só conta para o streak se a atividade for validada **até o final do dia** |

---

# ✅ **Plano de Implementação – Lógica de Streaks e Verificação Pós-Meia-Noite (FitVibes)**

---

## 🧩 **Objetivo**

Garantir que o streak dos usuários (por grupo e global) seja atualizado com base em **atividades válidas registradas diariamente**, e que **inatividade resulte em reset automático**.

---

## 📚 **Estrutura de Dados Envolvida**

### Tabelas principais:

1. `activities`

   * `id`, `user_id`, `group_id`, `date`, `status` (`'pending' | 'valid' | 'invalid'`), `created_at`

2. `group_members`

   * `id`, `group_id`, `user_id`, `streak_days`, `last_valid_activity_date`

3. `users` ou `profiles`

   * `id`, `streak_days_global`, `last_valid_activity_date_global`

---

## 🔁 **1. Permitir múltiplas postagens por dia**

* Nenhuma limitação de quantidade por dia.
* As `activities` devem registrar `date`, `status`, `created_at`.

> Ex: João pode postar 3 atividades no dia 10/07.
> Só a **primeira validada** conta para streak.

---

## 🧠 **2. Trigger: marcar 1ª atividade válida como "usada" para streak**

Crie uma trigger na tabela `activities` que:

* Executa **quando o status muda para `'valid'`**
* Verifica se **o usuário já teve uma atividade válida** naquele mesmo `group_id` e `date`
* Se não, atualiza:

  * `streak_days` do grupo (`group_members`)
  * `streak_days_global` do usuário (`users`)
  * Os campos `last_valid_activity_date` e `last_valid_activity_date_global`

### 🧾 Exemplo de lógica (em pseudocode SQL):

```sql
IF NEW.status = 'valid' THEN
  -- Verifica se é a primeira atividade válida do dia no grupo
  IF NOT EXISTS (
    SELECT 1 FROM activities
    WHERE user_id = NEW.user_id
      AND group_id = NEW.group_id
      AND status = 'valid'
      AND date = NEW.date
      AND id <> NEW.id
  ) THEN
    -- Atualiza streak por grupo
    IF (SELECT last_valid_activity_date FROM group_members WHERE user_id = NEW.user_id AND group_id = NEW.group_id) = NEW.date - 1 THEN
      UPDATE group_members SET streak_days = streak_days + 1 WHERE ...
    ELSE
      UPDATE group_members SET streak_days = 1 WHERE ...
    END IF;
    UPDATE group_members SET last_valid_activity_date = NEW.date WHERE ...

    -- Atualiza streak global
    IF (SELECT last_valid_activity_date_global FROM users WHERE id = NEW.user_id) = NEW.date - 1 THEN
      UPDATE users SET streak_days_global = streak_days_global + 1 WHERE ...
    ELSE
      UPDATE users SET streak_days_global = 1 WHERE ...
    END IF;
    UPDATE users SET last_valid_activity_date_global = NEW.date WHERE ...
  END IF;
END IF;
```

---

## 🕐 **3. Função automática (job diário após meia-noite)**

### Objetivo:

* Verificar se o **usuário** e **cada grupo** teve pelo menos 1 atividade válida no dia anterior.
* Se **não**, resetar o streak correspondente.

### Deve rodar 1x por dia (ex: 03:00 UTC).

### SQL para grupos:

```sql
-- Para cada group_member
UPDATE group_members
SET streak_days = 0
WHERE last_valid_activity_date < CURRENT_DATE - 1;
```

### SQL para global:

```sql
UPDATE users
SET streak_days_global = 0
WHERE last_valid_activity_date_global < CURRENT_DATE - 1;
```

### Onde rodar:

* Supabase **Edge Function agendada**
  ou
* Plataforma externa como **n8n, cronjob, Deno Deploy**, etc.

---

## 📱 **4. Feedback no App**

### Exibir status de streak:

* No grupo:

  * “🔥 Você está com 5 dias de streak!”
  * “⚠️ Você não postou nada hoje. Se acabar o dia assim, seu streak será zerado!”

* No perfil:

  * “🔥 Streak global: 17 dias”
  * “💤 ZERADO ontem por inatividade”

---

## 🔐 **5. Segurança (RLS)**

* Certifique-se de que:

  * A função de verificação tem acesso a todas as atividades necessárias
  * As triggers acessam `group_members` e `users` sem restrição (ou via policy liberada)

---

## 📊 **6. Logs (opcional)**

Crie tabela `streak_events` para registrar:

* `user_id`, `group_id`, `date`, `event_type` (`reset`, `increment`, etc.), `source_activity_id`, `comment`

---

## ✅ Resumo final

| Ação                            | Responsável            |
| ------------------------------- | ---------------------- |
| Postagem de várias atividades   | App frontend           |
| Trigger para avaliar streak     | Banco (PostgreSQL)     |
| Atualização do streak diário    | Trigger + função       |
| Reset automático pós-meia-noite | Função agendada diária |
| Status visual no app            | Frontend               |

---
