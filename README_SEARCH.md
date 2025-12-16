Search setup
--------------

1. Set environment variables in your deployment (Vercel/Supabase):
   - `SUPABASE_URL` (e.g., https://your-project.supabase.co)
   - `SUPABASE_ANON_KEY` (anon/public key)

2. Create `cards_minimal` table in your Postgres (use `db/init_cards_minimal.sql`).

3. Import `baseball_output_minimal.csv` to `cards_minimal` table (via Supabase UI -> Table Editor -> Import CSV).

4. The backend exposes a search endpoint at `/api/search/players?q=키워드` which proxies the Supabase REST API.
   - Supports pagination: `limit` (default 30), `page` or `offset` parameters.
   - Results are ordered by similarity (pg_trgm) for better fuzzy matching.
   - Frontend uses infinite scroll and fetches additional results in +10 increments after the initial 30.

5. Frontend uses the `apiBaseUrl` configured in `App.jsx` to call the search endpoint.
