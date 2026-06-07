---
description: Install dependencies, verify environment, and start MMS dev servers
---

# Workflow: Dev Setup

## Steps

1. Load skill: `mms-dev-setup`
2. Run environment check:
   ```bash
   bash .agents/skills/mms-dev-setup/scripts/verify-env.sh
   ```
3. Install and typecheck:
   ```bash
   pnpm install && pnpm typecheck
   ```
4. Start servers (choose one):
   ```bash
   pnpm dev
   # OR
   ./restart_servers.sh
   ```
5. Confirm:
   - Backend: `curl http://localhost:3000/health`
   - Frontend: http://localhost:5173

## Rules

`rules/mms-ops.md`, `rules/mms-core.md`
