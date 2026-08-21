---
name: instantiate-new-project
description: Create an empty GitHub repository, establish it locally by cloning into a new path or initializing an explicitly chosen existing non-Git project directory, and configure it for Wayfinder and related engineering skills. Use for a brand-new GitHub project, or to resume this orchestration after a partially completed run; do not use to adopt an unrelated or already Git-managed repository.
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
verified remote has been established successfully as `origin` at the local
target.

## Establish the target

Collect the inputs required by `create-github-repo`: repository name,
visibility, and GitHub organization. Also establish one explicit local target
and one of these modes:

- **New clone** — clone the empty remote into a destination that does not exist.
- **Existing project directory** — initialize an existing directory whose
  current contents the user explicitly intends to make the new project.

If the target or mode is missing, ask before remote creation. Recommend the
current directory only when the user says to use it or it is clearly the
intended existing project. Recommend `<current-directory>/<repository>` only
when the current directory is clearly the intended project parent. Resolve the
path and show it to the user; do not invent a home or development root.

Inspect the resolved target before remote creation. A new-clone destination
must not exist. An existing project target must be a directory and must not be
a Git worktree, a directory inside another worktree, or contain a `.git` entry.
List its current contents so later verification can distinguish them from
changes made by this workflow. If any of these checks fail, stop rather than
adopting or nesting a repository.

Ask only for unresolved inputs, one at a time. Do not create a directory,
initialize Git, clone, or write setup files while collecting them.

## Create the remote

Run `create-github-repo` with the resolved organization, repository, and
visibility. Preserve its read-only preflight, exact `confirm` gate, empty-repo
creation command, and verification step.

Alongside the creation summary, show the resolved local mode and path so the
exact `confirm` also covers how the verified remote will be established locally.

If the repository already exists or creation is not verified, stop. Do not
adopt the collision, retry creation, establish it locally, or proceed to setup.

## Establish the local repository

After creation is verified, perform only the selected local mode.

For **new clone**, clone exactly that repository to the agreed destination:

```bash
gh repo clone "<organization>/<repository>" "<destination>"
```

This clone is authorized by the user's invocation of this orchestration skill;
it is deliberately outside the narrower `create-github-repo` skill.

For **existing project directory**, initialize the agreed target with `main` as
the initial branch and add only the verified repository as `origin`:

```bash
git -C "<target>" init -b main
git -C "<target>" remote add origin "https://github.com/<organization>/<repository>.git"
```

This initialization is authorized only after the user explicitly selects the
existing project directory. Do not stage its files, create a commit, or push.

For either mode, verify that:

- the agreed local target is the Git worktree root;
- `origin` identifies the verified `<organization>/<repository>` remote; and
- the workflow did not add or alter unexpected files. In existing-directory
  mode, the pre-existing project files should remain unmodified and only the
  `.git/` metadata should be new.

If local establishment or verification fails, inspect the remote and local path
once, then stop with the repository URL, observed local state, and exact
failure. Do not retry, delete the remote, remove the destination or `.git/`, or
silently choose a new path.

## Configure the checkout

Treat the established local target as the active repository root and run
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
target before acting. Never recreate, reclone, or reinitialize completed phases.
Continue from the first incomplete phase only when the earlier phase is
evidenced in the current conversation or the user explicitly asks to resume
that exact project.

The orchestration is complete only when remote creation, local establishment,
and the setup skill's writes are each verified. Report the GitHub URL, local
path and mode, created setup files, and which later skills can now consume the
configuration.
