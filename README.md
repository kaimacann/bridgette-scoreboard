# Bridgette’s Strikes

A baseball strike scoreboard where each board belongs to its creator and can be shared with a strikee by email.

**Website:** [bridgette-scoreboard.netlify.app](https://bridgette-scoreboard.netlify.app) · **GitHub:** [kaimacann/bridgette-scoreboard](https://github.com/kaimacann/bridgette-scoreboard)

## Accounts and sharing

Accounts use Neon Auth. Scoreboard data and share invitations are stored in Neon Postgres and exposed through the Neon Data API. The creator can invite a strikee by email; after the strikee creates an account with that email, the shared board appears in their account. Both creator and strikee can update pitcher strike counts. Row-level security in [`migrations/0001_accounts_and_scoreboards.sql`](migrations/0001_accounts_and_scoreboards.sql) limits each database request to the signed-in user’s own or shared boards.

The old site editor key was a single static Netlify secret checked by the write function. It was not linked to a user, so the deployed app could only ask everyone for the same key, and writes failed when that secret was absent. The key prompt and Blobs-backed function have been removed from the app.

## Local development

Use Node.js 22.19 or later and pnpm 10.30.3. Copy `.env.example` to `.env` and set the public Neon Auth URL and Neon Data API URL for a development Neon branch. Then start Astro:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Astro (normally `http://localhost:4321`). Without the Neon URLs, the local page displays a setup message; authentication and persistent accounts require Neon Auth and the Data API to be provisioned.

Useful checks:

```sh
pnpm check
pnpm test
pnpm build
```

## Neon setup

On the Neon development branch, enable Neon Auth and the Neon Data API, add `http://localhost:4321` and the production site origin to Neon Auth’s trusted domains, then apply the checked-in SQL migration. Apply the migration through a versioned migration workflow on a temporary Neon branch first, and verify creator, strikee, and unrelated-account access before applying it to production.

Set these **public endpoint URLs** in the local `.env` and Netlify’s build environment:

| Variable | Value |
| --- | --- |
| `PUBLIC_NEON_AUTH_URL` | The branch’s Neon Auth endpoint URL |
| `PUBLIC_NEON_DATA_API_URL` | The branch’s Neon Data API REST endpoint URL |

These URLs are public. User authorization is enforced by short-lived Neon Auth JWTs and Postgres row-level security. Do not add a database connection string, Neon API key, or password to these public variables.

## Netlify

The Netlify project is [bridgette-scoreboard](https://app.netlify.com/projects/bridgette-scoreboard). It builds this repository from its root using `pnpm build` and publishes `dist/`, as configured in [`netlify.toml`](netlify.toml). Set the two public endpoint variables above in Netlify’s build environment after Neon is provisioned. The static site does not need a shared editor secret or a serverless function.
