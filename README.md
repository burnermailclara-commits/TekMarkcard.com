# Business with TekMark

Static site, no dependencies. Content lives in `content/`, the builder is `build.js`.

## Edit
- Guides: `content/guides/*.md`. The top block (JSON) holds `title`, `description`, `updated`, `quick` (quick answers) and `faq`. The text below it is the body.
- `"draft": true` hides a guide from the sitemap and `llms.txt` and adds noindex. Set it to `false` when the guide is ready.
- Update `"updated"` whenever you add or change a phrase.
- `config.json`: site name, domain (`siteUrl`), TekMark URL, disclosure line.

## Preview
`node build.js` then open `dist/index.html` (or `npx serve dist`).

## Deploy (GitHub Pages)
1. Create a repo, upload these files, push to `main`.
2. Settings > Pages > Source: **GitHub Actions**.
3. Custom domain: add a file named `CNAME` containing your domain (e.g. `businesswithtekmark.com`), set the domain in Settings > Pages, and create the DNS record at your registrar.
4. Update `siteUrl` in `config.json` to the final domain.

The workflow rebuilds on every push and once a day.
