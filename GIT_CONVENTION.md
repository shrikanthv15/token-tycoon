# Git convention — token-tycoon (Shrikanth's order, 2026-10-04)

Every commit to shrikanthv15/token-tycoon follows this:

- **Author**: the agent/person who did the work (their own name, e.g. `Kratos Muse`).
- **Committer**: `shrikanthv15 <shrikanthv15@users.noreply.github.com>` — so GitHub shows it committed by him.
- **Trailer**: `Co-authored-by: shrikanthv15 <shrikanthv15@users.noreply.github.com>`

Command:

```
git -c user.name="<Agent Name>" -c user.email="<agent>@twoby2.dev" \
    -c user.committer... # (use --author + committer env instead)
```

Reliable form:

```
GIT_COMMITTER_NAME="shrikanthv15" \
GIT_COMMITTER_EMAIL="shrikanthv15@users.noreply.github.com" \
git commit --author="<Agent Name> <agent@twoby2.dev>" \
    -m "<message>" -m "Co-authored-by: shrikanthv15 <shrikanthv15@users.noreply.github.com>"
```

Push auth: this VM has no GitHub auth. The fine-grained PAT lives on
agents-01 at /home/hermes/.git-credentials (0600). Copy it to a local
0600 file and point git at it:

```
ssh -S /home/hatch/.ssh/mux_agents01 agents-01 'cat /home/hermes/.git-credentials' > ~/.ssh/gh_token_store
chmod 600 ~/.ssh/gh_token_store
git config credential.helper 'store --file=/home/hatch/.ssh/gh_token_store'
```

Never print the token. Never commit it.
