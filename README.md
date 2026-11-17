# منجم الأسوار — developer handoff

Arabic RTL Telegram Mini App built with React 19, TanStack Start, Tailwind v4 and Supabase. Read `AGENTS.md` before making changes.

## Screens

- `/`: animated onboarding and TON Connect.
- `/tasks`: real tasks and daily check-in.
- `/heroes`: five heroes, 200 levels each, upgrades and TON coin packs.
- `/battle`: two-decoder video crossfades, mining storage and rewarded ads.
- `/wallet`: in-game balance, pending mining, TON connection, coin packs and real check-in/referral totals.

## Backend and safety

The database is shared with other bots. Only the `wall_` tables/functions belong to this game. Existing schema migrations are included under `supabase/migrations`; review them before applying to a fresh database. No live player data is included in source exports.

Players authenticate through signed Telegram `initData`, not Supabase Auth. Verify it on the server before using privileged database access. Public browser checks do not verify real balances or purchases; these require launching from Telegram. Never put the bot token or service-role key in frontend code or a repository.

TON payments are verified on-chain before crediting coins. Treasury and proposed coin-pack prices still require owner confirmation before production payments. Game coins are internal balances, not an issued on-chain token. Token withdrawals, market charts, NFT passes and public payment feeds are not implemented. Wallet connection alone is not proof of ownership for withdrawals.

Monetag zone: `12281067`. Coin name is temporary and centralized in `src/lib/coin.ts`. Two heroes still use earlier battle clips rather than the newer arena-style clips.

## Development

Install Bun, copy `.env.example` to `.env` and supply your secure configuration. Server secrets must be configured separately from Vite's public environment variables. Deployment needs a runtime compatible with the project's Cloudflare Worker target.

```sh
bun install
bun run dev
bun run test
```

## Media and portable exports

In Lovable, downloaded videos and animated emoji use `.asset.json` pointers; generated stills are imported directly. Create an independent copy with all referenced CDN assets downloaded locally:

```sh
python3 scripts/export-source.py --origin http://localhost:8080 --output /tmp/wall-handoff
```

The output includes source, stills, videos, emoji, migrations and setup notes. Pointer URLs are rewritten to `/media/...`; binaries are in `public/media`. `media-manifest.json` records sizes and SHA-256 checksums. The export excludes real environment files, Git metadata, dependencies and build output. Configure secrets separately. Inspect the output before archiving. Large videos may exceed GitHub limits; use Git LFS or release attachments for those files.

## GitHub sync

Connect from Lovable **Project settings → Git → GitHub**. Lovable creates a new private repository and syncs code; the agent cannot establish Git sync or inspect its status. The portable ZIP is separate from this sync and includes physical CDN media.
