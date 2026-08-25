# Project Standards Bootstrapper: Build-Ready Specification

Status: revised implementation handoff

Owners: `dev-env-export` (engine, catalogue, templates, package policy, and standards payload) and Skill Hub (invocation and distribution skill)

Sources: the resolved decisions in [Chart a safe project standards bootstrapper](https://github.com/ironicbuddha/skills-hub/issues/1) and [Incorporate portable coding principles into project standards](https://github.com/ironicbuddha/skills-hub/issues/62), supported by the [Source Guidance audit and disposition ledger](research/source-guidance-audit.md)

## 1. Purpose

Build a repeatable project-standards bootstrapper that installs and verifies a selected repository baseline. It must initialize genuinely empty repositories and adopt standards into repositories with existing content without guessing ownership, overwriting unrelated work, or claiming success before every selected requirement is verified.

The bootstrapper is a verified-baseline installer, not a file copier or best-effort scaffold. A run succeeds only with the `verified` outcome.

## 2. Goals

- Represent desired repository intent as one Core Baseline, one or more composable Workloads, and optional scoped Capabilities.
- Give interactive and non-interactive callers the same schema, planning model, state machine, safety rules, and terminal outcomes.
- Produce deterministic, reviewable, state-bound plans before mutation.
- Preserve user-owned and unrelated content during Adoption Runs.
- Track current Managed Artifact ownership and verification in committed provenance.
- Make rerunning an unchanged configuration against an unchanged Verified Baseline a true no-op that still re-verifies the contract.
- Automate work when the caller already has authority and pause only when human identity, consent, secrets, billing, licence acceptance, organisation approval, SSO, or browser-only authority is required.
- Generate a substantive Project Delivery Contract, executable verification, and concise Agent Guidance Adapters for every selected repository shape.
- Curate Source Guidance into closed, versioned Catalogue Entries without making source material a runtime dependency or repository policy.
- Bind deterministic checks, attributable reviews, manual-state verification, and governed waivers to exact rules, scopes, repository state, and catalogue identity.
- Make catalogue upgrades explicit semantic review-and-adoption runs that preserve the current Verified Baseline until the complete target baseline verifies.

## 3. Non-goals

- Machine provisioning or replacement of the machine bootstrap in `dev-env-export`.
- Personal identity, account login, credential creation, licence acceptance, or unrelated environment setup.
- Inferring durable intent from detected tools, repository resemblance, or legacy starter files.
- A compatibility shim, legacy migration mode, or deprecation window for the old starter.
- Generic support for providers whose artifacts and verification are not modelled in the catalogue.
- A global force, overwrite, skip, or best-effort mode.
- Storing secret values, hidden reasoning, candidate-generation logs, or creativity scores.
- Applying Source Guidance directly, fetching it at bootstrap runtime, or allowing it to override the Project Delivery Contract.
- Project-local rule plugins, remote rule URLs, automatic latest-compatible catalogue selection, or silent policy weakening.
- Claiming that a linter, score, generic approval, or agent judgment proves a judgment-heavy obligation.

## 4. Normative domain model

Use the canonical vocabulary in `CONTEXT.md`.

- **Catalogue Release**: an immutable, content-addressed bundle of schemas, Catalogue Entries, rules, checks, rendering and artifact contracts, migrations, fixtures, support evidence, and authoring provenance.
- **Catalogue Entry**: the closed atomic support unit for one Core Baseline, Workload kind, or Capability kind. It owns its choices, rules, artifacts, composition relationships, verification declarations, fixtures, support evidence, and migration metadata.
- **Catalogue Rule**: a stable-ID normative obligation owned by exactly one Catalogue Entry. A repository selects layer instances, never individual rules; every applicable rule must be satisfied, waived, failed, or incomplete.
- **Catalogue Incompatibility**: a catalogue-declared combination of entries, rules, scopes, or Policy Choice values that cannot form a valid Bootstrap Configuration. It fails validation before planning and is distinct from a Conflict with Detected Repository State.
- **Verification Requirement**: a typed obligation attached to a Catalogue Rule. Its kind is `deterministic-check`, `attributable-review`, or `manual-state`; multiple requirements compose conjunctively.
- **Baseline Verification Requirement**: a requirement that must be satisfied or validly waived for the exact current repository state before a Verified Baseline may be established.
- **Delivery Verification Requirement**: a requirement that demands fresh evidence for every affected future change. Baseline verification proves that the declared gate and policy are installed, never that future work already conforms.
- **Catalogue Check**: a stable-ID deterministic verifier owned by a Catalogue Entry, with closed invocation, scope, prerequisites, toolchain, timeout, network and secret policy, retry policy, and pass criteria.
- **Review Requirement** and **Review Evidence**: the catalogue-owned questions and attributable named-human conclusions for judgment-heavy obligations, including authority, independence, exact fingerprinted material, per-requirement conclusion (`accepted`, `changes-required`, or `unable-to-conclude`), findings, disposition, time, and freshness. An agent may prepare analysis but cannot be the accountable reviewer.
- **Authority Class**: a closed catalogue role resolved to named identities or verifiable external decisions, with independence `none`, `not-author`, or `separate-authority` as declared by the requirement.
- **Manual-State Requirement**: an exact externally or human-authorized state that must be read back mechanically where possible, or supported by catalogue-permitted named attestation when independent read-back genuinely does not exist.
- **Verification Evidence**: immutable, secret-safe proof bound to exact rule and requirement IDs, scope, repository state, configuration and catalogue identities, declared inputs, invocation, toolchain, result, attempts, time, and output digest or immutable reference.
- **Waiver Policy**: the rule-owned declaration `prohibited` or `governed`, including allowed reasons, authority, independence, maximum duration, compensating controls, and renewal conditions.
- **Rule Waiver**: a committed, immutable-versioned authorization covering one rule, one exact scope, and named requirements. Versions progress through `proposed`, `active`, `expired`, `revoked`, `invalidated`, or `superseded`; only `active` provides coverage, and renewal creates a fresh version with new evidence and approval.
- **Managed Suppression**: a catalogue-declared technical suppression whose authority, scope, and lifetime derive from one exact active Rule Waiver.
- **Requirement Evaluation**: the deterministic current classification `satisfied`, `waived`, `failed`, or `incomplete`; there is no score or warning-success threshold.
- **Catalogue Upgrade Plan**: a state-bound semantic comparison of exact current and target Catalogue Releases against the resolved repository configuration, including policy, scope, artifact, evidence, waiver, migration, and operator-decision effects.

- **Core Baseline**: exactly one mandatory, workload-independent standards layer.
- **Workload**: a stable instance with a unique ID, catalogue kind, exact repository-relative root, and fully resolved Policy Choices.
- **Capability**: an optional stable instance with an ID, catalogue kind, fully resolved Policy Choices, and repository, Workload, or declared cross-Workload scope.
- **Policy Choice**: a typed value owned by exactly one Core Baseline, Workload, or Capability. No choice floats independently.
- **Detected Repository State**: a fresh, read-only snapshot used as planning evidence for one run. It is not durable intent.
- **Planned Change**: one state-bound operation with target, owning layer, reason, precondition, verification, and recovery.
- **Conflict**: a contradiction between detected state and desired intent, or an inability to establish ownership for a required Planned Change. It blocks only the affected change.
- **Managed Artifact**: a whole file, link, or addressable structured fragment owned through provenance.
- **Manual Stage**: a resumable human-authority gate with instructions, expected evidence, and machine verification where possible.
- **Bootstrap Configuration**: the complete desired intent committed at `.project-standards/config.json`.
- **Provenance Manifest**: the current machine-owned ownership and verification ledger committed at `.project-standards/manifest.json`.
- **Verified Baseline**: a selected baseline whose complete installation, configuration, and verification contract passes.
- **Incomplete Result**: any required selected work that is unfinished or unverified, including a pending Manual Stage.
- **Initialization Run** and **Adoption Run**: explicit, run-local operating modes. They are never durable configuration.
- **Project Delivery Contract**: authoritative human-readable policy at `constitution.md`.
- **Agent Guidance Adapter**: concise agent entry point that routes to the Project Delivery Contract and adds only tool-specific operating guidance.
- **Runtime Rationale**: structured evidence for choosing a non-default runtime.
- **Selection Recipe**: wizard-only proposal that disappears when the complete Bootstrap Configuration is emitted.
- **Creative Review Policy**: observable quality contract for judgment-heavy work in a Markdown content Workload.

## 5. Configuration contract

### 5.1 Durable files

`.project-standards/config.json` contains only:

```json
{
  "$schema": "<schema URL>",
  "schemaVersion": "<exact schema version>",
  "catalogueVersion": "<exact catalogue version>",
  "catalogueDigest": "<exact content digest>",
  "core": {
    "kind": "core",
    "choices": {}
  },
  "workloads": [],
  "capabilities": [],
  "extensions": {}
}
```

Every object has a closed schema and rejects unknown fields. `extensions` is the only namespaced escape hatch. The resolved configuration materializes every accepted default. It must not contain mode, detection results, plans, conflicts, approvals, progress, run state, ownership, verification state, or secrets.

`extensions` accepts only catalogue-registered, namespaced, schema-validated extension kinds. Unknown kinds or namespaces are invalid. Catalogue content is resolved locally from the exact version and digest; missing, mutable, or mismatched content fails closed rather than falling forward.

`.project-standards/manifest.json` contains:

- manifest schema version;
- configuration digest;
- catalogue and bootstrapper versions;
- exact catalogue content digest and configuration, catalogue, bootstrapper, and schema digests;
- optionally the verifying run ID for audit context;
- one entry per Managed Artifact with stable artifact ID, owning layer instance, target locator, ownership granularity, semantic or byte fingerprint, and last verification state.
- the current secret-safe Verification Evidence envelope required to recompute baseline acceptance, including exact bindings, outcomes, attribution, freshness, digests, and immutable external references;
- references to the exact active Rule Waiver versions and digests that cover waived requirements.

The manifest is a current ledger, not an append-only log. Raw output and verbose diagnostics remain in gitignored run state or their authoritative external system and are never the sole proof. The manifest never depends on retained backups and never describes partial ownership.

Governed waiver records live at `.project-standards/waivers/<waiver-id>.json`. Each immutable version records one rule, one exact scope, named requirements, reason and constraint evidence, risk, compensating controls and their evidence, requester, approvers and authorities, remediation, validity boundary, upgrade disposition, digest, and lifecycle state. Wildcard scopes and multi-rule waivers are invalid. Expiry, revocation, or invalidation removes coverage immediately; its Managed Suppression must be removed atomically or the baseline becomes incomplete.

### 5.2 Validation layers

JSON Schema validates closed structure, types, and required fields. The pinned catalogue additionally validates:

- supported kinds and stable IDs;
- exact Catalogue Release identity and digest;
- complete Catalogue Entries with stable rule, artifact, check, requirement, fixture, and migration identities;
- unique Workload IDs and roots;
- Policy Choice values and resolved defaults;
- deterministic rule applicability from declared kinds, shapes, Policy Choices, Capability presence, and explicit scopes;
- Capability scopes, cardinality, `requires`, `refines`, and incompatibilities;
- nested-root composition contracts;
- artifact ownership and declared merge contracts;
- runtime-selection rules and Runtime Rationale requirements.
- closed Verification Requirements, Waiver Policies, Authority Classes, and extension registrations.

Applicable rules compose conjunctively. `refines` strengthens or operationalizes a rule without weakening it; `requires` declares a dependency; `incompatibleWith` rejects an invalid configuration. Two selected layers may target the same artifact only when the catalogue declares an explicit composition or merge contract. There is no implicit precedence. Schema-version changes use explicit migrations; catalogue or configuration versions never upgrade silently.

## 6. First-release selection matrix

### 6.1 Workloads

| Kind | Responsibility | Required shape choices | Intrinsic verification |
| --- | --- | --- | --- |
| `next-web` | One Next.js app, including rendering, Server Actions, route handlers, and small BFF logic | Exact root and package/runtime choices | format, lint, typecheck, tests, build |
| `vite-web` | One Vite frontend app | Exact root and package/runtime choices | format, lint, typecheck, tests, build |
| `node-service` | One independently deployable TypeScript backend unit | `http-service`, `function`, `worker`, or `scheduled-job` | format, lint, typecheck, tests, build/package |
| `typescript-package` | TypeScript library, CLI, or reusable tooling package | Package boundary and runtime choices | format, lint, typecheck, tests, package check |
| `python-workload` | One Python script, library, worker, scheduled job, or service | `script`, `library`, `worker`, `scheduled-job`, or `service`; service-like shapes require Runtime Rationale | format, lint, typecheck where selected, tests, package/build check |
| `markdown-content` | Authored Markdown as a primary deliverable | Content root and factual-validation command | format, lint, links, factual validation |

Every Workload has a unique stable ID and exact root. Duplicate roots are invalid. Nested roots require a catalogue-declared ownership contract. Multiple web Workloads are separate applications. Independently deployable APIs, workers, queues, substantial persistence logic, and non-web consumers are separate service Workloads.

The default frontend/backend composition is a web Workload plus `node-service`. A Python service may replace or accompany it only with a Runtime Rationale containing the default alternative considered, concrete constraint, material benefit, accepted operational trade-offs, and review trigger. Preference alone is invalid.

### 6.2 Capabilities

| Kind | Scope/cardinality | Selection rule |
| --- | --- | --- |
| `tdd` | repository-wide or selected executable Workloads | Preselect for new executable repositories |
| `github-repository` | repository singleton | Preselect; human confirms remote settings |
| `github-actions-ci` | repository singleton | Preselect when GitHub support is accepted; depends on it |
| `vercel-deployment` | Workload | Recommend for Next.js/Vite deployable shapes |
| `aws-deployment` | Workload | Recommend for Node and deployable Python shapes |
| `vercel-services-experimental` | cross-Workload singleton | Explicit opt-in only; qualifying Next.js/FastAPI topology |
| `persistence` | Workload | Explicit selection |
| `authentication` | Workload | Explicit selection |
| `observability` | Workload | Required for production services, workers, and scheduled jobs |
| `public-interface` | one named Interface Boundary on exactly one Workload | Recommend for stable consumer-facing boundaries; `declared-contract` or `http-rest` style |
| `secret-management` | repository-wide or Workload | Required wherever secrets are used |
| `creative-markdown` | Workload | Explicit selection; requires `markdown-content` |
| `modular-design` | exactly one executable Workload | Explicit opt-in; requires a substantive architecture overview |
| `domain-modeling` | explicit set of one or more Workloads | Explicit opt-in; requires substantive domain glossary artifacts |
| `ports-and-adapters` | exactly one executable Workload | Explicit opt-in; requires `modular-design` on the same Workload and a substantive boundary map |

Multiple deployment Capabilities may target one Workload only for distinct named environments or purposes. Two providers claiming the same environment are incompatible. Cross-Workload Capabilities identify Workloads by ID and never infer topology.

Each `public-interface` instance has a stable boundary identity and owns disjoint artifacts. `declared-contract` applies consumer-fit, explicit-contract, compatibility, boundary-validation, bounded-data, documentation, and contract-test obligations without inventing protocol semantics. `http-rest` refines those obligations with HTTP resource, method, status, error, and OpenAPI-oriented checks. GraphQL, RPC, and event-specific semantics require future researched Catalogue Entries or variants.

`modular-design`, `domain-modeling`, and `ports-and-adapters` remain independently selectable except for the explicit ports-and-adapters dependency. No repository shape activates them automatically. The catalogue does not contain a `solid` or architecture mega-Capability. Compatible architecture Capabilities may share one coherent artifact, but empty generated templates never satisfy their Review Requirements.

### 6.3 Selection Recipes

The wizard may propose recipes for Next.js web app, Vite web app, TypeScript service, Next.js plus Node service, Python automation, and Markdown content repository. A recipe visibly expands to proposed instances and choices, remains fully editable, and is absent from durable configuration. Python backend and experimental Vercel Services are never recipe defaults.

### 6.4 Curated Source Guidance boundary

The [Source Guidance audit and disposition ledger](research/source-guidance-audit.md) is the complete classification record. The first revised Catalogue Release applies it as follows:

- portable outcome-oriented obligations enrich the Core Baseline only when they meet the universal inclusion test, otherwise the owning Workload or existing Capability;
- modularity, domain language, and ports/adapters outcomes become the three explicit architecture Capabilities above; useful SOLID outcomes canonicalize into Core or `modular-design`, while numeric and absolute dogma is rejected;
- agent-workflow rituals, arbitrary thresholds, copied examples, and source-specific boilerplate do not become Catalogue Rules;
- Angular, .NET, Azure Bicep, and LikeC4 guidance remains deferred and supplies no runtime policy in the first revised release.

The catalogue is closed-world. A future platform or protocol Entry is admitted atomically only with stable kind, rule, artifact, check, requirement, and migration IDs; a primary-evidence-backed compatibility envelope; complete scope, choices, applicability, composition and incompatibility declarations; rendering and ownership contracts; deterministic and review evidence; representative initialize, adopt, Conflict, drift, no-op, and upgrade fixtures; and named maintenance ownership. Target repositories cannot add executable policy plugins or partially enable unsupported guidance.

## 7. Package, repository, CI, test, and deployment policies

### 7.1 Package and runtime defaults

- New TypeScript and Markdown package boundaries use pnpm, exactly pinned in `package.json#packageManager` and activated by Corepack.
- Node is exactly pinned in `.nvmrc`; `package.json#engines.node` declares compatibility.
- New Python Workloads use uv, `.python-version`, and committed `uv.lock`.
- Lockfiles are mandatory and CI installs are frozen/immutable.
- Adoption preserves compatible pnpm, npm, Yarn, Bun, or uv arrangements unless package-manager migration is explicitly selected.
- Package-manager and runtime ownership is per package boundary or Workload. Layers sharing a boundary must agree; isolated pnpm and uv roots may coexist.
- Renovate or Dependabot may propose upgrades, but accepted upgrades are explicit configuration migrations.

### 7.2 GitHub and CI defaults

`github-repository` may create or connect a repository only after confirming owner, name, visibility, and remote. It can configure default branch, merge strategy, automatic deletion of merged branches, topics, and a baseline ruleset. The first-release solo default permits direct pushes to `main`; pull requests and required reviews are stricter selectable choices. Compatible existing controls are preserved; weakening them is a Conflict.

`github-actions-ci` composes Workload verification into separate stable-named jobs. It runs for every direct push to `main`, uses frozen installs, least-privilege permissions, concurrency cancellation, timeouts, no secret access for untrusted pull requests, and third-party actions pinned to full commit SHAs. Production deployment waits for all required jobs for the exact commit.

### 7.3 TDD

For scoped executable Workloads, observable behavior changes follow red-green-refactor; bug fixes begin with a reproducing failing test; refactors remain green. Tests target public behavior at the narrowest reliable boundary, with integration tests wherever correctness depends on framework wiring, filesystems, networks, databases, or cross-Workload contracts. Documentation-only changes, formatting, generated artifacts, and explicitly labelled throwaway prototypes are exempt. There is no universal coverage percentage.

### 7.4 Deployment

Vercel and AWS production deployment proceeds from successful GitHub Actions CI for the exact commit. Preview and lower-environment deployments are optional. AWS uses least-privilege OIDC, never long-lived access keys. Each deployment declares artifact identity, environment mapping, smoke check, rollback/recovery, and status reporting.

Experimental Vercel Services is limited to one Vercel project with isolated `frontend/` and `backend/` roots, root `vercel.json`, current `services` schema, and ordered rewrites exposing `/api/**` before the frontend catch-all. Preflight team entitlement and CLI/schema support. Support only the documented FastAPI preset initially; never fall back to `experimentalServices`. Expose Function constraints, including external durable state, bounded requests, 4.5 MB bodies, Python bundles, and usage costs. Preserve native isolated dev commands alongside `vercel dev`, and offer split projects or Vercel frontend plus external Python as supported fallbacks.

## 8. Managed Artifact contract

### 8.1 Core artifacts

- `constitution.md`: wholly managed after creation or explicit adoption; the authoritative Project Delivery Contract.
- `AGENTS.md`: wholly managed when newly created; otherwise only an identifiable managed section is owned.
- `README.md`: only an identifiable managed links section is owned.
- `CLAUDE.md`: created only when selected or already present; routes to `AGENTS.md` and `constitution.md`.
- Nested `AGENTS.md`: only for a subtree with genuinely different commands or constraints; inherits and cannot override the root contract.
- `.project-standards/config.json`: complete committed intent, promoted only on verification.
- `.project-standards/manifest.json`: complete committed provenance, promoted atomically with configuration.

Selected Workloads and Capabilities add package files, lockfiles, tool configurations, CI workflows, deployment configuration, environment examples, and documentation identified by stable catalogue artifact IDs. Ownership must be whole-file or a catalogue-declared structured fragment.

### 8.2 Constitution composition

The Core Baseline contains only outcome-oriented obligations valid for every repository whenever their subject exists and independent of platform or optional architecture. Workloads add platform and runtime obligations. Capabilities add explicitly selected cross-cutting or architectural policy. Detected Repository State never silently activates or deactivates policy.

Render the Project Delivery Contract by repository meaning and exact scope: repository-wide obligations; named Workloads with roots and commands; cross-Workload contracts and shared Capabilities; then governance, active waivers, and verification expectations. Each applicable Catalogue Rule renders exactly once as a titled normative clause with its stable semantic ID visible but unobtrusive. Compatible refinements co-render as one clause while retaining every contributing rule ID. Unselected alternatives, duplicate prose, source-layer boilerplate, and placeholders do not render.

Every Catalogue Rule retains immutable authoring provenance within its release: authorizing decision or specification, exact Source Guidance revision and locator where applicable, disposition, and adaptation rationale. Provenance does not affect runtime applicability and does not render into the Project Delivery Contract. The curated Catalogue Rule is authoritative.

Agent Guidance Adapters route to the constitution and command/docs locations, require nested guidance, preserve unrelated work, state secret and external-authority boundaries, and link domain/architecture docs when present. They do not duplicate coding or testing policy, and no adapter filename has precedence.

The managed README section links to the constitution, local setup, and verification. Deployable Workloads additionally require environment, deployment, rollback/recovery, and troubleshooting guidance. Public interfaces require interface documentation. Domain and ADR links are included where applicable. Empty placeholders do not satisfy the contract.

### 8.3 Creative Markdown

The `creative-markdown` Capability adds a Workload-scoped Creative Review Policy to `constitution.md` and a managed `docs/standards/creative-review.md`. It applies to ideation, substantive editorial structure, framing, naming, requirements analysis, and synthesis. It excludes extraction, citation handling, lint/format/link fixes, templated updates, typo correction, and other mechanical transformations unless alternatives are requested.

Facts are established first; exploration may change framing and expression but not sourced facts, quotations, citations, confidence, or uncertainty. Internal candidate exploration may be used, but candidate transcripts, scoring, probability estimates, chain-of-thought, and attestations are never required or stored. There is no durable creativity-intensity choice. Validation checks only observable content, links, commands, placeholders, scope, and non-contradiction; it never scores creativity.

## 9. Run modes and inspection

The caller selects an exact root and explicitly confirms `initialize` or `adopt`. Inspection may recommend but never choose or switch the mode.

Initialization is eligible only when the root contains Git administrative metadata, empty directories or conventional placeholders, ignorable OS/editor metadata that remains untouched, and optionally a wholly empty initial commit. Any substantive file or symlink requires Adoption. Unexpected content invalidates an initialization plan and requires replanning.

Operate on the exact selected root; never redirect to a parent Git root. Git initialization requires confirmation. Inspection fingerprints root identity and covers symlinks, submodules, worktrees, nested repositories, case collisions, filesystem boundaries, traversal, normalization ambiguity, special files, and type changes. Targets remain inside the root unless a selected Capability explicitly owns an external target. Symlinks are not followed for mutation by default. Nested repositories, submodules, and unrelated dirty state are separate ownership boundaries.

All existing Adoption content begins user-owned. Compatible content may be adopted explicitly; structured merges require catalogue ownership boundaries; contradictions or ambiguous ownership are Conflicts. Previously applied legacy starter output receives no detection, reconstruction, or special treatment.

## 10. Planning, conflict, and approval contract

Each Planned Change uses exactly one strategy:

- `create`: create an absent target;
- `adopt`: claim compatible existing content without mutation;
- `merge`: change only a catalogue-declared structured fragment;
- `replace`: replace the reviewed target after backup;
- `satisfied`: verified state already fulfils the requirement;
- `defer`: make no change; if required, the result is Incomplete.

Applicability is derived solely from the exact Catalogue Release and fully resolved Bootstrap Configuration. Detected Repository State may reveal missing or contradictory intent and force replanning, but it cannot infer or rescope policy. Catalogue Incompatibilities fail before planning; Conflicts remain state and ownership collisions discovered during planning.

The plan records target, owner, reason, contributing rule and requirement IDs, precondition fingerprints, semantic/textual diff, verification and review obligations, waiver effects, reversibility, backup, and recovery. Secret-bearing diffs are redacted without weakening fingerprints. Planning may continue around Conflicts, but execution starts only after every Conflict in the reviewed plan has a structured resolution. Removing or deferring selected scope requires replanning. Inline suppressions, disabled checks, ADRs, issue links, or ignored paths never weaken policy unless represented by a valid Rule Waiver and, where applicable, a matching Managed Suppression.

One final confirmation authorizes the exact resolved plan. Destructive replacement and destructive merge also require per-change approval. Additive declared merges may use overall approval. Drift or any plan change voids affected authorization. There is no wildcard approval or durable overwrite preference.

## 11. Execution, recovery, and idempotency

Before mutation, create gitignored `.project-standards/runs/<run-id>/` state containing plan, fingerprints, logs, candidate configuration/provenance, progress, immutable backups, and recovery report. Back up immediately before each actual mutation, preserving bytes, type, permissions, and restoration metadata under restrictive permissions. Never log or commit backup contents. Absent and satisfied targets create no backup.

Prepare file changes in temporary storage, validate, and promote atomically where possible. On failure, restore all reversible mutations from that execution in reverse order without Git reset/checkout and without touching unrelated work. Remote writes, package installs, migrations, and human-authority actions are declared potentially non-reversible, scheduled late, separately confirmed, and given recovery instructions. Incomplete restoration yields `incomplete` with exact manual steps.

Successful run directories remain until explicit cleanup. Cleanup refuses active/Incomplete runs and the only recovery path. Only one mutating run may be active. Signals and crashes never promote candidate configuration or provenance. Cancellation before mutation discards the candidate run; during mutation it rolls back immediately or on resume.

A Manual Stage may preserve candidate state while paused. It records exact instructions, resume point, expected evidence, and abandonment/recovery command. Resume re-inspects relevant state and replans on drift.

For the same Bootstrap Configuration and unchanged Verified Baseline, rerun performs no writes, installs, backups, manifest churn, or Manual Stages. It re-evaluates every applicable Verification Requirement from fresh or still-valid evidence and reports each as satisfied or waived. Semantic normalization is used only where declared. Managed drift, surrounding user changes, version changes, evidence invalidation, waiver expiry, and intent changes are reported distinctly.

A catalogue upgrade uses the same planning, approval, execution, recovery, and verification machinery. The current release remains authoritative while candidate artifacts, configuration, manifest, waiver disposition, and evidence are prepared. The target configuration, Project Delivery Contract, manifest, and evidence promote together only when every target requirement is satisfied or validly waived. Failure preserves the old Verified Baseline only when its exact state is restored; mixed releases and partial promotion are forbidden.

Verification Evidence is reusable across an upgrade only when bound repository inputs remain unchanged and the target preserves the semantic digests of the rule, requirement, check behaviour, scope, Authority Class, independence, and freshness policy. A reviewed equivalence migration may explicitly bind old and new identities with rationale and acceptance fixtures; otherwise any semantic change invalidates evidence. Provenance-only and formatting-only changes may reuse evidence when normative and verification digests are unchanged.

A Rule Waiver carries forward only when its exact rule, requirements, scope, Waiver Policy, risk assumptions, Authority Class, independence, compensating controls, and evidence remain valid and the plan exposes the carry. Removed rules retire their waivers. Tightened or prohibited waiver policy invalidates them without grandfathering. A named human explicitly selects and approves the exact target release; background upgrades, wildcard approvals, and silent defaults are forbidden.

## 12. Interactive journey and captured values

The wizard uses ten guided-choice stages:

| Stage | Human journey | Captured values/evidence |
| --- | --- | --- |
| 1. Inspect | Select exact root; review detected facts and boundaries | root identity and Detected Repository State fingerprints |
| 2. Choose mode | Review recommendation and exact eligibility evidence | explicit `initialize` or `adopt` for this run |
| 3. Select shape | Optionally choose a Selection Recipe; inspect expanded proposal | proposed Workload and Capability instances |
| 4. Resolve intent | Select the exact Catalogue Release; review every visible default, dependency, incompatibility, choice, scope, and rationale | complete Bootstrap Configuration candidate, target catalogue version and digest, and Runtime Rationale where required |
| 5. Review plan | Inspect ownership, semantic policy and artifact diffs, Conflicts, evidence reuse or invalidation, waiver disposition, verification, reversibility, and recovery | state-bound Planned Changes or Catalogue Upgrade Plan and Conflict resolutions |
| 6. Authorize | Confirm the exact plan; separately approve destructive merge/replace | plan fingerprint and scoped approvals |
| 7. Execute | Allow deterministic local and authenticated API operations | progress, operation evidence, backups, and API results |
| 8. Manual authority | Complete attributable reviews or exact external-state work only where named human or provider authority is required | Review Evidence, non-sensitive Secret References, and Verification Evidence for Manual-State Requirements; never secret values |
| 9. Verify | Review every applicable Verification Requirement and active waiver | Requirement Evaluations and candidate provenance |
| 10. Finish | Review terminal outcome, changes, checks, recovery retention, and next commands | final report and, only if verified, promoted config/manifest |

Each stage first shows a recommendation, reason, relevant choices, and consequence. Details are progressively disclosed at their review gate. Going back is safe before execution. The wizard may open exact URLs or show CLI paths but must not invent provider journeys or treat acknowledgement as evidence.

## 13. CLI behavior

The implementation may choose the executable name, but it must expose these semantic operations consistently in interactive and automation modes:

- `inspect <root>`: read-only Detected Repository State and mode recommendation.
- `plan <root>`: interactive intent resolution by default; automation accepts an explicit mode and complete config. An existing baseline may specify an exact target catalogue version and digest, producing a Catalogue Upgrade Plan when the pin changes. Planning never selects `latest`.
- `apply <plan>`: execute only the exact approved plan; automation supplies structured fingerprint-bound approvals, never `--yes` or `--force`.
- `resume <run-id>`: re-inspect and continue a paused Manual Stage or recover an interrupted execution.
- `verify <root>`: verify the committed configuration and manifest without changing intent.
- `status <root|run-id>`: show active run, outcome, pending stage, drift, and recovery state.
- `recover <run-id>`: restore reversible mutations or print exact remaining manual recovery.
- `abandon <run-id>`: discard pre-mutation work or recover candidate mutations before abandonment.
- `cleanup <run-id>`: remove retained run material only when safe.

Machine-readable output includes schema version, run ID, mode, plan/configuration digests, terminal outcome, checks, changes, pending Manual Stage, recovery state, and exact next commands. Human output uses the same facts. Exit status distinguishes `verified`, `incomplete`, `failed`, and `cancelled`; only `verified` returns success. Missing authority, credentials, connectivity, or evidence is `incomplete`, not warning-success.

## 14. Verification and acceptance criteria

A run is `verified` only when all of the following hold:

Every applicable Verification Requirement first evaluates independently to:

- `satisfied`: its deterministic check passed, attributable review was accepted, manual state was verified, or its required delivery gate and policy passed baseline verification;
- `waived`: one exact active Rule Waiver validly covers it, visibly and without pretending it passed;
- `failed`: trustworthy evidence disproves it, including a failed check, `changes-required` review, or violated non-waivable invariant;
- `incomplete`: evidence is missing, stale, errored, not run, unable to conclude, awaiting authority, or covered only by a non-active waiver.

Only `satisfied` and `waived` contribute to a Verified Baseline. A deterministic check reports `passed`, `failed`, or `error`; absence is `not-run`, and only `passed` satisfies its requirement. Agents may prepare review analysis but cannot supply accountable human Review Evidence. Core closed-configuration, exact-pin, secret-exclusion, evidence-authenticity, atomic-promotion, and truthful-outcome invariants are non-waivable.

1. Configuration, provenance, waivers, and evidence validate against their pinned schemas and exact content-addressed Catalogue Release.
2. Every Planned Change postcondition passes and no Conflict remains unresolved.
3. Every Managed Artifact or fragment has a stable identity, owner, locator, and matching semantic/byte fingerprint.
4. User-owned surrounding and unrelated content is preserved.
5. `constitution.md` renders every applicable Catalogue Rule exactly once by repository meaning and scope, exposes contributing rule IDs and active waivers, contains no unselected material, and has no unresolved placeholder.
6. Agent Guidance Adapters route to the Project Delivery Contract and do not contradict or duplicate it.
7. Managed links resolve to substantive documents and referenced commands exist.
8. Package managers, exact runtime pins, and lockfiles are internally consistent; immutable installation succeeds where selected.
9. Every Workload's format, lint, applicable typecheck, tests/content checks, and build/package checks pass.
10. Every applicable Verification Requirement is satisfied or validly waived with fresh, exact-bound evidence; judgment-heavy rules have attributable human Review Evidence rather than mechanical proxy scores.
11. Deployment Capabilities establish artifact identity, environment mapping, smoke verification, recovery, and status reporting.
12. No unexplained managed drift, ownership ambiguity, or state drift remains.
13. Candidate configuration, contract, manifest, waiver disposition, and evidence are promoted together only after the full acceptance reducer returns `verified`.
14. A repeated run against the unchanged Verified Baseline is a write-free no-op and returns `verified` after re-verification.
15. Failure, cancellation, and interruption tests prove rollback/recovery without changing unrelated work or promoting partial provenance.

First-release acceptance must include fixtures for eligible empty roots; substantive roots; dirty worktrees; symlinks and nested repositories; existing compatible, complementary, contradictory, and ambiguous artifacts; each Workload; valid and invalid Capability compositions; public-interface boundary overlap and both initial styles; all three architecture Capabilities and their dependency rules; Python Runtime Rationale; structured fragments; deterministic-check pass/fail/error/not-run; attributable review outcomes and independence; Manual-State assurance; waiver proposal, activation, expiry, invalidation, renewal, suppression, and prohibition; evidence freshness and drift; exact-digest mismatch; semantic catalogue upgrades with evidence reuse/invalidation and waiver carry/retirement; interrupted execution; secret redaction; and unchanged reruns.

## 15. Migration and cutover

The legacy `scripts/13-apply-project-standards.sh`, Skill Hub `apply-project-standards`, and Skill Hub `agentic-delivery-loop` are archived immediately as part of successor rollout. Remove them from active catalogues, installers, profiles, and current documentation. Git history is the archive; provide no executable shim or deprecation window.

A repository touched by the old starter uses an ordinary Adoption Run. Inspection considers current state only, never historical fingerprints or inferred legacy profiles. Every artifact remains user-owned until the reviewed plan explicitly adopts, merges, or replaces it. Provenance begins only after a Verified Baseline.

## 16. Repository ownership boundary

`dev-env-export` owns:

- bootstrapper engine and CLI;
- configuration, manifest, plan, run-state, and machine-output schemas;
- versioned catalogue, dependency/composition rules, and migrations;
- content-addressed Catalogue Releases, Source Guidance provenance, Catalogue Rules, checks, Verification Requirements, Waiver Policies, Authority Classes, and upgrade semantics;
- templates, semantic renderers, managed-fragment contracts, package/runtime policy, provider operations, and verification engines;
- recovery machinery, tests, documentation, and release/cutover work.

Skill Hub owns:

- one thin successor invocation/distribution skill;
- guidance for locating and invoking the `dev-env-export` implementation;
- removal of the two legacy skills from active discovery.

Skill Hub must not duplicate templates, policy payload, catalogue data, schemas, or implementation logic.

## 17. Ordered implementation handoff

Implement as tracer bullets in this dependency order. Parallelize only after each ticket's declared blockers close; every ticket must leave its slice executable and tested.

1. **Establish the content-addressed catalogue foundation** — Deliver closed schemas, Catalogue Release and Entry identity, stable rule/artifact/check/requirement IDs, deterministic applicability, Policy Choice resolution, composition and incompatibility validation, Source Guidance provenance, fixtures, and migrations.
2. **Inspect exact roots independently** — Build read-only repository and Git inspection once the configuration shape is stable. Inspection may expose conflicting state but never infer durable policy.
3. **Implement the shared verification reducer** — Record immutable exact-bound deterministic, attributable-review, and manual-state evidence; enforce horizons, freshness, drift invalidation, authority, and the four Requirement Evaluations.
4. **Implement governed weakening** — Add closed Waiver Policies, immutable Rule Waiver lifecycles, compensating-control evidence, Managed Suppressions, visible contract/manifest effects, and fail-closed expiry or invalidation.
5. **Plan with policy and ownership context** — Produce state-bound Planned Changes that expose contributing rules, requirements, semantic diffs, evidence obligations, waiver effects, Conflicts, and recovery without mutation.
6. **Execute and recover atomically** — Add guarded run custody, backups, staged writes, rollback, interruption recovery, cancellation, and atomic candidate promotion without touching unrelated work.
7. **Render and verify the Core Baseline semantically** — Render each applicable rule once by meaning and scope, co-render refinements, expose stable IDs and active waivers, and establish the first complete Verified Baseline.
8. **Add catalogue upgrade adoption** — Reuse `plan`, `apply`, recovery, and verification for exact target releases; expose semantic policy/artifact/evidence/waiver changes and promote only a completely verified target.
9. **Add the six Workload Catalogue Entries** — Implement complete closed entries for Next.js, Vite, Node service, TypeScript package, Python, and Markdown content, including rules, artifacts, checks, review obligations, provenance, fixtures, and migrations.
10. **Add established local-policy Capability Entries** — Implement TDD, persistence, authentication, secret management, and creative Markdown as independently verifiable Catalogue Entries.
11. **Add architecture Capability Entries** — Implement `modular-design`, `domain-modeling`, then `ports-and-adapters` with its same-Workload modular-design dependency; preserve independent opt-in and substantive human-review evidence.
12. **Add observability and public-interface Entries** — Deliver one atomic Entry per Capability; model named Interface Boundaries, disjoint ownership, and the `declared-contract` and `http-rest` styles without inventing other protocol policy.
13. **Add GitHub repository and CI Entries** — Implement authenticated state comparison, least-privilege CI composition, full-SHA actions, stable delivery gates, attributable/manual evidence, and Conflict handling.
14. **Add deployment Entries** — Implement Vercel and AWS verified deployment contracts, then the separately gated experimental Vercel Services topology and preflights.
15. **Build the interactive and automation callers** — Deliver the ten-stage journey and matching automation with explicit catalogue pins, semantic upgrade review, structured approvals, resume/status/recover flows, and outcome-specific exits over the same engine.
16. **Prove the complete acceptance model** — Exercise every repository shape, content Entry, composition, evidence result, authority constraint, waiver lifecycle, semantic upgrade, fault, recovery, drift, redaction, and write-free rerun fixture.
17. **Release the authoritative implementation** — Publish the verified `dev-env-export` release and content-addressed catalogue, then archive the old script without a shim.
18. **Cut over Skill Hub** — Publish the thin invoker, remove the two legacy entry points from active discovery, and verify ordinary Adoption Runs on representative legacy-touched repositories.

The handoff is complete when every ticket below has native dependency edges, acceptance tests derived from section 14, and named ownership in the appropriate repository. Implementation must not reopen a resolved product decision merely to make sequencing convenient; any genuine contradiction must be raised against this specification and its linked decision records.

## 18. Delivery ticket reconciliation

The existing delivery graph remains the spine. `Amended` retains issue identity and user-value boundary while replacing its body with the revised contract. `Unchanged` means both scope and acceptance contract remain valid. `Replaced` closes a non-atomic slice in favour of named successors. No existing ticket is retired without a successor.

| Delivery ticket | Disposition | Reconciliation |
| --- | --- | --- |
| [Establish versioned schemas and catalogue validation](https://github.com/ironicbuddha/skills-hub/issues/13) | Amended | Own the content-addressed Catalogue Release, atomic Entry/Rule model, applicability, composition, provenance, fixtures, and migrations; shared evidence and waivers move to dedicated foundations. |
| [Inspect exact repository roots and recommend run eligibility](https://github.com/ironicbuddha/skills-hub/issues/14) | Unchanged | Inspection remains read-only evidence and never selects mode, policy, scope, or a catalogue release. |
| [Produce deterministic ownership-aware plans](https://github.com/ironicbuddha/skills-hub/issues/15) | Amended | Add rule/requirement bindings, Catalogue Incompatibility boundary, semantic policy diffs, evidence obligations, and waiver effects. |
| [Execute local changes atomically with rollback and recovery](https://github.com/ironicbuddha/skills-hub/issues/16) | Amended | Extend atomicity and recovery to candidate contract, evidence, waiver disposition, and exact-release promotion. |
| [Render and verify the Core Baseline](https://github.com/ironicbuddha/skills-hub/issues/17) | Amended | Render by meaning and scope, co-render refinements, expose stable IDs and active waivers, and establish acceptance through the shared reducer. |
| [Install and verify a Next.js web Workload](https://github.com/ironicbuddha/skills-hub/issues/18) | Amended | Deliver a complete `next-web` Catalogue Entry rather than only tooling and templates. |
| [Install and verify a Vite web Workload](https://github.com/ironicbuddha/skills-hub/issues/19) | Amended | Deliver a complete `vite-web` Catalogue Entry rather than only tooling and templates. |
| [Install and verify a Node service Workload](https://github.com/ironicbuddha/skills-hub/issues/20) | Amended | Deliver a complete `node-service` Catalogue Entry across every declared service shape. |
| [Install and verify a TypeScript package Workload](https://github.com/ironicbuddha/skills-hub/issues/21) | Amended | Deliver a complete `typescript-package` Catalogue Entry and package-boundary evidence. |
| [Install and verify a Python Workload](https://github.com/ironicbuddha/skills-hub/issues/22) | Amended | Deliver a complete `python-workload` Catalogue Entry, including Runtime Rationale rules and review evidence. |
| [Install and verify a Markdown content Workload](https://github.com/ironicbuddha/skills-hub/issues/23) | Amended | Deliver a complete `markdown-content` Catalogue Entry with factual-validation requirements. |
| [Compose and verify the TDD Capability](https://github.com/ironicbuddha/skills-hub/issues/24) | Amended | Deliver one complete Capability Entry with Baseline and Delivery Verification Requirements. |
| [Compose and verify the persistence Capability](https://github.com/ironicbuddha/skills-hub/issues/25) | Amended | Deliver one complete Capability Entry with scoped operational, migration, recovery, and review obligations. |
| [Compose and verify the authentication Capability](https://github.com/ironicbuddha/skills-hub/issues/26) | Amended | Deliver one complete Capability Entry with secret-safe evidence and scoped integration obligations. |
| [Compose and verify observability and public-interface Capabilities](https://github.com/ironicbuddha/skills-hub/issues/27) | Replaced | One issue cannot be the atomic support unit for two Capability kinds; replace it with separate observability and public-interface Entries. |
| [Compose and verify secret management](https://github.com/ironicbuddha/skills-hub/issues/28) | Amended | Deliver one complete Capability Entry with manual-state evidence and non-waivable secret-exclusion invariants. |
| [Compose and verify creative Markdown policy](https://github.com/ironicbuddha/skills-hub/issues/29) | Amended | Deliver one complete Capability Entry while preserving observable-output and private-reasoning boundaries. |
| [Manage GitHub repository configuration safely](https://github.com/ironicbuddha/skills-hub/issues/30) | Amended | Add a complete Entry contract, exact Authority Classes, manual-state read-back, and evidence freshness. |
| [Compose and verify GitHub Actions CI](https://github.com/ironicbuddha/skills-hub/issues/31) | Amended | Add a complete Entry contract and Delivery Verification Requirements for every affected future change. |
| [Deploy and verify selected Workloads on Vercel](https://github.com/ironicbuddha/skills-hub/issues/32) | Amended | Add a complete Entry contract with exact artifact, external-state, authority, freshness, and recovery evidence. |
| [Deploy and verify selected Workloads on AWS](https://github.com/ironicbuddha/skills-hub/issues/33) | Amended | Add a complete Entry contract with exact artifact, OIDC, external-state, authority, freshness, and recovery evidence. |
| [Gate and verify experimental Vercel Services](https://github.com/ironicbuddha/skills-hub/issues/34) | Amended | Add a complete experimental Entry contract with pinned support evidence, entitlement/schema preflight, and upgrade metadata. |
| [Deliver interactive and automation CLI journeys](https://github.com/ironicbuddha/skills-hub/issues/35) | Amended | Add exact catalogue target selection and semantic upgrade review over the existing caller surface. |
| [Prove safety, recovery, and write-free reruns](https://github.com/ironicbuddha/skills-hub/issues/36) | Amended | Expand acceptance to evidence, authority, waiver, suppression, digest, semantic upgrade, and atomic-promotion failures. |
| [Release the successor bootstrapper and archive the old script](https://github.com/ironicbuddha/skills-hub/issues/37) | Amended | Release an immutable content-addressed catalogue with the verified engine before removing the legacy script. |
| [Publish the thin successor Skill Hub invocation skill](https://github.com/ironicbuddha/skills-hub/issues/38) | Unchanged | Skill Hub remains a thin discoverable caller and owns no catalogue or policy implementation. |
| [Archive legacy Skill Hub entry points and smoke-test Adoption Runs](https://github.com/ironicbuddha/skills-hub/issues/39) | Unchanged | Legacy-touched repositories still use ordinary Adoption with provenance established only after verification. |
| [Implement verification evidence and the acceptance reducer](https://github.com/ironicbuddha/skills-hub/issues/68) | New | Shared exact-bound evidence and four-state acceptance foundation. |
| [Implement governed waivers and managed suppressions](https://github.com/ironicbuddha/skills-hub/issues/69) | New | Shared governed weakening, lifecycle, compensating-control, and suppression foundation. |
| [Implement catalogue upgrade planning and atomic adoption](https://github.com/ironicbuddha/skills-hub/issues/70) | New | Explicit semantic review-before-adoption vertical slice over the normal lifecycle. |
| [Compose and verify the observability Capability](https://github.com/ironicbuddha/skills-hub/issues/71) | New | Atomic successor for the observability half of the replaced combined ticket. |
| [Compose and verify the public-interface Capability](https://github.com/ironicbuddha/skills-hub/issues/72) | New | Atomic successor with Interface Boundary identity and initial declared-contract/http-rest styles. |
| [Compose and verify the modular-design Capability](https://github.com/ironicbuddha/skills-hub/issues/73) | New | Independent opt-in architecture Capability with substantive review evidence. |
| [Compose and verify the domain-modeling Capability](https://github.com/ironicbuddha/skills-hub/issues/74) | New | Independent explicit-Workload-set domain Capability with substantive glossary evidence. |
| [Compose and verify the ports-and-adapters Capability](https://github.com/ironicbuddha/skills-hub/issues/75) | New | Same-Workload refinement requiring modular-design and a substantive boundary map. |
