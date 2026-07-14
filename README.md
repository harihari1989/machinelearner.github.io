# machinelearner.github.io
Visual summaries of Machine Learning and Neural Network algorithms — built for intuition. This repository powers machinelearner.github.io, a GitHub Pages site dedicated to clear, visual, and intuitive explanations of common machine learning and neural network algorithms.

## Math Deep Dive

The Math Deep Dive chapter is an animated, interactive course connecting calculus, linear algebra, differential equations, and neural networks. Its browser-native labs use real numerical methods and learning algorithms:

- finite differences, Riemann sums, chain-rule composition, and Taylor approximations;
- animated matrix transformations with determinant, rank, and eigen-direction diagnostics;
- phase portraits integrated with Euler or Runge–Kutta 4; and
- a trainable 2–3–1 neural network with forward, loss-surface, backpropagation, and XOR-training views.

The chapter also includes a searchable coverage atlas for all 45 lectures in the four source playlists—12 calculus, 16 linear algebra, 8 differential equations, and 9 neural/deep-learning lectures. Each lecture maps one-to-one to a visual scene, its central equation, a detailed concept checklist, and a machine-learning connection. The guided carousel gives every one of the 302 named concepts its own checkpoint slide with meaning, visible mechanism, symbolic invariant, and a boundary-case stress test. It then builds the main formula through staged visual derivations before moving to an experiment and ML transfer. Keyboard, swipe, replay, synchronized concept seeking, playback pace, and optional auto-play controls are included.

### ManimGL browser lectures

The lecture carousel can play original white-theme scenes rendered with [3Blue1Brown's ManimGL engine](https://github.com/3b1b/manim). Because ManimGL is a Python/OpenGL renderer rather than a browser runtime, the repository pins the upstream engine, renders 45 deterministic MP4/WebM assets, and delivers them through an HTML5 video layer. Every lecture has its own focused Manim scene; the existing JavaScript canvas remains available as an interactive and reduced-bandwidth fallback. The clips use slower staged transitions and default to a 0.70× study pace. A dedicated unit-circle scene derives `sin θ = y/r`, `cos θ = x/r`, the sine trace, and Euler's formula.

- Scene source: `manim/lecture_scenes.py`
- Lecture-to-scene mapping: `manim/scene-manifest.json` with a browser-ready mirror at `manim/scene-manifest.js`
- Reproducible renderer: `scripts/render-manim-lectures.sh`
- Optional GitHub Actions artifact build: `.github/workflows/render-manim-lectures.yml`

The ManimGL engine is MIT licensed. These scenes are original and do not copy the separately CC BY-NC-SA scene code or artwork in the `3b1b/videos` repository.

Serve the repository as a static site, then open index.html through that local server.
