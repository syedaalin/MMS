# MMS Project Skills

Agent skills for Cursor and Antigravity. Cursor discovers these from `description` frontmatter; Antigravity reads `.agent/skills/` (symlink → `.agents/skills/`).

**Antigravity:** start with [antigravity-workspace](antigravity-workspace/SKILL.md). Manifest: [.agents/skills-manifest.json](../.agents/skills-manifest.json)

## Skills index

| Skill | Use when |
|-------|----------|
| [antigravity-workspace](antigravity-workspace/SKILL.md) | Antigravity orientation, rules/skills sync |
| [mms-dev-setup](mms-dev-setup/SKILL.md) | Install, run servers, env, typecheck |
| [mms-module-page](mms-module-page/SKILL.md) | New module or three-tier page layout |
| [mms-contacts](mms-contacts/SKILL.md) | Contact CRM, forms, WhatsApp |
| [mms-fields-registry](mms-fields-registry/SKILL.md) | Custom fields, tabs, column registry |
| [mms-data-sync](mms-data-sync/SKILL.md) | db.ts, localStorage, API sync |
| [mms-auth-users](mms-auth-users/SKILL.md) | Login, JWT, users, RBAC |
| [mms-shared-package](mms-shared-package/SKILL.md) | `@mms/shared` types and utils |
| [mms-backend-api](mms-backend-api/SKILL.md) | Fastify routes and services |
| [mms-reports-export](mms-reports-export/SKILL.md) | Analytics, charts, PDF/Excel |
| [mms-migration-fixes](mms-migration-fixes/SKILL.md) | Known tech debt from migration-status |
| [mms-code-review](mms-code-review/SKILL.md) | PR / change review against MMS standards |

## Rules vs skills

| Layer | Location | Behavior |
|-------|----------|----------|
| **Rules** | `.cursor/rules/*.mdc` | Auto-applied (always or by glob) |
| **Skills** | `.cursor/skills/*/SKILL.md` | Invoked when description matches task |

Always-on rules: `antigravity-global`, `mms-core`, `mms-migration-status`.

## Verify setup

```bash
bash .cursor/skills/mms-dev-setup/scripts/verify-env.sh
pnpm install && pnpm typecheck
```

## Antigravity mirror

Identical skills in `.agents/skills/`. Workflows in `.agents/workflows/`. Rules in `.agents/rules/`.
