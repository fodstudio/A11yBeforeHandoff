# A11y Handoff

A practical accessibility handoff tool for everyone building digital products.

See [SEO.md](./SEO.md) for the search positioning, page-to-query map, content priorities, and launch checklist.

This starter contains:

- **Web app** — a quick checklist, component-specific guidance, search, filters, and local progress tracking.
- **Three languages** — complete English, Japanese, and Korean interface and guidance content.
- **Light and dark themes** — follows the system on first visit, then remembers the reader's choice.
- **URL accessibility report** — fetches a public page, runs a safe static-HTML first pass, scores automated findings, separates manual checks, and exports JSON.
- **Public Figma review** — recognizes Design, Prototype, FigJam, and Slides share links, preserves targeted node IDs, embeds the public preview, and creates a team-focused manual review report without inventing an automated compliance score.
- **Figma plugin MVP** — selection checks, a manual handoff checklist, annotation creation, and Markdown/JSON export.
- **Shared content package** — one typed source of truth for guidance used by both experiences.

The product deliberately does not promise a full WCAG audit. It focuses on the decisions product teams can make and document during design and handoff.

## Project structure

```text
apps/
  web/                 React + TypeScript + Vite
  server/              Express + Cheerio URL analysis API
  figma-plugin/        Figma Plugin API + TypeScript + esbuild
packages/
  content/             Shared categories, checks, and component guidance
```

## Run locally

Requirements: Node.js 20 or newer and npm 10 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

`npm run dev` starts both the web app and the local analysis API. The URL audit accepts public HTTP(S) pages only. It blocks loopback and private-network destinations, revalidates redirects, limits responses to 2 MB, and times out slow requests.

Useful commands:

```bash
npm run typecheck       # Type-check every workspace
npm run build           # Build the website and Figma plugin
npm run dev:plugin      # Rebuild the plugin when source files change
```

## Deploy to DigitalOcean App Platform

The production web app and URL analysis API run together as one Node.js web service. The server reads DigitalOcean's `PORT` environment variable, listens on `0.0.0.0`, serves the built Vite files, and exposes `/api/health` for health checks.

After this folder is pushed to a GitHub repository, create an App Platform **Web Service** with these settings:

```text
Source directory: /
Environment: Node.js
Build command: npm run deploy:build
Run command: npm start
HTTP port: 8080
Health check path: /api/health
Instance: 1 vCPU / 512 MiB fixed ($5/month)
Environment variable: NODE_ENV=production
Secret environment variable: RESEND_API_KEY=your Resend API key
Environment variable: CONTACT_FROM_EMAIL=A11y Handoff <contact@mail.a11yhandoff.com>
Environment variable: CONTACT_TO_EMAIL=a11yhandoff@gmail.com
```

DigitalOcean installs dependencies before running the build command and automatically provides `PORT=8080` when the HTTP port is set to 8080. Use the Singapore region for a Japan-focused launch, then enable deploy-on-push for the repository's `main` branch.

The contact form posts to `/api/contact` and sends through Resend without opening the visitor's email app. Verify `mail.a11yhandoff.com` in Resend, add the DNS records it provides, and save `RESEND_API_KEY` as an encrypted DigitalOcean App Platform environment variable. The endpoint validates field lengths, uses a honeypot, and limits each IP address to five submissions per hour.

A reusable App Platform specification template is available at `.do/app.yaml.example`. Replace the GitHub repository placeholder before uploading it or using it with `doctl`.

## Load the Figma plugin

For a no-build local install, download the ready-to-run ZIP from `/figma-plugin`, unzip it, and import the included `manifest.json` in the Figma desktop app.

To build the plugin from source:

1. Run `npm install` and `npm run build` once.
2. In the Figma desktop app, open **Plugins → Development → Import plugin from manifest…**.
3. Select `apps/figma-plugin/manifest.json`.
4. Run **A11y Handoff** from the Development section.
5. During development, keep `npm run dev:plugin` running and reopen the plugin after edits.

The MVP can inspect a selection, record manual checklist progress on the selected node, create a visual annotation beside the selection, and copy or download a handoff report. Automated checks are intentionally limited to facts that Figma exposes reliably; they are prompts, not a certification.

`npm run build:plugin` rebuilds the plugin and creates `apps/web/public/downloads/a11y-handoff-figma-plugin.zip`. Production deployment regenerates this download automatically before building the website.

## Product principles

1. **Plain language first.** Every check explains what to look for and why it matters.
2. **Design-stage decisions.** Focus on structure, states, content, interaction, and documentation.
3. **Evidence over badges.** Show what was checked and what still needs human review.
4. **Progressive depth.** Start with a quick checklist, then open component guidance when needed.
5. **Free and portable.** Reports export as Markdown or JSON and progress stays local.

## Add or edit guidance

Edit `packages/content/src/index.ts`. Each item has a stable ID because checked state and plugin data are stored against it. Avoid changing an ID after release; add a new item instead.

## Suggested next milestones

- Add contrast calculation for solid fills and nearby backgrounds.
- Add role-specific views for design, engineering, product, content, and accessibility work.
- Add annotation variants for focus order and reading order.
- Add automated tests for filtering, progress persistence, and exports.
- Publish the web app and prepare Figma Community artwork/privacy notes.

## Scope and disclaimer

This project supports accessibility conversations but does not replace testing with disabled people, assistive technology testing, engineering review, or legal advice. WCAG references are provided as educational pointers.

## License

MIT — use, adapt, and share it freely.
