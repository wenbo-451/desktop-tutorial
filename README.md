# Anki AI Card Maker

A web-based prototype for turning user-provided learning materials into concise Anki flashcards. Users can paste text, upload images, generate draft cards, review correctness warnings, edit every card, and export an Anki-compatible TSV file.

## Features

- **Material intake:** paste notes, article excerpts, lecture text, or textbook passages and upload supporting images.
- **AI-ready card generation:** the current frontend includes a deterministic summarization fallback and is structured so a server-side AI API call can replace the local generator.
- **Image-aware workflow:** uploaded images are previewed and trigger visual-detail review prompts.
- **Correctness review layer:** automated checks flag short source material, overly long answers, missing image coverage, and cards that need human verification.
- **Anki export:** cards download as tab-separated values with front and back fields.


## GitHub Pages deployment

This is configured as a Vite project for GitHub Pages. The repository name is `xxx`, so `vite.config.js` uses `base: '/xxx/'`. This base path is required because GitHub Pages serves project sites from `https://<your-github-username>.github.io/xxx/` instead of the domain root.

The deployment workflow lives at `.github/workflows/deploy.yml` and runs automatically when changes are pushed to the `main` branch. After GitHub Pages is enabled with **Settings → Pages → Source → GitHub Actions**, each push to `main` builds the app and updates the same public browser link:

```text
https://<your-github-username>.github.io/xxx/
```

You can refresh that link after each update instead of downloading the project again.

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Production build

```bash
npm run build
```

## Future AI API integration

For production use, add a backend endpoint that accepts the source text and image files, calls your preferred multimodal AI API, and returns cards in this shape:

```json
[
  {
    "front": "What does active recall improve?",
    "back": "Long-term memory retention.",
    "source": "Text paragraph 2",
    "confidence": "high"
  }
]
```

Keep the review layer in place even with AI-generated output so users can verify factual correctness before importing into Anki.
