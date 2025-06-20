drop policy "Group creator can add members" on "public"."group_members";

drop policy "Group members are viewable by group members" on "public"."group_members";

drop policy "Users can join with valid invite" on "public"."group_members";

alter table "public"."achievements" drop constraint "achievements_group_id_fkey";

alter table "public"."achievements" drop constraint "achievements_user_id_fkey";

alter table "public"."activities" drop constraint "activities_status_check";

alter table "public"."activities" drop constraint "activities_type_check";

alter table "public"."balances" drop constraint "balances_status_check";

alter table "public"."group_invites" drop constraint "group_invites_group_id_fkey";

alter table "public"."group_invites" drop constraint "group_invites_invited_by_fkey";

alter table "public"."group_invites" drop constraint "group_invites_used_by_fkey";

alter table "public"."group_members" drop constraint "group_members_role_check";

alter table "public"."groups" drop constraint "groups_payment_cycle_check";

drop index if exists "public"."idx_activities_group_id_date";

drop index if exists "public"."idx_activities_user_id_date";

drop index if exists "public"."idx_balances_group_id_cycle";

drop index if exists "public"."idx_group_members_group_id";

drop index if exists "public"."idx_group_members_user_id";

drop index if exists "public"."idx_users_email";

drop index if exists "public"."idx_votes_activity_id";

drop index if exists "public"."idx_votes_voter_id";

alter table "public"."achievements" add column "created_at" timestamp with time zone default CURRENT_TIMESTAMP;

alter table "public"."activities" alter column "excuse_category" set data type text using "excuse_category"::text;

alter table "public"."activities" alter column "exercise_type" set data type text using "exercise_type"::text;

alter table "public"."activities" alter column "status" set default 'pending'::text;

alter table "public"."activities" alter column "status" set data type text using "status"::text;

alter table "public"."activities" alter column "type" set data type text using "type"::text;

alter table "public"."balances" alter column "status" set default 'pending'::text;

alter table "public"."balances" alter column "status" set data type text using "status"::text;

alter table "public"."group_invites" alter column "expires_at" set not null;

alter table "public"."group_invites" alter column "group_id" set not null;

alter table "public"."group_invites" alter column "invited_by" set not null;

alter table "public"."group_members" alter column "role" set data type text using "role"::text;

alter table "public"."groups" alter column "emoji" set data type text using "emoji"::text;

alter table "public"."groups" alter column "name" set data type text using "name"::text;

alter table "public"."groups" alter column "payment_cycle" set data type text using "payment_cycle"::text;

alter table "public"."groups" alter column "theme_color" set data type text using "theme_color"::text;

alter table "public"."votes" alter column "comment_type" set data type text using "comment_type"::text;

CREATE INDEX idx_achievements_group_id ON public.achievements USING btree (group_id);

CREATE INDEX idx_achievements_type ON public.achievements USING btree (type);

CREATE INDEX idx_achievements_user_id ON public.achievements USING btree (user_id);

alter table "public"."group_invites" add constraint "valid_invite" CHECK ((((used_at IS NULL) AND (used_by IS NULL)) OR ((used_at IS NOT NULL) AND (used_by IS NOT NULL)))) not valid;

alter table "public"."group_invites" validate constraint "valid_invite";

alter table "public"."achievements" add constraint "achievements_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;

alter table "public"."achievements" validate constraint "achievements_group_id_fkey";

alter table "public"."achievements" add constraint "achievements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."achievements" validate constraint "achievements_user_id_fkey";

alter table "public"."activities" add constraint "activities_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'valid'::text, 'invalid'::text]))) not valid;

alter table "public"."activities" validate constraint "activities_status_check";

alter table "public"."activities" add constraint "activities_type_check" CHECK ((type = ANY (ARRAY['exercise'::text, 'excuse'::text, 'auto_excuse'::text]))) not valid;

alter table "public"."activities" validate constraint "activities_type_check";

alter table "public"."balances" add constraint "balances_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text]))) not valid;

alter table "public"."balances" validate constraint "balances_status_check";

alter table "public"."group_invites" add constraint "group_invites_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;

alter table "public"."group_invites" validate constraint "group_invites_group_id_fkey";

alter table "public"."group_invites" add constraint "group_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."group_invites" validate constraint "group_invites_invited_by_fkey";

alter table "public"."group_invites" add constraint "group_invites_used_by_fkey" FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."group_invites" validate constraint "group_invites_used_by_fkey";

alter table "public"."group_members" add constraint "group_members_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text]))) not valid;

alter table "public"."group_members" validate constraint "group_members_role_check";

alter table "public"."groups" add constraint "groups_payment_cycle_check" CHECK ((payment_cycle = ANY (ARRAY['weekly'::text, 'monthly'::text]))) not valid;

alter table "public"."groups" validate constraint "groups_payment_cycle_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_streak_days_on_valid_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    last_activity_date DATE;
BEGIN
    -- Only run if status is being set to 'valid' and it wasn't valid before
    IF NEW.status = 'valid' AND (OLD.status IS DISTINCT FROM 'valid') THEN
        -- Get the last activity date for this user/group before today
        SELECT MAX(date) INTO last_activity_date
        FROM activities
        WHERE user_id = NEW.user_id
          AND group_id = NEW.group_id
          AND status = 'valid'
          AND date < NEW.date;

        -- If last activity was yesterday, increment streak, else reset to 1
        IF last_activity_date = NEW.date - INTERVAL '1 day' THEN
            UPDATE group_members
            SET streak_days = streak_days + 1
            WHERE user_id = NEW.user_id AND group_id = NEW.group_id;
        ELSE
            UPDATE group_members
            SET streak_days = 1
            WHERE user_id = NEW.user_id AND group_id = NEW.group_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_record(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.users (id, email, name)
    SELECT id, email, raw_user_meta_data->>'name'
    FROM auth.users
    WHERE id = user_id
    ON CONFLICT (id) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$function$
;

create policy "All can select achievements"
on "public"."achievements"
as permissive
for select
to public
using (true);


create policy "System can insert achievements"
on "public"."achievements"
as permissive
for insert
to public
with check (true);


create policy "Users can view achievements in their groups"
on "public"."achievements"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = achievements.group_id) AND (group_members.user_id = auth.uid())))));


create policy "Users can view their own achievements"
on "public"."achievements"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Group members are viewable by group creator"
on "public"."group_members"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM groups g
  WHERE ((g.id = group_members.group_id) AND (g.created_by = auth.uid())))));


CREATE TRIGGER trigger_update_streak_days AFTER UPDATE OF status ON public.activities FOR EACH ROW EXECUTE FUNCTION update_streak_days_on_valid_activity();


