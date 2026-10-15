/*
 * IC Cut — Local Mock Database
 * 11 strategic test words for Immediate Constituent (IC) Analysis.
 *
 * The block between JSON-START and JSON-END is strict JSON so that the
 * Google Apps Script back-end (Code.gs → seedWordsFromGitHub) can import it
 * into the "Words" sheet. Keep double quotes and no trailing commas.
 *
 * cls keys:
 *   prefix-der  Prefix (Derivational)     prefix-inf  Prefix (Inflectional)
 *   root-free   Free Root                 root-bound  Bound Root
 *   suffix-der  Suffix (Derivational)     suffix-inf  Suffix (Inflectional)
 */
window.IC_DB = /*JSON-START*/{
  "unhappiness": {
    "word": "unhappiness",
    "pos": "Noun",
    "ipa": "/ʌnˈhæpinəs/",
    "gloss": { "en": "the state of not being happy", "vi": "trạng thái không hạnh phúc; nỗi bất hạnh" },
    "process": { "en": "Derivation (prefixation + suffixation)", "vi": "Phái sinh (thêm tiền tố + hậu tố)" },
    "morphemes": [
      { "form": "un-", "surface": "un", "type": "prefix", "cls": "prefix-der",
        "meaning": { "en": "Negation: 'not, the opposite of'. Attaches to the adjective happy and reverses its meaning without changing the word class (Adj → Adj).",
                     "vi": "Phủ định: 'không, trái với'. Gắn vào tính từ happy và đảo nghĩa của nó mà không làm thay đổi từ loại (Tính từ → Tính từ)." },
        "etym": { "en": "Old English un- (Germanic); cognate with Latin in- and Greek a(n)-.",
                  "vi": "Tiếng Anh cổ un- (gốc German); cùng gốc với tiền tố Latin in- và Hy Lạp a(n)-." } },
      { "form": "happy", "surface": "happi", "type": "root", "cls": "root-free", "cat": "Adj",
        "meaning": { "en": "Adjective 'feeling or showing pleasure'. A free root: it can stand alone as a complete word.",
                     "vi": "Tính từ 'vui vẻ, hạnh phúc'. Là gốc tự do: có thể đứng độc lập như một từ hoàn chỉnh." },
        "etym": { "en": "Middle English happy, from hap 'luck, chance' (Old Norse happ) + -y.",
                  "vi": "Tiếng Anh trung đại happy, từ hap 'may mắn, tình cờ' (tiếng Bắc Âu cổ happ) + -y." } },
      { "form": "-ness", "surface": "ness", "type": "suffix", "cls": "suffix-der",
        "meaning": { "en": "Forms an abstract noun from an adjective: 'the state or quality of being X' (Adj → N).",
                     "vi": "Tạo danh từ trừu tượng từ tính từ: 'trạng thái hay tính chất của việc là X' (Tính từ → Danh từ)." },
        "etym": { "en": "Old English -nes(s), a native Germanic suffix.",
                  "vi": "Tiếng Anh cổ -nes(s), hậu tố bản địa gốc German." } }
    ],
    "tree": { "label": "unhappiness", "cat": "N", "children": [
      { "label": "unhappy", "cat": "Adj", "children": [ { "m": 0 }, { "m": 1 } ] },
      { "m": 2 }
    ] },
    "insights": {
      "allomorphy": { "en": "Orthographic alternation: the final -y of happy is written -i- before a consonant-initial suffix (happy + -ness → happiness). The pronunciation of the root does not change; only the spelling does.",
                      "vi": "Biến đổi chính tả: chữ -y cuối của happy được viết thành -i- trước hậu tố bắt đầu bằng phụ âm (happy + -ness → happiness). Cách phát âm của gốc từ không đổi; chỉ có chính tả thay đổi." },
      "restoration": [ { "surface": "happi-", "base": "happy", "rule": { "en": "i → y (restore final -y)", "vi": "i → y (khôi phục -y cuối)" } } ],
      "derivInfl": { "en": "All three morphemes are derivational or root; there is no inflection. un- is class-maintaining (Adj → Adj), -ness is class-changing (Adj → N). Why [[un + happy] + ness] and not [un + [happiness]]? Because un- ('not') attaches to adjectives, so unhappy must be built first; -ness then turns the whole adjective into a noun.",
                     "vi": "Cả ba hình vị đều là gốc hoặc phụ tố phái sinh; không có biến tố. un- giữ nguyên từ loại (Tính từ → Tính từ), -ness làm đổi từ loại (Tính từ → Danh từ). Vì sao phân tích là [[un + happy] + ness] chứ không phải [un + [happiness]]? Vì un- ('không') gắn vào tính từ, nên unhappy phải được tạo trước; sau đó -ness biến cả tính từ thành danh từ." }
    },
    "family": { "root": "hap", "rootGloss": { "en": "luck, chance", "vi": "may mắn, tình cờ" },
      "words": ["happy", "happily", "happiness", "unhappy", "unhappily", "hapless", "mishap", "haphazard", "perhaps", "happen"] }
  },

  "reconstruction": {
    "word": "reconstruction",
    "pos": "Noun",
    "ipa": "/ˌriːkənˈstrʌkʃən/",
    "gloss": { "en": "the act or result of building something again", "vi": "sự xây dựng lại, sự tái thiết" },
    "process": { "en": "Derivation (two prefixes + suffix on a bound root)", "vi": "Phái sinh (hai tiền tố + hậu tố trên một gốc ràng buộc)" },
    "morphemes": [
      { "form": "re-", "surface": "re", "type": "prefix", "cls": "prefix-der",
        "meaning": { "en": "'Again, back'. Attaches to verbs: re + construct = 'build again'. Class-maintaining (V → V).",
                     "vi": "'Lại, một lần nữa'. Gắn vào động từ: re + construct = 'xây dựng lại'. Không đổi từ loại (Động từ → Động từ)." },
        "etym": { "en": "Latin re- 'back, again'.", "vi": "Latin re- 'trở lại, lần nữa'." } },
      { "form": "con-", "surface": "con", "type": "prefix", "cls": "prefix-der",
        "meaning": { "en": "'Together, with'. Literally 'pile together'. No longer productive with this root in modern English, so construct is often taught as one unit.",
                     "vi": "'Cùng nhau, với'. Nghĩa đen là 'chất lại với nhau'. Trong tiếng Anh hiện đại, tiền tố này không còn sản sinh với gốc này, nên construct thường được dạy như một khối." },
        "etym": { "en": "Latin com-/con- 'with, together' (con- is the assimilated form before s, t, d, n).",
                  "vi": "Latin com-/con- 'với, cùng nhau' (con- là dạng đồng hóa trước s, t, d, n)." } },
      { "form": "struct", "surface": "struct", "type": "root", "cls": "root-bound",
        "meaning": { "en": "'Build, pile up'. A bound root: it cannot stand alone in English, but recurs in structure, instruct, obstruct, destruction.",
                     "vi": "'Xây, chất lên'. Là gốc ràng buộc: không thể đứng độc lập trong tiếng Anh, nhưng xuất hiện lặp lại trong structure, instruct, obstruct, destruction." },
        "etym": { "en": "Latin structus, past participle of struere 'to build, pile up'.",
                  "vi": "Latin structus, quá khứ phân từ của struere 'xây dựng, chất đống'." } },
      { "form": "-ion", "surface": "ion", "type": "suffix", "cls": "suffix-der",
        "meaning": { "en": "Forms a noun of action or result from a verb: reconstruct → reconstruction (V → N).",
                     "vi": "Tạo danh từ chỉ hành động hoặc kết quả từ động từ: reconstruct → reconstruction (Động từ → Danh từ)." },
        "etym": { "en": "Latin -io (-ionis) via Old French -ion.", "vi": "Latin -io (-ionis) qua tiếng Pháp cổ -ion." } }
    ],
    "tree": { "label": "reconstruction", "cat": "N", "children": [
      { "label": "reconstruct", "cat": "V", "children": [
        { "m": 0 },
        { "label": "construct", "cat": "V", "children": [ { "m": 1 }, { "m": 2 } ] }
      ] },
      { "m": 3 }
    ] },
    "insights": {
      "allomorphy": { "en": "The suffix {-ion} has several allomorphs: -ion, -tion, -sion, -ation (create → creation, decide → decision, inform → information). After a root ending in -t, plain -ion is selected and /t/ is realised as /ʃ/: construct /kənˈstrʌkt/ → construction /kənˈstrʌkʃən/. The prefix con- is itself an assimilated allomorph of Latin com- (com- before b, p, m: combine, compose).",
                      "vi": "Hậu tố {-ion} có nhiều biến thể hình vị: -ion, -tion, -sion, -ation (create → creation, decide → decision, inform → information). Sau gốc tận cùng bằng -t, biến thể -ion được chọn và âm /t/ chuyển thành /ʃ/: construct /kənˈstrʌkt/ → construction /kənˈstrʌkʃən/. Bản thân tiền tố con- cũng là biến thể đồng hóa của com- trong tiếng Latin (com- đứng trước b, p, m: combine, compose)." },
      "restoration": [],
      "derivInfl": { "en": "All four morphemes are derivational or root; there is no inflection. The first cut is [reconstruct] + [-ion] because re- attaches productively to verbs (rebuild, rewrite, reconstruct). The bracketing [[re-[con-struct]]-ion] shows the history of the word: the verb is built first, then nominalised.",
                     "vi": "Cả bốn hình vị đều là gốc hoặc phụ tố phái sinh; không có biến tố. Lát cắt đầu tiên là [reconstruct] + [-ion] vì re- gắn vào động từ một cách sản sinh (rebuild, rewrite, reconstruct). Cách đóng ngoặc [[re-[con-struct]]-ion] cho thấy trình tự hình thành từ: động từ được tạo trước, sau đó mới được danh từ hóa." }
    },
    "family": { "root": "struct", "rootGloss": { "en": "build", "vi": "xây dựng" },
      "words": ["structure", "construct", "construction", "constructive", "destruction", "instruct", "instruction", "obstruct", "infrastructure", "restructure"] }
  },

  "misunderstanding": {
    "word": "misunderstanding",
    "pos": "Noun",
    "ipa": "/ˌmɪsʌndərˈstændɪŋ/",
    "gloss": { "en": "a failure to understand something correctly", "vi": "sự hiểu lầm" },
    "process": { "en": "Compounding + derivation", "vi": "Ghép từ + phái sinh" },
    "morphemes": [
      { "form": "mis-", "surface": "mis", "type": "prefix", "cls": "prefix-der",
        "meaning": { "en": "'Wrongly, badly'. Attaches to verbs: misunderstand = 'understand wrongly' (V → V).",
                     "vi": "'Sai, tồi'. Gắn vào động từ: misunderstand = 'hiểu sai' (Động từ → Động từ)." },
        "etym": { "en": "Old English mis- (Germanic), reinforced by Old French mes-.",
                  "vi": "Tiếng Anh cổ mis- (gốc German), được củng cố bởi tiếng Pháp cổ mes-." } },
      { "form": "under", "surface": "under", "type": "root", "cls": "root-free", "cat": "P",
        "meaning": { "en": "A free morpheme (preposition) acting as the first element of the compound verb understand. Its meaning is now opaque: understanding is not literally 'standing under'.",
                     "vi": "Hình vị tự do (giới từ) đóng vai trò thành tố thứ nhất của động từ ghép understand. Nghĩa của nó nay đã mờ: understand không còn mang nghĩa đen 'đứng dưới'." },
        "etym": { "en": "Old English under.", "vi": "Tiếng Anh cổ under." } },
      { "form": "stand", "surface": "stand", "type": "root", "cls": "root-free", "cat": "V",
        "meaning": { "en": "Verb 'to be upright'. The head of the compound understand, which is why understand inflects like stand: understood ~ stood.",
                     "vi": "Động từ 'đứng'. Là thành tố chính của từ ghép understand, vì vậy understand chia giống stand: understood ~ stood." },
        "etym": { "en": "Old English standan.", "vi": "Tiếng Anh cổ standan." } },
      { "form": "-ing", "surface": "ing", "type": "suffix", "cls": "suffix-der",
        "meaning": { "en": "Here it forms a count noun (a misunderstanding, two misunderstandings), so it is derivational (V → N). In 'She is misunderstanding me' the same form would be inflectional.",
                     "vi": "Ở đây nó tạo ra danh từ đếm được (a misunderstanding, two misunderstandings), nên là phụ tố phái sinh (Động từ → Danh từ). Trong câu 'She is misunderstanding me', cùng hình thức này lại là biến tố." },
        "etym": { "en": "Old English -ung / -ing (verbal noun suffix).", "vi": "Tiếng Anh cổ -ung / -ing (hậu tố tạo danh động từ)." } }
    ],
    "tree": { "label": "misunderstanding", "cat": "N", "children": [
      { "label": "misunderstand", "cat": "V", "children": [
        { "m": 0 },
        { "label": "understand", "cat": "V", "children": [ { "m": 1 }, { "m": 2 } ] }
      ] },
      { "m": 3 }
    ] },
    "insights": {
      "allomorphy": { "en": "No spelling change at any boundary: stand + -ing → standing (no consonant doubling because the root ends in two consonants, -nd). The compound understand keeps the irregular past tense of its head: understood, like stood — evidence that stand is the head of the compound.",
                      "vi": "Không có biến đổi chính tả ở ranh giới nào: stand + -ing → standing (không nhân đôi phụ âm vì gốc tận cùng bằng hai phụ âm -nd). Từ ghép understand giữ dạng quá khứ bất quy tắc của thành tố chính: understood, giống stood — bằng chứng cho thấy stand là thành tố chính của từ ghép." },
      "restoration": [],
      "derivInfl": { "en": "Key test: can the word take an article or a plural? A misunderstanding / misunderstandings → it is a noun, so -ing is derivational here. Note that three processes meet in one word: compounding (under + stand), prefixation (mis-) and suffixation (-ing).",
                     "vi": "Phép thử then chốt: từ này có thể đi với mạo từ hoặc có dạng số nhiều không? A misunderstanding / misunderstandings → đây là danh từ, nên -ing ở đây là phụ tố phái sinh. Lưu ý ba quá trình gặp nhau trong một từ: ghép từ (under + stand), thêm tiền tố (mis-) và thêm hậu tố (-ing)." }
    },
    "family": { "root": "stand", "rootGloss": { "en": "be upright", "vi": "đứng" },
      "words": ["stand", "standing", "understand", "understood", "understandable", "misunderstand", "misunderstood", "withstand", "outstanding", "notwithstanding"] }
  },

  "running": {
    "word": "running",
    "pos": "Verb (present participle)",
    "ipa": "/ˈrʌnɪŋ/",
    "gloss": { "en": "moving fast on foot (progressive / participle form of run)", "vi": "đang chạy (dạng tiếp diễn / phân từ của run)" },
    "process": { "en": "Inflection", "vi": "Biến tố (biến hình)" },
    "morphemes": [
      { "form": "run", "surface": "runn", "type": "root", "cls": "root-free", "cat": "V",
        "meaning": { "en": "Verb 'to move fast on foot'. A free root.",
                     "vi": "Động từ 'chạy'. Là gốc tự do." },
        "etym": { "en": "Old English rinnan / irnan, influenced by Old Norse rinna.",
                  "vi": "Tiếng Anh cổ rinnan / irnan, chịu ảnh hưởng của tiếng Bắc Âu cổ rinna." } },
      { "form": "-ing", "surface": "ing", "type": "suffix", "cls": "suffix-inf",
        "meaning": { "en": "Present participle / progressive marker (be running). It does not create a new word: running is a grammatical form of the verb RUN.",
                     "vi": "Dấu hiệu hiện tại phân từ / thể tiếp diễn (be running). Nó không tạo ra từ mới: running là một dạng ngữ pháp của động từ RUN." },
        "etym": { "en": "Old English participle -ende, later merged with the verbal-noun suffix -ing.",
                  "vi": "Hậu tố phân từ -ende của tiếng Anh cổ, về sau hợp nhất với hậu tố danh động từ -ing." } }
    ],
    "tree": { "label": "running", "cat": "V", "children": [ { "m": 0 }, { "m": 1 } ] },
    "insights": {
      "allomorphy": { "en": "Consonant doubling (CVC rule): when a stressed syllable ends in a single vowel + single consonant, the consonant is doubled before a vowel-initial suffix: run → runn-ing. Compare rain → raining (two vowel letters, no doubling) and visit → visiting (stress not on the final syllable, no doubling).",
                      "vi": "Quy tắc nhân đôi phụ âm (CVC): khi âm tiết mang trọng âm kết thúc bằng một nguyên âm đơn + một phụ âm đơn, phụ âm đó được nhân đôi trước hậu tố bắt đầu bằng nguyên âm: run → runn-ing. So sánh rain → raining (hai chữ nguyên âm, không nhân đôi) và visit → visiting (trọng âm không rơi vào âm tiết cuối, không nhân đôi)." },
      "restoration": [ { "surface": "runn-", "base": "run", "rule": { "en": "remove the doubled consonant (nn → n)", "vi": "bỏ phụ âm nhân đôi (nn → n)" } } ],
      "derivInfl": { "en": "Inflection: -ing marks grammatical aspect, keeps the word class (verb) and the core meaning, and never creates a new dictionary entry. English has only eight inflectional suffixes: -s (3rd sg.), -ed (past), -ing (progressive), -en (past participle), -s (plural), -'s (possessive), -er (comparative), -est (superlative). When running is used as a noun ('Running is healthy'), some grammarians treat -ing as derivational.",
                     "vi": "Biến tố: -ing đánh dấu thể ngữ pháp, giữ nguyên từ loại (động từ) và nghĩa cốt lõi, và không bao giờ tạo ra mục từ mới trong từ điển. Tiếng Anh chỉ có tám hậu tố biến tố: -s (ngôi 3 số ít), -ed (quá khứ), -ing (tiếp diễn), -en (quá khứ phân từ), -s (số nhiều), -'s (sở hữu), -er (so sánh hơn), -est (so sánh nhất). Khi running được dùng như danh từ ('Running is healthy'), một số nhà ngữ pháp coi -ing là phụ tố phái sinh." }
    },
    "family": { "root": "run", "rootGloss": { "en": "move fast on foot", "vi": "chạy" },
      "words": ["run", "runs", "ran", "runner", "rerun", "runway", "outrun", "overrun", "forerunner", "runaway"] }
  },

  "arguing": {
    "word": "arguing",
    "pos": "Verb (present participle)",
    "ipa": "/ˈɑːrɡjuːɪŋ/",
    "gloss": { "en": "giving reasons; disagreeing in words (progressive form of argue)", "vi": "đang tranh luận, cãi nhau (dạng tiếp diễn của argue)" },
    "process": { "en": "Inflection", "vi": "Biến tố (biến hình)" },
    "morphemes": [
      { "form": "argue", "surface": "argu", "type": "root", "cls": "root-free", "cat": "V",
        "meaning": { "en": "Verb 'to give reasons; to disagree'. A free root.",
                     "vi": "Động từ 'đưa ra lý lẽ; tranh cãi'. Là gốc tự do." },
        "etym": { "en": "Latin arguere 'to make clear, prove', via Old French arguer.",
                  "vi": "Latin arguere 'làm sáng tỏ, chứng minh', qua tiếng Pháp cổ arguer." } },
      { "form": "-ing", "surface": "ing", "type": "suffix", "cls": "suffix-inf",
        "meaning": { "en": "Present participle / progressive marker (be arguing). Grammatical, not lexical.",
                     "vi": "Dấu hiệu hiện tại phân từ / thể tiếp diễn (be arguing). Mang nghĩa ngữ pháp, không mang nghĩa từ vựng." },
        "etym": { "en": "Old English -ende / -ing.", "vi": "Tiếng Anh cổ -ende / -ing." } }
    ],
    "tree": { "label": "arguing", "cat": "V", "children": [ { "m": 0 }, { "m": 1 } ] },
    "insights": {
      "allomorphy": { "en": "Silent-e deletion: a final mute -e is dropped before a vowel-initial suffix: argue + -ing → arguing. The -e belongs to the dictionary form of the root even though it disappears in spelling. Compare arguable (also drops e) and argument (an exception: e is dropped even before a consonant).",
                      "vi": "Quy tắc lược bỏ -e câm: chữ -e câm cuối từ bị lược bỏ trước hậu tố bắt đầu bằng nguyên âm: argue + -ing → arguing. Chữ -e vẫn thuộc về dạng từ điển của gốc từ dù nó biến mất trên chính tả. So sánh arguable (cũng bỏ e) và argument (ngoại lệ: e bị bỏ ngay cả trước phụ âm)." },
      "restoration": [ { "surface": "argu-", "base": "argue", "rule": { "en": "restore the silent -e", "vi": "khôi phục chữ -e câm" } } ],
      "derivInfl": { "en": "-ing here is inflectional (progressive). Contrast argument, where -ment is derivational (V → N): it creates a new word, which can then take its own inflection (arguments).",
                     "vi": "-ing ở đây là biến tố (thể tiếp diễn). Đối chiếu với argument, trong đó -ment là phụ tố phái sinh (Động từ → Danh từ): nó tạo ra một từ mới, và từ mới đó lại có thể nhận biến tố của riêng nó (arguments)." }
    },
    "family": { "root": "argu", "rootGloss": { "en": "make clear, prove", "vi": "làm sáng tỏ, chứng minh" },
      "words": ["argue", "argued", "argues", "argument", "argumentative", "argumentation", "arguable", "arguably"] }
  },

  "cities": {
    "word": "cities",
    "pos": "Noun (plural)",
    "ipa": "/ˈsɪtiz/",
    "gloss": { "en": "more than one city", "vi": "các thành phố (số nhiều của city)" },
    "process": { "en": "Inflection", "vi": "Biến tố (biến hình)" },
    "morphemes": [
      { "form": "city", "surface": "citi", "type": "root", "cls": "root-free", "cat": "N",
        "meaning": { "en": "Noun 'a large town'. A free root.",
                     "vi": "Danh từ 'thành phố'. Là gốc tự do." },
        "etym": { "en": "Latin civitas 'citizenship, community', via Old French cité.",
                  "vi": "Latin civitas 'quyền công dân, cộng đồng', qua tiếng Pháp cổ cité." } },
      { "form": "-es", "surface": "es", "type": "suffix", "cls": "suffix-inf",
        "meaning": { "en": "Plural marker {-s}: 'more than one'. It changes neither the word class nor the core meaning.",
                     "vi": "Dấu hiệu số nhiều {-s}: 'nhiều hơn một'. Không làm thay đổi từ loại cũng như nghĩa cốt lõi." },
        "etym": { "en": "Old English plural -as (as in stānas 'stones').", "vi": "Hậu tố số nhiều -as trong tiếng Anh cổ (như stānas 'những hòn đá')." } }
    ],
    "tree": { "label": "cities", "cat": "N", "children": [ { "m": 0 }, { "m": 1 } ] },
    "insights": {
      "allomorphy": { "en": "Two levels of variation. (1) Spelling: consonant + y → i before -es: city → citi-es (compare day → days: vowel + y, no change). (2) Pronunciation: the plural morpheme {-s} has three phonologically conditioned allomorphs: /s/ after voiceless sounds (cats), /z/ after voiced sounds (dogs), /ɪz/ after sibilants (buses). In cities it is /z/ because the root ends in a vowel.",
                      "vi": "Có hai cấp độ biến đổi. (1) Chính tả: phụ âm + y → i trước -es: city → citi-es (so sánh day → days: nguyên âm + y, không đổi). (2) Phát âm: hình vị số nhiều {-s} có ba biến thể hình vị chịu điều kiện ngữ âm: /s/ sau âm vô thanh (cats), /z/ sau âm hữu thanh (dogs), /ɪz/ sau âm xuýt (buses). Trong cities, biến thể là /z/ vì gốc từ tận cùng bằng nguyên âm." },
      "restoration": [ { "surface": "citi-", "base": "city", "rule": { "en": "i → y (restore final -y)", "vi": "i → y (khôi phục -y cuối)" } } ],
      "derivInfl": { "en": "Plural -es is inflectional: it is required by grammar (two cities, not *two city), it is always attached last (outside any derivational suffix: citizen-s), and it never creates a new dictionary entry.",
                     "vi": "Hậu tố số nhiều -es là biến tố: nó bắt buộc về mặt ngữ pháp (two cities, không phải *two city), luôn được gắn sau cùng (bên ngoài mọi phụ tố phái sinh: citizen-s), và không bao giờ tạo ra mục từ mới trong từ điển." }
    },
    "family": { "root": "civ", "rootGloss": { "en": "citizen", "vi": "công dân" },
      "words": ["city", "citizen", "citizenship", "civic", "civil", "civilian", "civilization", "civility"] }
  },

  "sunflower": {
    "word": "sunflower",
    "pos": "Noun (compound)",
    "ipa": "/ˈsʌnˌflaʊər/",
    "gloss": { "en": "a tall plant with a large yellow flower that turns towards the sun", "vi": "hoa hướng dương" },
    "process": { "en": "Compounding (root + root)", "vi": "Ghép từ (gốc + gốc)" },
    "morphemes": [
      { "form": "sun", "surface": "sun", "type": "root", "cls": "root-free", "cat": "N",
        "meaning": { "en": "Noun 'the star that gives light and heat to the Earth'. The modifier (non-head) of the compound.",
                     "vi": "Danh từ 'mặt trời'. Là thành tố bổ nghĩa (không phải thành tố chính) của từ ghép." },
        "etym": { "en": "Old English sunne (Germanic).", "vi": "Tiếng Anh cổ sunne (gốc German)." } },
      { "form": "flower", "surface": "flower", "type": "root", "cls": "root-free", "cat": "N",
        "meaning": { "en": "Noun 'the coloured part of a plant'. The head of the compound: a sunflower is a kind of flower.",
                     "vi": "Danh từ 'bông hoa'. Là thành tố chính của từ ghép: sunflower là một loại hoa." },
        "etym": { "en": "Old French flour, from Latin flos, floris 'flower'.", "vi": "Tiếng Pháp cổ flour, từ Latin flos, floris 'hoa'." } }
    ],
    "tree": { "label": "sunflower", "cat": "N", "children": [ { "m": 0 }, { "m": 1 } ] },
    "insights": {
      "allomorphy": { "en": "No allomorphy and no spelling change. English compounds usually carry primary stress on the first element: SUNflower. This stress pattern helps distinguish a compound from a phrase.",
                      "vi": "Không có biến thể hình vị và không có biến đổi chính tả. Từ ghép tiếng Anh thường mang trọng âm chính ở thành tố thứ nhất: SUNflower. Kiểu trọng âm này giúp phân biệt từ ghép với cụm từ." },
      "restoration": [],
      "derivInfl": { "en": "Neither derivation nor inflection: this is compounding — two free roots combine. By the Right-hand Head Rule, the rightmost element (flower) is the head; it decides the word class and receives inflection: sunflower-s.",
                     "vi": "Không phải phái sinh cũng không phải biến tố: đây là ghép từ — hai gốc tự do kết hợp với nhau. Theo Quy tắc thành tố chính bên phải (Right-hand Head Rule), thành tố ở bên phải nhất (flower) là thành tố chính; nó quyết định từ loại và nhận biến tố: sunflower-s." }
    },
    "family": { "root": "sun + flor", "rootGloss": { "en": "sun + flower", "vi": "mặt trời + hoa" },
      "words": ["sunny", "sunshine", "sunset", "sunrise", "Sunday", "flowery", "floral", "florist", "flourish", "flora"] }
  },

  "children": {
    "word": "children",
    "pos": "Noun (plural)",
    "ipa": "/ˈtʃɪldrən/",
    "gloss": { "en": "more than one child", "vi": "những đứa trẻ (số nhiều của child)" },
    "process": { "en": "Inflection (irregular plural)", "vi": "Biến tố (số nhiều bất quy tắc)" },
    "morphemes": [
      { "form": "child", "surface": "child", "type": "root", "cls": "root-free", "cat": "N",
        "meaning": { "en": "Noun 'a young human being'. A free root.", "vi": "Danh từ 'đứa trẻ'. Là gốc tự do." },
        "etym": { "en": "Old English cild.", "vi": "Tiếng Anh cổ cild." } },
      { "form": "-ren", "surface": "ren", "type": "suffix", "cls": "suffix-inf",
        "meaning": { "en": "An irregular, lexically conditioned allomorph of the plural morpheme {-s}. Same grammatical meaning as -s in cats.",
                     "vi": "Một biến thể hình vị bất quy tắc, chịu điều kiện từ vựng, của hình vị số nhiều {-s}. Mang cùng nghĩa ngữ pháp như -s trong cats." },
        "etym": { "en": "Historically a double plural: Old English cildru (plural -ru > -er) + Middle English weak plural -en (as in oxen) → childer + en → children.",
                  "vi": "Về lịch sử là số nhiều kép: tiếng Anh cổ cildru (đuôi số nhiều -ru > -er) + đuôi số nhiều yếu -en của tiếng Anh trung đại (như oxen) → childer + en → children." } }
    ],
    "tree": { "label": "children", "cat": "N", "children": [ { "m": 0 }, { "m": 1 } ] },
    "insights": {
      "allomorphy": { "en": "{PLURAL} is realised here by the rare allomorph -ren instead of -s, and the root vowel also changes: child /tʃaɪld/ → child- /tʃɪld/. Other irregular plural allomorphs: ox-en (-en), foot → feet (vowel change), sheep → sheep (zero allomorph, Ø).",
                      "vi": "{SỐ NHIỀU} ở đây được hiện thực hóa bằng biến thể hiếm -ren thay vì -s, đồng thời nguyên âm của gốc cũng thay đổi: child /tʃaɪld/ → child- /tʃɪld/. Các biến thể số nhiều bất quy tắc khác: ox-en (-en), foot → feet (đổi nguyên âm), sheep → sheep (biến thể zero, Ø)." },
      "restoration": [ { "surface": "child- /tʃɪld/", "base": "child /tʃaɪld/", "rule": { "en": "restore the vowel /ɪ/ → /aɪ/", "vi": "khôi phục nguyên âm /ɪ/ → /aɪ/" } } ],
      "derivInfl": { "en": "Despite its unusual form, -ren is inflectional — it expresses the same grammatical category (plural) as -s. Contrast childhood and childish, where -hood and -ish are derivational and create new words.",
                     "vi": "Dù có hình thức khác thường, -ren vẫn là biến tố — nó biểu thị cùng phạm trù ngữ pháp (số nhiều) như -s. Đối chiếu với childhood và childish, trong đó -hood và -ish là phụ tố phái sinh và tạo ra từ mới." }
    },
    "family": { "root": "child", "rootGloss": { "en": "young human", "vi": "đứa trẻ" },
      "words": ["child", "childhood", "childish", "childlike", "childless", "childbirth", "childcare", "grandchild"] }
  },

  "uncle": {
    "word": "uncle",
    "pos": "Noun",
    "ipa": "/ˈʌŋkəl/",
    "gloss": { "en": "the brother of one's father or mother", "vi": "chú, bác, cậu (anh/em trai của bố hoặc mẹ)" },
    "process": { "en": "Monomorphemic (no word formation)", "vi": "Đơn hình vị (không có quá trình cấu tạo từ)" },
    "morphemes": [
      { "form": "uncle", "surface": "uncle", "type": "root", "cls": "root-free", "cat": "N",
        "meaning": { "en": "Noun 'the brother of one's parent'. A single free root: the letters u-n are NOT the prefix un-.",
                     "vi": "Danh từ 'anh/em trai của bố mẹ'. Chỉ là một gốc tự do: các chữ u-n KHÔNG phải là tiền tố un-." },
        "etym": { "en": "Anglo-Norman uncle, from Latin avunculus 'mother's brother' (diminutive of avus 'grandfather').",
                  "vi": "Tiếng Anglo-Norman uncle, từ Latin avunculus 'anh/em trai của mẹ' (dạng giảm nhẹ của avus 'ông')." } }
    ],
    "tree": { "label": "uncle", "cat": "N", "m": 0 },
    "insights": {
      "allomorphy": { "en": "Diagnostic trap (false prefix). Test 1: removing un- leaves *cle, which has no meaning. Test 2: the prefix un- means 'not', but an uncle is not 'not a cle'. Since neither part carries meaning on its own, the word cannot be cut.",
                      "vi": "Bẫy chẩn đoán (tiền tố giả). Phép thử 1: bỏ un- còn lại *cle, không mang nghĩa gì. Phép thử 2: tiền tố un- có nghĩa 'không', nhưng uncle không phải là 'không phải cle'. Vì không phần nào tự mang nghĩa, từ này không thể cắt." },
      "restoration": [],
      "derivInfl": { "en": "A monomorphemic word has no IC cut: the tree is a single node. It can still be inflected (uncles, uncle's); inflection attaches to the whole root.",
                     "vi": "Từ đơn hình vị không có lát cắt thành tố trực tiếp: sơ đồ cây chỉ có một nút. Nó vẫn có thể nhận biến tố (uncles, uncle's); biến tố gắn vào toàn bộ gốc từ." }
    },
    "family": { "root": "avunculus", "rootGloss": { "en": "mother's brother", "vi": "anh/em trai của mẹ" },
      "words": ["uncles", "avuncular", "great-uncle", "granduncle"] }
  },

  "sing": {
    "word": "sing",
    "pos": "Verb",
    "ipa": "/sɪŋ/",
    "gloss": { "en": "to make musical sounds with the voice", "vi": "hát" },
    "process": { "en": "Monomorphemic (no word formation)", "vi": "Đơn hình vị (không có quá trình cấu tạo từ)" },
    "morphemes": [
      { "form": "sing", "surface": "sing", "type": "root", "cls": "root-free", "cat": "V",
        "meaning": { "en": "Verb 'to make music with the voice'. A single free root: the final -ing is NOT the suffix -ing.",
                     "vi": "Động từ 'hát'. Chỉ là một gốc tự do: phần -ing ở cuối KHÔNG phải là hậu tố -ing." },
        "etym": { "en": "Old English singan (Germanic).", "vi": "Tiếng Anh cổ singan (gốc German)." } }
    ],
    "tree": { "label": "sing", "cat": "V", "m": 0 },
    "insights": {
      "allomorphy": { "en": "Diagnostic trap (false suffix): removing -ing leaves *s, which is meaningless. sing shows ablaut (internal vowel change) instead of affixation: sing – sang – sung, and the related noun song. These are replacive allomorphs, not added affixes.",
                      "vi": "Bẫy chẩn đoán (hậu tố giả): bỏ -ing chỉ còn lại *s, không có nghĩa. sing thể hiện hiện tượng ablaut (biến đổi nguyên âm bên trong) thay vì thêm phụ tố: sing – sang – sung, và danh từ liên quan song. Đây là các biến thể thay thế, không phải phụ tố được thêm vào." },
      "restoration": [],
      "derivInfl": { "en": "sing is a simple free root (1 morpheme). It can take inflection (sings, singing) or derivation (singer: -er forms an agent noun, V → N).",
                     "vi": "sing là một gốc tự do đơn (1 hình vị). Nó có thể nhận biến tố (sings, singing) hoặc phụ tố phái sinh (singer: -er tạo danh từ chỉ người thực hiện hành động, Động từ → Danh từ)." }
    },
    "family": { "root": "sing", "rootGloss": { "en": "make music with the voice", "vi": "hát" },
      "words": ["sings", "sang", "sung", "singing", "singer", "song", "songbird", "songwriter"] }
  },

  "unflobbable": {
    "word": "unflobbable",
    "pos": "Adjective (nonce word)",
    "ipa": "/ʌnˈflɒbəbəl/",
    "gloss": { "en": "(hypothetical) not able to be flobbed", "vi": "(giả định) không thể bị 'flob'" },
    "process": { "en": "Derivation on a nonce root (productivity test)", "vi": "Phái sinh trên gốc từ giả (kiểm tra tính sản sinh)" },
    "morphemes": [
      { "form": "un-", "surface": "un", "type": "prefix", "cls": "prefix-der",
        "meaning": { "en": "Negation 'not'. Attaches to the adjective flobbable (Adj → Adj).",
                     "vi": "Phủ định 'không'. Gắn vào tính từ flobbable (Tính từ → Tính từ)." },
        "etym": { "en": "Old English un- (Germanic).", "vi": "Tiếng Anh cổ un- (gốc German)." } },
      { "form": "flob", "surface": "flobb", "type": "root", "cls": "root-free", "cat": "V",
        "meaning": { "en": "A nonsense root with no dictionary meaning. Because -able attaches to transitive verbs, we infer that flob behaves like a verb: 'to flob something'.",
                     "vi": "Gốc từ vô nghĩa, không có trong từ điển. Vì -able gắn vào ngoại động từ, ta suy ra flob hoạt động như một động từ: 'flob một cái gì đó'." },
        "etym": { "en": "Nonce (invented) word — no etymology. Used to test whether learners apply morphological rules productively (cf. Berko's 1958 'wug test').",
                  "vi": "Từ giả (tự tạo) — không có từ nguyên. Được dùng để kiểm tra xem người học có áp dụng quy tắc hình thái một cách sản sinh hay không (x. 'wug test' của Berko, 1958)." } },
      { "form": "-able", "surface": "able", "type": "suffix", "cls": "suffix-der",
        "meaning": { "en": "Forms an adjective from a verb: 'able to be X-ed' (V → Adj).",
                     "vi": "Tạo tính từ từ động từ: 'có thể được X' (Động từ → Tính từ)." },
        "etym": { "en": "Latin -abilis, via Old French -able.", "vi": "Latin -abilis, qua tiếng Pháp cổ -able." } }
    ],
    "tree": { "label": "unflobbable", "cat": "Adj", "children": [
      { "m": 0 },
      { "label": "flobbable", "cat": "Adj", "children": [ { "m": 1 }, { "m": 2 } ] }
    ] },
    "insights": {
      "allomorphy": { "en": "Consonant doubling applied to an invented root: flob + -able → flobbable (CVC rule). Learners double the b even though they have never seen the word — clear evidence that spelling rules are productive.",
                      "vi": "Quy tắc nhân đôi phụ âm áp dụng cho một gốc từ tự tạo: flob + -able → flobbable (quy tắc CVC). Người học nhân đôi chữ b dù chưa từng thấy từ này — bằng chứng rõ ràng rằng quy tắc chính tả có tính sản sinh." },
      "restoration": [ { "surface": "flobb-", "base": "flob", "rule": { "en": "remove the doubled consonant (bb → b)", "vi": "bỏ phụ âm nhân đôi (bb → b)" } } ],
      "derivInfl": { "en": "Why [un-[flob-able]] and not [[un-flob]-able]? un- ('not') attaches to adjectives, and there is no verb *unflob. So -able attaches first (flob → flobbable, an adjective), and then un- negates it. This is exactly the structure of un-[predict-able]: the prefix branches LEFT, the stem branches RIGHT. Both affixes are derivational.",
                     "vi": "Vì sao là [un-[flob-able]] chứ không phải [[un-flob]-able]? un- ('không') gắn vào tính từ, và không tồn tại động từ *unflob. Vì vậy -able gắn trước (flob → flobbable, một tính từ), sau đó un- phủ định nó. Đây chính là cấu trúc của un-[predict-able]: tiền tố tách sang TRÁI, thân từ tách sang PHẢI. Cả hai phụ tố đều là phái sinh." }
    },
    "family": { "root": "flob", "rootGloss": { "en": "nonce root (hypothetical)", "vi": "gốc từ giả (giả định)" },
      "words": ["flob", "flobs", "flobbed", "flobbing", "flobber", "flobbable", "unflobbed"] }
  }
}/*JSON-END*/;
