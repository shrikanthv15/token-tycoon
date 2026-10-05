# Nebius Hackathon Submission Checklist

This document enumerates every requirement for the Devpost submission of **Nebius** (Token Tycoon) and tracks ownership and status.

| Item | Description | Owner | Status |
|------|-------------|-------|--------|
| Demo URL | Publicly accessible URL to the live demo (GitHub Pages or hosted) | Shrikanth | ☐ |
| 3‑minute video | YouTube video showcasing gameplay and Token Factory integration | Shrikanth | ☐ |
| Public repo | GitHub repository `shrikanthv15/token-tycoon` (already public) | Shrikanth | ✅ |
| License | Open source license file (`LICENSE`) in repo | Shrikanth | ✅ |
| README | Repo README with project description, install/run instructions, and link to Devpost | Shrikanth | ✅ |
| Prior‑work disclosure | Mention any prior work or assets used (e.g., Kenney UI pack) | Shrikanth | ✅ |
| Token Factory feedback | Brief note on experience using Nebius Token Factory API (including credit codes) | Shrikanth | ☐ |
| Track selection | Specify the chosen track on Devpost (e.g., *Infrastructure*) | Shrikanth | ✅ |
| Credits | Include credit codes `NEBIUS‑DEVPOST‑GLOBAL26` and Builders Program acknowledgment | Shrikanth | ☐ |
| City‑winner ruling | Document that the award is attendance‑gated, not residence‑gated (Dallas ineligible) | Shrikanth | ✅ |

## Token Factory Setup Note

1. Shrikanth will obtain the Nebius API key (`NEBIUS_API_KEY`).
2. Once the key is available, add it to the Vercel environment variables for the **PAN‑53** deployment under the variable name `NEBIUS_API_KEY`.
3. Verify the integration by running a test call (see `docs/token-factory-test.md`).

## How to Verify Completion

- Ensure all checkboxes are marked ✅ in the table above.
- Commit this file to `docs/hackathon-submission.md` following the project's Git convention (author *mimir*, committer *shrikanthv15*, Co‑authored‑by trailer).
- Push to the `main` branch.
- Include the commit hash and the output of `git ls-remote origin` in the closing comment of the Kanban card for verification.
