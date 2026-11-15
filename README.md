# superhero-site

The website for [SUPERHERO](https://github.com/ninja7v/superhero): control your computer with
your eyes, face and voice.

Plain HTML, CSS and a little JavaScript. No build step, no dependencies, no external fonts or
trackers.

```bash
python3 -m http.server   # then open http://localhost:8000
```

Deploy by enabling GitHub Pages on the `main` branch (root folder).

| File | Purpose |
|---|---|
| `index.html` | All content |
| `style.css` | Styles. The single accent is the laser red `#ff2d2d` |
| `script.js` | Hero demo, laser-typed section titles, copy button, scroll reveals. Respects reduced motion |
| `favicon.svg` | The laser dot |

When a feature matures, update its label on the **Actions** cards in `index.html`
(Working / In testing / Experiment) to match `docs/ROADMAP.md` in the main repo.
