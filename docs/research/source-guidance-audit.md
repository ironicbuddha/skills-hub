# Source Guidance audit and disposition ledger

Research note for the Wayfinder investigation **Audit and classify the Source
Guidance**. It compares the complete local corpus in
`/Users/carlo/dev/llm-toolkit/rules` with the settled Project Standards
Bootstrapper design and the current `dev-env-export` baseline. It classifies the
guidance; it does not change the bootstrapper specification or implement a
catalogue.

## Snapshot and authority

- Source Guidance: `/Users/carlo/dev/llm-toolkit` at
  `a46825d808eefe7a31dd390d65695f197fa95305` (all 16 rule files, 2,162 lines).
  The untracked `rules/.DS_Store` is not guidance and was excluded.
- Authoritative current baseline: `/Users/carlo/dev/dev-env-export` at
  `7dd0496fb1022625f17553e096ab5d8981123d14`.
- Settled successor contract: `docs/project-standards-bootstrapper-spec.md` at
  the Skill Hub snapshot
  `e64dd615ecdb2b33c00cc52e7cd4a6e1e8e3cf16`, backed by the resolved decisions
  indexed in [Chart a safe project standards bootstrapper](https://github.com/ironicbuddha/skills-hub/issues/1).
- The current effort's scope and authority boundary are defined in
  [Incorporate portable coding principles into project standards](https://github.com/ironicbuddha/skills-hub/issues/62):
  Source Guidance must be curated rather than copied, universal outcome policy
  belongs in Core, platform policy belongs in Workloads, and prescriptive
  architecture belongs in opt-in Capabilities.

Where the current baseline and the settled successor contract disagree, the
successor contract wins. This is already the intended relationship: the
successor is a verified-baseline installer with a versioned catalogue, while the
current `dev-env-export` starter is evidence of the contract being replaced
(`docs/research/existing-project-standards-bootstrap-contract.md:9-30` and
`docs/project-standards-bootstrapper-spec.md:297-301`).

## Executive conclusion

Do **not** import the corpus as a new long-form policy bundle. Its useful content
falls into four narrower outcomes:

1. **Merge portable outcomes into existing layers.** Clarity, explicit error
   handling, behavior-focused tests, safe API evolution, least privilege,
   boundary validation, non-sensitive structured logs, and narrow changes
   strengthen Core or existing Capabilities. Much of this already exists in the
   baseline (`/Users/carlo/dev/dev-env-export/PROJECT-STANDARDS.md:37-83` and
   `132-199`) and the settled composition contract
   (`docs/project-standards-bootstrapper-spec.md:189-195`).
2. **Keep architecture approaches opt-in.** DDD, SOLID, and hexagonal
   architecture contain valuable heuristics, but making any of them universal
   would violate the map's applicability rule and overfit small scripts,
   frontends, libraries, and simple services. Curate them as review-led
   Capability material, with no fake metric-based certification.
3. **Treat platform files as candidate Workload content, not current truth.**
   TypeScript guidance can amend the existing TypeScript Workloads now. Angular,
   .NET, LikeC4, and Azure Bicep require explicit catalogue decisions and
   current first-party validation before support. The current first-release
   Workload list does not include those platforms
   (`docs/project-standards-bootstrapper-spec.md:109-122`).
4. **Replace scattered exception prose with one governed mechanism.** Every
   substantial source file invents a slightly different comment/README/ADR,
   tech-lead approval, follow-up, and periodic-review process. Catalogue rules
   should point to a typed waiver record with scoped authority, compensating
   control, expiry or review trigger, and evidence. Inline suppressions may be
   inputs to that process, never silent policy weakening.

The Source Guidance is therefore useful as design input, not as a runtime source
of truth. Its strongest additions are richer applicability and evidence
requirements. Its weakest material is absolute style dogma, arbitrary numeric
thresholds, outdated or unpinned platform prescriptions, and agent workflow
preferences presented as project standards.

## Disposition vocabulary

- **Adopt**: carry the source outcome substantially as written into the named
  layer.
- **Adapt**: retain the intent but narrow its applicability, remove absolutes,
  update the mechanism, or turn it into an explicit Policy Choice.
- **Merge**: the outcome is already substantially present; enrich the canonical
  existing rule rather than create a duplicate.
- **Reject**: exclude it from Project Delivery Contracts and catalogue policy.
- **Defer**: potentially useful, but requires a future supported platform,
  current primary-source validation, or a separately settled design.

Examples, anti-examples, decision summaries, related-rule links, and duplicated
TL;DR sections inherit the disposition of the rule cluster they illustrate; they
are not separate normative rules.

## Complete source classification

### Portable code, delivery, and interface guidance

| Source cluster | Disposition | Target layer | Evidence and rationale |
| --- | --- | --- | --- |
| `clean-code.md` clarity, intent, simplicity, meaningful naming, consistent formatting, and removal of dead/commented-out code (`:13-30`) | **Merge** | Core Baseline | Core already owns invariant code standards and narrow-change discipline (`docs/project-standards-bootstrapper-spec.md:189-193`). Add concise outcome language and use Workload format/lint checks where deterministic. |
| `clean-code.md` Boy Scout rule, strict DRY, functions under 20 lines, at most three parameters, nesting under three levels, and universally small classes (`:18-19`, `:25-38`) | **Reject** as hard rules; **adapt** clarity/cohesion as review heuristics | Core Baseline for the heuristics; none for the thresholds | Numeric size is not a proxy for responsibility, strict DRY encourages premature abstraction, and “always improve touched code” conflicts with preserving unrelated work. The corpus itself later says team context and demonstrated performance matter (`:81-103`). |
| `clean-code.md` composition, descriptive errors, low coupling, and intention-revealing organization (`:39-45`) | **Merge** | Core Baseline, with deeper forms in an architecture Capability | Portable at outcome level; do not require a particular class hierarchy or abstraction pattern. |
| `clean-code.md` lint/complexity gates and quarterly exceptions (`:93-109`) | **Adapt** | Workload verification plus governance/waiver machinery | Format/lint are executable Workload checks (`docs/project-standards-bootstrapper-spec.md:275-288`). Complexity metrics may inform review but must not certify maintainability. Central waivers replace file-local quarterly tracking. |
| `code-quality.md` evidence, no invented scope, preservation of unrelated code, and real file links (`:3-17`) | **Merge** | Core Baseline and Agent Guidance Adapter | Evidence, narrow changes, and preservation agree with the baseline adapter (`/Users/carlo/dev/dev-env-export/agent-direction/AGENTS.md:3-13`) and settled adapter contract (`docs/project-standards-bootstrapper-spec.md:191-195`). |
| `code-quality.md` “never apologize,” do not explain existing implementation, no whitespace suggestions, single-chunk edits, and similar conversation preferences (`:5-16`) | **Reject** | None | These are user/agent interaction preferences, not repository delivery standards. Several are context-dependent and not observable properties of the delivered project. |
| `code-quality.md` specific error handling, contextual error types, no log-and-rethrow, and no swallowed errors (`:18-23`) | **Adapt** | Core Baseline | Retain “handle or propagate explicitly while preserving useful context and cause.” Remove the internal contradiction between “ignore the error” at `:21` and “do not ... ignore errors” at `:22`, and do not mandate custom classes in languages with better native mechanisms. |
| `code-quality.md` structured, consistent, minimal logging (`:25-30`) | **Merge** | `observability` Capability | The baseline already requires structured logs only for running services/jobs (`/Users/carlo/dev/dev-env-export/PROJECT-STANDARDS.md:154-165`). “Flat only” and “no templates” are implementation preferences, not universal outcomes. |
| `testing-principles.md` tests as documentation, public behavior rather than implementation, deterministic independence, and test layers selected by boundary/risk (`:11-18`) | **Merge** | Core testing expectation, executable Workloads, and `tdd` Capability | This is the settled model: Workloads declare test contracts and TDD targets public behavior at the narrowest reliable boundary (`docs/project-standards-bootstrapper-spec.md:165-167`, `275-288`). |
| `testing-principles.md` descriptive names, clear behavior, failure paths, minimal setup, and careful doubles (`:21-35`) | **Adapt** | `tdd` Capability review policy | Preserve observable intent and independence. Do not require exactly one assertion or a visually fixed Arrange-Act-Assert layout; multiple assertions can prove one behavior and framework idioms differ. |
| `testing-principles.md` mandatory pyramid, immediate deletion of flaky tests, mutation testing, and “coverage drop” gate (`:27-41`, `:75-103`) | **Adapt** or **defer** | `tdd` Capability and Workload Policy Choices | Quarantine/fix flaky tests without deleting valuable coverage blindly; select test layers by risk, not a universal ratio. Mutation testing is a future opt-in check for critical logic. The settled contract explicitly has no universal coverage percentage (`docs/project-standards-bootstrapper-spec.md:165-167`). |
| `testing-principles.md` exploratory, performance, and legacy exceptions (`:87-97`) | **Merge** | Governance/waiver machinery and `tdd` applicability | Throwaway prototypes are already exempt, and missing regression coverage must be restored before merge (`docs/project-standards-bootstrapper-spec.md:165-167`). Legacy/performance exceptions need scoped evidence, not a comment plus generic follow-up. |
| `api-design.md` consumer-first, consistent, explicit contracts, informative errors, and safe evolution (`:11-17`) | **Adopt** | `public-interface` Capability | These are durable outcomes for selected interfaces and reinforce the existing requirement for substantive interface documentation (`docs/project-standards-bootstrapper-spec.md:193-195`). |
| `api-design.md` resource-oriented paths, HTTP methods/status, error shape, API versioning, and bounded collections (`:21-38`) | **Adapt** | `public-interface` Capability with an HTTP/REST style Policy Choice | Correct semantics, consistent errors, and bounded collections are strong defaults. “Version every API as `/v1` from first release” and CRUD-only modeling are not universal: internal, RPC, GraphQL, event, and compatibility-managed APIs need other strategies. |
| `api-design.md` JSON Merge Patch, health endpoint, ETag, correlation IDs, ISO 8601, filters/sorts, and `Location` (`:30-43`) | **Adapt** | `public-interface` and `observability` Capabilities | Select by protocol and workload need. Correlation/trace identity and health/readiness already belong to observability (`/Users/carlo/dev/dev-env-export/PROJECT-STANDARDS.md:154-165`); HTTP details belong only to HTTP interfaces. |
| `api-design.md` local exception process (`:76-98`) | **Merge** | Governance/waiver machinery | Consumer impact, migration, and externally mandated contracts are useful waiver evidence. Replace “ensure consumers are aware” with attributable evidence and a review/expiry trigger. |
| `api-design.md` OpenAPI linting, schema validation, contract tests, and error/pagination integration tests (`:100-104`) | **Adopt** | `public-interface` Capability verification | These are proportionate deterministic checks when OpenAPI/HTTP is selected. The Capability must declare exact commands/artifacts instead of assuming Spectral universally. |
| `git-rules.md` atomic/revertible changes, readable intent, short-lived work, healthy main, and traceability (`:11-18`) | **Adapt** | `github-repository` Capability | Preserve outcomes, but “every commit links to a work item” is a selectable traceability policy, not valid for every repo or initial change. |
| `git-rules.md` Conventional Commits, 72-character subjects, required issue references, PR-only delivery, and passing CI (`:21-29`) | **Adapt**, with the PR-only mandate **rejected** as universal | `github-repository` and `github-actions-ci` Policy Choices | The settled solo default explicitly permits direct pushes to `main`; PRs/reviews are stricter selectable choices (`docs/project-standards-bootstrapper-spec.md:159-163`). Selected CI gates must pass, but commit format, line length, and references require explicit policy/tooling selection. |
| `git-rules.md` branch names, squash behavior, PR descriptions, branch deletion, signing, SemVer tags, and changelog (`:30-43`) | **Defer** or **adapt** | `github-repository` Capability choices | Useful repository/release choices, but not one universal workflow. Branch deletion already fits the existing repository Capability (`docs/project-standards-bootstrapper-spec.md:159-161`); release/version policy needs a supported release capability or explicit choice. |
| `git-rules.md` emergency bypass and tech-lead acknowledgement (`:76-104`) | **Adapt** | Governance/waiver machinery | Emergency change evidence is useful, but role names and post-merge bypass authority are repository-specific. A waiver must identify actual authority, affected gates, risk, compensating checks, and expiry. |
| `long-running-tasks.md` mandatory `docs/tasks` checklist and `[~]` syntax (`:1-12`) | **Reject** | None | This is a specialized agent execution workflow. The predecessor decision deliberately keeps specialized Skill Hub workflows out of every target repository (`docs/research/existing-project-standards-bootstrap-contract.md:268-303`). It also competes with the repository's tracker and planning conventions. |
| `task-execution.md` simplest implementation and pre-review format/test/lint (`:7-12`, `:17-21`) | **Merge** | Core Baseline and Workload verification | Simplicity and selected checks fit the narrow-change contract. The exact check set comes from each Workload, which also includes typecheck/build/package/content checks where applicable (`docs/project-standards-bootstrapper-spec.md:275-288`). |
| `task-execution.md` mandatory human approval for every TODO, no next task without approval, mark `[X]`, then commit (`:13-23`) | **Reject** | None | This is a caller workflow, conflicts with automation parity and scoped authority, and cannot be a delivery standard for all repositories. Human gates are required only for defined authority/consent boundaries (`docs/project-standards-bootstrapper-spec.md:17-24`, `240-257`). |

### Architecture and modeling guidance

| Source cluster | Disposition | Target layer | Evidence and rationale |
| --- | --- | --- | --- |
| `solid-principles.md` cohesion, substitutable contracts, client-focused interfaces, and inward dependency intent (`:13-20`) | **Adapt** | Opt-in architecture Capability | Generalize beyond classes/OOP and express as reviewable design outcomes. These are valuable when architecture complexity justifies them, but not universal Core policy. |
| `solid-principles.md` “always abstractions,” “never modify working classes,” dependency count ≤5, interface-size percentages, and fixed inheritance depth (`:23-45`, `:119-149`) | **Reject** as gates; **adapt** as prompts | Architecture Capability review rubric; none for thresholds | The source contradicts itself by warning against premature abstraction (`:123-130`). Fixed counts and OCP absolutism can add indirection, while changing an existing class is often the clearest safe design. |
| `solid-principles.md` measured performance/framework exceptions (`:132-143`) | **Merge** | Governance/waiver machinery | Retain measured constraint, isolation, and remediation evidence. Replace generic “technical debt ticket” with the central waiver record and repository authority. |
| `domain-driven-design.md` ubiquitous language, bounded contexts, context maps, and investment by domain value (`:10-50`) | **Adapt** | Opt-in domain-modeling/architecture Capability | Fits repositories with substantive domains and complements the settled `CONTEXT.md`/ADR link contract (`docs/project-standards-bootstrapper-spec.md:193-195`). It must not require every repository to invent bounded contexts. |
| `domain-driven-design.md` entities, value objects, aggregates, domain events, repositories, services, and specifications (`:53-116`) | **Defer** within the selected Capability | Opt-in domain-modeling/architecture Capability | Make these candidate patterns selected by domain need, not a mandatory tactical stack. Several claims (one transaction per aggregate, repository per aggregate, events enabling event sourcing) require local architectural decisions and review evidence. |
| `domain-driven-design.md` invariants, intention-revealing interfaces, conceptual contours, and low dependency (`:119-135`) | **Merge** | Architecture Capability | Useful review prompts, redundant with portable clarity/SOLID/hexagonal clusters. Canonicalize once rather than render three formulations. |
| `domain-driven-design.md` as a whole lacks applicability, exceptions, and verification | **Adapt** | Capability plus governance/waiver/evidence machinery | Add explicit selection criteria, non-applicability, reviewer evidence, and links to substantive domain artifacts. Do not certify “richness” mechanically. |
| `hexagonal-architecture.md` domain isolation, ports/adapters, technology boundaries, and inward dependencies (`:3-20`, `:24-105`) | **Adapt** | Opt-in hexagonal/modular-architecture Capability | Strong where business logic and replaceable external systems justify the seam; overkill for simple scripts and CRUD. “Interfaces for all interactions” is narrowed by the source's own pragmatism at `:278-307`. |
| `hexagonal-architecture.md` pure core, DI, explicit error mapping, and package structure (`:109-188`) | **Adapt** | Architecture Capability plus language Workload rendering | Preserve boundary isolation and explicit error translation; do not mandate `Either`, DI containers, repositories, or a universal package layout. The package-structure section is literally unfinished (`:109-114`). |
| `hexagonal-architecture.md` domain/adapter/end-to-end test strategy (`:192-255`) | **Merge** | `tdd` Capability and Workload test contract | This is a topology-specific restatement of unit logic, real boundary integration, and complete-flow testing already settled in the successor. |
| `hexagonal-architecture.md` leaky dependencies, pragmatic adoption, migration, and performance (`:258-307`) | **Adopt** in narrowed form | Architecture Capability review and waiver evidence | These sections supply useful observable review questions and guard against the source's more absolute earlier wording. |
| `likec4.md` source traceability, business vocabulary, descriptions, hierarchy, naming, and relationships (`:11-40`) | **Adapt** | Candidate `likec4-model` Workload | A `.c4` model is a separately verifiable authored artifact, so a Workload is a cleaner fit than universal Core. “All elements link to source” must support confidential/offline sources and typed provenance without leaking sensitive URLs. |
| `likec4.md` visual style, navigation, and predicates (`:35-40`) | **Defer** | Candidate `likec4-model` Workload choices | Useful rendering preferences, but catalogue inclusion must validate them against a pinned current LikeC4 version and allow project design systems. |
| `likec4.md` exception metadata and render/link validation (`:86-114`) | **Adapt** | Workload verification plus governance/waiver machinery | Adopt parse/render/navigation and accessible-source checks. A model-local metadata note does not replace a governed waiver; confidentiality may itself require redacted provenance. |

### Security and platform guidance

| Source cluster | Disposition | Target layer | Evidence and rationale |
| --- | --- | --- | --- |
| `platform/security.md` defence in depth, least privilege, deny on ambiguity, boundary validation, and secrets excluded from code/logs (`:11-28`) | **Merge** | Core Baseline, `secret-management`, and `authentication` Capabilities | These outcomes already form the day-one baseline (`/Users/carlo/dev/dev-env-export/PROJECT-STANDARDS.md:132-152`) and Core composition (`docs/project-standards-bootstrapper-spec.md:189-191`). Capability selection supplies concrete artifacts and checks. |
| `platform/security.md` HTTPS/HSTS, auth/authz, headers, rate limiting, parameterized access, password hashing, CORS, rotation, audit logs, dependency scanning, and threat modeling (`:21-43`) | **Adapt** | `authentication`, `public-interface`, `persistence`, `secret-management`, and `observability` Capabilities | Scope by surface and threat. Do not imply JWT alone is a “proven standard,” require rotation on an arbitrary universal schedule, or force application-managed passwords/audit logs where an identity/provider service owns them. |
| `platform/security.md` internal API, test credential, and append-only audit-log edge cases (`:75-85`) | **Adapt** | Relevant security Capabilities | Zero-trust input and non-production credentials are good outcomes. Append-only audit evidence needs a selected threat/retention model; it is not satisfied by prose. |
| `platform/security.md` security exceptions (`:87-97`) | **Adapt** | Governance/waiver machinery | Security waivers require named security authority, explicit risk, compensating controls, scope, expiry/review, and evidence. “Non-negotiable” at `:8` cannot coexist with undocumented local bypasses. |
| `platform/security.md` SAST, dependency/secret scanning, DAST, review, and attack-path tests (`:99-103`) | **Adopt** proportionately | Security Capabilities and `github-actions-ci` verification | Catalogue kinds must declare which checks apply, their exact commands/configuration, severity policy, and evidence. DAST is surface/environment-dependent, not a universal Core command. |
| `platform/typescript.rules.md` strict mode, safe unknown/null handling, and public contract typing (`:11-25`) | **Adopt** with one narrowing | Existing TypeScript Workloads | Strict TypeScript already exists in the baseline (`/Users/carlo/dev/dev-env-export/PROJECT-STANDARDS.md:19-20`, `203-245`). Replace absolute “never any” with a linted default plus narrow, attributable third-party/migration exceptions. |
| `platform/typescript.rules.md` interfaces over types, custom errors, readonly, discriminated unions, naming, and explicit returns (`:27-35`) | **Adapt** | TypeScript Workload review/lint choices | Readonly, explicit public contracts, and discriminated states are useful where they clarify intent. Interface-vs-type and error-class choices are design-context dependent, not universal blockers. |
| `platform/typescript.rules.md` Props suffix, barrel exports, and async/await preference (`:36-43`) | **Reject** as standards; optionally defer to local style | None | These are conventions with legitimate counterexamples; barrel exports can obscure ownership/cycles and Promise chains can be clearer for composition. Existing project conventions should win during Adoption. |
| `platform/typescript.rules.md` exceptions and type gates (`:86-114`) | **Adapt** | TypeScript Workload verification and governance | Use compiler strictness, ESLint, type tests where needed, and runtime validation of external data. Reject “performance-critical type checking overhead” (`:102`) as a runtime rationale because TypeScript types are erased; build-time constraints need measured build evidence instead. |
| `platform/angular-ts.rules.md` strict typing and modern Angular primitives (`:13-40`) | **Defer**, then adapt | Future `angular-web` Workload | Angular is absent from the settled first-release matrix. The file says Angular v16+ (`:9`) while several “default”/modern syntax claims are version-sensitive; inclusion requires a pinned Angular catalogue version and current official validation. |
| `platform/angular-ts.rules.md` universal OnPush, signals, reactive forms, singleton services, lazy routes, and syntactic bans (`:25-56`) | **Adapt** if the Workload is added | Future `angular-web` Workload Policy Choices | Sensible starter defaults for a compatible version, but not every library/component/service has the same state, route, DI, or form needs. Existing compatible Angular conventions must be preserved during Adoption. |
| `platform/angular-ts.rules.md` approval/timebox process and automated gates (`:163-191`) | **Adapt** | Future Workload verification and central governance | Angular compiler/ESLint/template tests can be deterministic. The proposed bespoke “tech lead + ADR” waiver is replaced by the shared record and authority model. |
| `platform/dotnet.rules.md` secure, observable, async, versioned ASP.NET/EF API defaults (`:11-38`) | **Defer**, then merge/adapt | Future `dotnet-service` Workload plus existing Capabilities | .NET is absent from the first release. Generic API/security/testing outcomes already belong to Capabilities; framework-specific analyzers, build/test commands, async and EF checks belong to a future Workload validated against a pinned SDK. |
| `platform/dotnet.rules.md` LINQ/`var`, caching, action filters, repository-vs-EF, AutoMapper, and named test/mock libraries (`:39-53`) | **Reject** as universal; **defer** selected defaults | Future `dotnet-service` Workload choices or none | “Use AutoMapper” and particular mock frameworks are dependency choices, not standards. The source correctly admits repository vs direct EF depends on complexity (`:46`), contradicting universal repository guidance elsewhere. |
| `platform/dotnet.rules.md` exception and quality gates (`:116-145`) | **Adapt** | Future Workload verification and governance | Prefer official framework conventions and measured optimization. Pin exact analyzer/test commands when the Workload is designed; centralize exception authority and expiry. |
| `platform/bicep.rules.md` top-three, errors-only, single-line annotation output and `genaiscript` suppression (`:13-43`, `:71-98`) | **Reject** | None | This is a review-bot output contract, not Azure Bicep engineering policy. A tool-local suppression must not become a Project Delivery Contract waiver. The file contains almost no substantive Bicep rules. |
| `platform/bicep.rules.md` prioritize security/correctness, actionable de-duplicated review, and test the reviewer contract (`:30-42`, `:94-98`) | **Defer** | Future review-tool Capability, not a coding Workload | Potentially useful for a selected review bot, but outside the bootstrapper's current standards payload. |
| Azure Bicep platform support implied by `platform/bicep.rules.md` | **Defer** | Future `azure-bicep`/infrastructure Workload | A real Workload would need actual lint/build/what-if/security/deployment rules, pinned Azure tooling, and first-party research. This source is insufficient evidence to claim verified Bicep support. |

## Contradictions that require explicit resolution

| Contradiction | Resolution for the revised design |
| --- | --- |
| `git-rules.md:27` forbids direct main commits, while the settled solo default permits them (`docs/project-standards-bootstrapper-spec.md:159-163`). | Keep the settled default. Model PR-only delivery and required review as explicit stricter `github-repository` choices; never render both. |
| `solid-principles.md:26-29` says always depend on abstractions and never modify working classes, but `:123-130` warns against premature abstraction. | Retain cohesion/client-contract/dependency review prompts in an opt-in Capability; reject absolutes and numeric certification. |
| `clean-code.md:27` demands strict DRY while `task-execution.md:19` demands the simplest solution and SOLID warns against speculative variation. | Prefer clear, local duplication until a stable shared concept is evidenced; review duplication as a smell, not an automatic gate. |
| `testing-principles.md:23` mandates one assertion while `:17` requires the correct boundary/critical path. | A test should prove one coherent behavior; assertion count is not the contract. |
| `testing-principles.md:15` dismisses slow tests while the same file and baseline require integration/end-to-end coverage. | Use tiered commands, time budgets, and reliable CI placement. Slower necessary suites are not skipped merely for being non-unit speed. |
| The current baseline specifies 80% coverage (`/Users/carlo/dev/dev-env-export/PROJECT-STANDARDS.md:67-72`); the settled contract explicitly rejects a universal percentage (`docs/project-standards-bootstrapper-spec.md:165-167`). | The settled successor wins. Workloads/Capabilities may select thresholds, but direct critical-path evidence is primary. |
| `code-quality.md:21` says ignore an error when no action is possible; `:22` says never ignore errors. | Require explicit handling or propagation with context; deliberate suppression needs observable rationale or a governed waiver where policy is affected. |
| `platform/security.md:8` calls security non-negotiable, then `:87-97` permits exceptions. | Define non-waivable invariants separately from waivable controls. All waivable security rules require stronger named authority, risk, compensating control, and expiry. |
| `api-design.md:23` bans verbs in paths while `:83-86` permits action/batch endpoints. | A selected REST style prefers resource nouns; non-CRUD operations use consistently modeled action resources or another explicitly selected interface style. |
| `platform/typescript.rules.md:14` prefers explicit typing while `platform/angular-ts.rules.md:15` prefers inference when obvious. | Require explicit public/boundary contracts and allow local inference where the compiler preserves clarity and safety. |
| `domain-driven-design.md:92-99` expects repositories per aggregate, `hexagonal-architecture.md:42-55` expects driven repository ports, and `.NET` guidance allows direct EF Core (`platform/dotnet.rules.md:46`). | Repository abstraction is an architecture Capability choice driven by domain complexity and substitution need, never a universal Workload rule. |
| `long-running-tasks.md` and `task-execution.md` mandate document/TODO workflows while the successor supports interactive/non-interactive parity and authority-scoped Manual Stages. | Exclude those agent workflows from rendered project policy. Repository trackers and specialized Skill Hub skills remain separate. |
| `platform/bicep.rules.md:28` creates an inline suppression while the current map requires governed, reviewable waivers. | Inline suppressions can only satisfy a waiver when the catalogue declares the mechanism and the committed waiver record authorizes the exact rule/scope. The specific `genaiscript` bypass is not adopted. |

## Redundancies to canonicalize once

The corpus repeatedly states the same outcome with different architecture or
platform vocabulary. Rendering all versions would recreate the template
sediment the predecessor explicitly retired
(`docs/research/existing-project-standards-bootstrap-contract.md:282-303`).

| Canonical outcome | Redundant sources | Canonical home |
| --- | --- | --- |
| Clear responsibility, cohesive modules, intention-revealing names | Clean Code, SOLID, DDD, Angular | Core outcome; richer architecture review only when selected |
| Dependency isolation at meaningful boundaries | SOLID, hexagonal, DDD repositories, .NET DI | Opt-in architecture Capability |
| Test behavior at the right boundary and include regression evidence | Testing, hexagonal, API, .NET, Git, task execution | Core expectation + Workload commands + `tdd`/interface Capabilities |
| Explicit boundary validation and predictable errors | Code Quality, API, security, hexagonal, .NET, TypeScript | Core outcome + interface/security/persistence Workloads/Capabilities |
| Structured non-sensitive logs and trace identifiers | Code Quality, API, security, .NET, baseline | `observability` Capability |
| API contracts, compatibility, bounded collections, and contract tests | API, security, .NET, baseline | `public-interface` Capability |
| Strict TypeScript and runtime validation of external data | TypeScript, Angular, baseline security | TypeScript Workloads + relevant interface/security Capability |
| Scoped, justified, reviewed exceptions | Clean Code, Testing, API, Git, SOLID, LikeC4, security, TypeScript, Angular, .NET, Bicep | One governance/waiver schema |
| Format/lint/test/build/typecheck/security evidence | Nearly every Quality Gates section | Workload/Capability verification declarations composed by CI |

## Gaps exposed by the audit

### Gaps in Source Guidance

Source Guidance cannot replace the settled bootstrapper contract because it has
no model for configuration, detected state, ownership, artifact composition,
conflicts, state-bound plans, recovery, idempotency, provenance, or terminal
outcomes. Those remain authoritative in
`docs/project-standards-bootstrapper-spec.md:36-105` and `203-295`.

It also lacks:

- typed applicability and non-applicability rules across repository, Workload,
  Capability, and cross-Workload scopes;
- stable rule/artifact/check IDs and a machine-readable evidence record;
- a common waiver schema, non-waivable rule class, authority model, expiry, and
  compensating-control verification;
- source provenance, framework/runtime compatibility ranges, catalogue-version
  pins, migrations, and reviewable upgrade diffs;
- substantive Python, Next.js, Vite, Node package, Markdown content, AWS, and
  Vercel rules despite those being the settled first-release shapes;
- accessibility requirements (the Angular file claims accessibility in its
  introduction but supplies no meaningful accessibility rule);
- supply-chain/CI controls already settled by the successor: frozen installs,
  least privilege, untrusted-PR secret isolation, timeouts, concurrency, and
  full-SHA action pins (`docs/project-standards-bootstrapper-spec.md:149-163`);
- privacy/data-classification, retention, licensing, and provider-authority
  applicability needed to turn broad security claims into project-specific
  contracts; and
- evidence for judgment-heavy qualities. Function length, dependency counts,
  interface size, and “top three findings” are crude proxies, not proof of clear
  design.

### Gaps in the settled successor design made concrete by Source Guidance

The predecessor architecture is sound, but the revised specification now needs
to make these seams normative:

1. **Rule-level applicability.** Each curated rule needs a stable ID, owning
   layer/kind, scope, severity/obligation, prerequisites, incompatibilities,
   deterministic checks, required review evidence, and waiver class. Layer-level
   selection alone is too coarse for the source's mix of universal outcomes and
   protocol/framework choices.
2. **Judgment evidence.** Clarity, consumer fit, domain boundaries, dependency
   direction, and architecture pragmatism require an attributable review record
   stating the reviewed scope, rule IDs, conclusion, and supporting artifact or
   diff. A linter passing must never certify these qualities.
3. **Governed waivers.** “Policy Choices with rationale and compensating
   controls” (`docs/project-standards-bootstrapper-spec.md:40-43`, `189-195`) do
   not yet define an operational waiver record. The source's repeated exception
   patterns make that missing contract unavoidable.
4. **Catalogue upgrades.** Configuration pins a catalogue and prevents silent
   upgrades (`docs/project-standards-bootstrapper-spec.md:81-105`), but the
   revised spec must define the human-readable rule delta, affected rendered
   contract, new/changed evidence, waiver impact, approval, and atomic promotion
   for review-before-adoption.
5. **Architecture and additional-platform extension points.** The catalogue
   needs a principled way to add review-led architecture Capabilities and future
   Workloads without promoting them to Core or claiming unsupported platforms.

## Quality-gate and evidence disposition

The repeated source pattern of “automated checks + code review focus + tests” is
worth adopting as a catalogue schema shape, not as copied prose.

| Evidence class | Suitable examples from the audit | Required treatment |
| --- | --- | --- |
| Deterministic Workload evidence | format, lint, compile/typecheck, unit/integration suites, build/package, LikeC4 parse/render if added, Angular/.NET tooling if added | Exact versioned command/check ID, target scope, expected result, exit evidence, and exact commit/config/catalogue identity |
| Deterministic Capability evidence | OpenAPI/schema lint, contract tests, secret/dependency/SAST checks, security headers where deployed, authz attack-path tests, health/smoke checks | Declared prerequisites and environment, redacted output, severity policy, and explicit non-applicability where no deterministic check exists |
| Review evidence | clarity/naming, consumer fit, coherent errors, domain language, boundaries, cohesion, abstraction justification, log usefulness, architecture diagrams | Attributable reviewer, rule IDs, reviewed artifact/diff and commit, decision, rationale, unresolved findings; never reduced to a numeric style score |
| Manual Stage evidence | provider settings, protected environments, security authority, external consumer acknowledgement | Expected externally observable state, verifier where possible, authority identity/reference without secrets, and resumable status |

A selected layer is verified only when all applicable deterministic checks pass,
all required review evidence is complete, every non-applicable rule has a
catalogue-valid reason, and every active waiver is valid. This extends rather
than replaces the existing verified-only terminal contract
(`docs/project-standards-bootstrapper-spec.md:273-295`).

## Exception and waiver disposition

The corpus supplies useful *reasons* for exceptions—legacy/external contracts,
measured performance, framework constraints, migration windows, emergencies,
and controlled prototypes—but not an adequate shared mechanism. The revised
design should require one committed, typed waiver per affected rule and scope,
containing at least:

- stable waiver ID and rule/catalogue IDs;
- owning layer instance and exact repository/artifact scope;
- non-waivable/waivable classification check;
- justification and evidence for the constraint;
- risk and affected verification gates;
- compensating controls and their verification evidence;
- named approving authority appropriate to the rule, not a hard-coded “tech
  lead” role;
- issue/decision reference where remediation is expected;
- start, expiry or objective review trigger, and current status; and
- effect on upgrade: unchanged, invalidated, or requiring renewed approval.

Inline comments, README notes, ADRs, pipeline suppressions, and external tickets
may be linked evidence, but none is silently sufficient by itself. Expired,
invalidated, unapproved, or unverifiable waivers make the selected baseline
`incomplete`, consistent with the successor's existing outcome model
(`docs/project-standards-bootstrapper-spec.md:213-238`, `259-273`).

## Catalogue impact indicated by this audit

These are evidence-backed inputs to the next decisions, not prematurely settled
catalogue names:

- **Core Baseline:** enrich the existing concise policy with outcome-level code
  clarity/cohesion, explicit error handling, narrow/no-unrelated change, behavior
  verification, dependency reproducibility, security boundaries, and
  documentation. Do not add numeric style limits, architecture mandates, agent
  workflow rituals, or platform syntax.
- **Existing Workloads:** enrich TypeScript Workloads with strict compiler and
  external-data validation evidence. Keep exact formatting, lint, test,
  typecheck, and build/package checks intrinsic as already settled. No change is
  justified to the TypeScript-first/Python-rationale decision.
- **Existing Capabilities:** deepen `public-interface`, `observability`,
  `authentication`, `secret-management`, `persistence`, and `tdd` with the
  applicable clusters and evidence above. The audit does not justify a new
  universal coverage gate or PR-only workflow.
- **Architecture Capabilities:** add an opt-in route for portable modular-design,
  domain-modeling, and hexagonal guidance. **Define catalogue composition and
  applicability** must decide whether these are one composable architecture
  family or several compatible/incompatible Capabilities, and what substantive
  artifacts and review evidence each requires.
- **Additional Workloads:** consider LikeC4 modeling as the strongest near-term
  new Workload candidate because it has a distinct artifact and verification
  surface. Angular, .NET, and Azure Bicep remain future Workloads until first-party
  research, version policy, artifact ownership, commands, and acceptance fixtures
  exist.
- **Governance:** add rule-level evidence, non-applicability, typed waivers, and
  review-before-adoption catalogue upgrade deltas. These are cross-cutting
  catalogue/manifest/run concerns, not rendered pseudo-Capabilities.

## Downstream decisions now specifiable

The audit clears the evidence dependency for the two existing frontier
decisions; no additional research ticket is required before starting them.

1. [Define catalogue composition and applicability](https://github.com/ironicbuddha/skills-hub/issues/64)
   can now decide:
   - the stable rule/applicability schema and Core inclusion test;
   - REST/interface style as Policy Choices inside `public-interface`;
   - the architecture Capability split and composition constraints;
   - whether LikeC4 enters the revised release as a Workload or remains a future
     catalogue extension; and
   - the extension contract that keeps Angular/.NET/Bicep deferred without
     pretending support.
2. [Define verification, waiver, and upgrade evidence](https://github.com/ironicbuddha/skills-hub/issues/65)
   can now decide:
   - deterministic-check versus review-evidence schemas;
   - non-waivable rule classes and security-specific approval authority;
   - waiver lifecycle, expiry/invalidation, non-applicability, and terminal
     outcome effects; and
   - catalogue-upgrade diff, evidence refresh, waiver carry-forward, approval,
     and atomic adoption semantics.

## Uncertainties and limits

- The audit classifies the local snapshot as supplied. Source Guidance contains
  links to outside documentation, but it is itself the primary corpus for this
  question; platform claims were not refreshed against current vendor docs.
  Such refresh is a prerequisite to adding Angular, .NET, LikeC4, or Bicep
  support.
- The corpus has no authorship, rule-version, compatibility, or generated-source
  metadata. Statements such as Angular “v16+” plus newer-default syntax and the
  TypeScript runtime-performance exception should be treated as potentially
  stale or erroneous until independently validated.
- Exact catalogue names, whether the architecture material is one or multiple
  Capabilities, and whether LikeC4 is in the revised first release remain human
  design decisions. This audit establishes the safe placement and evidence
  boundary; it does not settle those product choices.
- The authoritative `dev-env-export` baseline is itself the legacy behavior being
  superseded. It is evidence for continuity, not authority to reopen later
  settled decisions such as no universal coverage percentage, direct-main solo
  delivery, or verified-only success.
