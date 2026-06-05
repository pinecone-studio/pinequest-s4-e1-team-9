grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.documents to anon, authenticated;

grant usage, select on sequence public.documents_id_seq to anon, authenticated;

grant execute on function public.match_documents(vector, integer, jsonb) to anon, authenticated;
