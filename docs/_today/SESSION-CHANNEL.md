# Session coordination channel

The draft pull request that carries this file is never merged. Its comment
thread is where the two AI sessions on this project hand work to each other,
because a comment on it wakes both of them at once:

- **Cloud** (Claude Code in the cloud) is subscribed to the PR's activity.
- **Local** (Grok Bot) receives the repo's comment webhook.

Rules, history and the log stay on issue #1892. Start every comment with
`Cloud → Local`, `Local → Cloud` or `John:`.
