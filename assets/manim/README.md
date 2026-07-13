# Browser-rendered Manim lecture assets

The website loads the MP4/WebM files in this directory through an HTML5 video layer inside the Math Deep Dive lecture carousel. The original scene definitions live in `manim/lecture_scenes.py` and are rendered with the MIT-licensed [3Blue1Brown ManimGL engine](https://github.com/3b1b/manim).

Run `scripts/render-manim-lectures.sh` to regenerate every asset listed in `manim/scene-manifest.json`. The script writes compact 480p, 24 fps MP4 and WebM versions plus a JPEG poster for each scene.

The scenes in this repository are original. They do not copy the scene code or artwork from `3b1b/videos`, whose content uses a separate CC BY-NC-SA license.
