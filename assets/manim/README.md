# Browser-rendered Manim lecture assets

The website loads the MP4/WebM files in this directory through HTML5 video lessons in the Math, Python/PyTorch, reinforcement-learning, and reasoning/planning chapters. The original scene definitions live in `manim/lecture_scenes.py` and are rendered with the MIT-licensed [3Blue1Brown ManimGL engine](https://github.com/3b1b/manim).

Run `scripts/render-manim-lectures.sh` to regenerate all 57 assets listed in `manim/scene-manifest.json`. The script writes compact 480p, 24 fps MP4 and WebM versions plus a representative JPEG poster for each scene. Transitions use the slower study pace defined by `MANIM_LECTURE_PACE`.

The scenes in this repository are original. They do not copy the scene code or artwork from `3b1b/videos`, whose content uses a separate CC BY-NC-SA license.
