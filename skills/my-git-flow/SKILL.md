---
name: my-git-flow
description: Finish the current session's Git work by running and fixing the repository's pre-commit checks, committing only relevant files, pushing the current branch to origin, and conservatively pruning stale branches. Use when the user asks to complete or ship their current local Git changes; do not use for releases, force-pushes, or publishing unrelated work.
---

# My Git Flow

Take the current session's completed work from dirty checkout to a verified
commit on `origin`, while preserving every unrelated change.

## Authorization

Do not mutate files, the index, commits, remotes, or branches merely because
this skill was selected implicitly. A direct `$my-git-flow` invocation with no
narrower instruction authorizes the full workflow below. Otherwise, proceed
only when the user's current request explicitly authorizes the requested
stage, commit, push, and prune operations; ask for confirmation immediately
before the first unauthorized mutation.

This workflow never authorizes force-pushing, deleting remote branches,
bypassing hooks, amending an existing commit, or discarding work.

## Establish the commit boundary

1. Read the repository's applicable agent instructions and inspect its Git
   root, current branch, worktrees, `origin`, upstream, status, staged diff,
   unstaged diff, and untracked files. Fetch only when needed to refresh remote
   state.
2. Build the relevant-file set from files created or changed for the active
   session and files the user explicitly named. A nearby dirty file is not
   relevant merely because it is in the same repository.
3. Inspect each relevant diff. Exclude generated, secret, credential, cache,
   build, and editor artifacts unless the repository contract intentionally
   tracks them.
4. Before changing anything, state the relevant-file set, current branch,
   planned check entrypoint, proposed commit message, push destination, and
   pruning rule. If relevance is ambiguous, ask the user instead of guessing.

Preserve unrelated staged and unstaged work. If unrelated paths are already
staged, do not commit until the user resolves or explicitly includes them;
never hide them with reset, stash, or a temporary index. Do not switch or
create branches unless the user asks.

## Run and repair pre-commit checks

Discover the repository's real pre-commit contract from its instructions,
configured hooks, package scripts, task runner, and pre-commit framework. Do
not install or invent a new hook setup; use `setup-pre-commit` for that separate
request.

Stage only the relevant paths with pathspec-safe commands so staged-file hooks
see the intended commit. Prefer the configured Git hook entrypoint, such as
`git hook run pre-commit`, when available. Otherwise invoke the repository's
declared pre-commit framework or documented equivalent. Also run
`git diff --cached --check`.

When a check fails:

- diagnose the failure and fix it only in the relevant-file set;
- re-inspect the diff, restage those paths, and rerun the complete pre-commit
  contract;
- continue until it passes or a genuine blocker requires user input;
- never use `--no-verify`, weaken a check, or expand into unrelated cleanup.

Some hooks rewrite files. After every run, inspect status and both staged and
unstaged diffs. Do not stage a hook-created change outside the relevant set.
Stop if a safe fix requires altering unrelated user work. Treat unavailable,
skipped, or incomplete checks as such, never as passed.

## Commit and push

Inspect the final staged diff and confirm it contains exactly the relevant
files, contains no evident secrets, is non-empty, and still matches the user's
request. Infer a concise commit message from that diff unless the user supplied
one or the repository requires a convention.

Commit normally so the hook runs again. If the commit fails, repair only an
in-scope cause and rerun the checks; otherwise stop with the exact blocker.
Never amend an existing commit as part of this flow.

Push the new commit without force to `origin` on the current branch. Use the
existing upstream when correct; otherwise establish it with an ordinary
`git push -u origin HEAD`. Do not substitute another remote silently. If the
push is rejected, fetch and diagnose, but do not rewrite history, merge,
rebase, or force-push without new user direction.

Verify that `origin` reports the pushed branch at the new commit before branch
cleanup.

## Prune stale branches

Run `git fetch origin --prune` to remove obsolete remote-tracking references.
Resolve the remote default branch from `origin/HEAD`; do not assume its name.

A local branch is eligible for deletion only when all of these are true:

- it is not the current branch or the local/remote default branch;
- it is not checked out in any worktree;
- its configured upstream is reported gone;
- its tip is fully merged into the remote default branch; and
- ordinary `git branch -d` accepts it.

Show the exact eligible names before deletion. Delete only those candidates
with `git branch -d`. Never use `-D`, delete a remote branch, or delete an
unmerged, protected, ambiguous, or worktree-bound branch. No candidates is a
successful no-op.

## Report the result

Report the commit SHA and subject, pushed ref, checks run and their outcomes,
files committed, pruned remote-tracking refs, local branches deleted or
retained, and final Git status. Call out all remaining unrelated changes and
any unavailable verification.
