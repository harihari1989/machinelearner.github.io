# Visualization Logic and Architecture

This document summarizes how the visualizations in this web app are structured, how they render, and how the UI controls connect to the drawing code.

## High-level architecture

- Single-page site: markup and canvases live in `index.html`. Sections are grouped into chapters using `.chapter` and `data-chapter`. Visibility is controlled by toggling `.is-active`.
- Styling and themes: CSS variables in `styles.css` define the palette. Theme overrides are in `body[data-theme="..."]` blocks. The canvas visuals pull colors from CSS variables to stay in sync with the active theme.
- All logic in one file: `script.js` contains state, canvas drawing utilities, per-section renderers, and all event wiring.

## Common visualization pattern

Most visualizations follow the same three-part structure:

1) State object
   - Example: `vectorState`, `matrixState`, `probabilityState`
   - Holds current parameters (sliders, active mode, active step)

2) Draw function(s)
   - Signature pattern: `drawX(ctx, canvas, theme)`
   - Uses shared helpers like `drawRoundedRect`, `drawArrow`, `drawGrid`, etc.

3) Setup function
   - Binds UI controls to state changes
   - Calls a redraw function after each change

There is also a global `refreshAllVisuals()` used to repaint everything, primarily after theme or chapter changes.

## Theme integration

- `getThemeColors()` reads CSS variables from the active theme.
- Every draw function uses this palette to keep the canvas visuals aligned with UI styling.
- Theme switching triggers `refreshAllVisuals()` to repaint all canvases.

## Core drawing utilities

A shared set of low-level helpers in `script.js` makes the visuals consistent:

- `drawRoundedRect`, `drawArrow`, `drawPoint`, `drawDashedLine`
- `drawGrid`, `drawAxes`, `drawCoordinatePlane`

These are reused across all sections to render vectors, matrices, charts, and diagrams.

## Example module flows

### Vector playground

- State: `vectorState`
- Render: `drawVectorPlayground()` -> `drawVectorBase()` + `drawVector()` + `drawAngleArc()`
- UI: `setupVectorControls()` listens to sliders and operation buttons
- Animation: `animateVectorAddition()` uses `requestAnimationFrame`

### Matrix section

- State: `matrixState` (basic), `matrixDeepState` (advanced)
- Render: `drawMatrixCanvas()` / `drawMatrixDeepCanvas()` -> `drawMatrixOperation()`
- UI: `setupMatrixControls()` / `setupMatrixDeepControls()`
- Animation: `animateMatrixOperationForState()` for step-based operations

### Probability section

- State: `probabilityState`, `probabilityDepthState`
- Render: `drawProbabilityCanvas()` plus `drawProbabilityVennCanvas()`, `drawSpamFilterCanvas()`, `drawSampleSpaceCanvas()`
- UI: `setupProbabilitySection()` and `setupProbabilityDepth()` swap modes

### ML and neural visualizations

- Each section has its own state, draw function, and setup function.
- Steppers and autoplay use `toggleAutoPlay()` (interval-based) to advance steps.
- Examples: ML lifecycle, backprop, neuron lab, CNN/RNN/LSTM labs, transformer visualizations.

### Jupyter-style notebook lab

- Runtime: Python executes in-browser via Pyodide (`v0.25.1`) loaded on demand from CDN.
- State: a shared `notebook_globals` dict persists across cells to mimic a notebook kernel.
- Render path: `runNotebookCode()` captures `stdout`/`stderr` and injects text outputs, while matplotlib figures are saved to SVG and inserted into `.cell-output` as inline markup.
- UX flow: per-cell "Run" buttons, "Run all" (sequential execution), "Clear outputs", and "Reset kernel" update a shared status chip and toggle `.has-error` for failures.

## Initialization lifecycle

On `DOMContentLoaded`, the app:

- Initializes theme, chapter switcher, and navigation
- Wires all UI controls
- Draws all canvases once via `refreshAllVisuals()`

The theme switcher and chapter switcher both call `refreshAllVisuals()` to repaint the canvas-based visuals.
