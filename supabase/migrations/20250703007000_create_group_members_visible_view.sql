-- Migration: Cria view segura para membros de grupo

create or replace view group_members_visible as
select gm.*
from group_members gm
where exists (
  select 1 from group_members
  where group_id = gm.group_id and user_id = auth.uid()
); 