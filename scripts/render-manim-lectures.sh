#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${MANIM_VENV:-${ROOT}/.venv-manim}"
PYTHON_BIN="${MANIM_PYTHON:-python3.11}"
MANIM_BIN="${VENV}/bin/manimgl"
MANIFEST="${ROOT}/manim/scene-manifest.json"
SCENES="${ROOT}/manim/lecture_scenes.py"
CONFIG="${ROOT}/manim/custom_config.yml"
RAW_DIR="${ROOT}/.manim-build/raw"
WEB_DIR="${ROOT}/assets/manim"

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
    echo "Python 3.11 is required. Set MANIM_PYTHON to a compatible interpreter." >&2
    exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "FFmpeg is required to encode the browser MP4/WebM assets." >&2
    exit 1
fi

if [[ ! -x "${MANIM_BIN}" ]]; then
    echo "Creating the pinned ManimGL environment in ${VENV}"
    "${PYTHON_BIN}" -m venv "${VENV}"
    "${VENV}/bin/python" -m pip install --upgrade pip setuptools wheel
fi
"${VENV}/bin/python" -m pip install --quiet -r "${ROOT}/manim/requirements.txt"

mkdir -p "${RAW_DIR}" "${WEB_DIR}"

mapfile_compat() {
    local line
    while IFS= read -r line; do
        MANIM_JOBS+=("${line}")
    done
}

MANIM_JOBS=()
mapfile_compat < <("${VENV}/bin/python" - "${MANIFEST}" "$@" <<'PY'
import json
import sys

manifest_path, *selected = sys.argv[1:]
with open(manifest_path, encoding="utf-8") as handle:
    manifest = json.load(handle)

assets = manifest["assets"]
unknown = sorted(set(selected) - set(assets))
if unknown:
    raise SystemExit("Unknown Manim asset slug(s): " + ", ".join(unknown))

for slug, item in assets.items():
    if not selected or slug in selected:
        print(f"{slug}|{item['class']}")
PY
)

export MANIM_FONT="${MANIM_FONT:-Helvetica}"

for job in "${MANIM_JOBS[@]}"; do
    slug="${job%%|*}"
    scene_class="${job#*|}"
    raw_file="${RAW_DIR}/${slug}.mp4"
    mp4_file="${WEB_DIR}/${slug}.mp4"
    webm_file="${WEB_DIR}/${slug}.webm"
    poster_file="${WEB_DIR}/${slug}.jpg"

    echo "Rendering ${slug} (${scene_class}) with ManimGL"
    rm -f "${raw_file}"
    "${MANIM_BIN}" "${SCENES}" "${scene_class}" \
        -w -l --fps 24 --color "#F8FBFF" --quiet \
        --video_dir "${RAW_DIR}" --file_name "${slug}" --config_file "${CONFIG}"

    if [[ ! -s "${raw_file}" ]]; then
        echo "ManimGL did not produce ${raw_file}" >&2
        exit 1
    fi

    ffmpeg -y -loglevel error -i "${raw_file}" -an \
        -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart \
        "${mp4_file}"
    ffmpeg -y -loglevel error -i "${raw_file}" -an \
        -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -pix_fmt yuv420p \
        "${webm_file}"
    ffmpeg -y -loglevel error -ss 2.4 -i "${raw_file}" -frames:v 1 -q:v 3 \
        "${poster_file}"

    printf 'Wrote %s (%s MP4, %s WebM)\n' \
        "${slug}" "$(du -h "${mp4_file}" | cut -f1)" "$(du -h "${webm_file}" | cut -f1)"
done

echo "Rendered ${#MANIM_JOBS[@]} browser lecture animation(s)."
