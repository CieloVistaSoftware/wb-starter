# WB Pro waitlist Worker

Issue #1961. The WB Pro page's "Join the waitlist" form posts here. The site
itself is static (GitHub Pages) and cannot store anything, so this small
Cloudflare Worker keeps the list, in a Cloudflare D1 database.

| Address | What it does |
|---|---|
| `POST https://waitlist.cielovistasoftware.com/join` | Saves one email address. Answers with a "You are on the list" page. |
| `GET https://waitlist.cielovistasoftware.com/export` | The whole list as CSV. Needs the export token. |

## How it is protected

- Only the live site may post; other sites get 403. A Worker run locally by
  `npm run pro:local` (LOCAL_DEV=1) also takes a site on this PC, any port.
- Only a form body, at most 2 KB (415 / 413 otherwise).
- At most 5 tries an hour per visitor (429 after that). Visitors are counted by a
  salted SHA-256 of their IP address; the address itself is never stored.
- A hidden `website` field catches bots: they are told it worked, nothing is kept.
- Joining twice keeps one row. SQL is parameterized; typed text is escaped.
- `/export` needs the token, compared in constant time.
- Every answer: `no-store`, no framing, a deny-by-default content policy.
- Only `waitlist.cielovistasoftware.com` answers (`workers_dev = false`).

Locally, every test request comes from the same address, so after 5 tries in an
hour you get "Too many tries". Clear it with:
`npx wrangler d1 execute pro-waitlist --local --command "DELETE FROM join_attempts"`

## Run it locally (no Cloudflare account needed)

Two PowerShell windows, both from the repo root:

1. The site: `npm start`, then open http://localhost:3000/?page=pro
2. The Worker, with a local database on your PC:
   `cd server\waitlist`
   `npx wrangler d1 execute pro-waitlist --local --file=schema.sql`
   `npx wrangler dev --var PRO_PAGE_URL:http://localhost:3000/?page=pro`

On localhost the Pro page's form posts to the Worker at `http://localhost:8787/join`.
See who joined: `npx wrangler d1 execute pro-waitlist --local --command "SELECT * FROM waitlist"`

## Deploy (once, from this folder, on John's PC)

Run these in PowerShell from `server\waitlist`:

1. Log in to Cloudflare (opens the browser):
   `npx wrangler login`
2. Create the database, then copy the `database_id` it prints into
   `wrangler.toml` in place of `REPLACE_WITH_DATABASE_ID`:
   `npx wrangler d1 create pro-waitlist`
3. Create the table:
   `npx wrangler d1 execute pro-waitlist --remote --file=schema.sql`
4. Set the export token (it asks for the value; pick a long random one and keep it):
   `npx wrangler secret put EXPORT_TOKEN`
5. Set the salt for visitor fingerprints (any long random value; you never need it again):
   `npx wrangler secret put IP_SALT`
6. Deploy:
   `npx wrangler deploy`

Step 6 also creates `waitlist.cielovistasoftware.com`, because the domain is on
the same Cloudflare account.

## Get the list

In PowerShell, with your token in place of `<token>`:

`Invoke-WebRequest https://waitlist.cielovistasoftware.com/export -Headers @{ Authorization = "Bearer <token>" } -OutFile waitlist.csv`

## Removing someone

If someone asks to be removed:

`npx wrangler d1 execute pro-waitlist --remote --command "DELETE FROM waitlist WHERE email = 'their@address'"`

## Tests

`tests/regression/waitlist-worker.spec.ts` runs the Worker against an in-memory
database. It needs no Cloudflare account.
