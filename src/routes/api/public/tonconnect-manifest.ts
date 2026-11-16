import { createFileRoute } from "@tanstack/react-router";

// Public manifest that TON wallets fetch before connecting. Built from the request
// origin so it matches whichever domain (preview, published, custom) the app runs on.
export const Route = createFileRoute("/api/public/tonconnect-manifest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return Response.json(
          {
            url: origin,
            name: "منجم الأسوار",
            iconUrl: `${origin}/wallet-icon.png`,
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=300",
            },
          },
        );
      },
    },
  },
});
