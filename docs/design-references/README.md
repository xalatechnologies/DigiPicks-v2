# Design references (Stitch exports)

Product design arrives as **Stitch zip** bundles per feature. Each zip typically contains:

- `screen.png` — screenshot reference
- `code.html` — exported markup (structure + copy, not for copy-paste styling)
- `DESIGN.md` — narrative design rules

## How engineering uses them

See **`.cursor/rules/stitch-design-references.mdc`** and **`AGENTS.md`** (Reusable-Component Doctrine).

**Summary:** implement **layout, copy, and functionality** using `@digipicks/ds` and **existing tokens only**. Do **not** change `packages/tokens` to match Stitch palette values.

## Archiving a new reference

When you receive a zip, add a folder here:

```text
docs/design-references/<feature-slug>/
  screen.png
  code.html
  DESIGN.md
```

Example slug: `homepage`, `creator-apply`, `creator-dashboard`.

## Known references

| Slug            | Source                                      | Notes                                                                                              |
| --------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `creator-apply` | `stitch_edgepicks_homepage_design (55).zip` | **Implemented** at `/apply` — `Apply.tsx` + DS `SplitPageLayout`, `ProcessSteps`, `FileUploadZone` |
