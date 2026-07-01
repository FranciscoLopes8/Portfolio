# Portfolio — Francisco Lopes

A simple, personal single-page portfolio. Plain HTML/CSS/JS, no build step.

## Run locally

Just open `index.html` in a browser, or serve it:

```bash
cd ~/portfolio
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (GitHub Pages)

```bash
cd ~/portfolio
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin git@github.com:FranciscoLopes8/portfolio.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Branch: `main` / root → Save**.
It'll be live at `https://franciscolopes8.github.io/portfolio/`.

## Editing

- Text, projects, about & skills: `index.html`
- Colors, fonts, layout: `styles.css`
- Theme toggle / footer year: `script.js`

## Photo

Drop a square image at `assets/profile.jpg` and it appears automatically in the hero.
Until then, a "FL" initials placeholder shows instead.

## Résumé

`resume.pdf` is the file served by the Download/View buttons (currently a copy of
`FranciscoLopes_EN_29_05_26.pdf`). Replace `resume.pdf` to update it.
