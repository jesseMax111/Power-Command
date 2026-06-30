---
name: Clerk Expo proxy setup
description: How Clerk auth is wired for the Expo mobile app in this project
---

The API server hosts a Clerk proxy at `/api/__clerk` (via `clerkProxyMiddleware`).

The Expo dev script prepends `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY` so the key is exposed to Metro at build time.

The build script (`scripts/build.js`) also injects `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CLERK_PROXY_URL` into the Metro environment.

`ClerkProvider` in `app/_layout.tsx` uses:
- `publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL`

`setAuthTokenGetter` is called in `(home)/_layout.tsx` to attach Bearer tokens to every API request.

**Why:** Expo Go has no cookie jar, so auth must use Bearer tokens. The proxy lets the mobile app authenticate through the same domain without CORS issues.

**How to apply:** Always wire up `setAuthTokenGetter` in the authenticated layout, never in web-only code.
