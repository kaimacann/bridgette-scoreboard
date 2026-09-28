# Community Scoreboard

A shared baseball scoreboard for tracking pitchers and their strike counts.

**Website:** [bridgette-scoreboard.netlify.app](https://bridgette-scoreboard.netlify.app) · **GitHub:** [kaimacann/bridgette-scoreboard](https://github.com/kaimacann/bridgette-scoreboard)

## Features

- Add, select, and remove pitchers
- Track each pitcher's strike count
- Read the shared board without an editor key
- Save changes through the site’s authenticated API

The API is available at `/api/bridgette`. `GET` returns the shared board; `PUT` requires a bearer token. Scoreboard data is stored in the `bridgette-dashboard` Netlify Blobs store under the `scoreboard` key.

## Run locally

Use Node.js 22.19 or later and pnpm 10.30.3.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Useful checks:

```sh
pnpm check
pnpm build
```

The development server prints the local URL when it starts. The production build is written to `dist/`.

## Deploy on Netlify

The Netlify project is [bridgette-scoreboard](https://app.netlify.com/projects/bridgette-scoreboard), and its intended public URL is [bridgette-scoreboard.netlify.app](https://bridgette-scoreboard.netlify.app). Connect this repository to that project, using the repository root as the base directory. The checked-in [`netlify.toml`](netlify.toml) configures the `pnpm build` command, `dist` publish directory, Netlify Function directory, API rewrite, and Node.js 22.19 runtime.

### Runtime variables

Provision these variables to the project's **Production Functions** environment through the team’s secret-management process. Keep secret values out of this repository and out of pull requests.

| Variable | Purpose |
| --- | --- |
| `BRIDGETTE_EDITOR_TOKEN` | Secret bearer token required to save scoreboard changes. Keep this configured after migration. |
| `BRIDGETTE_MIGRATION_SITE_ID` | Site ID of the current Netlify site that holds the existing scoreboard. This is already configured on the new Netlify project. |
| `BRIDGETTE_MIGRATION_BLOBS_TOKEN` | Temporary secret with read access to the source site's Blobs store. The first successful read copies the existing scoreboard into this site's store. Remove this variable after verifying the copy. |

Until migration access is configured, the API returns `503` rather than creating a default board. This protects the existing scoreboard from being overwritten before its data is copied.
