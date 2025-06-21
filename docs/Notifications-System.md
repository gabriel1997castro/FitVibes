# 🔔 Sistema de Notificações - FitVibes

## Visão Geral

O sistema de notificações do FitVibes é responsável por informar os usuários sobre eventos importantes como conquistas, saldos pendentes e pagamentos. O sistema utiliza triggers de banco de dados para criar notificações automaticamente e uma interface dedicada para visualização.

## 📋 Tipos de Notificações

### 1. Notificações de Conquistas (Achievements)
- **Trigger**: Quando um achievement é criado via triggers de streak
- **Tipos**:
  - `global_streak`: Streaks globais (1, 7, 14, 30, 60, 100 dias)
  - `group_streak`: Streaks por grupo (1, 7, 14, 30, 60, 100 dias)
  - `variety`: Variedade de exercícios (1, 5, 10 tipos)
  - `social`: Primeira atividade, participação em votações

### 2. Notificações de Saldo (Balance)
- **Trigger**: Quando um novo saldo é criado
- **Tipos**:
  - `balance_created`: Novo saldo pendente
  - `payment_made`: Pagamento realizado
  - `payment_received`: Pagamento recebido

## 🏗️ Arquitetura Técnica

### Banco de Dados

#### Tabela `notifications`
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Políticas RLS (Row Level Security)
```sql
-- Usuários autenticados podem ver suas próprias notificações
CREATE POLICY "authenticated_users_can_select_own_notifications" 
ON notifications FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Usuários autenticados podem atualizar suas próprias notificações
CREATE POLICY "authenticated_users_can_update_own_notifications" 
ON notifications FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Sistema pode inserir notificações (para triggers)
CREATE POLICY "system_can_insert_notifications" 
ON notifications FOR INSERT TO authenticated 
WITH CHECK (true);
```

### Triggers de Notificação

#### 1. Trigger de Conquistas Globais
```sql
-- Função que cria notificação quando achievement global é criado
INSERT INTO notifications (
    user_id, group_id, type, title, body, data
) VALUES (
    NEW.user_id, NULL, 'achievement', 
    'Nova Conquista Global!', 
    'Você treinou ' || t || ' dias seguidos em qualquer grupo!',
    jsonb_build_object('achievement_type', 'global_streak', ...)
);
```

#### 2. Trigger de Conquistas por Grupo
```sql
-- Função que cria notificação quando achievement de grupo é criado
INSERT INTO notifications (
    user_id, group_id, type, title, body, data
) VALUES (
    NEW.user_id, NEW.group_id, 'achievement',
    'Nova Conquista no Grupo!',
    'Você treinou ' || t || ' dias seguidos no grupo ' || group_name || '!',
    jsonb_build_object('achievement_type', 'group_streak', ...)
);
```

## 🎯 Frontend

### Tela de Notificações (`app/notifications.tsx`)

#### Funcionalidades
- **Listagem**: Exibe todas as notificações do usuário ordenadas por data
- **Marcação como lida**: Ao tocar em uma notificação, ela é marcada como lida
- **Navegação**: Redireciona para telas específicas baseado no tipo de notificação
- **Estado de carregamento**: Loading spinner durante busca
- **Tratamento de erro**: Exibe erros de forma amigável

#### Navegação por Tipo
```typescript
switch (notification.type) {
  case 'balance_created':
  case 'payment_made':
  case 'payment_received':
    router.push(`/groups/${notification.group_id}/balance`);
    break;
  case 'achievement':
    router.push('/(tabs)/profile');
    break;
}
```

### Configuração do Supabase Client

**IMPORTANTE**: O app usa apenas uma instância do Supabase Client em `app/services/supabase.ts` para garantir consistência de autenticação.

```typescript
// ✅ Correto - usar esta instância
import { supabase } from './services/supabase';

// ❌ Incorreto - não usar múltiplas instâncias
import { supabase } from '../lib/supabase';
```

## 🔧 Problemas Resolvidos

### 1. Duplicação de Supabase Client
**Problema**: Múltiplas instâncias do Supabase Client causavam problemas de autenticação
**Solução**: 
- Removido `lib/supabase.ts`
- Unificado uso de `app/services/supabase.ts`
- Corrigido import em `app/notifications.tsx`

### 2. Políticas RLS Incorretas
**Problema**: Políticas configuradas para `public` role em vez de `authenticated`
**Solução**:
- Recriadas políticas para `authenticated` role
- Adicionadas políticas específicas para SELECT, UPDATE e INSERT
- Garantidas permissões corretas para triggers

### 3. Triggers de Notificação Ausentes
**Problema**: Achievements eram criados mas não geravam notificações
**Solução**:
- Implementados triggers para achievements globais e por grupo
- Adicionada função `handle_achievement_notification()`
- Integrados triggers com funções de streak

## 📊 Fluxo de Notificações

### 1. Criação Automática
```
Usuário completa atividade → Trigger de streak → Achievement criado → Notificação criada
```

### 2. Visualização
```
Usuário acessa tela de notificações → Supabase Client autenticado → Busca notificações → Exibe lista
```

### 3. Interação
```
Usuário toca notificação → Marca como lida → Navega para tela específica
```

## 🚀 Próximas Melhorias

### Planejadas
- [ ] Notificações push para dispositivos móveis
- [ ] Configurações de notificação por usuário
- [ ] Notificações em tempo real via WebSockets
- [ ] Agrupamento de notificações similares

### Implementadas
- [x] Notificações automáticas para achievements
- [x] Notificações para saldos e pagamentos
- [x] Interface de visualização de notificações
- [x] Marcação como lida
- [x] Navegação contextual

## 🔍 Debug e Teste

### Funções de Debug Disponíveis
```sql
-- Testar acesso às notificações
SELECT * FROM public.debug_notifications_permissions();

-- Criar notificação de teste
SELECT public.create_test_notification('user-uuid-here');

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Logs Úteis
- Console do app mostra logs de autenticação
- Status de autenticação exibido na tela de notificações
- Logs detalhados de erros de RLS

---

**Última atualização**: Junho 2025  
**Status**: ✅ Funcionando  
**Responsável**: Sistema de Notificações 