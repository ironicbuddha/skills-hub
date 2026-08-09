# Durable learning loops for agent operations

Research note for the Wayfinder investigation **Research durable learning loops
for agent operations**. It audits the current local mechanisms and primary
sources as of 2026-08-08. It identifies options and constraints; it deliberately
does not choose an architecture.

## Executive conclusion

The evidence supports a layered loop, not a single magical memory file:

1. capture a failure as structured, sanitized evidence;
2. turn it into a candidate lesson with provenance and an explicit recurrence;
3. require human approval before durable policy is broadened;
4. project approved lessons into the narrowest applicable instruction surface;
5. enforce mechanically where the invariant is deterministic; and
6. observe, test, supersede, or retire the lesson over time.

Each layer already has a partial local analogue. `auto-bot` makes GitHub the
durable evidence and handoff ledger; `skills-hub` supplies versioned operational
instructions and an approval-gated `heal-skill` reflection flow;
`dev-env-export` distributes environment-wide agent direction and demonstrates
structured event logs, sanitization, atomic replacement, recovery, and contract
tests. What is missing is a shared lifecycle connecting candidate capture,
approval, scoped retrieval/injection, precedence, expiry, and effectiveness
measurement.

The first recurrence case exposes why prose alone is insufficient. Passing a
Markdown comment containing backticks through a double-quoted shell argument
can execute the backticked text as command substitution. Bash specifies this
behavior; the safe boundary is to keep content out of shell source, for example
by writing an exact payload to a protected temporary file and passing its path
to a CLI option such as `--body-file`. A durable lesson can remind an agent of
that invariant, but a regression fixture or checked helper is the stronger
control.

## Concrete recurrence: Markdown backticks in a handoff comment

The failure shape is conceptually:

```bash
gh issue comment 123 --body "Run `dangerous-command` next"
```

Markdown treats the backticks as formatting, but Bash parses them first. Its
reference manual defines backquotes as the legacy form of command substitution:
the enclosed command runs and its standard output replaces the substitution
([GNU Bash, Command Substitution](https://www.gnu.org/software/bash/manual/html_node/Command-Substitution.html)).
Double quotes do not suppress `$`, backquote, or backslash processing
([GNU Bash, Double Quotes](https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html)).
The incident is therefore an interpreter-boundary failure, not a GitHub or
Markdown failure.

Evidence-backed control options, from weakest to strongest, are:

- **Reminder:** inject a scoped lesson saying that arbitrary Markdown must not
  be interpolated into shell command text. Cheap, but dependent on model
  compliance and retrieval.
- **Safe construction:** pass literal content through stdin or a file-based API,
  created with restrictive permissions and removed afterward. This avoids
  reparsing content as shell syntax. It should be expressed as an invariant,
  not as the brittle rule “escape backticks,” because `$()`, parameter
  expansion, quotes, and newlines create adjacent hazards.
- **Checked helper:** centralize tracker comment publication behind a helper
  accepting data separately from command arguments. This reduces duplicated
  quoting logic and gives enforcement a seam.
- **Regression fixture:** submit content containing backticks, `$()`, quotes,
  newlines, glob characters, and a sentinel command; assert byte-preserved
  output and that the sentinel never executes. The local `dev-env-export`
  contract tests demonstrate this exact style for secret non-disclosure and
  failure behavior
  ([npm configuration contract tests](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/tests/npm_configuration_contract_test.sh),
  [run-recorder contract tests](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/tests/run_recorder_contract_test.sh)).

## Existing local mechanisms

### `skills-hub`: versioned procedures and approval-gated reflection

- Skills are repository-versioned instruction modules, so a repaired procedure
  is reviewable, diffable, reversible through Git, and selectively loaded by
  task. The handoff skill already chooses a repository-scoped durable store,
  `.handoff/`, with a naming convention
  ([handoff skill](https://github.com/ironicbuddha/skills-hub/blob/fe22a03e6d2e20c300f0fb840eb56f3d1849f1bf/skills/handoff/SKILL.md)).
- `heal-skill` is the closest capture-and-approval loop: it detects the active
  skill, reflects on the failure, identifies root cause and impact, presents a
  before/after patch, and forbids edits until the human approves. Its weakness
  is reach: it only heals a known skill and provides no cross-skill candidate
  registry, retrieval, retirement, or effectiveness telemetry
  ([heal-skill command](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/claude/commands/heal-skill.md)).
- The debugging and TDD guidance favors one red reproducer followed by a
  regression test. This is durable enforcement for deterministic failures, but
  not a representation for contextual operational judgment
  ([diagnosing-bugs skill](https://github.com/ironicbuddha/skills-hub/blob/fe22a03e6d2e20c300f0fb840eb56f3d1849f1bf/skills/diagnosing-bugs/SKILL.md),
  [TDD skill](https://github.com/ironicbuddha/skills-hub/blob/fe22a03e6d2e20c300f0fb840eb56f3d1849f1bf/skills/tdd/SKILL.md)).

### `auto-bot`: durable operational ledger and explicit authority transfer

`auto-bot` declares GitHub the sole live progress ledger. Assignment is a claim;
handoffs must contain durable evidence, validation, risks, and an exact next
action; missing facts are treated as workflow defects. It separates reversible
agent choices from product, architectural, authorization, secret, destructive,
and high-impact decisions reserved for humans
([workflow](https://github.com/ironicbuddha/auto-bot/blob/debdf66e7ba89591c7476605e711d40c376e2aa0/wayfinder-codex-autonomous-workflow.md),
[agent rules](https://github.com/ironicbuddha/auto-bot/blob/debdf66e7ba89591c7476605e711d40c376e2aa0/AGENTS.md)).

This is a strong candidate-capture substrate because it has identity, authorship,
timestamps, comments, review state, links, and history. It is not itself a
lesson store: handoffs are case-specific, retrieval is issue-centric, and
turning one incident into general policy is deliberately outside its current
state machine.

### `dev-env-export`: projection, observability, sanitization, and regression locks

- The baseline projects concise `AGENTS.md` guidance into repositories and uses
  `CLAUDE.md -> AGENTS.md` as a single-source projection. Existing foreign files
  are preserved unless force is explicit, and contract tests lock idempotence
  and conflict behavior
  ([applicator](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/scripts/13-apply-project-standards.sh),
  [projection tests](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/tests/project_standards_contract_test.sh)).
- Bootstrap runs emit structured state and append-only events with failure class,
  code, operation, target, recovery, and log reference. This offers an
  observability pattern for learning-loop outcomes without making raw chat the
  source of truth
  ([operation policy](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/scripts/lib/operation-policy.sh),
  [run recorder tests](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/tests/run_recorder_contract_test.sh)).
- Shareable diagnostics are whitelist-derived into a mode-`0700` staging
  directory, explicitly exclude raw logs, messages, targets, paths, credentials,
  and secret-bearing arguments, then move atomically into place. This is a
  stronger model than attempting to redact arbitrary transcripts after capture
  ([shareable bundle](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/scripts/create-shareable-bootstrap-bundle.sh)).
- Managed artifacts use staging, ownership checks, backups, and restore paths;
  this supplies rollback mechanics for generated instruction projections
  ([managed artifacts](https://github.com/ironicbuddha/dev-env-export/blob/7dd0496fb1022625f17553e096ab5d8981123d14/scripts/lib/managed-artifact.sh)).

## External primary-source evidence

### Memory and reflection

Reflexion stores linguistic reflections in episodic memory and uses them to
condition later trials without changing model weights. Its results show that
feedback-derived text can improve subsequent behavior, but its memory is
self-authored and task-loop-oriented; that does not establish that autonomous
promotion into organizational policy is safe
([Shinn et al., *Reflexion*](https://arxiv.org/abs/2303.11366)).

Generative Agents stores natural-language experience, synthesizes higher-level
reflections, and retrieves memories using relevance, recency, and importance.
Its ablations support separating capture, consolidation, and retrieval rather
than dumping a complete history into every prompt
([Park et al., *Generative Agents*](https://arxiv.org/abs/2304.03442)).

Together these papers support external, selectively retrieved memory and
periodic consolidation. They do not solve truth, malicious or secret-bearing
content, human approval, precedence, expiry, or deterministic enforcement.

MemGPT adds a tiered-memory pattern: a bounded in-context tier is paged to and
from external storage. This makes context limits explicit, but memory writes,
evictions, and page-in decisions become observable policy failure points
([Packer et al., *MemGPT*](https://arxiv.org/abs/2310.08560)). Voyager shows a
different representation: an executable skill library built from environment
feedback and self-verification. Executable memory is testable and reusable, but
has a larger blast radius and must be versioned, sandboxed, applicability-scoped,
and regression-tested
([Wang et al., *Voyager*](https://arxiv.org/abs/2305.16291)). These patterns
support keeping prose lessons and executable controls linked but distinct.

### Incident learning

Google SRE treats a postmortem as a written record of impact, response, causes,
and follow-up actions. It recommends blameless system-focused analysis and
action items with owners, priorities, tracking, and verifiable end states;
otherwise incidents recur and the document becomes an archive rather than a
learning loop
([Google SRE, Postmortem Culture](https://sre.google/sre-book/postmortem-culture/),
[Google SRE Workbook, Postmortem Practices](https://sre.google/workbook/postmortem-culture/)).
This supports separating incident evidence from approved corrective controls and
tracking whether those controls shipped and worked.

### Instruction injection and enforcement

OWASP identifies persistent prompt injection and RAG poisoning as risks when
retrieved natural language mixes instructions with data. Its defenses are
layered: validate and sanitize inputs, clearly separate instructions from data,
apply least privilege, validate tool calls, monitor behavior, and retain human
approval for high-risk actions. It explicitly warns that model guardrails are
themselves fallible
([OWASP LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)).
An approved lesson store must therefore be treated as privileged policy input;
raw failure reports and external text must never graduate automatically.

OpenAI's instruction-hierarchy research treats instructions as privilege
levels and trains models to ignore lower-priority conflicts. This supports
explicit authority metadata and conflict handling for injected lessons, while
remaining a model-level mitigation rather than deterministic enforcement
([OpenAI, *The Instruction Hierarchy*](https://openai.com/index/the-instruction-hierarchy/)).

GitHub's Actions security guidance documents the same interpreter-boundary
class as the handoff incident: untrusted values interpolated into a generated
shell script can execute, and the preferred mitigation is to keep the value out
of shell source by using an action or passing it as data through an intermediate
environment variable
([GitHub Actions script injections](https://docs.github.com/en/actions/concepts/security/script-injections)).
Environment variables are not a license to use `eval` or unquoted expansion;
direct argv, stdin, file, or API-field transport is a cleaner boundary for a
multiline Markdown body.

GitHub rulesets and required status checks demonstrate deterministic,
scope-selective enforcement with explicit bypass identities. Secret push
protection demonstrates pre-write blocking, recorded bypass reasons, delegated
approval, and measurable blocked-versus-bypassed outcomes
([GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
[GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection),
[push-protection metrics](https://docs.github.com/en/code-security/concepts/secret-security/push-protection-metrics)).
These are useful governance patterns even if the eventual storage mechanism is
not GitHub.

Google SRE's reliability-testing guidance recommends converting every reported
bug into a test and running continuous builds on every submission. It also
recognizes that configuration needs validation and that break-glass paths must
be noisy and auditable
([Google SRE, Testing for Reliability](https://sre.google/sre-book/testing-reliability/)).
This supports promoting reproducible incidents beyond memory into executable
regressions and making exceptions visible rather than silently bypassed.

## Comparison across the ticket's design dimensions

<!-- markdownlint-disable MD013 -->

| Dimension | Evidence-backed mechanisms | Trade-offs and questions left open |
| --- | --- | --- |
| Candidate capture | GitHub incident/comment; structured event; agent reflection draft | Raw transcripts are rich but dangerous and noisy. Structured capture is safer but may omit causal context. |
| Human approval | `heal-skill` before/after review; PR review; delegated bypass | Approval prevents autonomous policy poisoning but adds latency and needs an owner/escalation path. |
| Representation and storage | Episodic reflection; postmortem plus action items; versioned Markdown policy; executable test | Free prose handles judgment; schemas enable retrieval/metrics; tests enforce only deterministic invariants. A candidate likely needs provenance, trigger, scope, control, tests, status, and review dates regardless of format. |
| Global vs repository scope | Environment-distributed agent direction; nested repo guidance; task-loaded skill | Global rules maximize reach and context cost/blast radius. Repo or skill scope improves relevance but risks duplication and missed recurrence. |
| Relevance retrieval | Task-triggered skills; repo hierarchy; recency/importance/relevance retrieval | Static injection is predictable but bloats context. Semantic retrieval scales but can miss exact safety rules or retrieve poisoned/conflicting text. Mandatory class-based rules and ranked contextual lessons are distinct options. |
| Context injection | `AGENTS.md`; skill loading; retrieved memory prompt | Natural-language injection is portable but probabilistic. Approved lessons must be clearly separated from untrusted incident evidence and carry authority/source labels. |
| Enforcement | Reminder; checked helper; CI regression; ruleset/status gate | Move deterministic, high-severity invariants toward code and gates. Keep prose for judgment. Bypasses need identity, reason, review, and telemetry. |
| Conflict resolution | Instruction hierarchy; narrowest-scope policy; managed-artifact foreign-file preservation | A precedence model must address global versus repo policy, newer versus older lessons, and safety versus convenience. Silent last-writer-wins is unsafe. |
| Secret sanitization | Whitelist-derived shareable bundle; 1Password references; GitHub push protection | Sanitize before durable capture where possible. Redaction after storing raw evidence leaves residual risk. False positives and bypasses require review. |
| Staleness and retirement | Version control/history; explicit supersession; review dates; retrieval recency | Git history enables rollback but does not retire injected policy. Lessons need lifecycle state and periodic/triggered review; repeated non-retrieval alone is not proof of obsolescence. |
| Rollback | Git revert; atomic projection with backups; disable a rule/bypass | Rollback must distinguish source lesson, projections, helper code, and gates. Global rollout benefits from staged/canary projection. |
| Observability | Structured events; postmortem action tracking; blocked/bypassed metrics | Useful measures include candidates, approval latency, retrievals, control hits, bypasses, false positives, recurrence, and stale lessons. Avoid storing prompts, secrets, or chain-of-thought merely for metrics. |
| Regression testing | Shell fixture; contract test; required check; periodic evaluation set | Exact shell failures suit deterministic tests. Behavioral reminders need scenario evaluations across model/tool versions, with false-positive and instruction-conflict cases. |

<!-- markdownlint-enable MD013 -->

## Viable mechanism families (not an architecture decision)

1. **Versioned lesson catalogue plus scoped projection.** Human-approved lesson
   records live in Git; a renderer projects applicable policy into global,
   repository, or skill instruction files. Strong auditability and rollback;
   requires schema, precedence, sync, retirement, and drift checks.
2. **Tracker-native incident-to-control workflow.** GitHub issues hold candidates,
   approvals, owners, and action status; approved controls land as policy or
   tests elsewhere. Strong collaboration and traceability; weaker runtime
   retrieval unless paired with projection or an index.
3. **Selective retrieval service.** Structured approved lessons are ranked by
   task, repository, tools, and risk, then injected at runtime. Better scale and
   relevance; introduces availability, privacy, poisoning, missed-retrieval,
   latency, and observability complexity.
4. **Executable guardrail library.** High-confidence recurrences become checked
   helpers, lint rules, hooks, CI fixtures, or platform rules. Strongest
   prevention and measurement; cannot encode all contextual judgment and needs
   exception governance.
5. **Hybrid promotion ladder.** Candidate evidence progresses through approved
   prose, scoped projection, and—where feasible—an executable control and
   regression. This matches SRE's separation of learning from corrective action
   and the local split between GitHub evidence, instruction modules, and
   contract tests; the design tickets must still decide its exact boundaries.

## Constraints later design work must settle

- Define the minimum candidate/lesson schema, including provenance, sanitized
  evidence, recurrence trigger, applicable scopes/tools, severity, owner,
  approval, conflicts, enforcement link, tests, version, and review/expiry data.
- Decide which safety classes are always injected and which use relevance
  retrieval, including behavior when retrieval is unavailable or ambiguous.
- Establish precedence and an explicit conflict state; do not silently merge
  contradictory instructions.
- Define promotion authority separately for repository-local and
  environment-wide lessons, plus emergency disable and staged rollout paths.
- Make sanitization a write-path boundary and retain only the minimum evidence
  needed for review. Never treat raw chat, shell output, or external content as
  approved memory.
- Pair the backtick recurrence with an exact shell regression and decide whether
  the durable control is a shared publication helper, a lint/check, or both.
- Measure recurrence and false-positive/bypass cost. A lesson that is stored but
  neither retrieved nor enforced is an archive entry, not operational learning.
