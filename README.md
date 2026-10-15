# IC Cut — Immediate Constituent Analysis Lab

**Thesis:** *Developing an AI-Assisted Web Application to Improve Immediate Constituent Analysis Skills Among English Majors at Dong Nai University*

IC Cut is a web app that helps English-majored students practise Immediate Constituent (IC) analysis of English words.

## Features

| # | Module | Description |
|---|--------|-------------|
| 1 | **Morpheme Breakdown** | Animated Lego blocks: prefix = green, root/stem = red, suffix = blue, plus a morpheme count. |
| 2 | **Hierarchical IC Tree** | Top-down SVG tree with binary cuts. Prefixes branch LEFT of the stem; suffixes branch RIGHT. |
| 3 | **Linguistic Matrix** | Classification (Prefix/Suffix × Derivational/Inflectional, Free/Bound Root), pedagogical meaning and etymology. EN / VI toggle in the navbar. |
| 4 | **Pedagogical Insights** | Allomorphy and base-form restoration (runn- → run, argu- → argue, citi- → city), derivation vs. inflection, and a Word Constellation (word family). |

Local mock database (11 strategic test words): `unhappiness, reconstruction, misunderstanding, running, arguing, cities, sunflower, children, uncle, sing, unflobbable`.

Words that are not in the database are looked up in the Google Sheet (if connected). If they are not there either, a rule-based analyzer cuts them and the result is marked **provisional**.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `style.css` | Oxford Navy & Clean White theme |
| `data.js` | Local mock database (strict JSON between the `JSON-START` / `JSON-END` markers) |
| `analyzer.js` | Heuristic fallback analyzer |
| `tree.js` | SVG IC tree renderer |
| `app.js` | App logic, i18n (EN/VI), Apps Script connection |
| `Code.gs` | Google Apps Script back-end (copy it into your Apps Script project) |

## Publish with GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → Branch `main` / `(root)` → Save.
The app will be available at `https://ngoly2872005-png.github.io/KLTN/`.

## Connect the Google Sheet back-end (optional)

1. Open the Apps Script project and replace the contents of `Code.gs` with the file in this repo.
2. If the script is not bound to a Google Sheet, put the spreadsheet ID in `SHEET_ID`.
3. Run `setup()` once (this creates the **Words** and **Logs** sheets). Optionally run `seedWordsFromGitHub()` to copy the 11 words into **Words**.
4. **Deploy → New deployment → Web app** (Execute as: *Me*, Who has access: *Anyone*).
5. Paste the Web app URL into `CONFIG.GAS_URL` at the top of `app.js` and commit.

Once connected, each analysis is logged (timestamp, participant code, word, language) for the research questions. To add a new word, duplicate a row in **Words** and edit its JSON.

---

### Hướng dẫn nhanh (Tiếng Việt)

- Bật GitHub Pages: Settings → Pages → Branch `main` / `(root)`.
- Kết nối Google Sheet: dán `Code.gs` vào Apps Script, chạy `setup()`, triển khai Web app, rồi dán URL vào `CONFIG.GAS_URL` trong `app.js`.
- Nút **EN / VI** trên thanh điều hướng dịch toàn bộ phần giải thích sang tiếng Việt.
