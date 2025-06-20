-- Migration: Fix get_user_groups_for_posting function with proper type casting

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS public.get_user_groups_for_posting(UUID);

CREATE OR REPLACE FUNCTION public.get_user_groups_for_posting(p_user_id UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(255),
    group_emoji VARCHAR(10),
    theme_color VARCHAR(7),
    is_member BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as group_id,
        g.name::VARCHAR(255) as group_name,
        g.emoji::VARCHAR(10) as group_emoji,
        g.theme_color::VARCHAR(7) as theme_color,
        true as is_member
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = p_user_id
    ORDER BY g.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_groups_for_posting TO authenticated; 