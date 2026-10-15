/*
 * IC Cut — Heuristic analyzer (fallback for words not in the database).
 * Strips known affixes, restores the base form (doubling, silent -e, i → y)
 * and builds a binary IC tree. Results are marked "provisional": the
 * learner should verify them against the database or the instructor.
 */
(function () {
  const PREFIXES = {
    "un":    { en: "'not, opposite of'", vi: "'không, trái với'", etym: "Old English", attachesTo: "Adj" },
    "dis":   { en: "'not, reverse of'", vi: "'không, đảo ngược'", etym: "Latin", attachesTo: "V" },
    "mis":   { en: "'wrongly, badly'", vi: "'sai, tồi'", etym: "Old English", attachesTo: "V" },
    "re":    { en: "'again, back'", vi: "'lại, một lần nữa'", etym: "Latin", attachesTo: "V" },
    "pre":   { en: "'before'", vi: "'trước'", etym: "Latin", attachesTo: "V" },
    "non":   { en: "'not'", vi: "'không'", etym: "Latin", attachesTo: "N" },
    "in":    { en: "'not'", vi: "'không'", etym: "Latin", attachesTo: "Adj" },
    "im":    { en: "'not' (allomorph of in- before p, b, m)", vi: "'không' (biến thể của in- trước p, b, m)", etym: "Latin", attachesTo: "Adj" },
    "il":    { en: "'not' (allomorph of in- before l)", vi: "'không' (biến thể của in- trước l)", etym: "Latin", attachesTo: "Adj" },
    "ir":    { en: "'not' (allomorph of in- before r)", vi: "'không' (biến thể của in- trước r)", etym: "Latin", attachesTo: "Adj" },
    "over":  { en: "'too much'", vi: "'quá mức'", etym: "Old English", attachesTo: "V" },
    "sub":   { en: "'under, below'", vi: "'dưới'", etym: "Latin", attachesTo: "N" },
    "inter": { en: "'between'", vi: "'giữa'", etym: "Latin", attachesTo: "Adj" },
    "anti":  { en: "'against'", vi: "'chống lại'", etym: "Greek", attachesTo: "N" },
    "de":    { en: "'remove, reverse'", vi: "'loại bỏ, đảo ngược'", etym: "Latin", attachesTo: "V" }
  };

  // Ordered longest-first within the matching loop. infl = inflectional.
  const SUFFIXES = {
    "ation": { cls: "suffix-der", from: "V", to: "N", en: "forms a noun of action or result", vi: "tạo danh từ chỉ hành động hoặc kết quả", etym: "Latin" },
    "ness":  { cls: "suffix-der", from: "Adj", to: "N", en: "'state or quality of being X'", vi: "'trạng thái hay tính chất của X'", etym: "Old English" },
    "ment":  { cls: "suffix-der", from: "V", to: "N", en: "forms a noun of action or result", vi: "tạo danh từ chỉ hành động hoặc kết quả", etym: "Latin via French" },
    "able":  { cls: "suffix-der", from: "V", to: "Adj", en: "'able to be X-ed'", vi: "'có thể được X'", etym: "Latin via French" },
    "ible":  { cls: "suffix-der", from: "V", to: "Adj", en: "'able to be X-ed'", vi: "'có thể được X'", etym: "Latin" },
    "less":  { cls: "suffix-der", from: "N", to: "Adj", en: "'without X'", vi: "'không có X'", etym: "Old English" },
    "ful":   { cls: "suffix-der", from: "N", to: "Adj", en: "'full of X'", vi: "'đầy X'", etym: "Old English" },
    "ize":   { cls: "suffix-der", from: "Adj", to: "V", en: "'make X'", vi: "'làm cho X'", etym: "Greek via Latin" },
    "ity":   { cls: "suffix-der", from: "Adj", to: "N", en: "'state or quality of being X'", vi: "'trạng thái hay tính chất của X'", etym: "Latin via French" },
    "ous":   { cls: "suffix-der", from: "N", to: "Adj", en: "'having the quality of X'", vi: "'có tính chất X'", etym: "Latin via French" },
    "ive":   { cls: "suffix-der", from: "V", to: "Adj", en: "'tending to X'", vi: "'có xu hướng X'", etym: "Latin" },
    "ion":   { cls: "suffix-der", from: "V", to: "N", en: "forms a noun of action or result", vi: "tạo danh từ chỉ hành động hoặc kết quả", etym: "Latin" },
    "ly":    { cls: "suffix-der", from: "Adj", to: "Adv", en: "'in an X manner'", vi: "'một cách X'", etym: "Old English" },
    "er":    { cls: "suffix-der", from: "V", to: "N", en: "agent noun 'one who Xs' (or comparative, if the base is an adjective)", vi: "danh từ chỉ người 'người làm X' (hoặc so sánh hơn nếu gốc là tính từ)", etym: "Old English" },
    "est":   { cls: "suffix-inf", from: "Adj", to: "Adj", en: "superlative", vi: "so sánh nhất", etym: "Old English" },
    "ing":   { cls: "suffix-inf", from: "V", to: "V", en: "present participle / progressive", vi: "hiện tại phân từ / thể tiếp diễn", etym: "Old English" },
    "ed":    { cls: "suffix-inf", from: "V", to: "V", en: "past tense / past participle", vi: "thì quá khứ / quá khứ phân từ", etym: "Old English" },
    "es":    { cls: "suffix-inf", from: "N", to: "N", en: "plural or 3rd person singular", vi: "số nhiều hoặc ngôi thứ 3 số ít", etym: "Old English" },
    "s":     { cls: "suffix-inf", from: "N", to: "N", en: "plural or 3rd person singular", vi: "số nhiều hoặc ngôi thứ 3 số ít", etym: "Old English" }
  };
  const SUFFIX_KEYS = Object.keys(SUFFIXES).sort((a, b) => b.length - a.length);
  const PREFIX_KEYS = Object.keys(PREFIXES).sort((a, b) => b.length - a.length);
  const ADJ_FORMING = new Set(["able", "ible", "less", "ful", "ous", "ive"]);
  const VOWELS = "aeiou";
  const MIN_STEM = 3;

  // Undo spelling changes made when a suffix was attached.
  function restore(stem, suffix) {
    const vowelInitial = VOWELS.includes(suffix[0]);
    const last = stem.slice(-1), prev = stem.slice(-2, -1);
    if (stem.endsWith("i") && ["es", "ed", "ness", "ly", "er", "est", "ful", "less", "ment"].includes(suffix)) {
      return { base: stem.slice(0, -1) + "y", rule: { en: "i → y (restore final -y)", vi: "i → y (khôi phục -y cuối)" } };
    }
    if (vowelInitial && last === prev && !VOWELS.includes(last) && !"lsfz".includes(last)) {
      return { base: stem.slice(0, -1), rule: { en: "remove the doubled consonant", vi: "bỏ phụ âm nhân đôi" } };
    }
    if (vowelInitial && (/(u|v|c|dg|rg|z)$/.test(stem))) {
      return { base: stem + "e", rule: { en: "restore the silent -e", vi: "khôi phục chữ -e câm" } };
    }
    return { base: stem, rule: null };
  }

  function analyze(raw) {
    const word = raw.toLowerCase().trim();
    let stem = word;
    const suffixes = [];   // outermost first
    const restorations = [];

    for (let guard = 0; guard < 4; guard++) {
      const key = SUFFIX_KEYS.find(s => stem.endsWith(s) && stem.length - s.length >= MIN_STEM);
      if (!key) break;
      if ((key === "s" && /(ss|us|is)$/.test(stem))) break;
      const surface = stem.slice(0, -key.length);
      const r = restore(surface, key);
      if (r.rule) restorations.push({ surface: surface + "-", base: r.base, rule: r.rule });
      suffixes.push(key);
      stem = r.base;
    }

    const prefixes = [];   // outermost first
    for (let guard = 0; guard < 2; guard++) {
      const key = PREFIX_KEYS.find(p => stem.startsWith(p) && stem.length - p.length >= MIN_STEM);
      if (!key) break;
      prefixes.push(key);
      stem = stem.slice(key.length);
    }

    const morphemes = [];
    prefixes.forEach(p => morphemes.push({
      form: p + "-", surface: p, type: "prefix", cls: "prefix-der",
      meaning: { en: PREFIXES[p].en, vi: PREFIXES[p].vi },
      etym: { en: PREFIXES[p].etym + " (general)", vi: PREFIXES[p].etym + " (tổng quát)" }
    }));
    const rootIndex = morphemes.length;
    morphemes.push({
      form: stem, surface: stem, type: "root", cls: "root-free",
      meaning: { en: "Root identified by affix stripping — check that it is a real word.", vi: "Gốc từ được xác định bằng cách tách phụ tố — hãy kiểm tra xem đây có phải là từ thật không." },
      etym: { en: "Not available for automatic analysis.", vi: "Không có dữ liệu cho phân tích tự động." }
    });
    suffixes.slice().reverse().forEach(s => morphemes.push({
      form: "-" + s, surface: s, type: "suffix", cls: SUFFIXES[s].cls,
      meaning: { en: SUFFIXES[s].en, vi: SUFFIXES[s].vi },
      etym: { en: SUFFIXES[s].etym + " (general)", vi: SUFFIXES[s].etym + " (tổng quát)" }
    }));

    // Build the binary tree. Verb-attaching prefixes bind to the root first
    // (pre-dict, re-build). Adjective-attaching prefixes (un-, in-) come after
    // the first adjective-forming suffix (un-[[pre-dict]-able]); without such
    // a suffix they attach before the remaining suffixes ([un-kind]-ness).
    const innerSuffixes = suffixes.slice().reverse();      // innermost first
    let splitAt = innerSuffixes.findIndex(s => ADJ_FORMING.has(s));
    splitAt = splitAt === -1 ? 0 : splitAt + 1;

    let node = { m: rootIndex };
    let text = stem;
    const suffixIndex = i => rootIndex + 1 + i;
    const attachSuffix = i => {
      const s = innerSuffixes[i];
      text = text + "-" + s;
      node = { label: text.replace(/-/g, ""), cat: SUFFIXES[s].to, children: [node, { m: suffixIndex(i) }] };
    };
    const attachPrefix = p => {
      text = prefixes[p] + "-" + text;
      node = { label: text.replace(/-/g, ""), cat: node.cat || PREFIXES[prefixes[p]].attachesTo, children: [{ m: p }, node] };
    };
    const isOuter = p => PREFIXES[prefixes[p]].attachesTo === "Adj";
    for (let p = prefixes.length - 1; p >= 0; p--) if (!isOuter(p)) attachPrefix(p);
    for (let i = 0; i < splitAt; i++) attachSuffix(i);
    for (let p = prefixes.length - 1; p >= 0; p--) if (isOuter(p)) attachPrefix(p);
    for (let i = splitAt; i < innerSuffixes.length; i++) attachSuffix(i);
    if (node.m !== undefined) node = { label: word, cat: "", m: rootIndex };
    node.label = word;

    const hasInfl = suffixes.some(s => SUFFIXES[s].cls === "suffix-inf");
    const hasDer = prefixes.length || suffixes.some(s => SUFFIXES[s].cls === "suffix-der");

    return {
      word, provisional: true, pos: "—", ipa: "",
      gloss: { en: "Automatic analysis — meaning not available.", vi: "Phân tích tự động — chưa có nghĩa." },
      process: {
        en: morphemes.length === 1 ? "No affix detected" : [hasDer && "Derivation", hasInfl && "Inflection"].filter(Boolean).join(" + "),
        vi: morphemes.length === 1 ? "Không phát hiện phụ tố" : [hasDer && "Phái sinh", hasInfl && "Biến tố"].filter(Boolean).join(" + ")
      },
      morphemes, tree: node,
      insights: {
        allomorphy: {
          en: restorations.length ? "Spelling changes were detected at the morpheme boundaries; see the base-form restoration list." : "No spelling change was detected at the morpheme boundaries.",
          vi: restorations.length ? "Phát hiện biến đổi chính tả tại ranh giới hình vị; xem danh sách khôi phục dạng gốc." : "Không phát hiện biến đổi chính tả tại ranh giới hình vị."
        },
        restoration: restorations,
        derivInfl: {
          en: "This is a provisional, rule-based analysis. Words that merely look affixed (uncle, sing) can be cut wrongly — always apply the meaning test: every part you cut off must carry meaning.",
          vi: "Đây là phân tích tạm thời dựa trên quy tắc. Những từ chỉ trông giống có phụ tố (uncle, sing) có thể bị cắt sai — luôn áp dụng phép thử nghĩa: mọi phần được cắt ra đều phải mang nghĩa."
        }
      },
      family: { root: stem, rootGloss: { en: "", vi: "" }, words: [] }
    };
  }

  window.ICAnalyzer = { analyze };
})();
