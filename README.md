# Skill Hub

Skill Hub is Carlo Kruger's public, cloneable catalogue of authored agent skills and a macOS/zsh bootstrap for selected installations. It keeps third-party repositories as pinned, ignored local Source checkouts rather than republishing their files or Git histories.

The Hub's own content is licensed under [MIT](LICENSE). Every Source keeps its own license; `sources.json` records its clone URL, pinned commit, license identifier, and license-file evidence.

## Install a profile

Download the repository ZIP or clone it, then from its root run a named profile:

```zsh
./scripts/bootstrap --profile carlo-baseline
```

The v1 support boundary is macOS running zsh. Bootstrap requires `git` and macOS `plutil`; it restores only Sources needed by the selected profile at their exact pinned revisions, then creates selected skill symlinks under `AGENTS_HOME` (default `~/.agents`) and projects that directory to the selected Claude and Codex roots. It never installs prerequisites silently.

Use `--no-input` for automation-safe setup. `--replace` is intentionally narrow: it can replace only a link previously recorded as Hub-managed. Existing files, directories, and foreign symlinks are conflicts left untouched. A run can finish `INCOMPLETE` after applying independent valid work; its nonzero status and per-item messages identify what to fix.

`carlo-baseline` installs 45 selected skills under `AGENTS_HOME` (default `~/.agents`): 44 authored skills in `skills/` plus the reviewed third-party `wizard` skill. Its `CLAUDE_HOME` (default `~/.claude`) and `CODEX_HOME` (default `~/.codex`) skill roots are directory links to that canonical projection. Third-party Source skills are exposed only through a reviewed manifest mapping and profile selection.

## Source updates

Normal bootstrap never advances a pin. Source revisions move through a reviewable two-step workflow:

```zsh
./scripts/source-update propose matt-pocock
./scripts/source-update apply matt-pocock --revision <full-40-character-sha>
```

`propose` validates the candidate revision and prints the exact manifest diff without changing it. `apply` requires a full lowercase SHA, revalidates the source's license evidence and any exposed skill paths, then changes only that one manifest pin. Run bootstrap afterward to restore the new pin.

## Public boundary

`sources/`, `.hub-state/`, planning artifacts, backups, local configuration, credentials, and unprovenanced material are ignored. A Source manifest entry is not an authorization to publish that Source; it only authorizes a local clone at its declared revision.

The first public candidate remains untagged. A v1 tag or release is blocked until Carlo confirms the fresh macOS/zsh VM acceptance run and completes the redacted record in [docs/first-release-acceptance-record.md](docs/first-release-acceptance-record.md).
