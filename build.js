// Zero-dependency static site builder. Run: node build.js  ->  ./dist
const fs = require("fs"), path = require("path");
const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));
const OUT = "dist";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function readMd(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return { meta: JSON.parse(m[1]), body: m[2], slug: path.basename(file, ".md") };
}
function md(src) {
  const inline = t => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  return src.trim().split(/\n{2,}/).map(b => {
    if (/^## /.test(b)) return `<h2>${inline(b.slice(3))}</h2>`;
    if (/^### /.test(b)) return `<h3>${inline(b.slice(4))}</h3>`;
    if (/^- /m.test(b)) return "<ul>" + b.split("\n").map(l => `<li>${inline(l.replace(/^- /, ""))}</li>`).join("") + "</ul>";
    return `<p>${inline(b)}</p>`;
  }).join("\n");
}
const guides = fs.readdirSync("content/guides").filter(f => f.endsWith(".md")).map(f => readMd("content/guides/" + f)).sort((a, b) => a.meta.order - b.meta.order);
const about = readMd("content/about.md");
const live = guides.filter(g => !g.meta.draft);

const CSS = `:root{--bg:#fff;--surface:#f2f6fd;--ink:#0f1b33;--muted:#5a6a85;--blue:#1f5eff;--line:#d9e2f3;--on-blue:#fff;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#0b1220;--surface:#121c31;--ink:#e8eefc;--muted:#9fb0cf;--blue:#5b8cff;--line:#243352;--on-blue:#0b1220}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--blue);text-decoration:none}.wrap{max-width:860px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line)}.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;color:var(--ink);font-weight:700}
.logo{width:40px;height:40px;border:2px dashed var(--blue);border-radius:10px;display:grid;place-items:center;font-size:9px;color:var(--blue);font-weight:700}
nav{display:flex;gap:16px;font-size:15px}nav a{color:var(--muted)}
.hero{background:var(--blue);color:var(--on-blue);padding:56px 0}.hero h1{font-size:clamp(28px,6vw,42px);line-height:1.15;margin:0 0 12px}.hero p{margin:0 0 22px;max-width:560px;opacity:.92}
.btn{display:inline-block;background:var(--bg);color:var(--blue);padding:11px 20px;border-radius:999px;font-weight:600}
.blk{padding:34px 0}h2{font-size:22px;margin:28px 0 12px}.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;color:var(--ink);display:block}
.card small{color:var(--blue);font-weight:600}.card h3{margin:6px 0;font-size:17px;line-height:1.3}.card p{margin:0;color:var(--muted);font-size:14px}
.quick{background:var(--surface);border-left:4px solid var(--blue);padding:14px 16px;border-radius:0 12px 12px 0;margin:18px 0}
.quick b{display:block;color:var(--blue);font-size:13px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}.quick p{margin:0 0 10px}.quick p:last-child{margin:0}
h1.t{font-size:clamp(26px,5vw,34px);line-height:1.2;margin:8px 0}.meta,.crumb{color:var(--muted);font-size:14px}.crumb{padding-top:22px}
details{border-bottom:1px solid var(--line);padding:10px 0}summary{cursor:pointer;font-weight:600}
footer{border-top:1px solid var(--line);background:var(--surface);padding:26px 0;margin-top:40px;font-size:14px;color:var(--muted)}footer .d{color:var(--ink);font-weight:600}`;

function page({ url, title, desc, body, jsonld = [], noindex = false }) {
  const full = cfg.siteUrl + url;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${full}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${full}"><meta property="og:type" content="website">
<link rel="stylesheet" href="/style.css">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head><body>
<header><div class="wrap bar"><a class="brand" href="/"><span class="logo">${cfg.logoText}</span><span>${cfg.siteName}</span></a>
<nav><a href="/">Home</a><a href="/blog/">Blog</a><a href="/about/">About</a><a href="${cfg.mainSiteUrl}">TekMark</a></nav></div></header>
<main>${body}</main>
<footer><div class="wrap"><p class="d">${cfg.disclosure}</p><p>© ${new Date().getFullYear()} TekMark · <a href="${cfg.mainSiteUrl}">tekmark.com</a> · <a href="/about/">About</a></p></div></footer>
</body></html>`;
  const dir = path.join(OUT, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}
const card = (g, i) => `<a class="card" href="/blog/${g.slug}/"><small>Guide ${g.meta.order || i + 1}</small><h3>${esc(g.meta.title)}</h3><p>${esc(g.meta.description)}</p></a>`;
const org = { "@context": "https://schema.org", "@type": "Organization", name: "TekMark", url: cfg.mainSiteUrl };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "style.css"), CSS);

// Home
page({ url: "/", title: cfg.siteName, desc: cfg.tagline, jsonld: [org, { "@context": "https://schema.org", "@type": "WebSite", name: cfg.siteName, url: cfg.siteUrl }],
  body: `<div class="hero"><div class="wrap"><h1>Turn every first conversation into a real lead.</h1><p>${esc(cfg.tagline)}</p><a class="btn" href="/blog/">Read the guides</a></div></div>
<section class="blk"><div class="wrap"><h2 style="margin-top:0">Master guides</h2><div class="grid">${guides.map(card).join("")}</div></div></section>` });
// Blog index
page({ url: "/blog/", title: `Blog | ${cfg.siteName}`, desc: cfg.tagline,
  body: `<div class="wrap"><div class="crumb"><a href="/">Home</a> / Blog</div><h1 class="t">Blog</h1><div class="grid" style="margin-top:20px">${guides.map(card).join("")}</div></div>` });
// About
page({ url: "/about/", title: about.meta.title, desc: about.meta.description, jsonld: [org],
  body: `<div class="wrap"><div class="crumb"><a href="/">Home</a> / About</div><h1 class="t">About</h1>${md(about.body)}</div>` });
// Guides
for (const g of guides) {
  const m = g.meta, url = `/blog/${g.slug}/`;
  const faq = m.faq && m.faq.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: m.faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null;
  const article = { "@context": "https://schema.org", "@type": "Article", headline: m.title, description: m.description, dateModified: m.updated, mainEntityOfPage: cfg.siteUrl + url, author: { "@type": "Organization", name: "TekMark" }, publisher: { "@type": "Organization", name: "TekMark", url: cfg.mainSiteUrl } };
  page({ url, title: `${m.title} | ${cfg.siteName}`, desc: m.description, noindex: !!m.draft, jsonld: [article, faq].filter(Boolean),
    body: `<div class="wrap"><article><div class="crumb"><a href="/">Home</a> / <a href="/blog/">Blog</a></div>
<div class="meta">Guide ${m.order} · Updated <time datetime="${m.updated}">${m.updated}</time></div><h1 class="t">${esc(m.title)}</h1>
<div class="quick"><b>Quick answers</b>${m.quick.map(q => `<p>${esc(q)}</p>`).join("")}</div>
${md(g.body)}
${m.faq ? `<h2>FAQ</h2>${m.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}` : ""}
<h2>Keep reading</h2><div class="grid">${guides.filter(x => x.slug !== g.slug).slice(0, 2).map(card).join("")}</div></article></div>` });
}
// 404
page({ url: "/404/", title: "Page not found", desc: "Page not found", noindex: true, body: `<div class="wrap"><h1 class="t" style="margin-top:40px">Page not found</h1><p><a href="/">Back to home</a></p></div>` });
fs.renameSync(path.join(OUT, "404", "index.html"), path.join(OUT, "404.html")); fs.rmdirSync(path.join(OUT, "404"));

// Machine-readable files
const urls = [{ u: "/", d: guides[0].meta.updated }, { u: "/blog/", d: guides[0].meta.updated }, { u: "/about/", d: about.meta.updated }, ...live.map(g => ({ u: `/blog/${g.slug}/`, d: g.meta.updated }))];
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x => `<url><loc>${cfg.siteUrl}${x.u}</loc><lastmod>${x.d}</lastmod></url>`).join("\n")}\n</urlset>\n`);
const bots = ["*", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "Google-Extended", "PerplexityBot", "ClaudeBot", "Applebot-Extended"];
fs.writeFileSync(path.join(OUT, "robots.txt"), bots.map(b => `User-agent: ${b}\nAllow: /\n`).join("\n") + `\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "llms.txt"), `# ${cfg.siteName}\n\n> ${cfg.tagline} ${cfg.disclosure}\n\n## Guides\n\n${live.map(g => `- [${g.meta.title}](${cfg.siteUrl}/blog/${g.slug}/): ${g.meta.description}`).join("\n")}\n\n## About\n\n- [About](${cfg.siteUrl}/about/): ${about.meta.description}\n`);
if (fs.existsSync("CNAME")) fs.copyFileSync("CNAME", path.join(OUT, "CNAME"));
console.log(`Built ${guides.length} guides (${live.length} live, ${guides.length - live.length} draft) -> ${OUT}/`);
