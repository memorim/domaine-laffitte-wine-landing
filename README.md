# Domaine Laffitte — Wine Landing

A responsive editorial landing page built from an existing Figma concept. Three wine states share one carousel, with calibrated bottle geometry and a fully interactive circular Next button.

[Live website](https://memorim.github.io/domaine-laffitte-wine-landing/) · [Original Figma](https://www.figma.com/design/jJ4Elc8tU9uAWlCB61WZYU/) · [Checks](https://github.com/memorim/domaine-laffitte-wine-landing/actions)

![Desktop: the white wine collection](docs/desktop.png)

## What works

- Three wine states: Colombard Sauvignon, Malbec and Rosé, with coordinated colours, labels, prices and next-bottle previews.
- Consistent **visible bottle height and baseline**, including the preview bottle. No stretching to a common width.
- Full circular hover/focus treatment. The adjacent decorative rail never acts as a button.
- Direct wine selection, keyboard arrows, Home/End and rapid consecutive switching.
- A local collection with quantities, totals, removal and persistence; malformed or blocked browser storage is handled.
- Mobile navigation, real section links, a native modal dialog, focus restoration, live announcements and reduced-motion support.
- Desktop and mobile layouts from 320px upward. Images and fonts are served locally.

| Desktop: Malbec                 | Desktop: Rosé                  |
| ------------------------------- | ------------------------------ |
| ![Malbec](docs/desktop-red.png) | ![Rosé](docs/desktop-rose.png) |

| Mobile                            | Selection                                      |
| --------------------------------- | ---------------------------------------------- |
| ![Mobile layout](docs/mobile.png) | ![Mobile selection](docs/selection-mobile.png) |

## The two original problems

### Bottle size

Equal image rectangles did not mean equal bottle sizes. The exported 218 × 742 PNGs have different transparent bounds:

| Bottle              | Alpha bounds: left, top, right, bottom | Visible height |
| ------------------- | -------------------------------------- | -------------- |
| Colombard Sauvignon | 4, 7, 199, 729                         | 722px          |
| Malbec              | 19, 53, 186, 698                       | 645px          |
| Rosé                | 15, 17, 208, 736                       | 719px          |

`bottle()` in [app.js](app.js) derives each image's scale and offset from those bounds. The common CSS container represents the visible bottle, rather than the PNG canvas. Width follows the bottle's own aspect ratio; height and baseline remain fixed. This preserves the original exported files without raster editing. If an asset is replaced, its bounds must be measured again.

### Partial hover / inconsistent interaction

The circle is a single semantic `<button>` with its own background, border radius and focus state. Its label and arrow have `pointer-events: none`; the decorative rail has no click handler. Carousel state changes synchronously, and animation never blocks input. CSS handles reduced motion.

## Stack and structure

Plain HTML, CSS and JavaScript modules. No runtime dependencies, framework, bundler, API or database is needed for this page.

```text
index.html              Semantic content and native dialog
styles.css              Responsive layout, themes, interaction states
app.js                  Carousel, calibrated images, local collection
assets/                 Original Figma exports and self-hosted OFL fonts
server.mjs              Loopback-only development server
tests/landing.spec.js   Browser regression checks
capture.mjs             Reproducible screenshots of the running page
```

## Run locally

Use Node **24.18.0** (see `.node-version`) and pnpm **11.7.0**.

```sh
pnpm install --frozen-lockfile
pnpm dev
# http://127.0.0.1:4184
```

There are no secrets, environment files or migrations. Optional `PORT` changes the local preview port. The development server exposes only the page and its assets, and listens on loopback.

The website itself is static: deploy `index.html`, `styles.css`, `app.js` and `assets/` to any static host. All asset paths are relative, including on GitHub Pages.

## Verification

```sh
pnpm check
pnpm format:check
pnpm exec playwright install chromium firefox webkit
pnpm test
pnpm audit --audit-level=high
```

The same nine behavioural checks run in Chromium, Firefox and WebKit. They cover geometry through a complete carousel cycle; circular hit targets and hover; rapid input and keyboard selection; collection arithmetic and persistence; invalid and unavailable storage; responsive overflow/collisions; menu/dialog focus; and local asset serving. CI fails on failed checks and publishes browser traces on failure. Automated widths are 320, 375, 390, 768, 1024 and 1440px.

To regenerate the real interface screenshots:

```sh
pnpm capture
```

See [verification notes](docs/VERIFICATION.md) for the checks actually run and their environment.

## Scope

This is an independent portfolio interface, not the producer's official website. Product names, bottle artwork and reference prices come from the supplied design; prices are not a current commercial offer. The collection is stored on the visitor's device; it does not submit an order, accept payment or reserve a tasting. Producer links leave the project for the external estate website. No account, analytics or tracking cookies are used.

The first wine and page content remain available without JavaScript; switching and the saved collection require JavaScript. Persisted collections do not sync between devices. No backend is justified for the present scope.

## Assets and credits

- Original composition and wine/photo assets: the [user-supplied Figma project](https://www.figma.com/design/jJ4Elc8tU9uAWlCB61WZYU/). Brand names and artwork remain the property of their respective owners; no additional licence to those assets is granted here.
- Cormorant Garamond and Manrope: self-hosted from [Google Fonts](https://github.com/google/fonts), under the SIL Open Font License; licence texts are included in `assets/fonts/`.
- Implementation and interface refinements: Roman Kabanov ([memorim](https://github.com/memorim)).
- Estate background and current external destination: the [producer's website](https://www.les-freres-laffitte.com/). No dates or visit availability are claimed by this interface.
