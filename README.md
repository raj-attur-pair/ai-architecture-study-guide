# AI Architecture Study Guide

A standalone visual study guide covering neural-network foundations, tokens and embeddings, Transformer blocks, QKV attention, training and inference, autoencoders, VAEs, ACT robotics, and a master review.

**Live guide:** https://raj-attur-pair.github.io/ai-architecture-study-guide/

## Use the guide

- Choose one of nine chapter tabs or bookmark a chapter/section URL.
- Search across all chapters; press `/` to focus search and Escape to return.
- Explore attention and VAE arithmetic, switch between ACT training/inference, and answer knowledge checks.
- Mark chapters reviewed. Progress and the light/dark preference stay in this browser using local storage.
- Print the full guide, including expanded explanations, or download the single-file offline edition.
- With JavaScript disabled, all educational content remains available as one document.

The site has no external runtime libraries, fonts, trackers, network APIs, or account system. Research references are ordinary outbound links. It is responsive and supports keyboard-operated tabs, visible focus, semantic tables, reduced motion, and print styles.

## Files and editing

- `index.html`: educational content and semantic structure.
- `styles.css`: responsive layout, light/dark themes, and print styling.
- `app.js`: navigation, search, local preferences, quizzes, and numerical demonstrations.
- `offline.html`: generated single-file edition.
- `tools/build-offline.py`: dependency-free bundling utility.

After editing the HTML, CSS, or JavaScript, run `python3 tools/build-offline.py` and commit the updated `offline.html` too. The hosted pages do not require a build tool.

For a local preview, run `python3 -m http.server 4173` from this directory and open `http://localhost:4173/`.

## Deployment

GitHub Pages publishes the `main` branch at the repository root. `.nojekyll` enables direct static publication. New commits to `main` are published by GitHub's Pages deployment workflow. Check the repository's Actions and Settings → Pages screens for deployment status.

## Content provenance

Adapted from the user's “Explain Transformer Attention” study conversation, preserving its worked examples and requested chapter structure. The conversation export exposed text but not the source of the embedded visual widget, so the standalone visual interface was recreated from the described tabbed, color-coded design. No private conversation transcript is included.

Technical references are listed in Master review → Sources. Toy calculations are labeled; implementation-dependent details are distinguished from general concepts. The site uses a common pre-norm Transformer illustration rather than implying it is identical to the original post-norm architecture. ACT's policy is distinguished from its training-only posterior encoder.
