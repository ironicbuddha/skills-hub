---
name: apply-project-standards
description: Interactively establish a new project's standards and scaffold only after the user approves the target, profile, and operating boundaries. Use when the user wants Carlo's project baseline applied to a new or existing repository.
---

# Apply Project Standards

Set up a project deliberately. This skill helps the user choose the smallest
useful standards baseline, records the decisions that shape the project, and
only then scaffolds or applies files.

Do not treat a profile as a substitute for understanding the project. Do not
silently select a stack, deployment target, or repository location.

## When To Use This Skill

Use this skill when the user wants to:

- start a repository with Carlo's engineering baseline;
- add the baseline to an existing repository;
- create a standards-only repository before application work begins; or
- choose a project-standards profile before scaffolding.

## Principles

- Inspect before changing anything. Read the target's `AGENTS.md`,
  `CONTEXT.md`, README, existing manifests, and git state when they exist.
- Ask one recommendation-led question at a time. Prefer repository evidence
  over questions whose answers can be discovered locally.
- State the recommended default and why; wait for the user's answer before
  asking the next question.
- Keep the first scaffold narrow and verifiable. Do not add authentication,
  databases, deployment automation, or product features unless they are in
  the agreed setup contract.
- Preserve existing work. Never overwrite, reformat, reset, or replace an
  existing configuration without explicit approval of the exact conflict.
- Use the project's existing generator or approved starter when available.
  Do not assume a `dev-env-export` checkout or a helper-script path exists.

## Workflow

### 1. Orient without scaffolding

Identify the target repository and whether it is new, empty, or established.
Inspect its existing instructions and configuration before proposing a profile.
For an existing repository, report the files the standards work could touch
and any likely conflicts.

If the target path, project purpose, or new-versus-existing status is not
clear from the request and local evidence, ask the first question:

> What project are we setting up, and should I treat the target as a new
> repository or an existing codebase? I recommend starting with a new,
> explicitly named target when no repository is already in scope.

Do not create a directory, initialize Git, run a generator, or write a file
in this step.

### 2. Discover the setup contract interactively

Work through only the questions that remain unresolved. Ask them one at a
time, waiting for each answer.

1. **Project shape.** Recommend one profile based on the stated product and
   current repository evidence:
   - `markdown-docs` for a documentation-only repository;
   - `typescript-nextjs` for a Next.js web product;
   - `astro` for a content-focused or mostly static site;
   - `python` for a Python service, tool, or data workflow; or
   - `hybrid-nextjs-python` when a Next.js product and Python runtime are
     both first-class from the start.
2. **Delivery boundary.** Ask whether the first slice is standards-only or
   should include a runnable application skeleton. For a new, unclear idea,
   recommend standards-only initialization so product and architecture choices
   can be specified before feature work.
3. **Operating boundaries.** Ask only for commitments that change the
   baseline: deployment target, authentication or sensitive data, external
   services, and whether a public repository is intended. Recommend deferring
   undecided integrations and keeping secrets out of the repository.
4. **Workflow artifacts.** Confirm whether the repository should start with
   Carlo's spec-first operating artifacts: `AGENTS.md`, `CONTEXT.md`, a
   tracker convention, and a handoff convention. Recommend including them
   for ongoing agent-assisted work, but adapt to any established repository
   conventions.

Turn the answers into a short setup contract: target, selected profile,
new/existing state, initial scope, explicit exclusions, files likely to be
created or merged, and verification commands.

### 3. Request scaffold approval

Show the setup contract and ask one final, explicit approval question before
making changes:

> The proposed first slice is: `<summary>`. Shall I scaffold/apply these
> standards now? I recommend this narrow slice because `<reason>`.

Do not scaffold when the user has not explicitly approved. If the user changes
an answer, update the contract and ask for approval again.

### 4. Apply the agreed baseline

Use an approved project-local generator or standards helper when one is
available. Otherwise create only the files named in the approved setup
contract, using the selected profile as a guide.

For an existing repository:

- run the helper's preview or dry-run mode first when it offers one;
- report each planned merge or conflict before writing it; and
- require exact approval before replacing an existing file.

For a new repository, establish only the agreed foundation. A
standards-only initialization may create the repository metadata, documented
operating conventions, quality tooling, and minimal verification surface, but
must not pretend an application has been scaffolded.

### 5. Verify and hand off

Run the verification commands named in the setup contract. At minimum, check
the created files, Git status, and the profile's configured quality commands
when they are available. Distinguish passing focused checks from checks that
were unavailable or not yet applicable.

Report:

- the selected profile and agreed scope;
- files created, merged, skipped, or requiring manual review;
- verification results and any remaining setup work; and
- the recommended next workflow, such as `$to-spec` for an application idea
  or `$implement` for an accepted, bounded implementation slice.

## Guardrails

- Never default to TypeScript merely because the project is new.
- Never use `--force` or equivalent overwrite behavior without the user's
  explicit approval after reviewing the affected paths.
- Never copy credentials, cloud profiles, personal configuration, or a master
  `.env` into the target repository.
- Treat an existing repository's instructions and conventions as authoritative
  unless the user explicitly asks to change them.
