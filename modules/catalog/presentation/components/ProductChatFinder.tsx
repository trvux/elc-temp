"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";

import { chatSearchProductsAction, getProductCompareAction } from "@/modules/catalog/presentation/actions";
import {
  resolveDefaultVariant,
  resolveProductDisplayPrice,
  type ProductWithRelations,
} from "@/modules/catalog/domain";
import { ChatComparisonTable, CriterionRankingAnswer } from "@/modules/catalog/presentation/components/ChatComparisonTable";
import {
  applicableCriteria,
  matchCriterionFollowUp,
  rankByCriterion,
  type CriterionRanking,
} from "@/modules/catalog/presentation/components/comparison-criteria";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Bubble, BubbleContent } from "@/shared/components/ui/bubble";
import { Button } from "@/shared/components/ui/button";
import { buildZaloProductsMessage, type ZaloProductInfo } from "@/shared/lib/zalo-message";
import { useContacts } from "@/shared/providers/contact-provider";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/components/ui/input-group";
import { Marker, MarkerContent, MarkerIcon } from "@/shared/components/ui/marker";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/shared/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/shared/components/ui/message-scroller";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { ArrowUp, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

// A wider, pain-point-shaped spread than a plain "product + budget" list —
// each one mirrors a real reason someone starts this chat: not knowing
// which of elc's 5 AC form factors fits their room, sizing capacity off a
// room's actual m², a specific install context (quán cafe, phòng ngủ nhỏ),
// or an electricity-bill worry (gas R32). Every phrase stays inside elc's
// real catalog — residential/light-commercial split AC only, up to 5.5 HP
// (see categoryLabelSlugs/maxTreoTuongTier in chat_search.go) — never
// implies a product class (VRF, ducted central, ...) elc doesn't sell.
// Rotated randomly client-side after mount (ROTATION_SIZE of the pool at a
// time) so returning visitors don't just see the same 3 chips every time —
// *after* mount specifically, not in useState's initializer: that
// initializer runs during SSR too, so the server would pick one random
// slice and the client's own rehydration render would independently pick
// a different one, a hydration mismatch (React logs it, then discards and
// regenerates the whole tree client-side). The first ROTATION_SIZE pool
// entries are the deterministic value both server and client's first
// render agree on; useEffect below reshuffles once mounted, after
// hydration has already reconciled.
const EXAMPLE_PROMPTS = [
  "Máy lạnh treo tường dưới 10 triệu cho phòng ngủ nhỏ",
  "Phòng khách 20m2 nên lắp máy lạnh mấy HP?",
  "Máy lạnh âm trần cho quán cafe",
  "Máy lọc nước cho gia đình 4 người",
  "Máy lọc không khí giá tốt cho nhà có trẻ nhỏ",
  "Máy lạnh tủ đứng công suất lớn",
  "Máy lạnh dùng gas R32 tiết kiệm điện",
  "Máy lạnh giấu trần cho biệt thự",
  "Máy lạnh nào bán chạy, giá dưới 15 triệu?",
];

const ROTATION_SIZE = 3;

function pickRandomPrompts(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// The Go API answers in under 200ms (rule-based parser, no LLM round trip —
// see chat_search.go) — fast enough that the shimmer/loading state below
// would flash by unseen on a real network. This floors every request at
// MIN_LOADING_MS of visible "typing" time, same trick real chat products
// use so a sub-perceptual response doesn't read as the UI skipping a step.
// Never adds latency to a request that's already slower than this.
const MIN_LOADING_MS = 900;

// Matches a follow-up asking to evaluate/differentiate the products a
// previous search turn just showed — "loại nào tốt hơn?", "khác nhau như
// nào?", "nên chọn cái nào?", "so với nhau thì sao?" — as opposed to a new
// search. chat-search itself has no memory of the previous turn (see
// chat_search.go: stateless, one message in, one filter out) and no
// comparison logic at all, so sending a bare phrase like this straight to
// it would parse as near-empty (no price/HP/brand/category signal) and
// silently return unrelated results — reading as the conversation having
// "forgotten" what was just shown. Caught here instead so it can be
// answered from the previous turn's own results (see runCompare) rather
// than re-searched.
// "nào" and a quality word ("tốt", "bền", ...) are checked as two
// independent, order-agnostic conditions rather than one fixed phrase —
// real messages put them in either order ("cái nào tốt hơn?" vs. the
// terser, very common "nào tốt?"/"nào ngon?"), and a single rigid pattern
// like `(loại|cái) nào` or `tốt hơn` misses whichever order it didn't
// anticipate. Caught as an actual bug during testing: "nào tốt?" (asked
// right after a search turn, clearly meaning "which of these is good?")
// matched neither the old "X nào" alternative (needs loại/cái/mẫu/con
// immediately before nào) nor "tốt hơn" (needs hơn immediately after
// tốt) — it silently fell through to a fresh, context-blind search.
// Vocabulary and the 3 sentence shapes below both come from real Vietnamese
// AC-shopping phrasing (VOZ/Tinh Tế forum threads, see
// docs/chat-search-intent-research.md) rather than guessed synonyms — that
// research surfaced "bền"/"uy tín"/"đáng tin" as recurring alongside "tốt",
// and a third sentence shape ("bền nhất" — a superlative with neither
// "nào" nor "hơn" at all) that the first two patterns alone don't cover.
const NAO_PATTERN = /\bnào\b/i;
// "tiết kiệm điện" is included here too (not just in comparison-criteria.ts'
// own keyword map) as a safety net: if there's no *existing* compare turn
// yet to answer a criterion follow-up against (matchCriterionFollowUp
// needs one — see submitMessage), "cái nào tiết kiệm điện?" should still
// open a general compare turn (the diff table + criterion chips) rather
// than fall all the way through to a signal-less search. Real bug this
// guards against: a compare turn whose products only had one of the two
// efficiency attributes populated meant the OTHER attribute's keyword
// ("tiết kiệm điện" living only on hieu_suat_cspf's pattern) matched
// nothing at all once that criterion got filtered out, and the message
// fell through everything down to a blind chatSearchProductsAction call.
// "tính năng"/"chức năng" caught from live testing too: "dòng nào nhiều
// tính năng" (asking which has more features) isn't a "tốt/bền" quality
// word at all, but it's the same shape of question — matched here so it
// opens the diff table (which, being differences-only, directly answers
// "which has more features" by just showing what's different) instead of
// falling through unrecognized.
const QUALITY_WORD_PATTERN =
  /tốt|bền|ổn|ngon|xịn|uy\s*tín|đáng\s*(mua|tiền|tin)|chất\s*lượng|nên\s*(chọn|mua|lấy)|tiết\s*kiệm\s*điện|tính\s*năng|chức\s*năng/i;
const DIFFER_PATTERN = /khác\s*(nhau|biệt)/i;
const COMPARE_VERB_PATTERN = /so\s*(sánh|với)/i;
const HON_PATTERN = /hơn\s*(nhau|kém)|(tốt|bền|xịn|ngon|đáng|uy\s*tín)\s*hơn/i;
// "bền nhất", "tốt nhất" — a superlative with no "nào" and no "hơn" at all,
// the third real sentence shape found in the research above.
const SUPERLATIVE_QUALITY_PATTERN = /(tốt|bền|xịn|ngon|uy\s*tín|đáng\s*tin)\s*nhất/i;

// A genuine new search almost always restates a *number* — a budget
// ("dưới 8 triệu"), a room size ("20m2"), an HP figure — even when it
// happens to also contain a comparison-shaped word ("còn loại nào dưới 8
// triệu không" has "nào" but is asking for a cheaper option, not to
// compare what's already on screen). A pure comparison question about the
// current results essentially never has one ("nào tốt?"). Cheap enough to
// be worth checking rather than mis-routing that case into a table
// comparing products the shopper already dismissed as too expensive.
const CONTAINS_DIGIT_PATTERN = /\d/;

function isComparisonFollowUp(message: string): boolean {
  if (CONTAINS_DIGIT_PATTERN.test(message)) return false;
  return (
    (NAO_PATTERN.test(message) && QUALITY_WORD_PATTERN.test(message)) ||
    DIFFER_PATTERN.test(message) ||
    COMPARE_VERB_PATTERN.test(message) ||
    HON_PATTERN.test(message) ||
    SUPERLATIVE_QUALITY_PATTERN.test(message)
  );
}

// Category synonyms, AC sub-category form factors, and known brand names —
// a lightweight mirror of chat_search.go's own vocabulary
// (categorySynonyms/subCategoryTerms/knownBrands), not the canonical
// source: this only needs to answer "does this message restate the topic
// itself", not actually parse a filter, so a plain substring/regex check
// is enough — no need to call the Go side or duplicate its
// normalizeVietnamese-based fuzzy matching here. Keep roughly in sync with
// chat_search.go if those lists change; a stale copy only means an
// occasional missed refinement (falls back to a fresh search, not wrong
// data), not a correctness bug.
const TOPIC_KEYWORD_PATTERN =
  /máy lạnh|điều hòa|lọc nước|lọc không khí|cấp khí tươi|nhà thông minh|công tắc|cảm biến|bảng điều khiển|remote|âm trần|treo tường|giấu trần|tủ đứng|áp trần|acis|carrier|daikin|gree|hagisu|\blg\b|menred|midea|mitsubishi|panasonic|samsung|toshiba/i;

// A bare structural follow-up — "phòng 20m2", "dưới 15 triệu", "2 HP" —
// restates a *new constraint* (room size/budget/HP/gas) with no
// category/brand/form-factor word of its own. Sent alone to a stateless
// chat-search, it loses whatever category the previous turn established
// (see runSearch's doc comment); merged with that turn's own query text,
// chat_search.go parses the combined sentence exactly the way someone
// would've asked it in one message to begin with. Requires a digit
// (CONTAINS_DIGIT_PATTERN) since that's what every real structural
// refinement found in research actually has — a topic-less message with
// no number at all is more likely chitchat or something this heuristic
// has no business guessing at.
function isBareRefinement(message: string): boolean {
  return CONTAINS_DIGIT_PATTERN.test(message) && !TOPIC_KEYWORD_PATTERN.test(message);
}

// Warranty/shipping/installation/promotion questions ("bảo hành bao lâu?",
// "có ship tỉnh không?", "lắp đặt tính phí không?") — real recurring
// questions in AC-shopping threads (see docs/chat-search-intent-research.md)
// but none of it maps to anything ProductFilter/chat_search.go can answer
// (no policy/logistics data, no LLM to reason about it). Sending these
// through chatSearchProductsAction anyway isn't a graceful degradation —
// the parser finds no recognizable signal, the Search string ends up
// near-empty or garbage, and whatever comes back reads as the bot just
// ignoring the actual question. Caught here so it can get an honest "can't
// answer this in chat" reply instead (see submitMessage's "info" turn),
// pointing at the same hotline/Zalo CTAs already on the page.
const OFF_TOPIC_PATTERN =
  /bảo\s*hành|đổi\s*trả|giao\s*hàng|ship(?:ping)?|vận\s*chuyển|lắp\s*đặt|thi\s*công|khuyến\s*mãi|mã\s*giảm|coupon/i;

function isOffTopicQuestion(message: string): boolean {
  return OFF_TOPIC_PATTERN.test(message);
}

const OFF_TOPIC_REPLY = "Câu này mình chưa trả lời được qua khung tìm sản phẩm này, bạn liên hệ trực tiếp nhé:";

// Purchase intent ("mua sao?", "mua hàng qua đâu?", "chốt đơn cái này",
// "inbox giúp em", "còn hàng không") — distinct from OFF_TOPIC_PATTERN
// above (policy/logistics questions) even though both end up routed to
// Zalo: this business has no cart/checkout at all (see BuyNowButton's own
// doc comment — "Mua ngay" always means "start a Zalo conversation with a
// real salesperson"), so a question about actually completing a purchase
// isn't something chat-search degrades gracefully on, it's something this
// app has no purchase flow to answer in the first place.
//
// MUA_WHERE_HOW_PATTERN allows up to 20 chars of filler between "mua" and
// the question word rather than requiring them adjacent — real bug caught
// live-testing: the first version required "mua ở đâu" literally
// touching, so "mua hàng qua đâu?" (a real, very ordinary phrasing —
// "hàng qua" sits between them) matched nothing and fell straight through
// to a blind search. Same bounded-gap technique chat_search.go's own
// labeledLengthWidthPattern uses for the same reason (bridging words
// between two clauses without risking a match across an unrelated second
// clause) — `[^?!.]` stops the gap at a sentence boundary so it can't
// stretch across "mua máy lạnh. sao mà nó ồn thế" into a false match.
//
// CONTACT_REQUEST_PATTERN/STOCK_CHECK_PATTERN cover the Facebook/Zalo/
// TikTok-shop "DM to buy" culture (see docs/chat-search-intent-research.md)
// — "inbox", "ib", "add zalo", "còn hàng không" are extremely common real
// ways Vietnamese shoppers signal buying intent *without ever saying
// "mua" at all*; missing this vocabulary is losing a ready-to-buy
// customer to a blind search result, not just an awkward reply.
//
// Deliberately still scoped to actual buying-process phrasing, not a bare
// "mua" — "muốn mua máy lạnh cho phòng 20m2" is an ordinary search (the
// shopper is browsing, not asking how checkout works) and should still
// search normally.
const MUA_WHERE_HOW_PATTERN =
  /mua[^?!.]{0,20}(đâu|sao\b|thế\s*nào|như\s*nào|ngay|luôn|chỗ\s*nào|kênh\s*nào)/i;
const ORDER_ACTION_PATTERN =
  /đặt\s*(hàng|mua)|chốt\s*(đơn|mua|hàng)|lên\s*đơn|seal\s*(đơn|hàng)|thanh\s*toán|trả\s*góp|\bcod\b|\border\b/i;
const CONTACT_REQUEST_PATTERN =
  /inbox|\bib\b|add\s*zalo|xin\s*(zalo|sđt|số\s*(điện\s*thoại)?)|để\s*lại\s*(sđt|số)|liên\s*hệ\s*(sao|thế\s*nào|qua\s*đâu|ở\s*đâu|kênh\s*nào)|note\s*giúp|tư\s*vấn\s*trực\s*tiếp/i;
const STOCK_CHECK_PATTERN = /còn\s*hàng\s*không|có\s*sẵn\s*hàng|hết\s*hàng\s*chưa/i;

function isPurchaseIntent(message: string): boolean {
  return (
    MUA_WHERE_HOW_PATTERN.test(message) ||
    ORDER_ACTION_PATTERN.test(message) ||
    CONTACT_REQUEST_PATTERN.test(message) ||
    STOCK_CHECK_PATTERN.test(message)
  );
}

const PURCHASE_INTENT_REPLY =
  'Để mua hàng, bạn bấm "Nhắn Zalo" bên dưới nhé — thông tin sản phẩm sẽ tự copy, chỉ cần dán vào Zalo là được tư vấn và lên đơn ngay!';

// A comparison-shaped message ("bên nào uy tín?") with no established
// product set to compare yet — first message in the conversation, or
// every prior turn was itself off-topic/too-few-results. Real bug this
// guards against: "bên nào uy tín?" isn't tied to any category by itself
// (trustworthiness isn't AC-specific), so chatSearchProductsAction fell
// back to whatever the classifier's default guess was and returned a
// single, essentially arbitrary "máy lạnh" product — reading as "asking
// about brand trust produces a random AC". Asking the shopper to say what
// they're looking for first is the honest answer a rule-based system can
// give here; guessing further would just be a different flavor of wrong.
const NO_CONTEXT_COMPARE_REPLY =
  "Bạn đang muốn so sánh loại nào vậy? Mô tả nhu cầu trước đã (VD: máy lạnh phòng 20m², dưới 15 triệu...), rồi mình so sánh giúp bạn nhé!";

interface Turn {
  id: string;
  query: string;
  status: "pending" | "done" | "error";
  // "compare" turns skip chat-search entirely — see isComparisonFollowUp
  // and runCompare below — and reuse the /products/compare endpoint
  // against the previous turn's own results instead, so "loại nào tốt
  // hơn?" answers with real attribute data on the products just shown
  // rather than a fresh, context-blind search. "rank" turns go one step
  // further: a follow-up naming one *specific* objective criterion (price,
  // energy efficiency, power draw — see comparison-criteria.ts) against a
  // previous compare turn's own products, answered instantly client-side
  // with no network call at all — the data's already sitting right there
  // in that turn. "info" turns are a static, canned reply (see
  // isOffTopicQuestion) — also answered instantly, no network call.
  kind: "search" | "compare" | "rank" | "info";
  results?: ProductWithRelations[]; // kind: "search"
  compareProducts?: ProductWithRelations[]; // kind: "compare"
  ranking?: CriterionRanking; // kind: "rank"
  infoMessage?: string; // kind: "info"
  // Every product last actually shown in the conversation, if any — lets
  // an "info" turn's embedded Gọi ngay/Nhắn Zalo actions reference all of
  // them (see ChatContactActions), not just whichever was first. A turn
  // that suggested 5 products and got asked "mua sao?" right after should
  // hand off a Zalo message covering all 5, not silently drop 4 of them.
  contactProducts?: ProductWithRelations[];
  // Only the off-topic reply offers contact actions (see submitMessage) —
  // NO_CONTEXT_COMPARE_REPLY is asking the shopper to clarify what they
  // want, not handing them off to a human, so it doesn't get the
  // Gọi ngay/Nhắn Zalo row.
  offersContact?: boolean;
  explanation?: string | null;
  suggestions?: string[];
  error?: string | null;
}

// One-shot request/response, not a streamed chat — POST /products/chat-search
// returns a single JSON body immediately (no LLM/embeddings on the Go side,
// see chat_search.go), so no Vercel AI SDK/useChat here: that hook is built
// for token-by-token streaming, which doesn't apply to a rule-based parser
// that answers in one round trip. The UI below borrows shadcn's official
// chat primitives (Message/Bubble/MessageScroller/Marker, shipped 2026-06 —
// see ui.shadcn.com/docs/components/base/message-scroller) purely for the
// *look*: two states, not one fixed panel — a compact title+input before
// the first message (matching how Claude's own web UI opens: no bounding
// box, just a headline and an input resting on the page background), then
// an unboxed transcript that grows above a bottom composer once there's a
// conversation. The previous version wrapped everything in one bordered
// card at all times — cramped for the empty state, and the border read as
// a second "panel inside a panel" against the section's own dark backdrop.
// Sits in a MessageFooter below each reply's content now (see AssistantTurn)
// — not a leading avatar beside the message the way Message/MessageAvatar
// is normally used — matching how claude.ai signs off its own replies with
// a small mark under the text instead of a chat-bubble-style avatar
// upfront. size="sm" (24px, not the 32px "default") since it now has to
// read as a small signature, not a portrait-sized identity icon.
function AssistantAvatar() {
  return (
    // object-contain, not AvatarImage's default object-cover: cover fills
    // the circular mask by cropping to it, and this mark's paths run close
    // to its own canvas edges — the circular crop slices through them,
    // which at avatar size reads as stray disconnected fragments instead
    // of the logo. contain scales the whole mark down to fit inside the
    // circle uncropped.
    <Avatar size="sm" className="bg-white/10 p-1">
      <AvatarImage src="/logo/logo.svg" alt="Điện máy ELC" className="object-contain grayscale" />
      <AvatarFallback className="bg-transparent">
        <Sparkle className="size-3" weight="fill" />
      </AvatarFallback>
    </Avatar>
  );
}

function ProductRow({ products }: { products: ProductWithRelations[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-1">
        {products.map((product) => (
          <ChatProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ChatProductItem({ product }: { product: ProductWithRelations }) {
  const imageUrl = primaryImageUrl(product.images);
  // Same defaultVariant/displayPrice resolution ProductCard uses — the
  // product's default variant carries the write-time-cached display price
  // (see resolveProductDisplayPrice's doc comment), not a value derived
  // here.
  const defaultVariant = resolveDefaultVariant(product);
  const hasDiscount = (defaultVariant?.discountPercent ?? 0) > 0;
  const currentPrice = resolveProductDisplayPrice(product);

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      prefetch={false}
      className="group flex w-fit max-w-full items-center gap-3 rounded-lg bg-white/5 p-2 pr-4 transition-colors hover:bg-white/10"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-white">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.images[0]?.alt || product.name}
            fill
            sizes="64px"
            className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-1 text-sm text-foreground/90">
          {product.name}
        </span>
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-semibold text-foreground">
            <FormattedPrice price={currentPrice} />
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground">
              <FormattedPrice price={defaultVariant?.originalPrice ?? 0} strikethrough />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="flex flex-col items-start gap-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-64 items-center gap-3 p-2 pr-4">
          <Skeleton className="size-16 shrink-0 rounded-md" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

// FollowUpSuggestions renders the turn's own contextual suggestions (see
// chat_search.go's buildSuggestions) — each already has this turn's
// resolved context folded into its text (form factor, capacity, ...), so
// tapping one and sending it as the next message is what makes each round
// read as digging deeper into *this* conversation rather than restarting
// with a generic prompt. Visually distinct from ExamplePrompts' pre-chat
// chips (ghost/ring style vs. solid fill) so they read as "keep going"
// rather than "start over".
function FollowUpSuggestions({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (prompt: string) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {suggestions.map((suggestion) => (
        <Badge key={suggestion} asChild variant="secondary" className="h-auto cursor-pointer px-3 py-1 text-xs">
          <button type="button" onClick={() => onPick(suggestion)}>
            {suggestion}
          </button>
        </Badge>
      ))}
    </div>
  );
}

// Real "Gọi ngay"/"Nhắn Zalo" actions for an off-topic reply (see
// isOffTopicQuestion) — copy the suggested products' info to clipboard,
// toast a confirmation, and let the link open straight to Zalo, the same
// on mobile and desktop. No ZaloContactModal/device branching here on
// purpose (unlike BuyNowButton elsewhere on the site): inside the chat,
// the shopper is already looking at a running transcript, not a product
// page — a modal on top of that reads as an extra, unnecessary step. The
// copy-then-paste need is identical either way (zalo.me has no `?text=`
// param — see zalo-message.ts), so one path for both devices.
function ChatContactActions({ products }: { products?: ProductWithRelations[] }) {
  const contacts = useContacts();

  const zaloContact = contacts.find((c) => c.type === "zalo" && c.isActive) || contacts.find((c) => c.type === "zalo");
  const phoneContact = contacts.find((c) => c.type === "phone" && c.isActive) || contacts.find((c) => c.type === "phone");

  if (!zaloContact && !phoneContact) return null;

  // Every product this turn's contactProducts carries, not just the
  // first — real bug caught live-testing: a turn that suggested 5
  // products only ever copied the 1st one's info, silently dropping the
  // other 4 from the Zalo message.
  const productInfos: ZaloProductInfo[] = (products ?? []).map((product) => ({
    productName: product.name,
    salePrice: resolveProductDisplayPrice(product) ?? 0,
    productSlug: product.slug,
  }));

  const handleZaloClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    // No product context yet (e.g. an off-topic question asked before any
    // search) — nothing to copy, so just let the plain zalo.me link open.
    if (productInfos.length === 0) return;
    const message = buildZaloProductsMessage(productInfos);
    navigator.clipboard.writeText(message).catch(() => {});
    toast.success("Thông tin sản phẩm đã được sao chép", {
      description: "Paste vào Zalo để gửi cho tư vấn viên.",
      duration: 4000,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {phoneContact && (
        <Badge asChild variant="secondary" className="h-auto px-3 py-1.5 text-xs">
          <a href={phoneContact.href}>Gọi ngay</a>
        </Badge>
      )}
      {zaloContact && (
        <Badge asChild variant="secondary" className="h-auto px-3 py-1.5 text-xs">
          <a href={zaloContact.href} target="_blank" rel="noopener noreferrer" onClick={handleZaloClick}>
            Nhắn Zalo
          </a>
        </Badge>
      )}
    </div>
  );
}

function AssistantTurn({ turn, onPick }: { turn: Turn; onPick: (prompt: string) => void }) {
  return (
    <Message align="start">
      {/* min-w-0 is load-bearing here: MessageContent lives in a flex row
          (Message), and a flex item with no explicit min-width defaults to
          its content's intrinsic width — which for a horizontally-scrolling
          row is effectively unbounded. Without it the product row blows out
          instead of clipping into its own scrollbar. */}
      <MessageContent className="min-w-0">
        {turn.status === "pending" && (
          <>
            <Marker>
              <MarkerIcon>
                <Sparkle weight="fill" />
              </MarkerIcon>
              <MarkerContent className="shimmer">
                {turn.kind === "compare"
                  ? "Đang so sánh sản phẩm…"
                  : turn.kind === "rank"
                    ? "Đang xếp hạng…"
                    : "Đang tìm sản phẩm phù hợp…"}
              </MarkerContent>
            </Marker>
            {turn.kind === "search" && <ProductRowSkeleton />}
          </>
        )}

        {turn.status === "error" && (
          <Bubble variant="destructive">
            <BubbleContent>{turn.error}</BubbleContent>
          </Bubble>
        )}

        {turn.status === "done" && turn.kind === "search" && turn.results && (
          <>
            {(turn.explanation || turn.results.length === 0) && (
              <Bubble variant="muted">
                {/* Bubble's "muted" variant only sets the background
                    (bg-muted) — no text color, so it just inherits ambient
                    color instead of guaranteeing contrast against --muted.
                    Pin it to --foreground explicitly here rather than
                    patching the shared bubble.tsx (owned by the shadcn CLI,
                    would just get overwritten on the next `add`/`apply`). */}
                <BubbleContent className="text-foreground">
                  {turn.results.length === 0
                    ? "Chưa tìm thấy sản phẩm phù hợp, thử mô tả khác hoặc xem toàn bộ danh mục bên dưới."
                    : turn.explanation}
                </BubbleContent>
              </Bubble>
            )}
            {/* Deliberately NOT inside a Bubble/BubbleContent: that
                component is sized w-fit for text (see its doc comment),
                which fights a horizontally-scrolling media row — nesting
                one caused a real width-computation feedback loop (cards
                overlapping, content escaping the panel). Rich content
                renders as a plain sibling block instead, same convention
                chat UIs use for attachments/cards next to a text bubble. */}
            {turn.results.length > 0 && <ProductRow products={turn.results} />}
            {turn.suggestions && (
              <FollowUpSuggestions suggestions={turn.suggestions} onPick={onPick} />
            )}
          </>
        )}

        {turn.status === "done" && turn.kind === "compare" && turn.compareProducts && (
          // ChatComparisonTable, not the standalone /san-pham/so-sanh
          // page's ComparisonTable — same underlying attribute_values data
          // (see runCompare), but a chat-column-sized, differences-only
          // view (see ChatComparisonTable's doc comment for why the full
          // page's table doesn't work dropped straight into this panel).
          <ChatComparisonTable products={turn.compareProducts} onPick={onPick} />
        )}

        {turn.status === "done" && turn.kind === "rank" && turn.ranking && (
          <CriterionRankingAnswer ranking={turn.ranking} />
        )}

        {turn.status === "done" && turn.kind === "info" && turn.infoMessage && (
          <>
            <Bubble variant="muted">
              <BubbleContent className="text-foreground">{turn.infoMessage}</BubbleContent>
            </Bubble>
            {turn.offersContact && <ChatContactActions products={turn.contactProducts} />}
          </>
        )}
        {/* Inside MessageContent (a flex-col), not a Message-level sibling
            of it — Message itself is a flex *row* (for the old side-by-side
            avatar layout), so a Message-level sibling here would sit next
            to the content, not below it. See AssistantAvatar's doc comment
            for why it moved here at all (matches claude.ai's own sign-off
            placement, below the reply instead of beside it). */}
        <MessageFooter className="px-0">
          <AssistantAvatar />
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}

// A hundred distinct, catalog-grounded phrasings (not "VD: <one example>"
// anymore — a single static placeholder read as a form label, not a
// natural thing a shopper might type) spanning every angle someone
// actually searches from: budget + room size, a named form factor, a named
// venue/building type, a brand, a technical detail (gas/inverter/sort), or
// one of the two smaller categories (water/air purifiers, smart-home
// devices). Grounded in elc's real catalog only — residential/light-
// commercial split AC across the 5 known form factors up to 5.5 HP (see
// categoryLabelSlugs/maxTreoTuongTier in chat_search.go), the RO 3-in-1
// water purifier, fresh-air/air purifiers, and the 4 smart-home device
// categories — never implies a product class elc doesn't sell.
const PLACEHOLDER_QUERIES = [
  // Budget + room size
  "Máy lạnh dưới 8 triệu cho phòng trọ",
  "Máy lạnh treo tường 1.5 HP giá rẻ",
  "Phòng ngủ 12m2 lắp máy lạnh mấy HP?",
  "Máy lạnh cho phòng khách 25m2",
  "Máy lạnh dưới 10 triệu cho phòng ngủ nhỏ",
  "Máy lạnh 2HP giá bao nhiêu?",
  "Phòng 15m2 nên chọn máy lạnh nào?",
  "Máy lạnh giá tốt cho căn hộ chung cư",
  "Máy lạnh dưới 15 triệu công suất lớn",
  "Phòng 4x5m nên lắp máy lạnh mấy HP?",
  "Máy lạnh 1 HP cho phòng nhỏ",
  "Máy lạnh dưới 12 triệu tiết kiệm điện",
  "Phòng khách 30m2 dùng máy lạnh loại nào?",
  "Máy lạnh 2.5 HP giá dưới 20 triệu",
  "Máy lạnh cho phòng ngủ hướng tây nắng nóng",
  "Máy lạnh giá rẻ nhất hiện có",
  "Phòng bếp nóng nên lắp máy lạnh mấy HP?",
  "Máy lạnh cho phòng 20m2 giá dưới 15 triệu",
  "Máy lạnh 3 HP cho phòng rộng",
  "Máy lạnh giá dưới 10 triệu bền, ít hỏng",
  "Phòng trọ nhỏ nên lắp máy lạnh loại nào rẻ",
  "Máy lạnh cho phòng 18m2 dùng ban đêm",
  "Máy lạnh công suất lớn cho phòng 40m2",
  "Máy lạnh dưới 9 triệu inverter tiết kiệm điện",
  "Phòng ngủ có nắng chiếu vào nên chọn máy lạnh nào",
  // Form factor
  "Máy lạnh âm trần cho phòng khách rộng",
  "Máy lạnh tủ đứng công suất lớn",
  "Máy lạnh giấu trần nối ống gió cho biệt thự",
  "Máy lạnh áp trần cho văn phòng nhỏ",
  "Nên chọn máy lạnh âm trần hay treo tường?",
  "Máy lạnh treo tường thẩm mỹ, gọn nhẹ",
  "Máy lạnh tủ đứng di động lắp ở đâu cũng được không?",
  "Máy lạnh giấu trần có ồn không?",
  "Máy lạnh áp trần lắp cho quán ăn",
  "So sánh máy lạnh âm trần với tủ đứng",
  "Máy lạnh treo tường 2 chiều nóng lạnh",
  "Máy lạnh giấu trần cho phòng khách sang trọng",
  "Máy lạnh tủ đứng cho hội trường nhỏ",
  "Máy lạnh âm trần 4 hướng thổi",
  "Loại máy lạnh nào gọn, không lộ dây ống",
  // Building type
  "Máy lạnh cho quán cafe nhỏ",
  "Máy lạnh cho nhà hàng đông khách",
  "Máy lạnh cho biệt thự 2 tầng",
  "Máy lạnh cho showroom ô tô",
  "Máy lạnh cho văn phòng 20 người",
  "Máy lạnh cho khách sạn mini",
  "Máy lạnh cho nhà phố mặt tiền",
  "Máy lạnh cho shop quần áo",
  "Máy lạnh cho phòng gym nhỏ",
  "Máy lạnh cho quán trà sữa",
  "Máy lạnh cho căn hộ cao cấp",
  "Máy lạnh cho homestay",
  "Máy lạnh cho phòng họp công ty",
  "Máy lạnh cho quán nhậu ngoài trời có mái che",
  "Máy lạnh cho tiệm bánh",
  // Brand
  "Máy lạnh Daikin loại nào bán chạy?",
  "Máy lạnh Panasonic tiết kiệm điện",
  "Máy lạnh LG inverter giá tốt",
  "Máy lạnh Mitsubishi bền không?",
  "Máy lạnh Toshiba 1.5 HP",
  "Máy lạnh Gree giá rẻ",
  "Máy lạnh Midea có tốt không?",
  "Máy lạnh Samsung 2 HP",
  "So sánh Daikin và Panasonic loại nào đáng mua hơn",
  "Máy lạnh Carrier cho văn phòng",
  // Gas / sort / technical
  "Máy lạnh dùng gas R32 tiết kiệm điện",
  "Máy lạnh mới nhất hiện có",
  "Máy lạnh bán chạy nhất tháng này",
  "Máy lạnh nào ít hao điện nhất",
  "Máy lạnh inverter là gì, có đáng mua không",
  "Máy lạnh chạy 24/24 bền không",
  "Máy lạnh cho phòng server nhỏ",
  "Máy lạnh giá cao cấp nhất",
  "Máy lạnh có chức năng lọc không khí không",
  "Máy lạnh nào lắp cho phòng đóng cửa cả ngày",
  // Water purifier
  "Máy lọc nước RO cho gia đình 4 người",
  "Máy lọc nước 3 lõi giá bao nhiêu",
  "Máy lọc nước nào cho nhà có trẻ nhỏ",
  "Máy lọc nước dưới 5 triệu",
  "Nước nhà tôi hơi đục cần lọc loại nào",
  "Máy lọc nước RO 3 in 1 lắp dưới bồn rửa",
  "Máy lọc nước cho gia đình đông người",
  "Máy lọc nước nào giữ khoáng chất",
  "Máy lọc nước giá tốt nhất hiện có",
  "Máy lọc nước dễ thay lõi không",
  // Air purifier / fresh air
  "Máy lọc không khí giá tốt cho nhà có trẻ nhỏ",
  "Máy cấp khí tươi cho phòng ngủ đóng kín",
  "Máy lọc không khí cho phòng 20m2",
  "Máy lọc không khí khử mùi hiệu quả",
  "Máy cấp khí tươi lắp cho căn hộ chung cư",
  "Máy lọc không khí nào lọc bụi mịn tốt",
  "Phụ kiện đường ống cho máy cấp khí tươi",
  "Máy lọc không khí cho phòng làm việc nhỏ",
  // Smart home
  "Công tắc thông minh điều khiển qua điện thoại",
  "Cảm biến thông minh báo động khi có người lạ",
  "Bảng điều khiển thông minh cho cả nhà",
  "Remote cầm tay điều khiển nhiều thiết bị",
  "Thiết bị nhà thông minh cho căn hộ nhỏ",
  "Công tắc thông minh có tương thích với công tắc cũ không",
  "Nhà thông minh cơ bản nên bắt đầu từ đâu",
];

// Typewriter timings, in ms — TYPE_MS/ERASE_MS are per character;
// HOLD_MS is the "đợi 2 nhịp" pause with a phrase fully typed out before
// it starts erasing (two ~800ms beats); GAP_MS is the brief blank pause
// between one phrase erasing away and the next one starting, so it doesn't
// read as one phrase instantly morphing into another.
const TYPE_MS = 45;
const ERASE_MS = 25;
const HOLD_MS = 1600;
const GAP_MS = 400;

// Drives the composer's placeholder through PLACEHOLDER_QUERIES one
// character at a time — typed out, held, erased, then the next phrase
// starts — instead of a single static string, so an idle input reads as
// "here's what people ask" rather than one fixed example. A self-
// scheduling setTimeout chain (not setInterval): each step's delay differs
// by phase (typing vs. holding vs. erasing vs. the gap between phrases),
// which setInterval's fixed period can't express, and each callback
// carries the exact phrase/index it's operating on in its own closure
// rather than reaching back into component state.
//
// `active` (message empty and not mid-request — see Composer) gates the
// whole effect: the timer chain simply doesn't run while there's real
// input to show instead, so it can't ever stomp on what the shopper is
// typing. Toggling back to active always restarts the current phrase from
// its first character rather than resuming mid-type/mid-erase — a minor
// visual reset, not worth the bookkeeping a true resume would need.
function useTypewriterPlaceholder(phrases: string[], active: boolean): string {
  const [text, setText] = useState("");
  const phraseIndexRef = useRef(0);

  useEffect(() => {
    if (!active || phrases.length === 0) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = (fn: () => void, delayMs: number) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, delayMs);
    };

    const typeChar = (phrase: string, charIndex: number) => {
      setText(phrase.slice(0, charIndex));
      if (charIndex < phrase.length) {
        schedule(() => typeChar(phrase, charIndex + 1), TYPE_MS);
      } else {
        schedule(() => eraseChar(phrase, phrase.length), HOLD_MS);
      }
    };

    const eraseChar = (phrase: string, charIndex: number) => {
      setText(phrase.slice(0, charIndex));
      if (charIndex > 0) {
        schedule(() => eraseChar(phrase, charIndex - 1), ERASE_MS);
      } else {
        phraseIndexRef.current = (phraseIndexRef.current + 1) % phrases.length;
        schedule(() => typeChar(phrases[phraseIndexRef.current], 0), GAP_MS);
      }
    };

    typeChar(phrases[phraseIndexRef.current % phrases.length], 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [active, phrases]);

  return text;
}

// Tracks how much shorter the *visual* viewport is than the layout
// viewport right now — 0 normally, and roughly the on-screen keyboard's
// height while it's open. `interactive-widget: resizes-content` (set
// globally in app/layout.tsx) already makes Android Chrome shrink the
// layout viewport itself when the keyboard opens, which — since the
// composer is an ordinary last-flex-item, not position:fixed — already
// makes it land right above the keyboard for free there, no JS needed.
// iOS Safari's support for that meta is newer and inconsistent, though:
// when the layout viewport doesn't actually shrink to match, the
// composer stays where flexbox thinks the container's bottom edge is —
// which can end up under the keyboard instead of above it. This hook
// measures that gap directly via the VisualViewport API (broadly
// supported, including iOS, unlike the newer Chromium-only
// VirtualKeyboard API) so the composer can correct for it with a plain
// CSS transform — see its one call site below for why a transform nudge
// on an already-mounted element, not position:fixed or a portal: neither
// remounts the input (which would drop focus and dismiss the keyboard
// the moment it opens) or fights Framer Motion's own transform
// management on the animated ancestor around it.
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  // The viewport's own tallest measurement seen so far — a self-tracking
  // baseline, not window.innerHeight. innerHeight reflects the layout
  // viewport (mobile Safari sizes it for the largest possible visible
  // area, chrome retracted) while visualViewport.height reflects what's
  // *currently* visible — these two legitimately differ just from the
  // address bar showing/hiding during ordinary scrolling, with no
  // keyboard involved at all. Comparing against innerHeight directly
  // (the first version of this hook) would have misread that as a
  // permanent keyboard-sized nudge on iOS Safari even with no keyboard
  // open. Only a shrink *relative to the tallest this session has seen*
  // is actually the keyboard.
  const baselineRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      if (baselineRef.current === null || viewport.height > baselineRef.current) {
        baselineRef.current = viewport.height;
      }
      setInset(Math.max(0, Math.round(baselineRef.current - viewport.height)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}

// The composer is identical in both states — same input, same button —
// only the surrounding layout changes (centered vs. pinned below a
// transcript), so it's one function instead of two near-duplicate JSX
// blocks.
function Composer({
  message,
  setMessage,
  isPending,
  onSubmit,
}: {
  message: string;
  setMessage: (value: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}) {
  const typedPlaceholder = useTypewriterPlaceholder(
    PLACEHOLDER_QUERIES,
    message.length === 0 && !isPending,
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      // w-full is load-bearing: this form is a flex child of a column
      // container. A plain flex column defaults cross-axis sizing to
      // stretch, but the parent here uses items-center (to horizontally
      // center the title/prompts above/below it), which switches children
      // to shrink-to-content instead — collapsing the form (and the
      // InputGroup inside it, whose own w-full only resolves relative to
      // this form) down to its placeholder text's width. Verified as the
      // exact cause of a real "input is a tiny box" bug.
      className="w-full"
    >
      {/* border-transparent (not the default border-input, which resolves
          to --border — the same token a bounding card would use) — the
          composer reads as its own soft surface resting on the section's
          dark background, not another bordered box nested inside one. */}
      <InputGroup className="h-auto rounded-2xl border border-white/15 bg-white/10 px-1.5 py-1.5 shadow-lg shadow-black/30">
        <InputGroupInput
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={typedPlaceholder}
          disabled={isPending}
          // text-foreground explicit for the same reason as BubbleContent
          // above: the base Input component doesn't set a text color
          // itself, just relies on inheriting the ambient one — which
          // rendered near-black/unreadable here (typed text on the dark
          // input background), so pin it rather than trust inheritance.
          className="h-11 px-3 text-base text-foreground"
        />
        <InputGroupAddon align="inline-end">
          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={isPending || !message.trim()}
          >
            <ArrowUp className="size-4" weight="bold" />
            <span className="sr-only">Gửi</span>
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function ExamplePrompts({
  prompts,
  onPick,
}: {
  prompts: string[];
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {prompts.map((prompt) => (
        <Badge
          key={prompt}
          asChild
          variant="outline"
          className="h-auto cursor-pointer border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <button type="button" onClick={() => onPick(prompt)}>
            {prompt}
          </button>
        </Badge>
      ))}
    </div>
  );
}

// /products/compare accepts 2-4 same-category product IDs (see
// getProductCompareAction's doc comment) — capped here for the same
// reason ChatSearchLimit caps chat-search's own result count: a
// comparison table is meant to read as "here's how these differ", not
// grow into an unreadable wall of columns.
const MAX_COMPARE_PRODUCTS = 4;

// Fire-and-forget: every message a shopper types into this chat carries
// real purchase intent/pain-point data in their own words (see
// docs/chat-search-intent-research.md) — worth keeping regardless of
// which internal path answers it, not just the ones that hit
// chatSearchProductsAction. Logged via the BFF proxy (app/api/chat-logs/
// route.ts → elc-go's public, anonymous-visitor_id /chat-logs endpoint —
// see internal/chat-log), matching Go's own ChatLogKind* whitelist
// (internal/chat-log/domain/types.go) exactly so a stray value here can't
// silently fail Go's validation and drop the entry. Never awaited by a
// caller and never affects the actual chat response — a dropped log call
// must stay invisible to the shopper.
function logChatMessage(message: string, kind: string) {
  fetch("/api/chat-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, kind }),
  }).catch(() => {});
}

export function ProductChatFinder() {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isPending, startTransition] = useTransition();

  // Runs an ordinary chat-search turn. Also doubles as runCompare's
  // fallback (see below) for a turn that was *provisionally* opened as
  // "compare" but couldn't actually be answered that way — re-searching
  // beats leaving the shopper at a dead end, so this always finishes the
  // turn as "search" regardless of which path started it.
  //
  // searchQuery is what's actually sent to chatSearchProductsAction — NOT
  // necessarily the same string as the turn's own displayed `query` (see
  // submitMessage's bare-refinement handling): a follow-up like "phòng
  // 20m2" gets the previous search turn's own query text prepended before
  // being sent here, so chat_search.go's parser sees the combined sentence
  // ("máy lạnh giấu trần cho biệt thự phòng 20m2") and keeps the earlier
  // form-factor/building-type signal instead of losing it to a fresh,
  // context-blind search. The transcript still shows exactly what the
  // shopper typed — only the API call itself sees the merged text.
  const runSearch = (id: string, searchQuery: string) => {
    startTransition(async () => {
      const start = Date.now();
      const { data, explanation, suggestions, error } = await chatSearchProductsAction(searchQuery);
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
      }
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                kind: "search",
                status: error ? "error" : "done",
                results: data,
                explanation,
                suggestions,
                error,
              }
            : t,
        ),
      );
    });
  };

  // Answers a comparison follow-up ("loại nào tốt hơn?") from the previous
  // search turn's own results — no new search, no LLM: real attribute
  // data (see ChatComparisonTable) on the exact products already shown. Falls
  // back to a plain search instead of erroring out if the compare
  // endpoint can't actually serve this pair (e.g. it enforces same-category
  // — see getProductCompareAction's doc comment — and a shopper can still
  // type a comparison phrase after a mixed-category fallback-path result).
  const runCompare = (id: string, trimmed: string, productIds: string[]) => {
    startTransition(async () => {
      const start = Date.now();
      const { data, error } = await getProductCompareAction(productIds);
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
      }
      if (error || data.length < 2) {
        runSearch(id, trimmed);
        return;
      }
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "done", compareProducts: data } : t,
        ),
      );
    });
  };

  const submitMessage = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isPending) return;
    setMessage("");
    const id = crypto.randomUUID();

    // Most recent turn — search *or* compare, whichever is chronologically
    // later — that has an actual set of >=2 products to reason about. Real
    // bug this replaces: criterion questions ("loại nào tiết kiệm điện
    // nhất?") only ever checked against a turn of kind "compare" — so
    // skipping the explicit "so sánh" step and asking about a criterion
    // straight after a plain search (confirmed as the overwhelmingly more
    // common real flow via live testing) always found lastCompareTurn
    // undefined and fell straight through to a blind, signal-less search.
    // A compare turn's own compareProducts is just as valid a "current
    // options" set as a search turn's results, so both count here — one
    // pass, not two separate lookups that only one of them used to feed.
    // Computed before the off-topic check too (not just compare/rank
    // below) so an off-topic reply can still reference whichever product
    // was last actually shown, for the embedded Zalo/phone actions.
    const lastContextTurn = [...turns].reverse().find(
      (t) =>
        (t.kind === "compare" && t.status === "done" && (t.compareProducts?.length ?? 0) >= 2) ||
        (t.kind === "search" && t.status === "done" && (t.results?.length ?? 0) >= 2),
    );
    const contextProducts =
      lastContextTurn?.kind === "compare" ? lastContextTurn.compareProducts : lastContextTurn?.results;
    const contactProducts = contextProducts;

    // Checked before anything else: a warranty/shipping/installation/promo
    // question isn't a product search at all, so it shouldn't fall through
    // to chat-search or the compare/rank logic below — see
    // isOffTopicQuestion's doc comment.
    if (isOffTopicQuestion(trimmed)) {
      logChatMessage(trimmed, "off_topic");
      setTurns((prev) => [
        ...prev,
        { id, query: trimmed, status: "done", kind: "info", infoMessage: OFF_TOPIC_REPLY, contactProducts, offersContact: true },
      ]);
      return;
    }

    // Checked right alongside off-topic, same reason — see
    // isPurchaseIntent's doc comment.
    if (isPurchaseIntent(trimmed)) {
      logChatMessage(trimmed, "purchase_intent");
      setTurns((prev) => [
        ...prev,
        { id, query: trimmed, status: "done", kind: "info", infoMessage: PURCHASE_INTENT_REPLY, contactProducts, offersContact: true },
      ]);
      return;
    }

    // Criterion match checked first (more specific than the general
    // isComparisonFollowUp below): a message naming one concrete criterion
    // gets answered instantly from contextProducts, no network call —
    // works whether contextProducts came from a search or an earlier
    // compare turn.
    const matchedCriterion = contextProducts
      ? matchCriterionFollowUp(trimmed, applicableCriteria(contextProducts))
      : null;

    if (matchedCriterion && contextProducts) {
      logChatMessage(trimmed, "rank");
      // No MAX_COMPARE_PRODUCTS cap here — a ranked *list* (unlike the
      // side-by-side table below) doesn't hit a column-width limit, so
      // ranking is worth doing across every product this turn actually has.
      const ranking = rankByCriterion(contextProducts, matchedCriterion);
      setTurns((prev) => [
        ...prev,
        { id, query: trimmed, status: "done", kind: "rank", ranking },
      ]);
      return;
    }

    if (isComparisonFollowUp(trimmed)) {
      if (contextProducts) {
        logChatMessage(trimmed, "compare");
        setTurns((prev) => [...prev, { id, query: trimmed, status: "pending", kind: "compare" }]);
        const productIds = contextProducts.slice(0, MAX_COMPARE_PRODUCTS).map((p) => p.id);
        runCompare(id, trimmed, productIds);
        return;
      }
      // Comparison-shaped ("bên nào uy tín?"), but nothing to compare yet —
      // see NO_CONTEXT_COMPARE_REPLY's doc comment for why this asks rather
      // than lets it fall through to a signal-less search.
      logChatMessage(trimmed, "no_context_compare");
      setTurns((prev) => [
        ...prev,
        { id, query: trimmed, status: "done", kind: "info", infoMessage: NO_CONTEXT_COMPARE_REPLY },
      ]);
      return;
    }

    // Most recent completed *search* turn at all (any result count) — the
    // context a bare refinement borrows from. Deliberately separate from
    // contextProducts above (that one requires >=2 products specifically
    // for a compare/rank table to make sense; carrying context forward for
    // a plain search is useful even off a single-result turn).
    const lastSearchTurn = [...turns].reverse().find((t) => t.kind === "search" && t.status === "done");
    const searchQuery =
      isBareRefinement(trimmed) && lastSearchTurn ? `${lastSearchTurn.query} ${trimmed}` : trimmed;

    // Logged as the shopper's own literal message (trimmed), not the
    // context-merged searchQuery actually sent to chat-search — the log's
    // purpose is capturing real shopper phrasing, and the merge is an
    // internal implementation detail of how the search gets carried out.
    logChatMessage(trimmed, "search");
    setTurns((prev) => [...prev, { id, query: trimmed, status: "pending", kind: "search" }]);
    runSearch(id, searchQuery);
  };

  const hasTurns = turns.length > 0;
  const keyboardInset = useKeyboardInset();
  // Starts as the pool's first ROTATION_SIZE entries (matches the server's
  // render exactly) and reshuffles once in useEffect, which only ever runs
  // client-side post-hydration — see EXAMPLE_PROMPTS' doc comment.
  const [examplePrompts, setExamplePrompts] = useState(() => EXAMPLE_PROMPTS.slice(0, ROTATION_SIZE));
  useEffect(() => {
    // Deliberate exception: this is the canonical justified case for the
    // rule (client-only randomization after hydration has already
    // reconciled against the server's deterministic first render), not an
    // external-system sync gone through setState by mistake.
    /* eslint-disable react-hooks/set-state-in-effect */
    setExamplePrompts(pickRandomPrompts(EXAMPLE_PROMPTS, ROTATION_SIZE));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // `dark` scopes every shadcn token below (Bubble/Message/InputGroup/
  // Marker all read CSS vars, not hardcoded colors) to the site's dark
  // palette — no per-component color overrides needed, same technique
  // hero.tsx uses for its own always-dark CTA row.
  //
  // h-full (not a min-h) is fixed regardless of state on purpose —
  // HeroChatFinderSection now hands this component the section's full,
  // bounded h-screen height. Filling it rather than just setting a
  // minimum is what lets the transcript's flex-1/min-h-0 scroller below
  // actually cap its own height and scroll internally instead of the
  // whole page growing with every turn. It also keeps the empty state
  // (just a title + composer) from jumping in height on the first send:
  // the title+composer pair that was vertically centered in the middle
  // splits apart — title rises to a small header at top, composer drops
  // to a footer at bottom, and the transcript fills the flex-1 gap that
  // opens up between them. The title lives here (not in the section
  // wrapper) specifically so its position can react to `hasTurns` the
  // same way the composer's does.
  return (
    // `layout` on the outer container + the title/composer blocks below
    // hands the reflow to Motion's FLIP animation instead of letting it
    // snap: same DOM, same h-full, but Motion measures each layout-tagged
    // element before/after the hasTurns class change and animates the
    // difference (position, size) instead of the browser just repainting
    // at the new layout instantly. Relies on `m`/AnimatePresence's
    // LazyMotion ancestor — already global via QueryProvider
    // (shared/providers/query-provider.tsx), same `domAnimation` setup
    // hero-rotating-word.tsx uses. (There's also an unrelated, unused
    // shared/components/layout/user/motion-provider.tsx wrapping the
    // identical LazyMotion config — dead code, not what actually
    // provides this.)
    <m.div layout className="dark flex h-full w-full flex-col gap-4">
      <m.div
        layout
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex flex-col items-center gap-2 text-center",
          hasTurns ? "shrink-0 pt-1" : "flex-1 justify-center",
        )}
      >
        <span className="text-sm font-medium text-white/60">
          Chưa biết chọn loại nào?
        </span>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Mô tả nhu cầu, để AI gợi ý cho bạn
        </h2>
      </m.div>

      <AnimatePresence>
        {hasTurns && (
          <m.div
            key="scroller"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* autoScroll defaults to false on this primitive (see
                @shadcn/react's message-scroller) — without it, a new turn
                appending below the fold left the shopper stuck reading
                whatever was already on screen, having to scroll down or
                hit MessageScrollerButton manually every single time. */}
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="min-h-0 flex-1">
                {/* overscroll-auto overrides the base component's own
                    overscroll-contain (message-scroller.tsx, shadcn-owned)
                    — contain is right for a chat panel that's the whole
                    page (nothing to hand scrolling off to past its edges),
                    but this transcript sits inside HeroChatFinderSection's
                    h-screen hero, with more page below it. contain also
                    blocks scroll *chaining*, not just the bounce effect
                    (see Tailwind's overscroll-behavior docs) — so once a
                    visitor's wheel/touch scroll hit the top or bottom of
                    this inner list, it silently ate every further scroll
                    input instead of continuing to scroll the page, reading
                    as the whole page being stuck. auto is the one that
                    still contains the scroll while inside the transcript,
                    but lets it hand off to the section/page once the
                    transcript itself can't scroll any further.
                    scrollbar-width/::-webkit-scrollbar hidden: the
                    scrollbar-thin/scrollbar-gutter-stable classes this
                    component ships with (message-scroller.tsx) assume the
                    tailwind-scrollbar plugin, which isn't installed in this
                    project — they're silently inert, so what a visitor
                    actually saw was just the bare browser scrollbar.
                    Hidden explicitly instead, same look as the rest of the
                    site's horizontally-scrolling rows (marquee, etc). */}
                <MessageScrollerViewport className="overscroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {/* min-h-0 overrides the base component's min-h-full
                      (message-scroller.tsx, shadcn-owned) — that stretches
                      the content block to fill the whole scroller viewport
                      even when the transcript is short, leaving a tall
                      near-empty reply box. Shrinking to actual content
                      height instead lets the box read as "as tall as this
                      reply is." */}
                  <MessageScrollerContent className="min-h-0 px-1 pt-2">
                    {turns.map((turn) => (
                      <MessageScrollerItem key={turn.id} className="flex flex-col gap-4">
                        <Message align="end">
                          <MessageContent>
                            <Bubble align="end">
                              <BubbleContent>{turn.query}</BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                        <AssistantTurn turn={turn} onPick={submitMessage} />
                      </MessageScrollerItem>
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </m.div>
        )}
      </AnimatePresence>

      <m.div
        layout
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn("flex shrink-0 flex-col gap-4", !hasTurns && "items-center")}
      >
        <AnimatePresence>
          {!hasTurns && (
            <m.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ExamplePrompts prompts={examplePrompts} onPick={submitMessage} />
            </m.div>
          )}
        </AnimatePresence>
        {/* Plain div, not another m.div — Framer Motion already owns the
            `transform` CSS property on its own layout-animated elements
            (this is literally how its FLIP animations work), so setting
            an inline transform directly on an m.div here would fight that
            and get overwritten on the next animation frame. A plain,
            non-motion element has no such owner, so the keyboard-inset
            nudge (see useKeyboardInset) is free to use `transform` for
            its own, unrelated purpose. w-full so it still stretches
            correctly inside the parent's items-center empty-state
            layout, same reasoning as Composer's own w-full. */}
        <div
          className="flex w-full flex-col gap-4"
          style={keyboardInset > 0 ? { transform: `translateY(-${keyboardInset}px)` } : undefined}
        >
          <Composer
            message={message}
            setMessage={setMessage}
            isPending={isPending}
            onSubmit={() => submitMessage(message)}
          />
          <p className="text-center text-xs text-white/40 sm:text-sm">
            AI đang trong quá trình huấn luyện, thông tin chỉ mang tính tham khảo.
            Cần tư vấn chuyên sâu, liên hệ Zalo nhé!
          </p>
        </div>
      </m.div>
    </m.div>
  );
}
