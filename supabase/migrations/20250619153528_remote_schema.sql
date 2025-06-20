create policy "Enable select for authenticated users"
on "public"."achievements"
as permissive
for select
to public
using ((auth.uid() = user_id));



