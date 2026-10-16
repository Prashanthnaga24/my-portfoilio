# Prashanth Nagarajan — Portfolio

Personal portfolio of **Prashanth Nagarajan**, QA Engineering Lead.
Static site (HTML, CSS, JavaScript) with a Three.js hero — no build step.

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly from disk won't load the 3D scene (browsers block ES modules on `file://`).

## Publish on GitHub Pages

1. Push this folder to a repository. Naming it `Prashanthnaga24.github.io` serves it at `https://prashanthnaga24.github.io/`.
2. In the repo: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. The site is live within a minute or two.

## Edit content

All text lives in `index.html`. Styles are in `styles.css`; interactions (terminal, counters, the catchable bug) are in `main.js`; the 3D browsers are in `scene.js`.

`vendor/three.module.min.js` is [three.js](https://threejs.org) r170 (MIT licence).
