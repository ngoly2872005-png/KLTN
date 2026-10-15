/*
 * IC Cut — Lego brick renderer (SVG).
 * Each morpheme is drawn as a brick with studs on top; bricks sit side by
 * side so the word looks like a built Lego wall.
 */
(function () {
  const COLORS = {
    prefix: { base: "#1E9E5A", light: "#46C985", dark: "#126F3E" },
    root:   { base: "#D8322C", light: "#F4625B", dark: "#9E1F1A" },
    suffix: { base: "#2F6FE4", light: "#629AF7", dark: "#1D4CAE" }
  };
  const STUD_H = 10, BODY_H = 70, STUD_W = 22;
  let uid = 0;

  function brickSVG(form, typeLabel, type) {
    const c = COLORS[type] || COLORS.root;
    const id = "b" + (uid++);
    const w = Math.max(104, form.length * 15 + 48);
    const h = STUD_H + BODY_H;
    const n = Math.max(2, Math.floor((w - 12) / 34));
    const step = w / n;

    let studs = "";
    for (let i = 0; i < n; i++) {
      const cx = step * (i + 0.5);
      studs += `<rect x="${cx - STUD_W / 2}" y="3" width="${STUD_W}" height="${STUD_H}" fill="url(#${id}s)"/>`
        + `<ellipse cx="${cx}" cy="3" rx="${STUD_W / 2}" ry="3.6" fill="${c.light}"/>`
        + `<ellipse cx="${cx - 3}" cy="2.4" rx="4" ry="1.2" fill="#fff" opacity=".35"/>`;
    }

    return `<svg width="${w}" height="${h + 6}" viewBox="0 -2 ${w} ${h + 6}" aria-hidden="true">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c.light}"/>
          <stop offset=".18" stop-color="${c.base}"/>
          <stop offset="1" stop-color="${c.base}"/>
        </linearGradient>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${c.dark}"/>
          <stop offset=".35" stop-color="${c.base}"/>
          <stop offset="1" stop-color="${c.dark}"/>
        </linearGradient>
      </defs>
      ${studs}
      <rect x="0" y="${STUD_H}" width="${w}" height="${BODY_H}" rx="7" fill="${c.dark}"/>
      <rect x="0" y="${STUD_H}" width="${w}" height="${BODY_H - 6}" rx="7" fill="url(#${id}g)"/>
      <rect x="6" y="${STUD_H + 2}" width="${w - 12}" height="2" rx="1" fill="#fff" opacity=".28"/>
      <text class="brick-form" x="${w / 2}" y="${STUD_H + 36}" text-anchor="middle">${form}</text>
      <text class="brick-type" x="${w / 2}" y="${STUD_H + 54}" text-anchor="middle">${typeLabel.toUpperCase()}</text>
    </svg>`;
  }

  /**
   * @param container  element to fill
   * @param morphemes  [{form, surface, type}]
   * @param labels     {prefix, root, suffix, spelled}
   */
  function render(container, morphemes, labels, esc) {
    container.innerHTML = morphemes.map((m, i) => {
      const plain = m.form.replace(/-/g, "");
      const spelled = m.surface && m.surface !== plain
        ? `<div class="brick-spelled">${esc(labels.spelled)} <b>${esc(m.surface)}</b></div>` : "";
      return `<div class="brick" title="${esc(m.form)}">
        <div class="brick-inner" style="--delay:${i * 0.12}s">${brickSVG(esc(m.form), labels[m.type] || "", m.type)}</div>
        ${spelled}
      </div>`;
    }).join("");
  }

  window.ICBricks = { render };
})();
