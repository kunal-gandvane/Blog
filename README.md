# Nebula — Kunal's blog

A single scrolling page (hero → recent thoughts → about) plus a real page per
post, so you can keep adding writing forever by committing files to GitHub.

The nebula sits fixed behind the whole main page and you travel through it:
four gas strips scroll past at four different speeds, with an opaque dust layer
in front silhouetting against the glow. Post pages drop it entirely — plain dark
background, one column of text.

Built with Next.js App Router. No Tailwind, no component library, no CMS — the
whole visual system is one CSS file you can read in five minutes.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Publish a post

Drop a file into `/posts`. The filename becomes the URL.

`posts/my-new-post.mdx` → `yoursite.com/blog/my-new-post`

```mdx
---
title: The day I gave an AI god-mode
category: Life · Curiosity
date: 2026-08-14
excerpt: One or two lines. This is what shows on the home page.
draft: false
---

Your writing goes here. Plain Markdown.

## A heading

**Bold**, *italic*, [links](https://example.com), lists, quotes, code blocks —
all styled already.
```

Every field is optional except `title` and `date`. Set `draft: true` to keep a
post out of the list while you work on it. Read time is calculated for you.
Posts sort newest first automatically.

To publish: commit the file and push. Vercel rebuilds in about 40 seconds.

The three posts currently in `/posts` are samples — delete them.

## Edit the about section

`content/about.mdx`. Plain Markdown, plus a list of interest tags in the
frontmatter.

## Edit your name, subtitle and footer links

`content/site.js`. That's the only place those strings live.

## Change the colours

Top of `app/globals.css`, under `:root`. Every colour on the site is one of
those eight variables.

```css
--void:  #03030a;   /* page background */
--ink:   #070713;   /* about + post background */
--star:  #eef0fa;   /* headings */
--haze:  #9aa0c4;   /* body text */
--dust:  #5c6288;   /* meta, labels */
--flare: #c9708f;   /* accent */
```

Backgrounds are only ever `--void`, `--ink` or `--surface`. Light colours are
only ever used on text and hairlines.

## Change the nebula

`lib/nebula.js`. The `LAYERS` array at the top defines the three gas layers.
Each one has a colour ramp and a density curve:

- `ramp` — four colour stops from thinnest gas to densest core
- `lo` / `hi` — the density window that becomes visible. Raise `lo` for a
  sparser, wispier nebula; lower it for thicker cloud
- `alpha` — how strongly that layer contributes
- `rate` — how fast that layer travels when you scroll. The spread between the
  four numbers is what creates depth. Widen the spread for a stronger sense of
  motion, narrow it for a calmer field
- `knot` — how strongly the layer clumps into dense regions with open void
  between them, so the journey has somewhere to go
- `mode` — `add` for glowing gas, `dust` for the opaque foreground

The dust layer is the one doing the most work visually. Raise its `lo` for
thinner wisps, lower it for heavier silhouettes.

Stars are drawn from pre-rendered sprites in two passes: a deep field behind the
gas and a near field in front of it, each wrapping endlessly as you scroll. The
brightest few get diffraction spikes.

A different nebula is generated on every page load, so refresh to try seeds.

## Turn on comments

1. Make sure the repo is **public** and turn on **Discussions** in its settings.
2. Install the Giscus app: https://github.com/apps/giscus
3. Go to https://giscus.app, enter your repo, and it hands you four values.
4. Create `.env.local`:

```
NEXT_PUBLIC_GISCUS_REPO=kunal-gandvane/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxxxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxxxxx
```

5. Add the same four variables in Vercel → Settings → Environment Variables.

Until then the comment area shows a short setup note instead of breaking.

## Deploy

Push to GitHub, then import the repo at vercel.com. No configuration needed.
Add a custom domain in Vercel → Settings → Domains.

---

## Where things are

```
app/
  layout.js            fonts + metadata
  page.js              the one main page
  globals.css          every style on the site
  blog/[slug]/page.js  a post page
components/
  Hero.jsx             name, subtitle, "Know more about me"
  NebulaCanvas.jsx     the fixed nebula behind the main page
  PostList.jsx         one article per row — the title is the link
  About.jsx            renders content/about.mdx, sits last
  ReadingProgress.jsx  the 2px bar at the top
  Comments.jsx         Giscus
  Mark.jsx / Footer.jsx
content/
  site.js              name, subtitle, links
  about.mdx            your about text
lib/
  nebula.js            the nebula renderer
  posts.js             reads /posts
posts/
  *.mdx                your writing
```

## Notes

- The hero animation is the only non-interactive motion on the site, and it
  plays once. Everything else moves only when you do.
- `prefers-reduced-motion` freezes the nebula drift and twinkle.
- On a phone the nebula renders at lower resolution and with fewer stars.
