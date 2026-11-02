# WB Pro waitlist Worker

Issue #1961. The WB Pro page's "Join the waitlist" form posts here. The site
itself is static (GitHub Pages) and cannot store anything, so this small
Cloudflare Worker keeps the list, in a Cloudflare D1 database.

| Address | What it does |
|---|---|
| `POST https://waitlist.cielovistasoftware.com/join` | Saves one email address. Answers with a "You are on the list" page. |
| `GET https://waitlist.cielovistasoftware.com/export` | The whole list as CSV. Needs the export token. |

It only accepts sign-ups from the live site and from `localhost:3000`. A hidden
`website` field catches bots, and joining twice keeps one row.

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
5. Deploy:
   `npx wrangler deploy`

Step 5 also creates `waitlist.cielovistasoftware.com`, because the domain is on
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
