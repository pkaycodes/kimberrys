#!/usr/bin/env python3
"""Build menu.html from menu-data.json + menu-template.html.

Usage:
    python3 _source/build_menu.py

The generated menu is static HTML so it is fully indexable and works without JS.
Edit menu-data.json, then re-run this script.
"""
from pathlib import Path
import html
import json

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "_source" / "menu-data.json").read_text(encoding="utf-8"))
TEMPLATE = (ROOT / "_source" / "menu-template.html").read_text(encoding="utf-8")

CURRENCY = DATA.get("currency", "GH₵")
SECTIONS = DATA["sections"]


def esc(value: str) -> str:
    return html.escape(value, quote=True)


PLUS_SVG = (
    '<svg viewBox="0 0 24 24" aria-hidden="true">'
    '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" '
    'stroke-width="1.8" stroke-linecap="round"/></svg>'
)

section_html = []
for index, section in enumerate(SECTIONS, start=1):
    sid = esc(section["id"])
    name = esc(section["name"])
    note = esc(section.get("note", ""))
    items = []
    for item in section["items"]:
        iid = esc(item["id"])
        iname = esc(item["name"])
        price = item["price"]
        desc = esc(item.get("desc", ""))
        tag = esc(item.get("tag", ""))
        desc_html = f'\n          <p class="dish__desc">{desc}</p>' if desc else ""
        tag_html = f'\n          <span class="dish__tag">{tag}</span>' if tag else ""
        items.append(
            f'''        <article class="dish" data-id="{iid}" data-name="{iname}" data-price="{price}" data-section="{sid}">
          <div class="dish__info">
            <div class="dish__row">
              <h3 class="dish__name">{iname}</h3>
              <span class="dish__leader" aria-hidden="true"></span>
              <span class="dish__price">{CURRENCY}{price}</span>
            </div>{desc_html}{tag_html}
          </div>
          <button class="dish__add" type="button" data-add aria-label="Add {iname} to your order">{PLUS_SVG}</button>
        </article>'''
        )
    items_html = "\n".join(items)
    section_html.append(
        f'''      <section class="menu-section" id="{sid}" data-menu-section aria-labelledby="{sid}-title">
        <header class="menu-section__head">
          <span class="menu-section__no">{index:02d}</span>
          <div>
            <h2 id="{sid}-title">{name}</h2>
            <p>{note}</p>
          </div>
        </header>
        <div class="menu-grid">
{items_html}
        </div>
      </section>'''
    )

sections_html = "\n\n".join(section_html)

menu_schema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Kimberrys Food Menu",
    "description": "Breakfast, pastries, sandwiches, wraps, salads, wings, mains and sides at Kimberrys Cafe & Bakery in Osu, Accra.",
    "url": "https://kimberrys.com/menu",
    "inLanguage": "en-GH",
    "hasMenuSection": [
        {
            "@type": "MenuSection",
            "name": section["name"],
            "description": section.get("note", ""),
            "hasMenuItem": [
                {
                    "@type": "MenuItem",
                    "name": item["name"],
                    **({"description": item["desc"]} if item.get("desc") else {}),
                    "offers": {
                        "@type": "Offer",
                        "price": str(item["price"]),
                        "priceCurrency": "GHS",
                        "availability": "https://schema.org/InStock",
                    },
                }
                for item in section["items"]
            ],
        }
        for section in SECTIONS
    ],
}
jsonld = json.dumps(menu_schema, ensure_ascii=False, indent=2)

output = TEMPLATE.replace("        <!-- SECTIONS -->", sections_html).replace("  <!-- JSONLD -->", jsonld)
(ROOT / "menu.html").write_text(output, encoding="utf-8")
print(f"Built menu.html — {sum(len(s['items']) for s in SECTIONS)} dishes in {len(SECTIONS)} sections.")
