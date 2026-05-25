This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Courier Guy / PUDO Setup

To enable live PUDO point lookup, configure these environment variables in local `.env` and in Vercel Project Settings:

```bash
COURIER_GUY_API_KEY=""
# Optional alternative to API key auth:
COURIER_GUY_USERNAME=""
COURIER_GUY_PASSWORD=""

# Optional overrides (defaults shown):
COURIER_GUY_BASE_URL="https://api.thecourierguy.co.za"
COURIER_GUY_PUDO_LOCATIONS_PATH="/v1/pudo/locations"
```

Checkout now calls `GET /api/courier/pudo/locations` to search PUDO points and stores the selected point on the order metadata.

## Shipping Prices

Default shipping prices are configured in `lib/shipping.ts`:

- Home Delivery: `99`
- PUDO Pickup: `60`

These are applied in checkout UI and enforced again server-side before payment.

## Site Settings Isolation

If local development and production use the same database, set different settings rows per environment:

```bash
# Optional override. Defaults:
# - production: 1
# - non-production (localhost/dev): 2
SITE_SETTINGS_ROW_ID="2"
```

This keeps admin "Site Settings" changes in localhost from affecting production.
