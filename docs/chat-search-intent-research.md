# Chat search — user intent research

Backs the follow-up detection logic in `ProductChatFinder.tsx` (comparison
detection, criterion/ranking detection). Written up so the phrase lists in
that file trace back to something other than one person's guesses — the
brief that started this: *"vì input nếu chỉ tao suy nghĩ ra và nhập thì nó
không đủ case và edge case"*.

## Sources

- Academic taxonomies of conversational product search intent:
  - [Intent term selection and refinement in e-commerce queries](https://arxiv.org/pdf/1908.08564)
  - [PSCon: Product Search Through Conversations](https://arxiv.org/pdf/2502.13881)
  - [Bridging the Gap Between Information Seeking and Product Search Systems: Q&A Recommendation for E-commerce](https://arxiv.org/pdf/2407.09653)
  - [Wizard of Shopping: Target-Oriented E-commerce Dialogue Generation with Decision Tree Branching](https://arxiv.org/pdf/2502.00969)
- Real Vietnamese shopper phrasing, from forum threads where people ask for
  AC buying advice (closest real-world analog to this chat's own use case):
  - [Nên mua máy lạnh loại nào, hãng nào? — VOZ](https://voz.vn/t/nen-mua-may-lanh-loai-nao-hang-nao.665416/)
  - [Máy lạnh giá rẻ nên mua của hãng nào — VOZ](https://voz.vn/t/may-lanh-gia-re-nen-mua-cua-hang-nao.922287/)
  - [Xin tư vấn máy lạnh — VOZ](https://voz.vn/t/xin-tu-van-may-lanh.1076712/)
  - [Tư vấn mua máy lạnh phòng ngủ 15m2 — VOZ](https://voz.vn/t/tu-van-mua-may-lanh-phong-ngu-15m2.939493/)
  - [Nhờ tư vấn máy lạnh 1HP inverter giá rẻ — VOZ](https://voz.vn/t/nho-tu-van-may-lanh-1hp-inverter-gia-re.958470/)
  - [Nên mua máy lạnh hãng nào? — Tinh Tế](https://tinhte.vn/thread/nen-mua-may-lanh-hang-nao.2786191/)
  - [Kinh nghiệm mua máy lạnh — FPTShop](https://fptshop.com.vn/tin-tuc/dien-may/kinh-nghiem-mua-may-lanh-moi-167135)
  - [Nên mua máy lạnh hãng nào — Điện máy Xanh](https://www.dienmayxanh.com/kinh-nghiem-hay/may-lanh-hang-nao-tot-nhat-nen-mua-cua-hang-nao-1112663)

## Intent taxonomy (from the academic sources)

Two overlapping taxonomies, both converge on the same shape:

**By dialogue act** (PSCon / intent-refinement papers):
- **Reveal** — a brand-new query
- **Revise** — reformulating/narrowing the existing query (a refinement)
- **Interpret** — answering a clarifying question or reacting to what was
  just shown (this is where comparison/ranking follow-ups live)
- **Inquire** — asking about the system's own response ("why this one?")
- **Chitchat** — greetings, off-topic

**By shopping-journey stage** (Q&A-recommendation paper):
`Aspect`, `Comparison`, `General Knowledge`, `Superlative`, `How-to`,
`Offer` (price/shipping/policy), `Subjective` (opinion-seeking), `Search`.

## What this maps to in our chat, turn by turn

| Turn | Taxonomy intent | Handled by |
|---|---|---|
| "Máy lạnh giấu trần cho biệt thự" | Reveal / Search | `runSearch` |
| "phòng 20m2" (after a search, no category restated) | Revise | **gap — see below** |
| "nào tốt?", "loại nào bền hơn?" | Interpret / Comparison, Subjective | `isComparisonFollowUp` → `runCompare` |
| "dòng rẻ nhất", "tiết kiệm điện nhất" | Interpret / Superlative | `matchCriterionFollowUp` → rank turn |
| "bảo hành bao lâu?", "có ship không?", "lắp đặt mất phí không?" | Offer / How-to | **gap — see below** |
| "cảm ơn", "ok" | Chitchat | not handled (falls through to search, returns nothing useful) |

## Real Vietnamese phrasing found (grouped by intent)

**Comparison / "which is better" (Interpret+Comparison+Subjective)** — this
is the dominant pattern across every thread found:
- "nên mua máy lạnh loại nào, hãng nào?"
- "máy lạnh nào tốt nhất và tiết kiệm điện"
- "hãng nào bền nhất"
- "nên mua điều hòa 1 chiều hay 2 chiều"
- "Daikin hay Panasonic tốt hơn"
- Bare, classifier-less forms are common and easy to miss with a rigid
  pattern: **"nào tốt?"**, "nào ngon?", "cái nào ổn?" — the quality word
  and "nào" appear in either order depending on the sentence, not a fixed
  "X nào" or "tốt Y" template. (This was a real bug caught earlier: the
  first version of `isComparisonFollowUp` required `(loại|cái|mẫu|con)
  nào` — matching "cái nào tốt" but not bare "nào tốt".)
- Superlative forms without "nào" or "hơn" at all: "bền nhất", "tốt nhất",
  "ngon nhất" — a third shape neither the "X nào" nor "Y hơn" pattern
  catches.

**Budget / criterion-specific (Interpret+Superlative, Offer)**:
- "máy lạnh giá rẻ nên mua hãng nào"
- "tiết kiệm điện" appears constantly, always about inverter vs.
  non-inverter — confirms `hieu_suat_cspf`/`dien_nang_tieu_thu` are the
  right two criteria to expose, not a made-up "efficiency score".
- "giá bao nhiêu" — a bare price question about an already-shown product,
  not currently distinguished from a new search.

**Sizing / usage-pattern context (Revise, Aspect)**:
- "phòng ngủ 15m2" — bare room size, no category word — confirms the
  earlier finding that a bare follow-up like this loses the previous
  turn's category/form-factor context once sent alone.
- Real threads also state *usage pattern*, not just room size — "ngủ 8
  tiếng mỗi ngày trong tuần, cuối tuần chạy cả ngày" — used by repliers to
  bump the recommended capacity up a notch. `chat_search.go`'s
  `heatLoadKeywords` (elc-go) currently covers "24/7"/"chạy 24" but not
  this "nhiều giờ/ngày" phrasing — a backend gap, out of scope for this
  frontend pass, noted here for later.

**Off-topic / unsupported (Offer, How-to)** — not about which product to
buy at all, and none of it maps to anything `chat_search.go`'s rule-based
parser can answer (no LLM, no policy/logistics data in `ProductFilter`):
- "bảo hành bao lâu", "đổi trả được không"
- "giao hàng mất bao lâu", "có ship tỉnh không"
- "lắp đặt có tính phí không", "nhân viên tới lắp khi nào"
- "có khuyến mãi/mã giảm giá gì không"

Sending these straight into `chatSearchProductsAction` isn't a graceful
degradation — the parser strips nothing it recognizes, so the message
becomes a near-empty or garbage `Search` string and comes back with
unrelated products, which reads as the bot ignoring the actual question.

## Bug found via live testing (not just the research above)

Live-tested flow: "Máy lạnh giấu trần cho biệt thự" → "so sánh" (compare
turn — this product line only has `dien_nang_tieu_thu` data, no
`hieu_suat_cspf` value at all) → "cái nào tiết kiệm điện?". Expected the
rank turn; got a random mixed-category product dump instead (âm trần AC +
giấu trần AC + air purifiers + a smart switch, no relation to the
question).

Root cause: `CRITERION_KEYWORD_PATTERNS` only put "tiết kiệm điện" on
`hieu_suat_cspf`'s pattern. `applicableCriteria` had already excluded
`hieu_suat_cspf` from that turn's candidate list (no CSPF value on any of
these products), so `matchCriterionFollowUp` never even got to check the
one pattern that had the phrase — it iterates the *filtered* criteria list,
not the full one. With no criterion match, and "tiết kiệm điện" absent
from `isComparisonFollowUp`'s own word list too, the message fell through
every check all the way down to a blind `chatSearchProductsAction("cái nào
tiết kiệm điện?")` — no category/price/capacity signal in that string at
all, hence the arbitrary-looking result set.

Fixed by putting "tiết kiệm điện" on **both** efficiency criteria's
patterns (`hieu_suat_cspf` and `dien_nang_tieu_thu`) — whichever one
actually made it into that turn's `applicableCriteria` still gets matched
— plus adding it to `isComparisonFollowUp`'s own `QUALITY_WORD_PATTERN` as
a second safety net, so even a compare turn with *neither* efficiency
attribute populated still opens the general diff-table view instead of a
signal-less search.

## Bigger bug found from the same testing session: the 2-step assumption was wrong

More testing (5 more screenshots, same session) kept producing the exact
same failure for phrasings the vocabulary fix above didn't touch at all —
"loại nào tiết kiệm điện nhất?", "dòng nào nhiều tính năng" — both fell
through to a blind search with a bare, contextless "Gợi ý máy lạnh."/"Gợi ý
sản phẩm phù hợp." explanation, every time straight off a plain **search**
turn, never after an explicit "so sánh" step.

Root cause: `matchCriterionFollowUp` was only ever checked against
`lastCompareTurn` — a turn of kind `"compare"` specifically. The entire
design assumed a shopper would say "so sánh" first (opening a compare
turn) and *then* ask about a criterion against that turn's
`compareProducts`. Real usage skips straight from search to a criterion
question — "phòng 30m2" → "loại nào tiết kiệm điện nhất?" with no
intermediate "so sánh" at all. `lastCompareTurn` was always `undefined` in
that flow, so `matchedCriterion` was always `null` regardless of
vocabulary, and the message fell all the way through.

Fixed by unifying the two lookups that used to feed separate branches
(`lastCompareTurn` for criterion matching, `lastComparable` for the general
compare trigger) into one `lastContextTurn` — the most recent turn,
*search or compare*, whichever is chronologically later, with >=2
products to reason about. Both the criterion check and the general
`isComparisonFollowUp` check now run against whatever that turn's products
are, so a criterion question works immediately after a plain search,
exactly as tested. Also added "tính năng"/"chức năng" to
`QUALITY_WORD_PATTERN` (a real phrasing found in the same test batch that
no existing pattern covered) and dropped `rankByCriterion`'s product cap
entirely — a ranked *list* doesn't hit the side-by-side table's
column-width limit, so it's worth ranking every product a search turn
actually returned, not just the 4 the compare table caps at.

## What changed as a result

1. **`isComparisonFollowUp` widened.** "nào" and a quality word are now
   checked as two independent, order-agnostic conditions (catches "nào
   tốt?" either order), plus a standalone superlative pattern ("bền
   nhất") for the third shape found above.
2. **Off-topic short-circuit added.** Warranty/shipping/installation/promo
   questions are now recognized *before* falling through to a search, and
   answered with an honest "can't answer this in chat, call/Zalo instead"
   message pointing at the same hotline/Zalo CTAs already on the page —
   instead of silently running a doomed search.
3. **Context-carrying deep search added (`isBareRefinement`).** A message
   with a structural signal (digit — room size/budget/HP) but no
   category/brand/form-factor word of its own ("phòng 20m2", "dưới 15
   triệu") is now recognized as a bare refinement of the previous search
   rather than a fresh, topic-less query. When one fires, the previous
   completed search turn's own query text is prepended before the combined
   sentence is sent to `chatSearchProductsAction` — so "Máy lạnh giấu trần
   cho biệt thự" → "phòng 20m2" is parsed by `chat_search.go` as "Máy lạnh
   giấu trần cho biệt thự phòng 20m2" (exactly how someone would phrase it
   in one message), not as a category-blind "phòng 20m2" on its own. The
   transcript still shows exactly what the shopper typed — only the API
   call itself sees the merged text (see `runSearch`'s doc comment in
   `ProductChatFinder.tsx`).
4. **Not implemented (flagged, not in this pass' scope):**
   - `heatLoadKeywords` gap for "used N hours/day" phrasing — elc-go
     (Go) side, not this frontend pass.
   - Chitchat ("cảm ơn", "ok") — currently just falls through to a
     pointless search; low priority since it's harmless, just unhelpful.
   - `isBareRefinement`'s keyword mirror (`TOPIC_KEYWORD_PATTERN`) is a
     lightweight, manually-kept-in-sync copy of `chat_search.go`'s own
     category/brand/sub-category vocabulary, not the canonical source —
     acceptable since a stale copy only means an occasional missed
     refinement (falls back to treating it as a fresh search), not wrong
     data, but worth re-syncing if those Go-side lists change materially.
