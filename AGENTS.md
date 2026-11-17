<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- App is Arabic RTL (`dir="rtl"` on `<html>`); use logical directions (origin-right for RTL progress, ChevronLeft = forward). Why: every screen reads right-to-left.
- Start page is a story onboarding in `src/components/onboarding/` with slide content in `story-slides.ts`; visual tokens (glass, story-fade, btn-cta, story animations) live in `src/styles.css`. Why: slides and copy change often without touching layout.
- Wallet connection uses TON Connect via the lazy browser-only singleton in `src/lib/ton-connect.ts`; its manifest and icon are served from `/api/public/*` (never `public/`), and login-protected preview hosts are mapped to the public dev host. Why: wallets fetch the manifest from their own servers, so it must be reachable without a login.
- Each start slide has a live canvas effect (`StoryEffects.tsx`) chosen by the slide's `effect` field; effect anchor points are fractions of the artwork, so they must be re-tuned if a slide image changes. Each slide plays a looping muted clip (`video`) with its still `image` as poster; clips are 720x1280, no audio, and must start on the still so the poster-to-video swap is invisible.
- The Supabase database is shared with the owner's other bots; this app's tables and functions use the `wall_` prefix and never touch other prefixes. Why: avoids clobbering other apps' data.
- Players are identified by Telegram Mini App `initData`, verified server-side with `TELEGRAM_BOT_TOKEN` (`src/lib/telegram.server.ts`); player tables are server-only (service role), and balance changes go through `wall_*` security-definer functions. Why: there is no Supabase Auth; the browser must never write balances.
- Task/check-in rules live in `src/lib/tasks-model.ts` (tested) and are mirrored by the `wall_daily_checkin` / `wall_claim_task` DB functions; change both together. Why: the UI predicts states that the DB enforces.
- Icons are animated Lottie emoji from Telegram's "The Open Emoji" pack, stored as asset JSON and registered in `src/components/emoji/emoji-registry.ts`; `AnimatedEmoji` tints them from CSS `color`. Why: owner wants this pack instead of icon fonts; the pack is monochrome repaintable.
- The coin name/symbol lives only in `src/lib/coin.ts`. Why: the final name is not decided yet.
- Hero economy (5 heroes x 200 levels, storage cap, costs) lives in src/lib/heroes-model.ts (tested) and is mirrored by wall_hero_rate/wall_hero_cost/wall_upgrade_hero in the DB; change both together. Why: UI predicts what the DB enforces.
- TON payments: server creates a wall_payments row, wallet sends to the treasury with comment wall:<id> (BOC built by commentPayload in src/lib/shop-model.ts, no Buffer), server verifies on toncenter and credits via wall_confirm_payment. Why: credits only after on-chain proof, once.
- Battle segments use two video decoders and seek only the hidden one before a crossfade. Why: avoid visible jumps, mirror flips and blank frames during playback.
- Wallet uses existing Telegram-verified player/hero reads and TON Connect; do not imply an on-chain game-token balance, withdrawals or NFTs exist. Why: those services are not implemented.
- Portable source exports must include downloaded CDN assets with local pointer URLs, migrations and setup notes, excluding secrets, user data, Git metadata, dependencies and build output. Why: another developer can continue without relying on Lovable media hosting.
