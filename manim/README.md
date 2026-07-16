# ManimGL lecture pipeline

ManimGL is a Python/OpenGL animation renderer; it cannot execute directly inside a static browser page. This project integrates it as a deterministic asset pipeline:

1. `lecture_scenes.py` defines original white-theme mathematical, machine-learning, and reasoning animations using `3b1b/manim`.
2. `scene-manifest.json` maps 59 catalogued concepts to 59 focused Manim scenes.
3. `scripts/render-manim-lectures.sh` renders MP4 files with ManimGL and creates optimized MP4/WebM/poster assets with FFmpeg.
4. The browser course surfaces each asset beside the concept it explains, while retaining interactive JavaScript labs for exploration.

The ManimGL dependency is pinned to commit `e61ad5c3f9c9ac96cba7a46dffc665c0ec13beea` in `requirements.txt`.

## Render

Prerequisites are Python 3.11, FFmpeg, and ManimGL's native dependencies (OpenGL and Pango). LaTeX is not required because these compact scenes use Pango text and Unicode formulas.

```sh
scripts/render-manim-lectures.sh
```

Pass one or more asset slugs to render only selected scenes:

```sh
scripts/render-manim-lectures.sh chain-rule-flow attention-routing
```

Use `MANIM_FONT` to select an installed Pango font. The local default is Helvetica; CI uses Liberation Sans. Set `MANIM_LECTURE_PACE` to adjust the transition multiplier; the default `2.1` favors slow, readable construction over short clips.
