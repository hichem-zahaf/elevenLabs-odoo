What Odoo actually does to this file

When Odoo renders static/description/index.html, it does not render it as a web page.

Internally, Odoo:

• strips <html>, <head>, <body>
• ignores <meta>, <title>
• blocks external CSS & JS
• injects your HTML inside its own backend DOM
• applies its own Bootstrap + Odoo CSS on top

So your document is being treated like CMS content, not a landing page.

That mismatch is why the design collapses.

Concrete problems in your file
1. External Bootstrap CDN is ignored (biggest breakage)

This line is silently discarded:

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">


Result:

.container, .row, .col-lg-4, .g-4, .btn, .nav-pills

all Bootstrap 5 layout logic → gone

Odoo does include Bootstrap, but:

version ≠ 5.3.2

class behaviors differ

spacing utilities don’t match

That’s why your grid explodes.

2. JavaScript-dependent components cannot work

You rely on Bootstrap JS here:

<button class="nav-link" data-bs-toggle="pill" data-bs-target="#basic">


Odoo:

strips <script>

does not load Bootstrap JS for module descriptions

Result:

Tabs never switch

Pills look clickable but do nothing

This is expected behavior.

3. Relative image paths are wrong

Example:

<img src="./banner.jpg">


In Odoo, this resolves to nowhere.

Correct form must be absolute:

<img src="/elevenlabs_agent/static/description/banner.jpg">


Every image in your file using ./ will fail in Apps view.

4. <body> styling is ignored

You define:

body {
  background-color: var(--bg-white);
  font-family: 'Segoe UI', Tahoma;
}


But your HTML is injected inside an existing page body, so:

your body styles never apply

Odoo’s fonts and margins win

That’s why text spacing and fonts look “off”.

5. Your layout assumes full-page control

This section:

.hero-section {
  padding: 120px 0 100px;
  position: relative;
}


Inside Odoo, your “hero” is just a <div> inside a scrollable backend page.
No viewport dominance, no top spacing context, no full-width behavior.

So visually it collapses into a box.

What will never work in Odoo module descriptions

These are hard limits, not bugs:

• External CSS (CDN, Google Fonts, Bootstrap)
• JavaScript (tabs, animations, scrolling, pills)
• Full-page layout assumptions
• <head>-level logic
• Responsive breakpoints tied to viewport height

Trying to force these will always lose.

How to fix this correctly

You have two sane paths.

Option A — Rewrite for Odoo (recommended for App Store)

Treat this like styled documentation, not a landing page.

Mandatory changes

Remove

<!DOCTYPE html>
<html>
<head>
<body>


Inline all CSS only (you already do this part well)

Drop JS features

Replace tabs with stacked sections

Replace pills with headings

Fix all image paths

<img src="/elevenlabs_agent/static/description/demo1.png">


Scope styles
Wrap everything:

<div class="oe_container elevenlabs-doc">


Then rewrite CSS like:

.elevenlabs-doc h1 { ... }
.elevenlabs-doc .feature-card { ... }


This prevents Odoo CSS collisions.