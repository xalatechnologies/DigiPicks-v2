# Account — Discover

Stitch reference for the subscriber **Discover** page (`/account/discover`).

| File         | Role                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `screen.png` | Visual target — hero search, sort pills, featured rail, explore grid |
| `DESIGN.md`  | Editorial system notes (map to existing tokens only)                 |

Zip (70) did not include `code.html`; layout follows the same pattern as `docs/design-references/creators-directory/` (“Find your edge.”).

## Implementation

- **Route:** `apps/web/src/account/pages/Discover.tsx`
- **DS:** `CreatorsDirectoryHero`, `CreatorsHorizontalRail`, `CreatorFeaturedCard`, `CreatorDirectoryCompactCard`, `CreatorExploreCard`, `ActivityFeed`, `CreatorsPromoCard`
- **Data:** `api.creators.list`, `api.creators.promoted`
