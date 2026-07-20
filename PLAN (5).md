git reset
git add "**/db/migration/*.sql"
git add auth-service/**/pom.xml user-service/**/pom.xml product-service/**/pom.xml inventory-service/**/pom.xml order-service/**/pom.xml
git add "**/entity/VerificationToken.java"
git commit -m "feat(db): introduce Flyway baselines + validate + token rename (3.2)"

git add -A
git commit -m "chore(config): externalize secrets (3.1)"# Trinket Story — Security & Correctness Remediation Plan

Post-audit roadmap for the `jewelry-store` microservices project. Findings come from a
full read-only audit (Claude Code 100%-coverage pass, cross-checked against a manual
review), plus a second read-only verification audit before Phase 3 (see **Audit findings**
under each relevant item). Items are ordered for execution:
**live-exploitable-and-cheap first**, then correctness, then heavier architectural work,
then deploy.

## How to use this file

- Each phase is meant to be a self-contained chunk of work — a phase (or a couple of
  items) per chat session.
- Check items off as they land. Each `- [ ]` item is sized as roughly one commit-unit.
- Items tagged **(CC)** are good candidates to hand to **Claude Code** — multi-file or
  repo-wide changes where direct filesystem access helps. Untagged items are better
  done chat-guided, because they involve subtle logic or design decisions worth
  reasoning through step by step.
- Finding IDs (C-1, H-2, M-3, …) map back to the audit report.
- **Deferred items live in their own section at the end of this document, not inline in
  their original phase.** Each carries the reasoning for deferring and a trigger
  condition for when to revisit. This keeps the active roadmap free of items you've
  already decided not to build right now.

## Working conventions

- One logical unit per commit; scoped commit prefixes (e.g. `fix(gateway):`,
  `feat(order):`, `refactor(auth):`).
- **Write a regression test alongside each security fix in Phases 1–2** — a test that
  proves the hole is closed (forged header rejected, IDOR returns 404, concurrent
  reserve no longer oversells). This front-loads the Phase 5 test suite and prevents
  re-opening a fixed vuln.
- Verify each piece before moving to the next. Prefer the simpler immediate solution;
  defer over-engineering (noted per item where relevant).
- **When handing work to Claude Code across a chat session, commit as each logical unit
  lands rather than batching multiple units uncommitted.** Phase 2.3/2.4 landed as five
  separate logical changes across three services but sat uncommitted together in one
  working tree for a stretch; splitting them into per-service commits afterward required
  hand-picking individual files in IntelliJ's commit dialog, including two identically-named
  files (`TransactionalEventPublisher.java` existing once per service) that had to be
  distinguished by path, not name. Commit as you go instead.
- **Before starting a new phase, run a read-only Claude Code audit of the actual current
  state of anything the phase assumes** (config values, existing tooling, file contents)
  rather than planning against what the plan *says* is there. Phase 3 planning surfaced
  several real discrepancies this way (see **Audit findings** below) — assumptions from
  an earlier session are not a substitute for checking.

## The two root causes (orientation for any fresh session)

Almost every finding is one of two patterns:

- **Pattern A — the server trusts the client too much.** Identity, ownership, prices,
  visibility are taken on the client's word instead of verified server-side. Most
  security findings.
- **Pattern B — things that should be all-or-nothing aren't.** Multi-service or
  concurrent operations can end up half-done. Most correctness findings.

## Baseline (already done)

- [x] Notification service Modules 1–3 complete (email verification, forgot/reset/change
  password, Kafka events, notification emails, all frontend pages + ProfilePage
  change-password form).
- [x] JWT signing-key charset fix — `JwtUtil` now uses `getBytes(StandardCharsets.UTF_8)`
  to match the gateway.
- [ ] Mailtrap happy-path test (register→verify, forgot→reset→login, in-profile
  change-password) — **still to run**.

---

## Phase 1 — Close the live security holes (app-level, no Docker needed) — **COMPLETE**

All items landed with regression tests written alongside. 9 tests banked across
api-gateway, order, user, product, inventory — these are the first deposits on Phase 5.

- [x] **1.1 — Decouple auth from product + fix the dead handler (M-3).** Removed the
  `product-service` dependency from `auth-service/pom.xml`; added `@RestControllerAdvice`
  to auth's `GlobalExceptionHandler` (it was never registered, so none of its handlers
  fired) and pointed it at auth's own `InvalidOperationException`. Pom-hygiene sweep done
  (duplicate `jjwt` in cart, redundant `spring-security-core` in product/inventory/order).
  - **Bonus finding — Lombok CLI build was broken repo-wide.** Only order-service had the
    `maven-compiler-plugin` → `annotationProcessorPaths` Lombok config, so `mvn clean
    compile` failed on every other module (`cannot find symbol builder()`). IntelliJ
    masked it. Fixed by lifting the config into the parent pom. **This was blocking
    Docker (Phase 6) and Jenkins (Phase 7) before we even got there.**

- [x] **1.2 — Gateway strips inbound `X-User-*` (H-1).** Gateway now strips
  `X-User-Id`/`X-User-Role` unconditionally at the top of `filter()`, before any
  branching, and re-adds them only after JWT validation. Closes the unauthenticated cart
  takeover. Follow-up commit routed *all* branches through `cleanedExchange` (three raw
  `exchange` references remained — behaviourally harmless, but they invited a future edit
  to forward the unstripped exchange and silently reopen the hole).
  - Regression test: forged `X-User-Id` on unauthenticated `GET /api/cart` must not reach
    the downstream service. ✅

- [x] **1.3 — Ownership checks on the two IDORs (C-3, H-4).**
  - `GET /orders/{orderId}` — 404s when caller is neither owner nor ADMIN.
  - `GET /users/addresses/{id}` — now resolves the address *within the caller's own
    profile* rather than by global id (mirrors the existing `deleteAddress`/
    `setDefaultAddress` pattern — the scoping IS the security). All failure paths return
    the same "Address not found" so nothing is an existence oracle.
  - **404, not 403, on ownership mismatch** — a 403 confirms the record exists.

- [x] **1.4 — Spring Security layer for user-service (H-5).** Added `GatewayAuthFilter` +
  `SecurityConfig` + `spring-boot-starter-security`. Baseline is
  `.anyRequest().authenticated()` (NOT the `permitAll` the other services use — every
  user-service route is personal), which required adding an `authenticationEntryPoint`
  (401) alongside the `accessDeniedHandler` (403).

- [x] **1.5 — Lock down inventory + gate product admin reads (H-3, M-2).**
  - **product:** `GET /products/all` and `/products/all/{id}` return DRAFT/INACTIVE
    products but were swallowed by the broad public-GET rule sitting *above* the ADMIN
    rules. **Spring Security is first-match-wins** — hoisted the specific admin GET
    matchers above the broad rule. These were publicly readable until this fix.
  - **inventory:** `GET /inventory` (full stock list) now ADMIN-only. Matcher is
    `"/inventory"` exactly (no wildcard) so `GET /inventory/{variantId}` and
    `/inventory/batch` stay public for cart-service.
  - **gateway:** `isPublicGetPath()` now excludes the exact path `/api/inventory` while
    keeping the prefix in `PUBLIC_GET_PATHS` — so sub-paths stay public but the bare list
    requires a validated JWT (otherwise the gateway never forwards the ADMIN role and
    admins couldn't reach their own stock list).

  > **1.5 note — reserve/release/confirm deliberately left `permitAll`.** They are called
  > **service-to-service** by order-service, which carries no identity headers, so any
  > role rule would break checkout. Through the gateway they're POSTs and already require
  > a valid JWT. The residual risk — hitting inventory-service's port directly, bypassing
  > the gateway — is closed by **network isolation in Phase 6** (private Docker network,
  > only the gateway published). Signed internal identity (see **Deferred**) is the
  > belt-and-braces fix; deferred with documented trade-off.

> **End of Phase 1:** nothing currently exploitable through the gateway remains open.

### Patterns learned in Phase 1 (apply these going forward)

- **Spring Security rule ordering is load-bearing.** Specific matchers must precede broad
  ones; a broad rule above a narrow one makes the narrow one dead code.
- **Any config gaining its first `hasRole`/`authenticated()` rule also needs an
  `authenticationEntryPoint`.** `accessDeniedHandler` only produces 403 ("I know you,
  you're not allowed"); 401 ("I don't know who you are") needs the entry point. Hit this
  three times (user, product, inventory).
- **`@WebMvcTest` slice tests must NOT live in the same package as the `@Configuration`
  classes they `@Import`** — Spring's circular-import detection rejects it. Put them in
  the controller's package and import the security classes explicitly.
- **Every `private final` field on the controller under test needs a `@MockitoBean`**, or
  the slice fails with an opaque "Failed to load ApplicationContext".
- **The regression tests earned their keep twice**: caught an inverted `isAdmin &&`
  (should have been `!isAdmin &&`, which let non-owners read any order) and caught a
  gateway path-list change that would have silently broken every cart stock lookup.

---

## Phase 2 — Correctness & data integrity (Pattern B) — **COMPLETE**

- [x] **2.1 — Atomic inventory decrement (H-2). — DONE.** Closed the oversell race with
  **pessimistic row locking**, not the conditional `UPDATE` originally specced here (see
  trade-off below). Added `StockRepository.findByVariantIdForUpdate`
  (`@Lock(PESSIMISTIC_WRITE)` + explicit `@Query` → Hibernate emits `SELECT … FOR UPDATE`)
  and swapped it in on the four mutating paths: `reserve`, `confirm`, `release`, **and
  `updateStock`** (which had the same read-check-write shape and was not in the original
  finding — an admin quantity reset could clobber a concurrent reservation). Read paths
  (`getStock`, `getBatchStock`) deliberately left lock-free.
  - **Why the lock over the conditional `UPDATE`:** a bulk `@Modifying` update bypasses the
    persistence context, which costs three things — `@PreUpdate` stops firing (so
    `updatedAt` silently goes stale), the return is a row count not an entity (needs a
    re-read, plus `clearAutomatically`/`flushAutomatically` or the re-read serves a stale
    cached entity), and `0 rows` is ambiguous between "insufficient" (409) and "no such
    variant" (404), needing a third query. The lock keeps the entity managed, so the method
    bodies, exception types, and messages are untouched — the diff is one identifier in
    four places.
  - **No deadlock risk**, despite order-service reserving cart items in a loop: each
    `reserve` is a separate HTTP call, hence a separate transaction that commits and drops
    its lock before the next begins. No transaction ever holds two row locks at once. ⚠️ If
    reserves are ever batched into one transaction, this changes — sort by `variantId` to
    impose a consistent lock order.
  - Regression test `StockConcurrencyTest` (Testcontainers + Postgres 17, non-transactional,
    `CountDownLatch` start gate): 10 concurrent `reserve` calls against stock of 1 → exactly
    1 succeeds, 9 get `InsufficientStockException`, DB ends at `reservedQuantity=1`.
    **Verified to fail without the lock** (multiple winners, single unit).

- [x] **2.2 — Order-flow quick wins (C-2, partial). — DONE.** In `OrderService.placeOrder`:
  `clearCart` now runs only after payment succeeds (was before payment, so a failed
  payment used to destroy the cart). Added `reserveAll`/`releaseReservations` helpers so a
  mid-loop reserve failure releases whatever was already reserved (compensation) instead
  of leaking reservations. Confirm and clearCart failures *after* successful payment are
  logged for reconciliation, not propagated — avoids a charge with no order record
  ("point of no return" — see pattern below).
  - Regression tests `reserveFails_midLoop_releasesAlreadyReservedItems` and
    `paymentFails_cartIsNotCleared` in `OrderServiceTest`.
  - Files: `order-service/.../service/OrderService.java`.

- [x] **2.3 — Publish Kafka events after commit (M-1). — DONE.** Added a per-service
  `TransactionalEventPublisher` (`auth-service`, `product-service`, `order-service`, each
  under `.../messaging/`) that defers `kafkaTemplate.send` to a
  `TransactionSynchronizationManager.registerSynchronization(...)`'s `afterCommit()`
  callback when a transaction is active on the current thread, and sends immediately
  otherwise (which is exactly what happens in plain Mockito unit tests with no real
  transaction — `isSynchronizationActive()` is false there, so existing test assertions
  needed no special transaction-simulation machinery). If the surrounding `@Transactional`
  method rolls back, the callback never fires and the event is never sent — closes the
  `variant-created`-for-a-rolled-back-variant class of bug.
  - `order-service`'s publisher carries an additional keyed overload
    (`publishAfterCommit(topic, key, payload)`) since `order-placed` partitions by order
    ID; `auth-service`/`product-service` only needed the keyless form.
  - **Accepted gap, deferred to the full outbox item (see Deferred section):** a crash
    between "commit succeeded" and "deferred send completes" still loses the event
    (in-memory registration, not persisted). Judged acceptable for this event set
    (notification triggers, not payment-critical).
  - Regression tests: `TransactionalEventPublisherTest` per service (keyless/keyed send,
    deferred-until-commit, never-sent-on-rollback); `AuthServiceTest` (new, 6 tests across
    all publishing paths incl. the `resendVerification`/`forgotPassword` early-return
    branches); `OrderServiceTest` extended with
    `paymentSucceeds_publishesOrderPlacedEventWithOrderIdAsKey`.
  - Files: `auth-service/.../service/AuthService.java`,
    `product-service/.../service/ProductService.java`,
    `order-service/.../service/OrderService.java`, plus the three new
    `messaging/TransactionalEventPublisher.java` files and their tests.

- [x] **2.4 — Low-correctness batch. (CC) — DONE.**
  - `@Valid` added to nested `ProductRequest.variants` so per-variant constraints (null
    price, blank SKU) now cascade and return 400 instead of a 500. Regression test
    `ProductRequestValidationTest` exercises the `Validator` directly.
  - Bounds check in `StockService.updateStock` — rejects `quantity < reservedQuantity`
    with `InvalidOperationException`. New `StockServiceTest` (2 tests).
  - Duplicate SKU in `addVariant` now throws `DuplicateResourceException` (409) instead of
    `ResourceNotFoundException` (404) — matches the existing pattern already used in
    `updateVariant`'s own duplicate-SKU check. Test added to `ProductServiceTest`.
  - Sorted lists: `ProductRepository.findByStatusOrderByIdAsc`,
    `FeaturedProductRepository.findAllByOrderByIdAsc`, and `ProductService.mapToResponse`'s
    variant-images mapping now goes through the existing
    `productImageRepository.findByVariantIdOrderByDisplayOrder` instead of the unordered
    `v.getImages()` collection.
  - `OrderRepository.findByIdOrderByCreatedAtDesc` renamed to
    `findByUserIdOrderByCreatedAtDesc` (method was already correct — explicit `@Query`
    filters by `userId` — just misnamed). Call site in `OrderService.getOrdersByUser`
    updated; no test referenced the old name.

> **End of Phase 2:** all four items landed, tests green across `auth-service`,
> `product-service`, `inventory-service`, `order-service`. Committed as `6824073`
> (2.3a, product-service) plus two follow-up commits splitting the remaining
> auth-service/order-service/inventory-service work (see commit-discipline note above).

### Patterns learned in Phase 2 (apply these going forward)

- **`@Transactional` gives atomicity, NOT isolation.** It means "all or nothing", not "one
  at a time". Under Postgres's default READ COMMITTED, a plain `SELECT` takes **no lock**
  and its snapshot never refreshes — so *any* read-check-write inside a transaction is a
  race. The `@Transactional` annotation on `reserve` was doing nothing to prevent the
  oversell. **Go looking for this shape elsewhere in the codebase.**
- **The Spring proxy is what makes `@Transactional` work.** The annotation is inert
  metadata; a runtime CGLIB subclass wraps the bean and opens/commits the transaction
  around the call. Therefore a **self-invocation (`this.reserve(...)`) bypasses the proxy
  entirely** — no transaction, and (critically) no lock, because each repository call falls
  back to its own auto-commit micro-transaction that releases the row lock before the
  `if` even runs. **Silent.** No error, no warning, annotations still look correct, unit
  tests still pass. This is the way 2.1 rots: someone adds a `reserveAll()` convenience
  method inside `StockService` and unwinds the whole fix. Same trap applies to
  `@Cacheable`, `@Async`, `@Retryable`, and to `private`/`final` methods (the proxy can't
  override them).
- **Bulk `@Modifying` queries bypass the persistence context.** No dirty checking, no
  `@PreUpdate` (so `updatedAt` freezes), and a subsequent `findBy…` in the same transaction
  serves the **stale cached entity** unless you set `clearAutomatically`/`flushAutomatically`.
- **Concurrency tests must not be `@Transactional`.** The test's own transaction never
  commits (it rolls back), so worker threads in their own transactions cannot see the
  seeded row. Seed and clean up explicitly instead.
- **A `CountDownLatch` start gate is load-bearing in a concurrency test.** Submitting N
  tasks to a pool does not make them run simultaneously — the first can finish before the
  last is scheduled, the race never happens, and **the test passes on the broken code.**
- **Test the DB you ship.** A DB-concurrency bug tested on H2 tests H2's locking
  semantics, not Postgres's. Testcontainers + the real Postgres version, or the test is
  theatre.
- **`@InjectMocks` is unreliable when a constructor has 2+ params of the identical type**
  (e.g. `OrderService`'s four `RestClient` fields) — Mockito can't disambiguate by type.
  Switch to explicit `new XService(...)` in `@BeforeEach` instead of relying on
  constructor auto-wiring.
- **`RETURNS_DEEP_STUBS` fails silently (returns `null`) on `RestClient`'s
  `.header(String, String...)`** — the self-bounded-generic-plus-varargs combination isn't
  something Mockito can auto-stub through. Any chain touching `.header(...)` needs
  manually-wired mocks; deep stubs are fine for chains that don't.
- **`TransactionSynchronizationManager` is thread-local, not lexical.** A Kafka-send call
  inside a lambda (e.g. `Optional.ifPresent(user -> { ... })`) still sees the enclosing
  method's active transaction correctly, *as long as the lambda executes synchronously on
  the same thread* — which `ifPresent` does. The check (`isSynchronizationActive()`) reads
  per-thread state, not "am I lexically inside a `@Transactional` method." This breaks only
  if the lambda's work is handed to a different thread (an executor, `@Async`,
  `CompletableFuture`).
- **Capture the event payload eagerly, not lazily, when deferring a Kafka send to
  `afterCommit`.** Building the DTO (`mapToResponse(entity)`) at the original call site,
  before registering the synchronization, snapshots the entity's current field values into
  immutable DTO fields — safe regardless of what happens to the mutable entity afterward
  (including the final `repository.save(...)`). Passing a *lazy* supplier that re-reads the
  entity when the callback fires would reopen a "did the entity still look right at fire
  time" question; eager capture sidesteps it entirely.
- **Commit as each unit lands, not in a batch at the end**, when spanning multiple chat
  sessions or Claude Code hand-offs — see the working-conventions note above.

---

## Phase 3 — Config & infrastructure hardening

Pure code/config; gets you deploy-ready. Several items pair naturally with Dockerizing
but don't require it.

### Audit findings (verified before starting Phase 3 — see conversation for full report)

A read-only Claude Code audit confirmed the following actual state, which sharpens the
scope of the items below:

- **`ddl-auto=update` is live on 5 services** (auth, inventory, order, product, user) —
  not hypothetical. Hibernate can currently alter these schemas on every startup. No
  `.example`/profile-specific config exists anywhere. **This makes 3.2 more urgent than
  originally scoped**, not just good practice.
- **Test-scope DB config is missing on 9 of 10 services** (only `inventory-service` has
  `application-test.properties`, and even that lacks a datasource URL override). All 10
  services have a `contextLoads` test that will hit this gap under `mvn test`.
- **No Flyway/Liquibase anywhere** — clean introduction for 3.2, nothing to migrate away
  from.
- **`discovery.locator.enabled=true`, and `payment-service`/`notification-service` have
  no explicit gateway routes** — they're only reachable via the locator's
  auto-generated `/payment-service/**`-style paths, which don't match the
  `/api/...`-based conventions the rest of the gateway (and `JwtAuthFilter`) is built
  around. **Open question, not yet resolved:** confirm whether `OrderService`'s
  `paymentClient` calls `payment-service` directly via Eureka/internal networking
  (bypassing the gateway entirely, which would be fine) or actually routes through the
  gateway's locator paths (which would mean it's currently riding on an inconsistent,
  possibly-unguarded path). **Check this before or during 3.5.**
- **No rate limiting anywhere** — greenfield for 3.3, confirmed no existing
  bucket4j/resilience4j/`RequestRateLimiter` usage.
- **CORS is worse than assumed**: the hardcoded ngrok origin
  (`https://delpha-intentional-improvingly.ngrok-free.dev`) is confirmed live, combined
  with `allow-credentials=true` **and** `allowed-headers=*`. Wildcard headers + credentials
  + a leftover dev tunnel is a materially open door, not just tidiness — bump 3.4's
  priority up.
- **Kafka `trusted.packages=*` is only set on 2 services** (inventory, user) — not
  repo-wide as originally assumed. `notification-service` already uses
  `ByteArrayDeserializer` (safe, N/A). Scope 3.6 to just inventory + user.
- **`VerificationToken`'s `@Table(name = "verification-token")`** confirmed exactly as
  suspected — hyphenated, needs the rename in 3.2.
- **Frontend token storage confirmed**: `localStorage` key `user` (a JSON object holding
  `.token`), attached via an axios interceptor as `Authorization: Bearer <token>`. A
  separate `sessionId` also lives in `localStorage`, sent as `X-Session-Id`.
  `JwtAuthFilter` on the gateway reads **only** the `Authorization` header — no cookie
  support exists yet. This is the concrete starting point for the httpOnly cookie
  migration (now scheduled — see 4.2 below).

---

- [ ] **3.1 — Externalize & rotate secrets (M-4). (CC)** Move JWT/DB/SMTP secrets to env
  vars; commit an `application.properties.example` with placeholders; give each service
  its own DB credentials; **rotate** the Mailtrap and JWT secrets that have been sitting
  in files. Note the single shared `jwt.secret` across 4 services — at minimum document
  the blast-radius tradeoff.
  - Files: every `*/src/main/resources/application.properties`, `docker-compose.yml`.

- [ ] **3.2 — Database migrations (M-6). (CC)** Introduce Flyway; switch `ddl-auto` from
  `update` to `validate` on all 5 affected services (auth, inventory, order, product,
  user); rename table `verification-token` → `verification_token` (hyphen is not a legal
  unquoted SQL identifier). Stops Hibernate from having standing permission to alter
  live schemas, and stops the manual `ALTER TABLE` pattern (e.g. the hand-added
  `email_verified` column) from being un-reproducible on a fresh database.
  - **Mechanics:** write a `V1__baseline.sql` per affected service that reproduces the
    *current* live schema exactly (including the manually-added columns) — this is the
    fiddly part, since a mismatch between V1 and the real schema will make `validate`
    fail on startup. Then `V2__rename_verification_token.sql` for the table rename.
  - Files: per-service `resources/db/migration/`, `application.properties`,
    `auth-service/.../entity/VerificationToken.java`.

- [ ] **3.3 — Rate limiting + generic registration (M-7).** Throttle `/auth/login` and
  `/auth/register` (Gateway `RequestRateLimiter` + Redis, since Redis is already running
  for cart). Make the duplicate-registration response generic so it stops being an
  enumeration oracle. (Login/forgot are already enum-safe — leave them.)
  - Files: `api-gateway/...` (filter/config), `auth-service/.../controller/AuthController.java`.

- [ ] **3.4 — CORS lockdown + remove dev exposure. (bumped priority — see audit findings
  above.)** Lock gateway CORS to the real frontend origin only; remove the committed
  ngrok origin; scope `allowed-headers` down from `*` to the specific headers actually
  used (`Authorization`, `Content-Type`, `X-Session-Id`, etc.) rather than wildcard,
  especially since `allow-credentials=true` is set; turn off `vite allowedHosts: true`.
  - Files: `api-gateway/.../application.properties`, `jewelry-store-frontend/vite.config.js`.

- [ ] **3.5 — Disable discovery locator (M-9, scoped down).** Set
  `discovery.locator.enabled=false` so only explicitly-defined gateway routes are
  reachable externally. **Before flipping it, resolve the open question from the audit**:
  confirm how `order-service` currently reaches `payment-service` (direct
  service-to-service via Eureka vs. through the gateway's locator path) so disabling the
  locator doesn't silently break checkout. Full Eureka credential/network hardening
  deferred — network isolation in Phase 6 covers most of that residual risk.
  - Files: `api-gateway/.../application.properties`
    (`discovery.locator.enabled`), possibly `order-service` payment-client config
    depending on what the routing check finds.

- [ ] **3.6 — Kafka trust-package hardening, scoped (M-10, partial).** Tighten
  `spring.json.trusted.packages` from `*` to the specific event package on the two
  services that actually set it wide-open: `inventory-service` and `user-service`. Add
  HTML-escaping for user-supplied fields in notification email templates. (Consumer
  idempotency deferred alongside the broader idempotency work — see Deferred section.)
  - Files: `inventory-service` + `user-service` `application.properties`,
    `notification-service/.../service/NotificationService.java`.

- [ ] **3.7 — Tune down logging.** Stop logging userId/role on every gateway request and
  email addresses in services. (No passwords/tokens are logged — that's already clean.)
  - Files: `api-gateway/.../JwtAuthFilter.java`, user/notification services.

---

## Phase 4 — Session security

- [ ] **4.2 — httpOnly cookie migration (partial — refresh tokens deferred, see below).**
  Move the JWT out of `localStorage` (currently stored under the `user` object's `.token`
  field and attached via an axios interceptor) into an httpOnly cookie, so client-side
  JavaScript — including anything an XSS payload could inject — can no longer read the
  token at all. Concretely:
  - **`auth-service`/gateway login response:** set the JWT as an httpOnly (and `Secure`,
    `SameSite=Strict` or `Lax`) cookie instead of returning it in the response body for
    the frontend to store.
  - **`JwtAuthFilter` (gateway):** currently reads *only* the `Authorization` header —
    add cookie-parsing so it extracts the token from the cookie instead (or in addition,
    during transition).
  - **CORS config:** already has `allow-credentials=true` (confirmed in audit), which is
    required for cookies to be sent cross-origin — but pair this with the 3.4 lockdown so
    it's credentials-with-a-locked-down-origin, not credentials-with-a-wildcard.
  - **Frontend (`axiosInstance.js`):** stop manually attaching the `Authorization`
    header from `localStorage`; add `withCredentials: true` so the browser sends the
    cookie automatically. The separate `sessionId` (also currently in `localStorage`,
    sent as `X-Session-Id`) can stay as-is — it's not a security-sensitive token in the
    same way.
  - **CSRF note:** moving to a cookie reintroduces CSRF as a consideration (the browser
    now attaches the cookie automatically to any request to your domain). `SameSite=Lax`
    or `Strict` handles most of this for free in modern browsers; add an explicit CSRF
    token only if `SameSite` alone feels insufficient once this is in place.
  - Refresh-token rotation and `tokenVersion`-based session revocation are **not** part
    of this item — deferred (see Deferred section).

---

## Phase 5 — Automated testing

- [ ] **Fix the `contextLoads` smoke tests — BLOCKS JENKINS (Phase 7). Confirmed scope:
  9 of 10 services need this**, not a handful — only `inventory-service` has any
  test-scope DB config today, and even that's missing a datasource URL override. The
  default `@SpringBootTest contextLoads()` test generated in every module fails under
  `mvn test` with *"Failed to configure a DataSource: 'url' attribute is not
  specified"* — booting the full context needs a real DB that isn't present in test
  scope. **Decide: H2 in-memory (simplest, but doesn't match Postgres locking/behavior),
  Testcontainers (most faithful, needs Docker at test time), or exclude these trivial
  tests from the unit-test run entirely.** CI will be red on day one until this is
  resolved.
- [ ] **Bump Testcontainers — currently pinned by workaround.** Docker Engine ≥29 raised the
  minimum API version to 1.44; Testcontainers 1.21.3's bundled docker-java falls back to
  **1.32**, so the daemon returns a bare `400` on the `/info` handshake and *no container
  ever starts*. Symptom is misleading: `docker ps` works fine (the CLI is new enough), only
  the JVM client fails, and the error reads "Could not find a valid Docker environment"
  which looks like Docker is down. **Not a config problem** — an ecosystem-wide breaking
  change (Traefik, Portainer, CapRover all shipped fixes for it). Worked around with
  `inventory-service/src/test/resources/docker-java.properties` → `api.version=1.44`.
  Note `DOCKER_API_VERSION` (the CLI env var) does **not** work — docker-java reads the
  classpath properties file. **Proper fix: bump Testcontainers** (1.21.x patch, which
  defaults to 1.44, or 2.x, which negotiates with the daemon). Do it in the **parent pom**
  via the testcontainers BOM, not per-module.
- [ ] Unit tests (JUnit 5 + Mockito) for service-layer logic across all services — mock
  repositories and `KafkaTemplate`.
  - **Substantially underway already.** Phases 1–2 banked regression tests across every
    touched service: `ProductServiceTest`, `AuthServiceTest`, `StockServiceTest`,
    `OrderServiceTest` (extended across 2.2/2.3), `TransactionalEventPublisherTest` × 3,
    `ProductRequestValidationTest`, plus the Phase 1 security/IDOR tests. Remaining gap is
    services untouched by Phases 1–2 (cart, payment, notification, gateway beyond the
    existing filter test) and any service-layer methods not exercised by a bug fix.
- [ ] Slice tests where they earn it: `@WebMvcTest` for controllers + security paths,
  `@DataJpaTest` for custom repository queries.
- [ ] (Optional) Frontend component tests — Vitest + React Testing Library.
- Builds on the regression tests already written in Phases 1–2.

---

## Phase 6 — Dockerize

- [ ] Containerize every service + Docker Compose **with a private network where only the
  gateway is published.** Network isolation lands here — this completes the signed-identity
  finding's real mitigation (see Deferred section for the belt-and-braces follow-up).

---

## Phase 7 — Jenkins CI/CD

- [ ] Pipeline that builds and runs the Phase 5 suite on every push.
  - **Open question, worth reconsidering before starting:** Jenkins requires standing up
    and maintaining a Jenkins server/agent yourself, which is meaningfully more setup
    overhead than a hosted CI like GitHub Actions, which would run the same test suite
    with a `.github/workflows/ci.yml` file and no server to maintain. If the goal is the
    "I built a CI/CD pipeline" portfolio line rather than "I specifically operated
    Jenkins," GitHub Actions gets ~80% of the resume value for a fraction of the setup
    and maintenance cost. Worth deciding deliberately rather than defaulting to Jenkins
    because it was the original plan.
- [ ] **Agent needs a Docker daemon reachable *from the JVM*** — not merely a working
  `docker` CLI. These are different things (the CLI resolves via Docker contexts; the
  Testcontainers Java client does not). `StockConcurrencyTest` is the first test that needs
  Docker at *test* time, and more will follow. If the agent runs Engine ≥29, it hits the
  API-version `400` above — carry the `docker-java.properties` pin or land the
  Testcontainers bump first. (Applies equally whether you land on Jenkins or GitHub
  Actions — hosted GitHub Actions runners already have a recent Docker, so this risk is
  lower there.)

---

## Phase 8 — Deploy

- [ ] Oracle Cloud Free Tier ARM via Docker Compose.

---

## Phase 9 — OAuth

- [ ] Deferred until a real domain is available.

---

## Confirmed good — do NOT regress these

These patterns are correct; new work should preserve them (and several are the exact
checks the IDOR fixes are applying elsewhere):

- Server-side pricing and order totals (clients can't tamper with what they pay).
- JWT verification pins the signing key (`verifyWith`); UTF-8 charset on both signer and
  verifier.
- `/me` endpoints are correctly ownership-scoped (the model for fixes 1.3).
- Idempotent Kafka consumers where it counts (`variant-created`, `user-registered` dedupe
  before acting).
- Bcrypt password hashing; stateless sessions everywhere.
- Login and forgot-password are enumeration-safe (generic responses).
- Notification multi-type Kafka deserialization (`ByteArrayDeserializer` +
  `ByteArrayJsonMessageConverter`).
- No frontend injection sinks (React auto-escaping; no `dangerouslySetInnerHTML`/`eval`).
- Inventory mutations take a pessimistic row lock (`findByVariantIdForUpdate`) while reads
  stay lock-free — don't "simplify" the mutating paths back onto `findByVariantId`.
- Kafka events in `auth-service`/`product-service`/`order-service` publish only after
  transaction commit (`TransactionalEventPublisher.publishAfterCommit`) — don't revert a
  new send call back to a direct `kafkaTemplate.send(...)` inside a `@Transactional`
  method.

---

## Deferred (revisit under the stated trigger condition)

These are real, valid findings — deferring them is a deliberate portfolio-scoping
decision, not an oversight. Each entry states why it's deferred and what would change
that decision.

- [ ] **Signed internal identity (C-1, proper fix for 1.5's residual risk).** Gateway
  signs the forwarded identity (short-lived internal JWT/HMAC over
  `X-User-Id|X-User-Role`); each `GatewayAuthFilter` verifies the signature, so header
  forgery fails even with direct network access to a backend service.
  - **Why deferred:** Phase 6's network isolation (private Docker network, only the
    gateway published) already closes the realistic version of this attack — reaching a
    backend service directly requires already being inside the infrastructure. This item
    is the last ~10% of defense against an attacker who's already gained that level of
    access, which is a much narrower threat model.
  - **Revisit if:** the deployment target changes to something where full network
    isolation isn't achievable (e.g. services need to be individually reachable for some
    reason), or if this becomes a specific resume/interview talking point worth building
    out.

- [ ] **Refresh tokens + `tokenVersion` session revocation.** Short-lived access token +
  long-lived refresh token; a `tokenVersion` claim bumped on password change/reset and
  checked per-request at the gateway (via Redis) so an old JWT stops working immediately
  after a password change, instead of remaining valid until natural expiry.
  - **Why deferred:** this is a real gap (a stolen or post-password-change JWT stays
    valid today), but it's substantial coordinated work across the token-issuing code,
    the gateway, and Redis — separable from the httpOnly cookie migration (4.2), which
    addresses the more acute XSS-theft risk on its own.
  - **Revisit if:** you want to close the "old token still works after password change"
    gap specifically, or want the token-revocation talking point for interviews. The
    `tokenVersion` piece alone (without full refresh-token rotation) is a smaller,
    separable task if you want a partial version of this later.

- [ ] **Full saga/outbox + idempotency (C-2 full fix + M-5).** Transactional outbox table
  + poller (or Debezium-based CDC) so Kafka events are guaranteed to survive a crash
  between DB commit and message publish (closing the small window accepted in 2.3);
  idempotency keys on order/payment so a retried request can't create a duplicate order
  or double-charge a card.
  - **Why deferred:** `payment-service` is currently an always-returns-`SUCCESS` stub —
    the catastrophic scenario this defends against (a real card double-charged) cannot
    happen with a stub. Building 10–15 hours of the hardest infrastructure in this plan
    to defend against a failure mode the current code can't produce isn't good time
    allocation. The Phase 2.2 compensation logic (`reserveAll`/`releaseReservations`) and
    2.3's `afterCommit` publishing already remove the *live* damage; this item is the
    hardening layer on top.
  - **Revisit if — hard gate, not optional:** you wire up a real payment provider. This
    must land **before** that happens, not after.

- [ ] **Kafka consumer idempotency (part of 3.6, split out).** Dedupe on event/message ID
  in the notification consumers so a redelivered event doesn't trigger a duplicate email.
  - **Why deferred:** overlaps conceptually and in implementation approach with the
    idempotency-key work in the full saga/outbox item above — better done once, together,
    than twice with two different patterns.
  - **Revisit if:** you land the saga/outbox item, or independently if duplicate
    notification emails become an observed problem before then.

- [ ] **Full Eureka credential/network hardening (M-9, remainder).** Add
  authentication credentials to the Eureka server itself, beyond just disabling the
  gateway's discovery locator (which is scoped into active Phase 3 as 3.5).
  - **Why deferred:** Phase 6's network isolation means Eureka itself won't be reachable
    from outside the Docker network either, which covers most of the realistic threat
    once that lands. Disabling the locator (3.5) is the higher-value, lower-effort piece
    and stays in the active plan.
  - **Revisit if:** Eureka ends up exposed for some operational reason (e.g. a monitoring
    tool needs to reach it from outside the private network).

- [ ] **Frontend component tests (Vitest + React Testing Library).**
  - **Why deferred:** optional from the original plan; separate skill area from the
    backend correctness/security work that's the spine of this project. Lower priority
    than finishing backend test coverage in Phase 5.
  - **Revisit if:** you want frontend-testing specifically as a demonstrated skill, or a
    frontend regression makes the case for it directly.
