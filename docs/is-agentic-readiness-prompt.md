# Is Agentic readiness: prompt gốc + trạng thái

Status: code xong local (2026-10-28), CHƯA commit, CHƯA deploy. Xem "Trạng thái" ở cuối.

Nguồn: https://is-agentic.com/scan/dienmayelc.com.vn (điểm 71/100, "Ready with a few material gaps", loại Commerce, snapshot 2026-10-28).

## Prompt gốc

Improve how ready https://dienmayelc.com.vn is for agents.

Current Is Agentic score: 71/100 (Is Agentic readiness model based on Ora audit evidence).

Implement the following fixes in priority order (failures first, then warnings):

### 1. Agent-friendly 404s (Essential, Partial 50%)

Evidence: The nonexistent path `https://dienmayelc.com.vn/__ora-404-probe-6x9tgkoy` correctly returns HTTP 410. Partial credit: no Markdown error body was detected.

Fix: Keep the correct HTTP 410 status. The remaining requirement is a Markdown error body when agents request `Accept: text/markdown`. Include at least 20 characters explaining the error and a link to docs, sitemap, or llms.txt. Verify:

```
curl -sS -L -i -H 'Accept: text/markdown' https://yourdomain.com/some-path-that-does-not-exist
```

Check both the final 410 status and the Markdown body with `Content-Type: text/markdown`. Checking the status alone does not verify the missing requirement.

### 2. Content is available without JavaScript (Essential, Partial 67%)

Evidence: 8368 chars with H1, but 0.9% content ratio is below the 5% target.

Fix: Serve at least 500 characters of meaningful homepage content in raw HTML. Add a clear H1, keep deeper heading levels sequential, and remove excessive non-content markup.

### 3. Markdown content negotiation, acceptmarkdown.com (Essential, Failed)

Evidence: Could not probe both `Accept: text/markdown` and `Accept: text/html` on the homepage.

Fix: Enable Markdown negotiation on the scanned homepage. Supporting it only on `/docs` or a separate .md URL does not satisfy this check. Requests with `Accept: text/markdown` must receive a nonempty Markdown body with `Content-Type: text/markdown` and `Vary: Accept`. Keep serving HTML for `Accept: text/html`. Adding Vary alone does not create a Markdown response. Verify both:

```
curl -sS -L -i -H 'Accept: text/markdown' https://yourdomain.com/
curl -sS -L -i -H 'Accept: text/html' https://yourdomain.com/
```

Check final response headers and body: Markdown with `Vary: Accept` for the first, HTML for the second.

### 4. Agent instruction / when-to-use (Recommended, Failed)

Evidence: No agent instruction file with when-to-use guidance found.

Fix: Add a "when to use this" section to llms.txt (or a dedicated agent-instructions file) that names best-fit use cases and how an agent should call you. Be specific about the jobs you are right for; generic marketing copy does not count.

### 5. Trust anchor pages (Recommended, Failed)

Evidence: No trust anchor pages found with sufficient content (About, Contact, Privacy).

Fix: Publish real `/about`, `/contact`, `/privacy` pages with at least 500 characters each. Agents check these to verify the business is legitimate before recommending it.

### 6. Brand name discoverability (Recommended, Partial 33%)

Evidence: dienmayelc.com.vn ranks #7 for "Điện máy ELC" (brand name alone; no main product term from the homepage qualified).

Fix: Make sure the own domain ranks in the top results for brand + main product (e.g. "Acme payments API"). Describe the main product clearly in homepage title and headings, earn press mentions linking to the domain, avoid redirect chains that mask the main domain.

### 7. JSON-LD structured data (Recommended, Partial 50%)

Evidence: JSON-LD Organization found, missing description on this entity.

Fix: Add `description` to the Organization JSON-LD entity.

### Requirements

- Inspect the existing codebase before changing files.
- Follow each published protocol or file format exactly.
- Preserve existing product behavior and visual design.
- Add or update tests for every behavior you change.
- Verify every public endpoint and machine-readable file after implementation.
- Finish with a concise change summary, verification results, and remaining recommendations that need product decisions or credentials.

## Trạng thái (2026-10-28)

| # | Mục | Trạng thái |
|---|---|---|
| 1 | 404/410 Markdown | Code + nginx xong, test Docker nginx pass. Cần deploy app trước rồi `install.sh` |
| 2 | Content không cần JS | Mới slim payload (bỏ ~1 MB description/brand/category + project props). Ước tính còn ~1.6 MB, ratio ~1%, CHƯA đạt 5% |
| 3 | Markdown negotiation | `proxy.ts` rewrite `/` sang `/agent-md/home`, `Vary: Accept`. Chưa test với data thật (Go API local tắt) |
| 4 | When-to-use | Đã thêm vào `/llms.txt` |
| 5 | Trust pages | `/about` `/contact` `/privacy` 308 sang trang VN có sẵn. Chưa biết scanner có theo redirect không |
| 6 | Brand discoverability | Chưa làm, việc SEO (title/H1, press, GBP) |
| 7 | Organization description | Xong |

### File đã đụng

- `proxy.ts`, `next.config.ts`, `app/llms.txt/route.ts`, `app/(public)/page.tsx`
- `app/agent-md/home/route.ts`, `app/agent-md/gone/route.ts` (mới)
- `shared/lib/agent-markdown/` (negotiate, render, tests), `shared/lib/seo-schema.ts`
- `shared/components/organisms/sections/project-bounce-cards.tsx`
- `modules/catalog/presentation/lib/slim-product-card.ts` (mới) + test
- `deploy/nginx/install.sh`, `elc-normalize.conf`, `elc-redirects.conf`, `scripts/nginx-live/redirects.py`
- Tests: `__tests__/proxy-markdown.test.ts`, `shared/lib/__tests__/seo-schema-organization.test.ts`

### Thứ tự deploy

1. Deploy app (có route `/agent-md/*`).
2. `scp` `elc-normalize.conf` + `elc-redirects.conf` lên VPS, chạy `install.sh` (nó cảnh báo nếu probe Markdown 410 không đạt).
3. Chạy 3 lệnh curl ở mục 1 và 3, kiểm tra `Vary: Accept` có trên HTML trang chủ thật.
4. Rescan trên is-agentic.com.

### Còn mở / cần quyết định

- Đạt 5% content ratio: chỉ render 4-6 sản phẩm/danh mục ban đầu, phần còn lại tải bằng "Hiển thị thêm". Đổi giao diện nên chưa làm. Cũng giúp HTML xuống dưới ngưỡng 2 MB của Googlebot.
- Brand ranking #7: title/H1 ghép thương hiệu + sản phẩm chính, press links, Google Business Profile.
- Nếu rescan mà trust anchor vẫn fail: đổi 3 alias thành trang thật có canonical.
- 404 do Next.js (slug còn trong allowlist nhưng không còn trong DB) vẫn chỉ trả HTML.
- 3 test fail sẵn từ trước ở `modules/catalog/__tests__/domain/validators.test.ts`, không liên quan.
