-- Migration: Concede SELECT na view group_members_visible ao papel authenticated

GRANT SELECT ON group_members_visible TO authenticated; 