import { supabase } from './supabase';

export interface ActivityFeedItem {
  id: string;
  group_id: string;
  user_id: string;
  type: 'exercise' | 'excuse' | 'auto_excuse';
  exercise_type?: string;
  duration_minutes?: number;
  excuse_category?: string;
  excuse_text?: string;
  status: 'pending' | 'valid' | 'invalid';
  created_at: string;
  date: string;
  group_name: string;
  group_emoji: string;
  group_color: string;
  user_name: string;
  user_avatar?: string;
  vote_count: number;
  valid_votes: number;
  invalid_votes: number;
  reactions: ActivityReaction[];
}

export interface ActivityReaction {
  id: string;
  reaction_type: 'like' | 'fire' | 'clap' | 'heart';
  user_id: string;
  created_at: string;
}

export class ActivitiesFeedService {
  static async getFeed(
    cursor?: string,
    limit: number = 20,
    groupFilter?: string
  ): Promise<{ data: ActivityFeedItem[]; nextCursor?: string }> {
    try {
      // First, get the current user's groups
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('User authenticated:', user.id);

      // Get user's groups
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (groupsError) {
        console.error('Error fetching user groups:', groupsError);
        throw groupsError;
      }

      console.log('User groups:', userGroups);

      const userGroupIds = userGroups.map(g => g.group_id);

      if (userGroupIds.length === 0) {
        console.log('No groups found for user');
        return { data: [], nextCursor: undefined };
      }

      console.log('User group IDs:', userGroupIds);

      // Build the query using direct table joins instead of the view
      let query = supabase
        .from('activities')
        .select(`
          *,
          groups!inner(name, emoji, theme_color),
          users!inner(name, avatar_url),
          votes(id, is_valid)
        `)
        .in('group_id', userGroupIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      if (groupFilter) {
        query = query.eq('group_id', groupFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }

      console.log('Raw activities data:', data);

      // Transform the data to match the expected format
      const transformedData: ActivityFeedItem[] = (data || []).map(activity => {
        const voteCount = activity.votes?.length || 0;
        const validVotes = activity.votes?.filter(v => v.is_valid).length || 0;
        const invalidVotes = activity.votes?.filter(v => !v.is_valid).length || 0;

        return {
          id: activity.id,
          group_id: activity.group_id,
          user_id: activity.user_id,
          type: activity.type,
          exercise_type: activity.exercise_type,
          duration_minutes: activity.duration_minutes,
          excuse_category: activity.excuse_category,
          excuse_text: activity.excuse_text,
          status: activity.status,
          created_at: activity.created_at,
          date: activity.date,
          group_name: activity.groups.name,
          group_emoji: activity.groups.emoji,
          group_color: activity.groups.theme_color,
          user_name: activity.users.name,
          user_avatar: activity.users.avatar_url,
          vote_count: voteCount,
          valid_votes: validVotes,
          invalid_votes: invalidVotes,
          reactions: [] // Will be populated below
        };
      });

      // Get reactions for each activity
      const activitiesWithReactions = await Promise.all(
        transformedData.map(async (activity) => {
          const { data: reactions } = await supabase
            .from('activity_reactions')
            .select('*')
            .eq('activity_id', activity.id);

          return {
            ...activity,
            reactions: reactions || []
          };
        })
      );

      const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : undefined;

      return {
        data: activitiesWithReactions,
        nextCursor
      };
    } catch (error) {
      console.error('Error in getFeed:', error);
      throw error;
    }
  }

  static async addReaction(
    activityId: string,
    reactionType: 'like' | 'fire' | 'clap' | 'heart'
  ): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      
      if (!user) {
        console.error('No user found');
        throw new Error('User not authenticated');
      }

      console.log('Adding reaction:', { activityId, reactionType, userId: user.id });
      console.log('User session valid:', !!user);

      // Test if we can access the table at all
      const { data: testData, error: testError } = await supabase
        .from('activity_reactions')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Test query error:', testError);
        throw new Error('Cannot access activity_reactions table: ' + testError.message);
      }

      console.log('Test query successful, proceeding with insert');

      const { error } = await supabase
        .from('activity_reactions')
        .upsert({
          activity_id: activityId,
          reaction_type: reactionType,
          user_id: user.id
        });

      if (error) {
        console.error('Error adding reaction:', error);
        throw error;
      }

      console.log('Reaction added successfully');
    } catch (error) {
      console.error('Error in addReaction:', error);
      throw error;
    }
  }

  static async removeReaction(
    activityId: string,
    reactionType: 'like' | 'fire' | 'clap' | 'heart'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Removing reaction:', { activityId, reactionType, userId: user.id });

      const { error } = await supabase
        .from('activity_reactions')
        .delete()
        .eq('activity_id', activityId)
        .eq('reaction_type', reactionType)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }

      console.log('Reaction removed successfully');
    } catch (error) {
      console.error('Error in removeReaction:', error);
      throw error;
    }
  }

  static async getUserGroups(): Promise<Array<{ id: string; name: string; emoji: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups!inner(name, emoji)
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.group_id,
      name: item.groups.name,
      emoji: item.groups.emoji
    }));
  }
} 