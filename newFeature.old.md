# 🧩 Plano de Componentização FitVibes

## 1. Mapeamento dos Componentes e Padrões
- [X] Listar todos os elementos de UI que se repetem nas telas (botões, cards, inputs, modais, listas, headers, chips, etc).
- [ ] Identificar lógicas duplicadas (fetch, loading, erro, navegação, etc).
- [ ] Mapear estilos repetidos e padrões visuais.

---

### 🔍 Mapeamento dos Componentes Mais Repetidos

#### **Botões (Button, TouchableOpacity)**
- Usados em praticamente todas as telas: login, registro, criação de grupo, ações em cards, filtros, etc.
- Exemplo: Botão de "Entrar", "Criar Conta", "Marcar como Pago", "Filtrar", "Salvar Configurações".
- **Sugestão:** Criar um componente `Button` padronizado, com variações de cor, loading e ícone.

#### **Cards (Card, ActivityCard, GroupCard, NotificationItem)**
- Estruturas de card aparecem em feeds de atividades, lista de grupos, notificações, conquistas, etc.
- Exemplo: `ActivityCard` no feed, card de grupo em `GroupListScreen`, card de saldo em `balance.tsx`, card de conquista no perfil.
- **Sugestão:** Criar um `Card` base e especializar para cada domínio.

#### **Inputs (TextInput)**
- Usados em formulários de login, registro, criação/edição de grupo, postagem de atividade, filtros.
- **Sugestão:** Criar um `Input` padronizado para campos de texto, senha, número, etc.

#### **Headers e Títulos**
- Quase todas as telas têm um header/título com estilo semelhante.
- Exemplo: "Meus Grupos", "Atividades", "Perfil", "Criar Novo Grupo".
- **Sugestão:** Criar um componente `Header` reutilizável.

#### **Listas (FlatList, ScrollView)**
- Listas de grupos, atividades, notificações, conquistas, histórico, etc.
- **Sugestão:** Criar um wrapper de lista que já trate empty state, loading e padding.

#### **Modais**
- Usados para seleção de ciclo, filtro de grupo, confirmação de ações, etc.
- **Sugestão:** Criar um `Modal` genérico e componentes de modal específicos.

#### **Chips/Tags**
- Usados para status, categorias, filtros, seleção de grupo, etc.
- **Sugestão:** Criar um componente `Chip` para status, categorias, filtros.

#### **Avatares/Fotos de Usuário**
- Exibidos em cards de atividade, ranking, perfil, etc.
- **Sugestão:** Criar um componente `Avatar`.

#### **Indicadores de Loading e Empty State**
- Loading: `ActivityIndicator` aparece em várias telas.
- Empty State: Mensagens e ícones para listas vazias.
- **Sugestão:** Componentizar `LoadingIndicator` e `EmptyState`.

#### **Seções de Estatísticas/Resumo**
- Exemplo: Resumo de saldo, estatísticas do perfil, ranking de grupos.
- **Sugestão:** Componentizar `BalanceSummary`, `UserStats`, `RankingItem`.

---

## 2. Estrutura Recomendada de Pastas
- [ ] Criar/ajustar a pasta `app/components/` para componentes atômicos e compostos.
- [ ] Criar/ajustar a pasta `app/hooks/` para hooks customizados.
- [ ] Criar/ajustar a pasta `app/context/` para contextos globais.
- [ ] Criar/ajustar a pasta `app/styles/` ou `app/theme/` para temas, cores e tipografia.

## 3. Componentização Atômica (UI Básica)
- [ ] Extrair componentes genéricos:
  - [ ] `Button.tsx` (botão padrão) - In progress 
  - [ ] `Avatar.tsx` (foto de usuário)
  - [ ] `Chip.tsx` (tag/status)
  - [ ] `Modal.tsx` (modal genérico)
  - [ ] `LoadingIndicator.tsx`
  - [ ] `EmptyState.tsx`
  - [ ] `Card.tsx` (estrutura base)

## 4. Componentes Compostos e de Domínio
- [ ] Extrair componentes maiores e reutilizáveis:
  - [ ] `ActivityCard.tsx` (card de atividade)
  - [ ] `GroupCard.tsx` (card de grupo)
  - [ ] `NotificationItem.tsx`
  - [ ] `BalanceSummary.tsx`
  - [ ] `AchievementBadge.tsx`
  - [ ] `UserStats.tsx`

## 5. Refatoração das Telas
- [ ] Refatorar telas para usar apenas componentes criados (deixar tela "burra").
- [ ] Garantir que lógica de dados fique em hooks customizados.
- [ ] Exemplo: `GroupListScreen.tsx` só monta `<GroupCard />`.

## 6. Hooks Customizados
- [ ] Extrair lógica de fetch, loading, erro, etc, para hooks:
  - [ ] `useActivitiesFeed.ts`
  - [ ] `useGroupList.ts`
  - [ ] `useUserProfile.ts`
  - [ ] `useBalance.ts`

## 7. Contextos Globais
- [ ] Centralizar estados globais (usuário, tema, notificações) em contextos.
- [ ] Exemplo: `AuthContext.tsx`, `ThemeContext.tsx`, `NotificationContext.tsx`.

## 8. Padronização de Estilos
- [ ] Centralizar cores, fontes e espaçamentos.
- [ ] Garantir uso consistente dos estilos em todos componentes.

## 9. Testes e Ajustes
- [ ] Testar cada tela após refatoração.
- [ ] Garantir que componentes estejam desacoplados e reutilizáveis.
- [ ] Ajustar props e interfaces para máxima flexibilidade.

## 10. Documentação
- [ ] Documentar cada componente e hook (props, exemplos de uso).
- [ ] Criar um guia rápido de como criar novos componentes seguindo o padrão.

---

### 🚦 Ordem Recomendada para Extração dos Componentes

1. **Button**
   - É o componente mais usado e fácil de padronizar. Serve de base para todas as ações do app.
2. **Input**
   - Padroniza todos os campos de formulário, reduzindo bugs visuais e melhorando UX.
3. **LoadingIndicator** e **EmptyState**
   - Permite padronizar feedback visual em todas as telas e listas.
4. **Card (base)**
   - Serve de estrutura para todos os cards do app (atividade, grupo, notificação, etc).
5. **Modal**
   - Usado em filtros, seleções e confirmações. Um modal genérico facilita a criação de modais específicos.
6. **Header**
   - Padroniza títulos e headers das telas, melhorando consistência visual.
7. **Chip**
   - Usado para status, categorias, filtros. Pequeno, mas muito recorrente.
8. **Avatar**
   - Centraliza exibição de fotos/ícones de usuário.
9. **ListWrapper**
   - Um wrapper para listas (FlatList/ScrollView) que já trate loading, empty e padding.
10. **Cards de domínio** (ActivityCard, GroupCard, NotificationItem, AchievementBadge, etc)
    - Após o Card base, extraia cards específicos para cada contexto.
11. **Seções de Estatísticas/Resumo** (BalanceSummary, UserStats, RankingItem)
    - Por fim, componentize seções mais complexas e específicas.

**Justificativa:**
- Comece pelos componentes mais simples e reutilizáveis, pois eles serão usados em todos os outros.
- Componentes de domínio (cards, estatísticas) devem vir depois, pois dependem dos atômicos.
- Assim, cada refatoração posterior já aproveita o que foi padronizado antes.

---

### Dicas práticas
- Comece pelos componentes mais simples e mais usados (Button, Card, Modal).
- Refatore uma tela por vez, sempre usando os novos componentes.
- Use hooks para toda lógica de dados e side effects.
- Padronize nomes e estilos para facilitar manutenção.

---

**Checklist sequencial:**
1. Mapear padrões e listar componentes a extrair.
2. Criar componentes atômicos.
3. Refatorar componentes compostos.
4. Refatorar telas para usar só componentes.
5. Extrair hooks customizados.
6. Centralizar contextos globais.
7. Padronizar estilos.
8. Testar e ajustar.
9. Documentar.
