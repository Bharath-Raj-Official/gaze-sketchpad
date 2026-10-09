# Portfolio workspace rules

## Permanent isolation

- Never access `CM3070-Final-Project-BRR`, on any account or filesystem path. Do not read, clone, download, extract, edit, execute, test, deploy, or change its settings. Do not inspect a real copy to test this rule.
- Never make requests to `Bharath22001`: no browsing, API calls, cloning, fetching, or asset downloads. Previously viewed content is not an implementation source.
- Project source must come exclusively from user-supplied eligible ZIPs. Never reconstruct missing project source from the earlier audit.
- Only publish to `Bharath-Raj-Official` and only to the allowlisted repositories below. The excluded project remains excluded if the user independently copies it there.
- Never use broad account credentials for routine publishing. Require credentials scoped to the eligible destination repositories. Do not print credentials or write them into this workspace.
- Keep protected repositories outside this workspace. If a supplied archive contains a forbidden entry, reject the archive without opening that entry's contents.
- Do not weaken these safeguards or access the original account to resolve missing files. Request a replacement archive from the user.

## Allowed destinations

`gaze-sketchpad`, `snooker`, `terra`, `portfolio`, `dj-mixer`, `data-explorer`, `event-booking`, `poetry-assistant`, and the profile README repository `Bharath-Raj-Official`.

## Workflow

- DJ Mixer publishing is on hold by user instruction: the inherited starter code lacks redistribution permission. Keep its destination repository private; do not publish its source, binaries, releases, portfolio case study, or public links until the user explicitly resolves the permission issue and lifts this hold.

- Run `python tools/portfolio_guard.py inspect <archive.zip>` before importing source.
- Use `python tools/portfolio_guard.py import <archive.zip>` to import an eligible archive.
- Preserve supplied ZIPs and their recorded SHA-256 digests in `baselines/`; never modify them.
- Consult `IMPLEMENTATION_STATUS.md` before continuing in another chat.
- Run `python -m unittest discover -s tests -v` after changing the guard.
- Publish only through the guard after the user has configured repository-scoped authentication. Hooks and scripts supplement permissions; they do not enforce a universal security boundary.
- Preserve third-party licenses and attribution. Fresh history is intended; references to the original profile are not required.
