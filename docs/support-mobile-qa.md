# Support & donation — QA checklist

Manual and automated validation for the PatternForge donation flow (backend-free: Stripe Payment Links, static crypto, local suppression, telemetry).

**Automated:** `pnpm test` (unit) · `pnpm test:e2e` (Playwright, see `e2e/support-donation.spec.ts`)

---

## Desktop

- [ ] `/support` loads — hero, creator note, card + crypto sections
- [ ] Stripe tiers (A$5–A$50) link to valid `buy.stripe.com` URLs
- [ ] Crypto QR codes render; **Copy address** works
- [ ] Sidebar/footer **Support PatternForge** links reach `/support`
- [ ] `/support/success` thank-you page and CTAs work

## Mobile (390×844, 430×932)

- [ ] No horizontal scroll on `/support` or `/support/success`
- [ ] Donation cards stack; touch targets ≥ ~44px
- [ ] QR codes readable but not oversized
- [ ] Long addresses wrap; copy buttons full-width on narrow screens

## PWA (Add to Home Screen)

- [ ] Open app from home screen icon (standalone)
- [ ] Navigate to `/support` from sidebar
- [ ] Stripe checkout opens from PWA (may hand off to system browser on iOS)
- [ ] Success URL returns to `/support/success` in same or linked browser context
- [ ] **Return to training** returns to `/app/training`

## Stripe (test mode / real links — no automated payment)

- [ ] **Test payment** — complete checkout in Stripe test/live link; land on `/support/success`
- [ ] **Cancel return** — cancel checkout; land on `/support`
- [ ] **Success return** — page stable, no loading flash; works with `?payment_intent=…&redirect_status=succeeded`
- [ ] Double-tap on tier shows “Opening Stripe…” once; no duplicate tabs

## Crypto

- [ ] BTC address copies and QR scans
- [ ] Lightning address copies and QR scans (`lightning:` URI)
- [ ] No wallet-connect prompts

## Support prompts (reflection / cycle completion only)

- [ ] Prompt on **completed cycle summary** (`/app/cycle/…/summary`)
- [ ] Prompt on **Reflection** (`/app/progress` when no active cycle)
- [ ] **Not** on `/app/training` or board during solving
- [ ] **Support the project** → `/support`
- [ ] **Maybe later** hides prompt; stays hidden after reload (14-day dismiss)
- [ ] Support CTA click suppresses ~90 days

## Telemetry (optional — DevTools Network / Vercel dashboard)

- [ ] `support_page_view` once per session on `/support`
- [ ] `donation_stripe_checkout_open` on tier click
- [ ] `support_cta_click` with source on prompt/sidebar/footer
- [ ] `donation_stripe_success_return` once on `/support/success`

## Regression

- [ ] Training session flow unchanged
- [ ] No donation modal over chessboard
- [ ] No backend donation API routes added
- [ ] No Stripe secret keys in client bundle/HTML
- [ ] No donor identity, accounts, or public recognition

## Stripe Dashboard redirect URLs

| Outcome | URL |
|---------|-----|
| Success | `{ORIGIN}/support/success` |
| Cancel | `{ORIGIN}/support` |

Local: `http://localhost:3000/…` — Production: match `NEXT_PUBLIC_SITE_URL`.
