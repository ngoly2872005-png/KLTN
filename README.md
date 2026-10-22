# IC Cut — AI Morphology Lab

**Thesis:** *Developing an AI-Assisted Web Application to Improve Immediate Constituent Analysis Skills Among English Majors at Dong Nai University*

IC Cut helps English-majored students practise Immediate Constituent (IC) analysis. Claude AI cuts any English word into morphemes; 11 strategic test words are verified by hand.

Live site: https://ngoly2872005-png.github.io/KLTN/

## Features

- **Morpheme badges** — glassy pastel pills that cascade in and glow on hover: prefix green, root red, suffix blue, plus a morpheme count.
- **IC tree** — top-down binary cuts; prefixes branch left, suffixes branch right.
- **Tabs** — classification (with etymology on click), allomorphy & base-form restoration, derivation vs. inflection, word family.
- **EN / VI** switch for every explanation.
- **Your own API key** — each user connects their own Claude API key once; it is remembered in their browser.

Verified words: `unhappiness, reconstruction, misunderstanding, running, arguing, cities, sunflower, children, uncle, sing, unflobbable`.

## How a word is analysed

1. The 11 verified words → shown instantly.
2. Words this browser analysed before → shown instantly (local cache).
3. Words anyone analysed before → loaded from the shared **Words** sheet (~1–2 s).
4. New words → Claude, called **directly from the browser** with the user's own key, streamed with a progress bar. The result is validated, cached in the browser and saved to the shared sheet, so the next person gets it instantly.

## Using the AI (for students and teachers)

1. Create a Claude API key at https://console.anthropic.com/settings/keys (the account needs credit).
2. On the site, click **API key** (top right), paste the key, choose a speed and press **Save**.
   - On a **shared/lab computer**, tick *"shared computer"*: the key is forgotten when the tab is closed.
   - **Remove key** deletes it from the browser at any time.
3. Speeds: **Fast** (Haiku 5.5, cheapest) · **Balanced** (Sonnet 5.5, default) · **Most accurate** (Opus 5.5, slower).

The key is stored only in that browser (localStorage / sessionStorage) and is sent only to `api.anthropic.com` — never to GitHub, the Apps Script or the Google Sheet.

## Files

| File | Purpose |
|------|---------|
| `index.html`, `style.css` | Page, theme, API key dialog |
| `app.js` | App logic, caches, EN/VI text, connection to Apps Script |
| `ai.js` | Claude call from the browser: prompt, JSON schema, streaming, validation |
| `bricks.js`, `tree.js` | Morpheme badges and IC tree (SVG) |
| `data.js` | The 11 verified words |
| `Code.gs` | Google Apps Script: shared word cache, research log, evaluation suite |

## Apps Script back-end (shared cache + research log)

1. Open your Apps Script project and replace `Code.gs` with the file from this repo.
2. Run `setup()` once.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (the URL in `app.js` stays the same).

The back-end no longer calls the AI for visitors, so no owner API key is needed. Optional: keep `ANTHROPIC_API_KEY` in Script Properties only if you want to run `testAI()` / `runEvalSuite()` from the editor (15 linguistic test cases → **Eval** sheet).

## Publish online (GitHub Pages)

On a free GitHub plan, Pages only works for **public** repositories.

1. **Settings → Danger Zone → Change repository visibility → Change to public**.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.
3. Open `https://ngoly2872005-png.github.io/KLTN/` after 1–2 minutes.

The repo contains no secrets.

---

### Tóm tắt (Tiếng Việt)

- **Người dùng tự nhập API key Claude của mình** (nút **API key** góc trên phải). Key chỉ lưu trong trình duyệt của họ, nhập một lần là dùng mãi. Ở máy phòng lab thì tick ô "máy dùng chung".
- **Tốc độ:** Nhanh (Haiku 5.5) · Cân bằng (Sonnet 5.5, mặc định) · Chính xác nhất (Opus 5.5).
- **Mỗi từ chỉ cần AI phân tích một lần:** kết quả được lưu trên máy và trong sheet **Words** dùng chung, người sau tra lại sẽ thấy ngay.
- **Apps Script:** dán `Code.gs` mới → chạy `setup()` → **Deploy → Manage deployments → Edit → New version → Deploy**. Có thể xóa `ANTHROPIC_API_KEY` của bạn trong Script Properties để không bị trừ tiền nữa.
