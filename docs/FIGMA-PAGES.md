# Reconstructed Figma pages

Source: the user-supplied `iOS and iPadOS 27 (Community) (Copy).fig`, SHA-256 `6b4142e6511c9ab681eedabb3d1580213cd5aa3497a26b7de924bd197c11fff9`.

## Scope

Segmented Controls, Activity Views, Face ID, Layout Guides, Popovers, Tab Bars, Toggles and Windows. Eight page manifests compose 147 public component placements and 49 overridden instances, plus source headings and section backgrounds. Original transforms, ordering, clipping paths and explicit appearance modes are preserved. Whole-page screenshots are not implementation assets.

React exposes `FigmaPage` and Flutter exposes `KitFigmaPage`. Storybook includes both the original layout and searchable variants, plus eight snapshot stories under **Figma Pages**. The original component story IDs remain available.

## Export corrections

- Sort layers by their fractional `parentIndex.position`, so backgrounds no longer cover Face ID or tab content.
- Use Figma's `mask` property, alpha/luminance masks, and end mask scope after a clipped frame. This removes solid tint rectangles and visible red mask shapes. Scope follows [Figma's mask documentation](https://help.figma.com/hc/en-us/articles/360040450253-Masks).
- Clip to source geometry, preserving independent rounded corners and smoothing.
- Resolve variable-bound appearance variants, retaining layout and text overrides when switching masters.
- Dark native materials use the source `Backgrounds/Secondary - Elevated` token as a portable opaque fallback; black tint alone vanished on the black Dark example. This is marked `dark-material-elevated-surface-fallback`, not claimed as native backdrop equivalence.
- Apply outer instance overrides after nested defaults, and resolve text/visibility component properties, including `parameterConsumptionMap` bindings. Activity View's close/action icons and Layout Guides' hidden toolbar/status-bar layers use these bindings.
- Use a bound color's alpha once. Do not multiply the serialized cached alpha by the resolved variable alpha again.
- Preserve overflow around popover arrows, pressed toggle knobs and device bezels.
- Do not render neutral white Multiply filter stencils as opaque white surfaces. Flutter removes these stencils with the unsupported filters.
- Add content revisions to fetched assets, preventing stale previews after rebuilding at the same address.

## Validation and limits

`node scripts/test-fig-semantics.mjs` checks real rendered pixels for Face ID and mask regressions, source track alpha, nested text/visibility overrides, and the page/component references. Existing tests cover the catalogue, bezels, effects and dark menu labels. `verify-render.mjs` also renders the added layout assets. Flutter widget tests load a composed page and a masked tab asset.

Glass refraction and backdrop blur are still approximations; Flutter's SVG renderer does not reproduce SVG filters. This is not a certified pixel comparison against a current Figma server render. Chromatic compares published builds to their baselines; a linked Figma design does not establish automatic pixel equivalence. The source itself labels some Segmented Control opacity variants counterintuitively (`Is Enabled=True` has reduced opacity); these source labels and appearance are preserved.
