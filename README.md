# Kimberrys Cafe & Bakery

The website for **Kimberrys Cafe & Bakery** on Okodan Road in Osu, Accra.

- Website: [kimberrys.com](https://kimberrys.com/)
- Shareable menu: [kimberrys.com/menu](https://kimberrys.com/menu)
- Instagram: [@kimberryscafeandbakery](https://www.instagram.com/kimberryscafeandbakery/)
- Orders: [WhatsApp](https://wa.me/233241502882) · [024 150 2882](tel:+233241502882)

The site is dependency-free static HTML, CSS and JavaScript. There is no build step and nothing to install to deploy it.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Homepage: hero, the cafe, favourites, menu preview, gallery and visit details |
| `menu.html` | Full 49-dish menu with search, dietary tags and the WhatsApp order builder |
| `404.html` | Branded not-found page |
| `styles.css` | Complete design system and responsive styles |
| `script.js` | Navigation, opening-hours status, gallery, menu search, order builder and sharing |

The canonical menu URL is `/menu`. On Apache/LiteSpeed, `.htaccess` serves `menu.html` at that address and redirects `menu.html` back to `/menu`.

## Preview locally

From the repository root:

```sh
python3 -m http.server 4199
```

Then open <http://localhost:4199/>. The menu is available at <http://localhost:4199/menu.html>.

> The clean `/menu` URL depends on the Apache rewrite in `.htaccess`. A plain Python preview server does not read that file, so use `menu.html` locally or test with Apache.

## Updating the menu

Menu content lives in one place: `_source/menu-data.json`.

1. Edit the JSON — items, descriptions, prices, tags and section notes.
2. Rebuild the static menu page:

   ```sh
   python3 _source/build_menu.py
   ```

3. Check `menu.html` in the browser.

The build script also regenerates the menu structured data from the same JSON. Do not edit the dish list directly in `menu.html`, because it will be overwritten.

Menu source files:

- `_source/menu-data.json` — the 49 dishes across 8 sections
- `_source/menu-template.html` — page shell and copy
- `_source/build_menu.py` — generator
- `_source/og-cover.html` / `_source/og-menu.html` — social preview templates (rendered at 1200 × 630)
- `_source/build_menu.py` is intentionally excluded from the public site by `.htaccess` and `robots.txt`.

## Brand assets

All brand files live in `assets/brand/` and are part of the repository:

- `logo-lockup-white.png` — white stacked logo, for dark backgrounds and GitHub
- `logo-lockup-ink.png` — navy stacked logo, for light backgrounds
- `logo-lockup-cream.png` — cream stacked logo, for photography
- `github-social.png` — 1280 × 640 GitHub repository social preview
- `github-avatar.png` — 640 × 640 square avatar
- `og-cover.jpg` / `og-menu.jpg` — 1200 × 630 link previews
- `favicon-*.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` — site icons
- `menu-qr.png` / `menu-qr.svg` — QR code for `kimberrys.com/menu`

On GitHub, upload `github-social.png` under **Settings → Social preview**, and use `github-avatar.png` as the account or organisation avatar.

## Deploy with GitHub and Hostinger

1. Create a GitHub repository and push the **contents of this folder** so `index.html` sits at the repository root.
2. In Hostinger hPanel, open **Git** and connect the repository to the site's `public_html` directory.
3. Deploy the branch.
4. Confirm that hidden files were deployed, especially `.htaccess`. If you upload manually, enable “show hidden files” first.
5. Check:
   - `https://kimberrys.com/`
   - `https://kimberrys.com/menu` (not a 404 or a redirect loop)
   - `https://kimberrys.com/menu.html` (should 301 to `/menu`)
   - a deliberately wrong URL (should show the branded 404 page)
   - the “Order Now” buttons and the menu order builder (WhatsApp prefill)

If the host does not use Apache or LiteSpeed, the `/menu` rewrite will not run. Keep `menu.html` as the working menu URL in that case, or add the equivalent clean-URL rule to the host's routing configuration.

## Notes

- All fonts and images are self-hosted. There are no third-party scripts, analytics or cookies.
- Orders are sent to the cafe's WhatsApp; the site does not take payment.
- Opening hours are Monday–Saturday, 8:00am–8:00pm (Sunday closed), displayed live for Accra.
- Social preview images are `assets/brand/og-cover.jpg` and `assets/brand/og-menu.jpg`.
- The site is © Kimberrys Cafe & Bakery.
