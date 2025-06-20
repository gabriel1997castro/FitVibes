create policy "Allow all select"
on "public"."achievements"
as permissive
for select
to public
using (true);



