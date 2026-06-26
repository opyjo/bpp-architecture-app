# 🎯 Canada Life — Senior IT BSA Interview Cheat Sheet

> **Role:** Senior IT Business Systems Analyst · **Team:** API Integration · **Domain:** Workplace Benefits & Retirement (WB&R)
> **The one-line frame:** *"I own building the right thing before any development work commences — and I do it in a financial, regulated domain where my CPA background pays off as much as the BSA discipline."*

---

## ⚡ 30-Second Self-Brief (read this last, right before you walk in)

- **Who you are:** One foot in software, one in finance. BSA on Bell's subscription platform **+** CPA who handled Protected B data at the CRA.
- **What you own:** Requirements, data mapping, acceptance criteria, state machines, API contracts — *not* implementation.
- **Why Canada Life:** The API Integration team builds the foundation the whole member experience sits on. Errors at the contract layer ripple across **millions of member accounts**. Highest-leverage place to work + the domain rewards the finance background.
- **The three things you must land:** (1) your deliverables *are* BSA deliverables, (2) the domain is financial & regulated = your home turf, (3) you get contracts right at the foundational layer.
- **Your three anchor phrases — drop them repeatedly:**
  1. *"before any development work commenced"*
  2. *"I produced the data mapping between the front-end and the back-end"*
  3. *"the dev team built directly against it"*

---

## 🧾 Logistics — Get These Out of the Way Cleanly

| Item | Your answer |
|---|---|
| **Work status** | Permanent resident — **no sponsorship needed** |
| **Notice period** | Two weeks |
| **Hybrid (3 days, Toronto)** | Yes, no concerns |
| **Reliability Status / clearance** | Comfortable — already held a security clearance at the **CRA handling Protected B data** |
| **Ramp time** | Productive in **60–90 days** |

> Don't over-explain logistics. Confirm cleanly and move on.

---

## 🏢 Company Research — Canada Life (talking points)

- **Federally regulated insurer** → OSFI oversight, auditability is non-negotiable.
- **Live transformation moment:** new **CDO mandate**, the **TCS partnership/deal**, and a serious **hiring push**. → Signals the requirements & integration practice is being *actively built out* — a senior BSA can shape how it matures rather than inherit something frozen.
- **Julia McGillis** joined as **EVP in 2025** — use as a "homework signal" question *only if rapport is good*.
- **Business line — Workplace Benefits & Retirement:** the data is **plan members' retirement savings**. Stakes are high; data integrity is financial, not cosmetic.

> ✅ **Verify these facts are current** the morning of — transformation details and exec names change.

---

## 🗣️ Your Narrative

### The 2-Minute Opener ("Walk us through your background")
> I sit at the intersection of two disciplines that don't usually meet in one person. On the **software side**, I work on Bell's subscription-management platform — a microfrontend and API platform spanning **18 products** — where I own the requirements: data-mapping documents, acceptance criteria, state machines, and the API contracts the dev team builds against.
>
> On the **finance side**, I'm a **CPA**, and I spent time in banking and at the **CRA handling Protected B data**. So I don't read financial regulation as a compliance checkbox — I read it as a **business constraint that shapes how the product has to behave**.
>
> What brings me here is that **Workplace Benefits & Retirement** is exactly where those two halves combine. It's a financial, regulated domain where the data is plan members' retirement savings, and the work is getting API contracts right at the foundational layer. That's the work I already do — I just want to do it where the domain rewards the finance background as much as the BSA discipline.

### Title-Gap Recovery (your resume says "Software / Front-End Engineer")
- **The line:** *"The title reflects how I entered Bell — through the graduate engineering program — not what I've been doing. Judge it by the deliverables."*
- **The proof (deliverables = BSA deliverables):** Contingency API contract + data mapping + state machine; UPCM domain model + export-status state machine; per-story acceptance criteria; post-delivery review. → *"The title undersells it; the artifacts are the real evidence."*

### Why Leaving Bell (never bash, never lead with layoffs)
- Forward-looking move. Two pulls: **(1) role alignment** — want the work recognised as BSA work on a team built around requirements & integration; **(2) domain alignment** — CPA + regulated finance applied where it shapes the product. *"Bell's domain is telecom subscriptions; the discipline transfers, but the domain fit is much stronger here."*

### CPA = Differentiator, Not Detour
- *"I'm not looking to do accounting. The CPA lets me read financial regulation as a business constraint that shapes product design — trace a rule into what the API actually has to do: the validation, the audit trail, the failure path."*
- Here the data is **plan members' retirement savings** → a BSA who understands *why* the regulation exists writes tighter contracts.

---

## 📚 STAR Story Bank (your backbone)

**Story → what it proves → which questions it answers.** Keep each to ~2 min, **end on the Result.**

| Story | Proves | Reach for it when asked about… |
|---|---|---|
| **Contingency** | End-to-end ownership; audit/RBAC instinct | proudest project, data mapping, error states, SQL, process improvement, regulatory |
| **Catalog** | Multi-stakeholder reconciliation | conflicting stakeholders, disagreement, post-delivery review, process improvement |
| **UPCM** | Operating in ambiguity, no docs | ambiguity, domain modelling, southbound orchestration, challenging project, inherited systems |
| **Membership** | OpenAPI contract-first | OpenAPI experience, JDL, tools |
| **Monorepo** | Prioritisation across dependencies | competing priorities, prioritisation method |
| **Performance / a11y audit** | Ownership nobody asked for | took initiative, disagreed with a PM (evidence-first) |
| **Bilingual routing** | Catching defects pre-sprint | caught a problem early, grooming, compliance (EN/FR) |
| **CPA / CRA** | Regulated-data discipline | Protected B, audit trails/RBAC, why finance |
| **Empty-field AC mistake** | Accountability + systemic fix | a mistake you made, a spec that caused an incident |

### 🔹 Contingency Management — *the proudest one*
- **S/T:** Back-office tool agents use to look up subscribers & orders. Process was manual and untraceable.
- **A:** *Before any development work commenced*, produced (1) the **API contract**, (2) a **state machine** for status transitions, (3) the **data-mapping document** (agent views → REST endpoints → DB schema). Specified an **audit log** as a formal requirement — every consequential action, who & when.
- **R:** Dev team built directly against the specs. **The audit log I specified has since been used in two separate internal investigations.** A requirement nobody asked for as a headline feature became the thing that let the business reconstruct what happened.

### 🔹 Catalog Management — *conflicting stakeholders*
- **S/T:** How should a product behave when retired? Marketing, product, billing each wanted different things; all used **"expire" vs "cancel"** loosely.
- **A:** Separate sessions with each group → mapped **expire and cancel as two distinct states** with different downstream effects → brought all three into **one room** with the mapping visible.
- **R:** Single agreed definition with **written sign-off from all three**. Dev built directly against it; no rework cycle. *(Later: turned post-delivery review into a repeatable standard.)*

### 🔹 UPCM — *ambiguity, zero documentation*
- **S/T:** Export pipeline already running in production, **no formal requirements anywhere** — behaviour in the code, knowledge in people's heads.
- **A:** Mapped **actual** behaviour end-to-end → built a **domain model** in the business's language + a **state machine** (`READY_TO_EXPORT → EXPORTED / FAILED / CANCELLED`, trigger events, error rules) → got **sign-off from three groups**.
- **R:** My model became **the reference for all later development**. Turned undocumented behaviour into the contract.

### 🔹 Membership Management — *OpenAPI contract-first*
- **A:** **OpenAPI YAML as the single source of truth.** Generated TypeScript types from the spec via **openapi-typescript**.
- **R:** Any contract change is a **compile error, not a runtime surprise** — spec and code can't silently drift.

### 🔹 Monorepo — *competing priorities*
- **S/T:** ~**17 concurrent projects**; a shared upstream package needed updating; every downstream product depended on it.
- **A:** Mapped the **dependency chain** → the upstream shared-package update had to be **sequenced first** → communicated the sequencing *before* anyone hit a slowdown.
- **R:** Shared package updated, 17 projects stayed unblocked, nobody experienced a slowdown.

### 🔹 Performance / Accessibility Audit — *ownership nobody asked for*
- **A:** Noticed the product felt slow & a11y was off → ran an audit on own time → measured **Core Web Vitals** + a11y issues (keyboard nav, contrast) → built a **prioritised fix doc (impact vs effort)** → presented to team & PM.
- **R:** High-impact items scheduled; **measured the improvement** afterward. *(Also the disagreement story: evidence first, raise privately, bring a solution.)*

### 🔹 Bilingual Routing — *caught a defect before the sprint*
- **A:** Routing logic depended on the user's language; the upstream service didn't carry that context as the team assumed. **Surfaced it in grooming** before story points were committed.
- **R:** Dependency became part of the requirement up front; built correctly the first time. *In a regulated bilingual market, a French-language gap isn't just a bug — it's a compliance miss.*

### 🔹 The Mistake — *accountability + systemic fix*
- Signed off AC without nailing one **edge case** (empty field from upstream). Dev built the reasonable path; wrong behaviour; caught in testing.
- **Owned it directly** (the ambiguity was mine), fixed the case, **then fixed the system:** every story now makes **failure paths & source-of-truth logic explicit** before dev. Designed out a whole class of "we never specified the edge case" defects.

---

## 🧩 APOART Ticket Examples (concrete "tell me about a specific feature" ammo)

Real Bell Subscription Platform tickets — use when asked for *specific, granular* work. Each has a clear current-state pain → change → outcome.

| Ticket | One-liner |
|---|---|
| **APOART-2211** | Surface **customer name from CPM** in the Contingency UI (4 places); missing name → "N/A", page still loads (soft-failure pattern). |
| **APOART-2199** | Allow **Netflix VAS changes** during pending activity; route based on post-anniversary Netflix Basic; optional "Cancel-the-Cancel" compensating order. |
| **APOART-2515** | **Undo a pending change + add a retention promo** in one atomic transaction. |
| **APOART-2516** | Apply a **retention promo to an ACTIVETERMINATING** plan without first undoing the cancellation. |
| **APOART-2568** | **Delete a VAS immediately** during pending activity (channel + toggle gated); bundle/Basic stay pending. |
| **APOART-2467** | Automate **NM1 disconnect cleanup** via a Lambda pair (EDW extractor + processor) instead of a manual SQL runbook. |
| **APOART-2577** | Move **promo rank-conflict resolution** from Flowrunner to Configurator (architectural cleanup, no customer-facing change). |
| **APOART-2419** | MyBell: downgrade a bundle **directly to À la carte** in a single transaction, carrying eligible credits. |
| **APOART-2502** | Show a **dash for negative price** in customer view, actual negative amount in agent view (feature-flagged). |

> **How to use these:** they show you reason in **CMO (current mode) → FMO (future mode)** terms, think in **feature toggles**, handle **partial-failure / soft-failure**, and write **field-level acceptance criteria**. Pick **2211** (data mapping + soft failure), **2467** (orchestration + error handling), or **2199** (state-aware routing + compensating transactions) as your go-to deep dives.

---

## 🛠️ Technical Cheat Sheet (BSA depth)

### What a BSA does — the 4 things
1. **Requirements** — turn a business need into something unambiguous: rules, edge cases, failure paths.
2. **Data mapping** — trace every field front-end → API → back-end store; validate the contract end-to-end.
3. **Acceptance criteria** — per story, concrete enough that a reviewer checks pass/fail without asking you.
4. **Post-delivery review** — check the build against the AC, raise defects, feed back.
> ❌ **Not** implementation. *"A developer joining the team reads my specs and builds against them. If a requirement's meaning is in question mid-sprint, they come to me — I'm the source of truth for what it's supposed to do."*

### BSA vs Developer
> *"Developers own the implementation being correct; I own the requirement being right in the first place. Not the same job at different seniorities."*

### Data Mapping (how you produce one) — Contingency example
- Three layers, **column by column**: **agent view → REST endpoint/field → DB table/column**, plus any transformation. One row = one field traced screen-to-storage.
- **Active validation, not passive review:** query the DB to confirm the payload *really* matches the source of truth; catch fields the API promises but the data doesn't reliably hold (e.g., a `name` coming back `null`).

### OpenAPI / Contract-First (Membership)
- OpenAPI **YAML = the governing contract** (endpoints, schemas, types, required vs optional, error responses).
- Generate TS types from spec (**openapi-typescript**) → drift fails **loud and early** (compile error, not runtime).

### JDL (be honest: not by name, but the discipline is identical)
- **JHipster Domain Language** — define entities/fields/relationships in a schema; tooling generates API scaffolding + DB schema. **Contract drives implementation.**
- *"I already think schema-first — UPCM domain model drove the build, Membership spec drove the types. JDL is that applied to entities & persistence. It's a notation gap, not a skills gap."*

### State Machines
- Explicit states + transitions + trigger events + **error-handling rules**. Example: `READY_TO_EXPORT → EXPORTED / FAILED / CANCELLED`.

### Southbound Orchestration Spec
- The contract for a **multi-step downstream flow**: sequence of calls, trigger per step, payload shape per hop, and **what happens on failure** (retry / terminal / alert). *"I've written one — the UPCM export pipeline. Failure paths are part of the spec, not an afterthought."*

### Domain Modelling
- Start from the **language the business uses**, not the DB schema. **Nouns = entities, verbs = relationships.** Confirm with the business → ambiguity drops. The model **drives the build**, it doesn't document it after the fact.

### Acceptance Criteria (testable)
- **No story to a developer without written AC.** Concrete & verifiable — a reviewer checks pass/fail without asking you.
- Bad: *"handles errors gracefully."* Good: *"when the customer-name lookup returns empty, the field shows N/A and the page still loads."*
- **Always cover failure paths & edge cases** (empty, timeout, conflicting values). *If you can't write it as a clear pass/fail, the requirement isn't pinned down yet.*

### SQL
- Used as **validation**, not auditing — confirm the API's data contract end-to-end against the DB (field populated? value matches source of truth? what on null/empty?).

### Error States / Timeouts / Edge Cases
- Work the **unhappy paths deliberately**: source-of-truth precedence (which system wins?), timeout behaviour (retry/fail/degrade?), empty/malformed fields, validation-rule conflicts. **Error responses defined as explicitly as success ones.**

### Story Grooming & Pointing
- Come in having done the work (requirements, AC, data mapping drafted). In the room: **surface ambiguity actively**, catch dependencies (e.g., bilingual routing), **point alongside engineers** (they own the estimate; you ensure the complexity being sized is *real*).

### Post-Delivery Review
- Review delivered build against **the same AC** you wrote up front. Defects tied to a specific criterion: *"AC-4 says empty name shows N/A; the build throws."* Made it a **repeatable standard** on Catalog so "done" reliably means "meets the requirement."

### Tools (and *why*)
| Tool | Job it does |
|---|---|
| **OpenAPI / YAML** | Define the contract as the source of truth |
| **openapi-typescript** | Generate FE types from spec → drift = compile error |
| **SQL** | Validate the contract against the real data |
| **Diagramming (state machines / domain models)** | Get **non-technical sign-off** a field table never would |
| **Jira** | Hold per-story AC; gate stories |
| **Confluence-style docs** | Durable reference for data-mapping docs & domain models |
| **Postman** | Exercise endpoints, confirm behaviour |

---

## 💼 Domain Knowledge — Group Benefits & Retirement

### How group benefits work
- **Plan sponsor (employer)** holds the contract. **Employees + dependants = members.** → Buyer ≠ beneficiary; the **data model must reflect that**.
- A member's eligible expense → hits the **adjudication engine** (rules-driven, high-volume) → decides covered/paid.
- **Renewal pricing is driven by the group's actual claims experience.** The more the group claims, the more premium moves at renewal. → **Claims data isn't just operational; it's an input to next year's price.**

### Where APIs live in the claims/benefits flow
> **member portal ↔ adjudication ↔ plan administration ↔ payment**
- Every arrow is an **integration point with a data contract**. None of the systems share a DB — they talk through APIs.
- A claim: portal → adjudication (coverage) → plan administration (eligibility/plan rules) → payment.
- **An error in an early contract propagates downstream** into pricing & payment. → Getting contracts right at those boundaries is the whole game = exactly what this team owns.

### Why data integrity matters so much
- A data error here has a **financial consequence on a real customer** via the renewal loop, and **compounds across millions of member accounts** before anyone notices. Cheaper & safer to be precise at the contract than reconcile millions of accounts later. *This is the whole argument for the BSA role being foundational.*

---

## ⚖️ Regulatory & Compliance (treat each as a product constraint, not a checkbox)

| Constraint | What it shapes in your contract |
|---|---|
| **OSFI** (federally regulated insurer) | **Auditability** — actions must be reconstructable → audit logging as a formal requirement (cf. your Contingency audit log) |
| **PIPEDA / Privacy Act** | Sensitive health + financial data → access controls, data minimisation, **RBAC** as an explicit requirement, what each endpoint may return |
| **CAPSA Guideline No. 3** | Governance over **capital accumulation plans** (the retirement side) |
| **Bilingual (EN / FR)** | Recurring **non-functional requirement** on everything → cf. the bilingual-routing dependency you flagged |

> **Through-line:** *"I bake these into the contract up front rather than auditing for them later."*

---

## 🧠 Repeatable "How I Handle X" Patterns (situational quick-recall)

- **Disagreeing (with a PM/architect):** *Evidence first → raise it privately → bring a solution in hand* (prioritised fix list, not a complaint).
- **Conflicting stakeholders:** *Separate the stated "want" from the underlying need → separate sessions → one room with the trade-off visible → shared criteria → written sign-off.* Never separate bilateral promises.
- **Prioritising competing requirements:** *Make the criteria explicit first* (member impact / regulatory / risk / effort) *→ dependency order → 80% of value in 20% of complexity.*
- **"Not feasible in the timeline" (architect):** *Treat as a requirements problem, not a negotiation. Find the 80/20 core, present the trade-off explicitly, let the business choose with full information.*
- **Ambiguous requirement mid-sprint (developer asks):** *Clarify against spec + business intent → decide quickly → **update the AC so it's closed for good**.* You are the source of truth, not your memory.
- **A spec you signed off caused a production issue:** *Own it without calculation → fix the immediate issue → fix the **process** that let it through.* Accountability + systemic fix.
- **Inherit a system, no docs, tight deadline:** *Map real behaviour → model it (domain model + state machine) → get stakeholder sign-off → make it the reference.* (The UPCM playbook.)

---

## ❓ Questions to Ask the Panel (pick 2–3)

1. **What does a typical API integration project look like from a BSA perspective on this team?** → tells you where requirements/data-mapping ownership actually sits.
2. **Where do the most significant stakeholder-alignment challenges usually come from?** → opens the door to your Catalog reconciliation story.
3. **How mature is the requirements & documentation practice today — what would you want a senior BSA to improve?** → positions you as a level-setter; ties to the transformation.
4. **What does success look like at six months in this role?** → outcome-oriented closer; pairs with your "60–90 days to productive."
5. **How does the API Integration team collaborate with POs and architects across WB&R?** → reveals the operating model & handoffs.
6. **Julia McGillis joined as EVP in 2025 — how has that shaped priorities?** → homework signal; **use sparingly, only if rapport is good.**

---

## 🌀 Curveballs → One-Line Answers

| If they ask… | Land on… |
|---|---|
| "Your title says engineer, not BSA." | *Title = how I entered Bell. Judge by the deliverables — they're BSA artifacts.* |
| "No group-benefits experience." | *Domain is financial & regulated = where my CPA already lives. Productive in 60–90 days; UPCM pattern applied here.* |
| "Why leave Bell?" | *Forward-looking: role + domain alignment. Not a move away — a move toward.* (No layoff talk, no bashing.) |
| "Why not a finance role?" | *CPA is a differentiator, not a detour — I read regulation as a product constraint.* |
| "JDL? Apigee? Tool you haven't used by name." | *Notation gap, not a skills gap — here's the identical discipline I already practise.* |
| "Tell me about a mistake." | *Empty-field AC → owned it → fixed the system, not just the incident.* |

---

## ✅ Final 10-Minute Pre-Interview Checklist

- [ ] Re-read the **30-Second Self-Brief** and the **three anchor phrases**.
- [ ] Have **5 stories loaded**: Contingency, Catalog, UPCM, Monorepo, Performance audit (+ the mistake).
- [ ] Know your **2-min opener** cold; know the **title-gap line**.
- [ ] One sentence each on **OSFI, PIPEDA, CAPSA, bilingual**.
- [ ] The claims flow: **portal ↔ adjudication ↔ administration ↔ payment**, and **claims experience → renewal pricing**.
- [ ] Pick your **2–3 panel questions**.
- [ ] **Verify** the latest Canada Life transformation facts (CDO/TCS/EVP).
- [ ] Logistics ready: **PR, two weeks' notice, hybrid yes, Reliability Status comfortable.**

> **Mantra:** *Get the contract right at the foundational layer — because an error there doesn't stay local, it compounds across millions of member accounts.*
