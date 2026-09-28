# Community Scoreboard

A standalone Astro site for the shared baseball strike board.

## Development

- `pnpm install`
- `pnpm dev`
- `pnpm check`
- `pnpm build`

Netlify builds from the repository root with `pnpm build` and publishes `dist`.

## Netlify configuration

The site uses the `bridgette-dashboard` Netlify Blobs store. Configure `BRIDGETTE_EDITOR_TOKEN` as a production Functions secret. To migrate the existing scoreboard once, also provision `BRIDGETTE_MIGRATION_SITE_ID` and `BRIDGETTE_MIGRATION_BLOBS_TOKEN` to the production Functions environment. The scoreboard stays unavailable until migration access is configured, preserving existing data. Verify the migrated board, then remove both migration variables. Keep secret values in the team secret store, never in this repository.
