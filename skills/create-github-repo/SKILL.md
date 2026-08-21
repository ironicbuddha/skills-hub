---
name: create-github-repo
description: Create an empty GitHub repository in a specified organization from a repository name and visibility. Use for new remote repositories, not for importing or pushing an existing local repository.
---

# Create GitHub Repository

Create exactly one empty remote repository from these required inputs:

- `repository`: the new repository name, without an owner or `/`
- `visibility`: `public`, `private`, or `internal`
- `organization` (or `organisation`): the GitHub organization login, not a URL

Accept the fields in natural language or as labels, for example:

```text
repository: audit-api
visibility: private
organisation: example-org
```

If a required field is missing or ambiguous, ask only for that field. Normalize capitalization, but do not infer or substitute an organization, repository name, or visibility. `internal` is valid only where GitHub supports it; never fall back to another visibility.

## Preflight

Use the installed GitHub CLI (`gh`). Before seeking creation confirmation:

1. Confirm `gh` is available and authenticated with `gh auth status`.
2. Confirm the organization resolves with `gh api "orgs/<organization>"`.
3. Check `gh repo view "<organization>/<repository>"` for a collision. If it succeeds, stop and report the existing repository. If it fails, continue only when the failure is GitHub's not-found response; treat authentication, authorization, network, and other failures as blockers.

These checks are read-only. Do not change authentication, organization settings, or permissions.

## Confirmation and creation

Immediately before the external mutation, show this summary using the resolved values:

```text
Target: <organization>/<repository>
Visibility: <visibility>
Initialization: empty
```

Ask the user to reply with exactly `confirm`. Do not create the repository until that confirmation is received for this summary.

After confirmation, run one non-interactive command with the matching literal visibility flag:

```bash
gh repo create "<organization>/<repository>" --public
gh repo create "<organization>/<repository>" --private
gh repo create "<organization>/<repository>" --internal
```

Run only the one command corresponding to the requested visibility. Do not add a README, license, `.gitignore`, description, template, clone, local remote, source import, or push unless the user explicitly expands the request.

## Verification

Verify the result with:

```bash
gh repo view "<organization>/<repository>" --json nameWithOwner,visibility,url
```

Compare `nameWithOwner` and `visibility` with the confirmed inputs, then report the repository URL. If creation returns an error or an ambiguous result, inspect the repository once before doing anything else. Do not retry creation automatically; report the exact observed state and error so the user can decide the next action.
