# Account — Saved library

Stitch reference for the subscriber **Saved** page (`/account/saved`, `/saved`).

| File         | Role                                                           |
| ------------ | -------------------------------------------------------------- |
| `screen.png` | Visual target — 3-column grid, locked blur cards, bento footer |
| `code.html`  | Structure, copy, tabs, filters                                 |
| `DESIGN.md`  | Editorial system notes (map to existing tokens only)           |

## Implementation

- **Route:** `apps/web/src/account/pages/Saved.tsx`
- **DS:** `SavedPickCard`, `SavedFindMoreCard`, `AccountSavedLibraryFooter`
- **Data:** `api.savedPicks.list`, `api.followedCreators.listMine`, `api.subscriptions.mySubscriptions`
