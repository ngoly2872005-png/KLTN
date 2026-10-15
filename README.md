# IC Cut — AI Morphology Lab

**Thesis:** *Developing an AI-Assisted Web Application to Improve Immediate Constituent Analysis Skills Among English Majors at Dong Nai University*

IC Cut helps English-majored students practise Immediate Constituent (IC) analysis. Claude AI cuts any English word into morphemes; 11 strategic test words are verified by hand.

## Features

- **Lego bricks** — each morpheme is a brick: prefix green, root red, suffix blue, plus a morpheme count.
- **IC tree** — top-down binary cuts; prefixes branch left, suffixes branch right.
- **Tabs** — classification (with etymology on click), allomorphy & base-form restoration, derivation vs. inflection, word family.
- **EN / VI** switch for every explanation.

Verified words: `unhappiness, reconstruction, misunderstanding, running, arguing, cities, sunflower, children, uncle, sing, unflobbable`.

## Files

| File | Purpose |
|------|---------|
| `index.html`, `style.css` | Page and theme |
| `app.js` | App logic, EN/VI text, connection to Apps Script |
| `bricks.js`, `tree.js` | Lego brick and IC tree drawings (SVG) |
| `data.js` | The 11 verified words |
| `Code.gs` | Google Apps Script back-end: Claude AI analysis, Sheet cache, research log |

## Turn on the AI

1. Open your Apps Script project and replace `Code.gs` with the file from this repo.
2. **Project Settings → Script Properties → Add**: `ANTHROPIC_API_KEY` = your Claude API key (from console.anthropic.com). Never put the key in GitHub.
3. Run `setup()` once, then `testAI()` to check the connection (see **Executions** log).
4. **Deploy → New deployment → Web app** · Execute as *Me* · Access *Anyone*.
5. Paste the Web app URL into `CONFIG.GAS_URL` at the top of `app.js`.

Each new word is analysed once by Claude (`claude-opus-5-5`) and saved in the **Words** sheet; later requests read from the sheet. `DAILY_AI_LIMIT` (default 300) caps daily AI calls.

## Publish

Settings → Pages → Branch `main` / `(root)`. On a free GitHub plan the repository must be **public** for Pages.

---

### Tóm tắt (Tiếng Việt)

1. Dán `Code.gs` vào Apps Script, thêm `ANTHROPIC_API_KEY` trong Script Properties.
2. Chạy `setup()` rồi `testAI()`; triển khai Web app; dán URL vào `CONFIG.GAS_URL` trong `app.js`.
3. Mỗi từ mới chỉ gọi AI một lần, kết quả được lưu trong sheet **Words** để giáo viên kiểm tra.
