---
name: feedback_no_auto_push
description: User handles git push and deploy themselves — never auto-push
metadata:
  type: feedback
---

Do NOT run `git push` automatically after making code changes.

**Why:** User wants full control over when code is deployed to production.

**How to apply:** After making and committing changes, stop at the commit step. Tell the user what was committed and let them push manually. Never run `git push origin main` unless explicitly asked.
