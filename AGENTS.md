# Bac Orientation DZ

- Keep the runtime static and flat: `index.html` contains the RTL views and inline SVG; `styles.css` contains responsive and print styles; `app.js` contains the browser logic and service worker; `data.js` contains the official `window.BAC_DATA.rows` records. There is no package manager or build step.
- Retain the order and literal values from the official PDF. Empty values, `NC`, and `--` have different meanings. Match institutions by recognizable names and known aliases; unmatched institutions stay unknown. Treat career profiles as editorial guidance, not official admissions data.
- The fragment stores the existing view and shortlist. Shortlist IDs refer to positions in the 2026 snapshot, so replacing or reordering records can change existing shared links. If a new snapshot is introduced, preserve existing link meanings or version them explicitly.
- The browser script also serves as the service worker so offline support stays within four runtime files. Bump its cache key when shipping changes that affect offline assets.
