# Neloy Digital Solutions — Brand Website Redesign

This package is built for the Cloudflare Worker named:

`neloy-digital-solutions`

## What is included

- Full branded homepage
- Responsive header and hero
- Six core service cards
- Client Projects Completed / portfolio section
- Project filters
- Latest Social Updates / blog section
- Automatic Facebook + Instagram feed endpoint
- Cloudflare Worker API layer
- Cloudflare Static Assets configuration
- Mobile navigation
- Branded footer

## Important: your exact PNG logo

The package includes a clean SVG brand fallback so the site works immediately.
To use your exact existing PNG logo, replace:

`public/assets/brand-logo.svg`

with your PNG and then change both logo image paths in `public/index.html` to your PNG filename.

Recommended filename:
`public/assets/neloy-digital-solutions-logo.png`

## Deploy to the SAME Cloudflare Worker URL

If your GitHub repository is connected to the existing Cloudflare Worker:

1. Replace the old website files with this package.
2. Commit and push to the same repository.
3. Keep the Worker/project name `neloy-digital-solutions`.
4. Cloudflare should deploy the update to the same Worker project.

Command-line deployment:
`npm install`
`npm run deploy`

## Social-to-Blog automation

The website calls `/api/social`.
Your Cloudflare Worker securely calls the social platform API.
Tokens never need to appear in browser JavaScript.

### Facebook Page

Add:
- `META_PAGE_ID` — variable
- `META_PAGE_ACCESS_TOKEN` — SECRET

### Instagram Business/Creator

Add:
- `INSTAGRAM_USER_ID` — variable
- `INSTAGRAM_ACCESS_TOKEN` — SECRET

### API version

`META_GRAPH_VERSION` is currently set in `wrangler.toml`.

If Meta asks you to use a newer supported version, update that variable.

## Cloudflare dashboard setup

Go to:
Workers & Pages → neloy-digital-solutions → Settings → Variables and Secrets

Store access tokens as Secrets, not normal public variables.

Do not commit tokens to GitHub.

## Client Projects section

Edit the three project cards in:
`public/index.html`

Replace the sample project title, description and visuals with your real completed work.
Do not publish a client name, logo or private project screenshot unless you have permission.

## Contact button

The current CTA uses:
`hello@example.com`

Replace it with your real business contact email or a WhatsApp/Facebook URL before final launch.
