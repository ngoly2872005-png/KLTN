/*
 * IC Cut — Morpheme badge renderer.
 * Each morpheme is a glassy pastel pill, colour-coded by type. Badges
 * cascade in one by one and lift with a soft colour glow on hover.
 */
(function () {
  /**
   * @param container  element to fill
   * @param morphemes  [{form, surface, type}]
   * @param labels     {prefix, root, suffix, spelled, zero}
   * @param esc        HTML escaper
   */
  function render(container, morphemes, labels, esc) {
    container.innerHTML = morphemes.map((m, i) => {
      const plain = m.form.replace(/-/g, "");
      const note = m.surface === ""
        ? `<span class="badge-note">Ø · ${esc(labels.zero)}</span>`
        : m.surface && m.surface !== plain
          ? `<span class="badge-note">${esc(labels.spelled)} <b>${esc(m.surface)}</b></span>` : "";
      return `<div class="badge-slot" style="--i:${i}">
        <div class="badge ${m.type}" title="${esc(m.form)}">
          <span class="badge-dot" aria-hidden="true"></span>
          <span class="badge-form">${esc(m.form)}</span>
          <span class="badge-type">${esc(labels[m.type] || "")}</span>
        </div>
        ${note}
      </div>`;
    }).join("");
  }

  window.ICBricks = { render };
})();
