---
name: instantiate-new-project
description: Create an empty GitHub repository, clone it to an explicitly chosen local path, and configure the checkout for Wayfinder and related engineering skills. Use for a brand-new GitHub project, or to resume this orchestration after a partially completed run; do not use to adopt an unrelated existing repository.
---

# Instantiate New Project

Create the remote and local project boundary before configuring the repository's
agent workflow. This skill composes two interactive skills; it does not replace
or bypass either skill's questions, confirmations, or stopping conditions.

## Required skill chain

Read and follow both prerequisite skills:

1. [`create-github-repo`](../create-github-repo/SKILL.md)
2. [`setup-matt-pocock-skills`](../setup-matt-pocock-skills/SKILL.md)

Run remote creation and verification first. Run repository setup only after the
verified remote has been cloned successfully.

## Establish the target

Collect the inputs required by `create-github-repo`: repository name,
visibility, and GitHub organization. Also establish one explicit local
destination path for the clone.

If the destination is missing, ask for it before remote creation. Recommend
`<current-directory>/<repository>` only when the current directory is clearly
the intended project parent. Resolve the path and show it to the user; do not
invent a home or development root. The destination must not already exist.

Ask only for unresolved inputs, one at a time. Do not create a directory,
initialize Git, clone, or write setup files while collecting them.

## Create the remote

Run `create-github-repo` with the resolved organization, repository, and
visibility. Preserve its read-only preflight, exact `confirm` gate, empty-repo
creation command, and verification step.

If the repository already exists or creation is not verified, stop. Do not
adopt the collision, retry creation, clone it, or proceed to setup.

## Clone the verified repository

After creation is verified, clone exactly that repository to the agreed
destination:

```bash
gh repo clone "<organization>/<repository>" "<destination>"
```

This clone is authorized by the user's invocation of this orchestration skill;
it is deliberately outside the narrower `create-github-repo` skill.

Verify that:

- the destination is the Git worktree root;
- `origin` identifies the verified `<organization>/<repository>` remote; and
- the worktree contains no unexpected files.

If cloning or verification fails, inspect the remote and local path once, then
stop with the repository URL, observed local state, and exact failure. Do not
retry, delete the remote, remove the destination, or silently choose a new path.

## Configure the checkout

Treat the cloned destination as the active repository root and run
`setup-matt-pocock-skills` there. Do not configure the Skill Hub checkout or
the parent directory.

Preserve the setup skill's interaction exactly:

- explore the new checkout before proposing configuration;
- ask its issue-tracker, optional PR-surface, triage-label, and domain-layout
  decisions one at a time;
- let the GitHub remote inform a recommendation, but do not answer any decision
  for the user;
- show the complete draft and obtain its approval before writing; and
- follow its `CLAUDE.md` versus `AGENTS.md` selection rule.

Do not scaffold an application, apply a project-standards profile, create
GitHub labels, or push commits. Those are separate workflows unless the user
explicitly requests them.

## Resuming and completion

For a partial run, inspect both the named GitHub repository and agreed local
destination before acting. Never recreate or reclone completed phases. Continue
from the first incomplete phase only when the earlier phase is evidenced in the
current conversation or the user explicitly asks to resume that exact project.

The orchestration is complete only when remote creation, local clone, and the
setup skill's writes are each verified. Report the GitHub URL, local path,
created setup files, and which later skills can now consume the configuration.
