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
- Wallet connection uses TON Connect via the lazy browser-only singleton in `src/lib/ton-connect.ts`; its manifest is served from `/api/public/tonconnect-manifest` using the request origin. Why: the wallet library must never run during SSR, and the manifest must match whatever domain the app is opened on.
- Each start slide has a live canvas effect (`StoryEffects.tsx`) chosen by the slide's `effect` field; effect anchor points are fractions of the artwork, so they must be re-tuned if a slide image changes. Each slide plays a looping muted clip (`video`) with its still `image` as poster; clips are 720x1280, no audio, and must start on the still so the poster-to-video swap is invisible.
