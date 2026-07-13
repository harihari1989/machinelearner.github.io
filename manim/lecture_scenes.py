"""Original ManimGL scenes for the browser Math Deep Dive.

Render with 3b1b/manim (ManimGL), then deliver the generated MP4/WebM files
through the site's HTML5 lecture player.  These scenes intentionally use only
the MIT-licensed ManimGL API; they do not copy scene code or artwork from the
separately licensed 3b1b/videos repository.
"""

from __future__ import annotations

import math
import os

import numpy as np

from manimlib import *


BG = "#F8FBFF"
INK = "#172033"
MUTED = "#64748B"
GRID = "#CBD5E1"
CYAN = "#0284C7"
BLUE = "#2563EB"
VIOLET = "#7C3AED"
CORAL = "#E11D48"
GOLD = "#C27A00"
MINT = "#059669"
FONT = os.environ.get("MANIM_FONT", "Helvetica")


class BrowserLectureScene(Scene):
    """Shared white-theme grammar for compact browser lecture clips."""

    title = "Mathematical motion"
    subtitle = "Watch the invariant, not just the moving object"
    accent = CYAN

    def text(self, value, size=30, color=INK, weight=NORMAL):
        return Text(value, font=FONT, font_size=size, weight=weight).set_color(color)

    def header(self):
        eyebrow = self.text("MANIM VISUAL LECTURE", 16, self.accent, BOLD)
        title = self.text(self.title, 39, INK, BOLD)
        subtitle = self.text(self.subtitle, 20, MUTED)
        group = VGroup(eyebrow, title, subtitle).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        group.to_edge(UP, buff=0.28).to_edge(LEFT, buff=0.55)
        rule = Line(LEFT * 6.55, RIGHT * 6.55).set_stroke(GRID, 1)
        rule.next_to(group, DOWN, buff=0.18)
        self.play(FadeIn(group, shift=0.18 * DOWN), ShowCreation(rule), run_time=0.65)

    def formula(self, value, color=None):
        label = self.text(value, 23, color or self.accent, BOLD)
        label.to_edge(DOWN, buff=0.28)
        panel = SurroundingRectangle(label, buff=0.18)
        panel.set_fill("#FFFFFF", 0.94).set_stroke(color or self.accent, 1.5)
        self.play(FadeIn(panel), FadeIn(label), run_time=0.45)
        return VGroup(panel, label)

    def construct(self):
        self.header()
        self.animate_concept()
        self.wait(0.35)

    def animate_concept(self):
        raise NotImplementedError

    def axes(self, x_range=(-4, 4, 1), y_range=(-2, 3, 1), width=9.4, height=4.4):
        axes = Axes(x_range, y_range, width=width, height=height)
        axes.set_stroke(GRID, 1.5)
        axes.shift(0.35 * DOWN)
        return axes

    def polyline(self, points, color=None, width=4):
        path = VMobject()
        path.set_points_as_corners(points)
        path.set_stroke(color or self.accent, width)
        return path

    def node(self, label, color=None, width=1.75):
        box = RoundedRectangle(width=width, height=0.82, corner_radius=0.16)
        box.set_fill("#FFFFFF", 1).set_stroke(color or self.accent, 2)
        word = self.text(label, 21, INK, BOLD)
        word.move_to(box)
        return VGroup(box, word)


class IntegralAccumulator(BrowserLectureScene):
    title = "Accumulation becomes area"
    subtitle = "Thinner pieces reduce approximation error"
    accent = MINT

    def rectangles(self, axes, count):
        items = VGroup()
        left, right = -3.1, 3.1
        dx = (right - left) / count
        for index in range(count):
            x = left + index * dx
            h = 0.18 * x * x + 0.35
            x0, x1 = axes.c2p(x, 0), axes.c2p(x + dx, 0)
            y0, y1 = axes.c2p(0, 0), axes.c2p(0, h)
            rect = Rectangle(width=abs(x1[0] - x0[0]), height=abs(y1[1] - y0[1]))
            rect.set_fill(MINT, 0.18).set_stroke(MINT, 1)
            rect.move_to(axes.c2p(x + dx / 2, h / 2))
            items.add(rect)
        return items

    def animate_concept(self):
        axes = self.axes(y_range=(0, 2.8, 1))
        graph = axes.get_graph(lambda x: 0.18 * x * x + 0.35).set_stroke(CYAN, 4)
        coarse = self.rectangles(axes, 7)
        fine = self.rectangles(axes, 28)
        self.play(ShowCreation(axes), ShowCreation(graph), run_time=0.8)
        self.play(FadeIn(coarse, lag_ratio=0.08), run_time=0.8)
        self.play(Transform(coarse, fine), run_time=1.4)
        boundary = DashedLine(axes.c2p(2.35, 0), axes.c2p(2.35, 1.35)).set_stroke(GOLD, 3)
        self.play(ShowCreation(boundary), run_time=0.5)
        self.formula("moving boundary  →  marginal strip  →  derivative")


class LocalDerivative(BrowserLectureScene):
    title = "A derivative is a local prediction"
    subtitle = "A secant settles into the best nearby line"
    accent = GOLD

    def animate_concept(self):
        axes = self.axes()
        fn = lambda x: 0.22 * x * x - 0.55
        graph = axes.get_graph(fn).set_stroke(CYAN, 4)
        x0 = 0.7
        p0 = axes.c2p(x0, fn(x0))
        p1 = axes.c2p(3.0, fn(3.0))
        p2 = axes.c2p(1.15, fn(1.15))
        fixed = Dot(p0, radius=0.09).set_color(CYAN)
        moving = Dot(p1, radius=0.09).set_color(CORAL)
        secant = Line(p0 + 1.8 * (p0 - p1), p1 + 0.65 * (p1 - p0)).set_stroke(CORAL, 3)
        secant_close = Line(p0 + 3.8 * (p0 - p2), p2 + 2.7 * (p2 - p0)).set_stroke(GOLD, 3)
        zoom = SurroundingRectangle(VGroup(fixed, moving), buff=0.3).set_stroke(VIOLET, 2)
        self.play(ShowCreation(axes), ShowCreation(graph), FadeIn(fixed), FadeIn(moving), run_time=0.85)
        self.play(ShowCreation(secant), ShowCreation(zoom), run_time=0.65)
        self.play(moving.animate.move_to(p2), Transform(secant, secant_close), zoom.animate.scale(0.52).move_to(p0), run_time=1.6)
        self.formula("Δoutput / Δinput  →  stable local slope")


class ChainRuleFlow(BrowserLectureScene):
    title = "The chain rule passes influence"
    subtitle = "Local conversion factors multiply; separate paths add"
    accent = VIOLET

    def animate_concept(self):
        labels = ["x", "u = g(x)", "y = f(u)", "loss L"]
        colors = [CYAN, VIOLET, CORAL, GOLD]
        nodes = VGroup(*[self.node(label, color) for label, color in zip(labels, colors)])
        nodes.arrange(RIGHT, buff=0.78).shift(0.25 * DOWN)
        arrows = VGroup(*[
            Arrow(nodes[i].get_right(), nodes[i + 1].get_left(), buff=0.08).set_color(colors[i + 1])
            for i in range(len(nodes) - 1)
        ])
        pulse = Dot(nodes[0].get_center(), radius=0.1).set_color(GOLD)
        self.play(LaggedStartMap(FadeIn, nodes, lag_ratio=0.12), LaggedStartMap(GrowArrow, arrows, lag_ratio=0.12), run_time=1.0)
        self.add(pulse)
        for node in nodes[1:]:
            self.play(pulse.animate.move_to(node.get_center()), node.animate.scale(1.08), run_time=0.48)
            self.play(node.animate.scale(1 / 1.08), run_time=0.18)
        self.formula("end-to-end sensitivity = product of local slopes")


class ExponentialGrowth(BrowserLectureScene):
    title = "Exponential growth reproduces itself"
    subtitle = "The rate is proportional to the current amount"
    accent = CYAN

    def animate_concept(self):
        axes = self.axes(x_range=(-3, 3.5, 1), y_range=(0, 4, 1))
        graph = axes.get_graph(lambda x: 0.55 * math.exp(0.48 * x)).set_stroke(CYAN, 4)
        points = [-1.7, -0.4, 0.9, 2.2]
        dots = VGroup(*[Dot(axes.c2p(x, 0.55 * math.exp(0.48 * x)), radius=0.085).set_color(GOLD) for x in points])
        arrows = VGroup()
        for x, dot in zip(points, dots):
            y = 0.55 * math.exp(0.48 * x)
            length = 0.32 + 0.24 * y
            arrows.add(Arrow(dot.get_center(), dot.get_center() + length * UP, buff=0).set_color(CORAL))
        self.play(ShowCreation(axes), ShowCreation(graph), run_time=0.9)
        self.play(LaggedStartMap(FadeIn, dots, lag_ratio=0.16), LaggedStartMap(GrowArrow, arrows, lag_ratio=0.16), run_time=1.2)
        self.play(LaggedStart(*[dot.animate.scale(1.45) for dot in dots], lag_ratio=0.12, rate_func=there_and_back), run_time=1.0)
        self.formula("height ↑  ⇒  slope ↑ in the same proportion")


class ConstraintMotion(BrowserLectureScene):
    title = "A constraint couples every change"
    subtitle = "Allowed motion stays tangent to the constraint"
    accent = CORAL

    def animate_concept(self):
        circle = Circle(radius=2.05).set_stroke(CYAN, 4).shift(0.3 * DOWN)
        start = circle.point_from_proportion(0.09)
        end = circle.point_from_proportion(0.36)
        point = Dot(start, radius=0.11).set_color(GOLD)
        radius = Arrow(circle.get_center(), start, buff=0).set_color(VIOLET)
        tangent = Arrow(start, start + 1.55 * normalize(rotate_vector(start - circle.get_center(), PI / 2)), buff=0).set_color(CORAL)
        new_radius = Arrow(circle.get_center(), end, buff=0).set_color(VIOLET)
        new_tangent = Arrow(end, end + 1.55 * normalize(rotate_vector(end - circle.get_center(), PI / 2)), buff=0).set_color(CORAL)
        self.play(ShowCreation(circle), FadeIn(point), GrowArrow(radius), GrowArrow(tangent), run_time=0.9)
        self.play(point.animate.move_to(end), Transform(radius, new_radius), Transform(tangent, new_tangent), run_time=1.7)
        angle = Elbow(width=0.35, angle=angle_of_vector(end - circle.get_center())).move_to(end)
        angle.set_stroke(GOLD, 3)
        self.play(ShowCreation(angle), run_time=0.45)
        self.formula("constraint change = 0  ⇒  gradient ⟂ motion")


class TaylorApproximation(BrowserLectureScene):
    title = "Taylor terms widen local agreement"
    subtitle = "Match value, slope, curvature, then higher derivatives"
    accent = GOLD

    def animate_concept(self):
        axes = self.axes(x_range=(-4, 4, 1), y_range=(-2, 2, 1))
        target = axes.get_graph(math.sin).set_stroke(CYAN, 4)
        linear = axes.get_graph(lambda x: x).set_stroke(GOLD, 3)
        cubic = axes.get_graph(lambda x: x - x ** 3 / 6).set_stroke(VIOLET, 3)
        seventh = axes.get_graph(lambda x: x - x ** 3 / 6 + x ** 5 / 120 - x ** 7 / 5040).set_stroke(CORAL, 3)
        center = Dot(axes.c2p(0, 0), radius=0.09).set_color(INK)
        self.play(ShowCreation(axes), ShowCreation(target), FadeIn(center), run_time=0.9)
        self.play(ShowCreation(linear), run_time=0.7)
        self.play(Transform(linear, cubic), run_time=1.0)
        self.play(Transform(linear, seventh), run_time=1.0)
        self.formula("more matched derivatives  →  wider accurate neighborhood")


class VectorSpan(BrowserLectureScene):
    title = "Vectors are scaled directions"
    subtitle = "Independent directions sweep a space"
    accent = VIOLET

    def animate_concept(self):
        plane = NumberPlane((-5, 5), (-3, 3), width=10.2, height=5.0)
        plane.set_stroke(GRID, 1).shift(0.25 * DOWN)
        origin = plane.c2p(0, 0)
        v1 = Arrow(origin, plane.c2p(2.5, 0.7), buff=0).set_color(CYAN)
        v2 = Arrow(origin, plane.c2p(-0.5, 1.7), buff=0).set_color(CORAL)
        result = Arrow(origin, plane.c2p(2.0, 2.4), buff=0).set_color(GOLD)
        bridge1 = DashedLine(v1.get_end(), result.get_end()).set_stroke(CORAL, 2)
        bridge2 = DashedLine(v2.get_end(), result.get_end()).set_stroke(CYAN, 2)
        self.play(ShowCreation(plane), GrowArrow(v1), GrowArrow(v2), run_time=0.9)
        self.play(ShowCreation(bridge1), ShowCreation(bridge2), GrowArrow(result), run_time=0.9)
        cloud = VGroup(*[
            Dot(plane.c2p(a * 2.5 - b * 0.5, a * 0.7 + b * 1.7), radius=0.035).set_color(VIOLET)
            for a in np.linspace(-1, 1, 7) for b in np.linspace(-1, 1, 7)
        ])
        self.play(LaggedStartMap(FadeIn, cloud, lag_ratio=0.01), run_time=1.1)
        self.formula("span = every reachable linear combination")


class LinearTransform(BrowserLectureScene):
    title = "A matrix moves the basis—and the grid follows"
    subtitle = "Columns reveal the whole transformation"
    accent = VIOLET

    def animate_concept(self):
        plane = NumberPlane((-6, 6), (-3, 3), width=11.0, height=5.0)
        plane.set_stroke(GRID, 1).shift(0.25 * DOWN)
        origin = plane.c2p(0, 0)
        i_hat = Arrow(origin, plane.c2p(1, 0), buff=0).set_color(CYAN)
        j_hat = Arrow(origin, plane.c2p(0, 1), buff=0).set_color(CORAL)
        group = VGroup(plane, i_hat, j_hat)
        self.play(ShowCreation(plane), GrowArrow(i_hat), GrowArrow(j_hat), run_time=0.9)
        self.play(group.animate.apply_matrix([[1.25, 0.65], [0.18, 0.78]]), run_time=1.8)
        unit = Polygon(origin, plane.c2p(1, 0), plane.c2p(1, 1), plane.c2p(0, 1))
        unit.set_fill(GOLD, 0.18).set_stroke(GOLD, 2)
        self.play(FadeIn(unit), run_time=0.5)
        self.formula("matrix columns = transformed basis directions")


class ProjectionGeometry(BrowserLectureScene):
    title = "Projection measures alignment"
    subtitle = "A dot product turns geometry into a scalar"
    accent = CYAN

    def animate_concept(self):
        line = Line(5.2 * LEFT + 1.65 * DOWN, 5.2 * RIGHT + 1.65 * UP).set_stroke(GRID, 3)
        origin = ORIGIN + 0.35 * DOWN
        vector = Arrow(origin, origin + 2.5 * UP + 2.4 * RIGHT, buff=0).set_color(CORAL)
        unit = normalize(line.get_end() - line.get_start())
        projected_length = np.dot(vector.get_end() - origin, unit)
        projection_point = origin + projected_length * unit
        projection = Arrow(origin, projection_point, buff=0).set_color(CYAN)
        drop = DashedLine(vector.get_end(), projection_point).set_stroke(VIOLET, 2.5)
        self.play(ShowCreation(line), GrowArrow(vector), run_time=0.75)
        self.play(ShowCreation(drop), GrowArrow(projection), run_time=0.95)
        shadow = projection.copy().set_stroke(GOLD, 8)
        self.play(TransformFromCopy(projection, shadow), shadow.animate.set_stroke(GOLD, 3), run_time=0.8)
        self.formula("dot product = signed length of the shadow")


class SubspaceCollapse(BrowserLectureScene):
    title = "Rank reveals what survives"
    subtitle = "The null space contains directions erased by the map"
    accent = MINT

    def animate_concept(self):
        plane = NumberPlane((-6, 6), (-3, 3), width=11, height=5)
        plane.set_stroke(GRID, 1).shift(0.25 * DOWN)
        v = Arrow(plane.c2p(0, 0), plane.c2p(1.5, -2.0), buff=0).set_color(CORAL)
        label = self.text("many inputs", 19, MUTED).next_to(v, RIGHT)
        self.play(ShowCreation(plane), GrowArrow(v), FadeIn(label), run_time=0.9)
        self.play(plane.animate.apply_matrix([[1.0, 0.7], [0.04, 0.03]]), v.animate.put_start_and_end_on(plane.c2p(0, 0), plane.c2p(0.08, 0.03)), FadeOut(label), run_time=1.8)
        surviving = Line(5.4 * LEFT + 0.2 * DOWN, 5.4 * RIGHT + 0.2 * UP).set_stroke(MINT, 4)
        self.play(ShowCreation(surviving), run_time=0.55)
        self.formula("input space = visible directions ⊕ lost directions")


class EigenDirections(BrowserLectureScene):
    title = "Eigen-directions do not turn"
    subtitle = "Repeated transformations only rescale these directions"
    accent = VIOLET

    def animate_concept(self):
        plane = NumberPlane((-5, 5), (-3, 3), width=10.5, height=5)
        plane.set_stroke(GRID, 1).shift(0.25 * DOWN)
        origin = plane.c2p(0, 0)
        e1 = Arrow(origin, plane.c2p(2.5, 1.2), buff=0).set_color(CYAN)
        e2 = Arrow(origin, plane.c2p(-1.1, 2.3), buff=0).set_color(CORAL)
        ordinary = Arrow(origin, plane.c2p(1.7, 2.0), buff=0).set_color(GOLD)
        self.play(ShowCreation(plane), GrowArrow(e1), GrowArrow(e2), GrowArrow(ordinary), run_time=0.9)
        group = VGroup(plane, e1, e2, ordinary)
        self.play(group.animate.apply_matrix([[1.35, 0.35], [0.35, 0.82]]), run_time=1.8)
        self.play(Indicate(e1, color=CYAN), Indicate(e2, color=CORAL), run_time=0.8)
        self.formula("A v = λ v  ⇒  direction stays invariant")


class DifferentialFlow(BrowserLectureScene):
    title = "A differential equation is a velocity field"
    subtitle = "A solution follows the arrow at every state"
    accent = MINT

    def animate_concept(self):
        arrows = VGroup()
        for x in np.linspace(-5.4, 5.4, 10):
            for y in np.linspace(-2.2, 1.9, 6):
                direction = np.array([y + 0.25, -0.45 * x - 0.2 * y, 0.0])
                direction = 0.28 * normalize(direction)
                arrows.add(Arrow(np.array([x, y - 0.15, 0]), np.array([x, y - 0.15, 0]) + direction, buff=0).set_color(MINT).set_opacity(0.55))
        points = []
        for t in np.linspace(0, 5.2 * PI, 150):
            radius = 2.6 * math.exp(-0.055 * t)
            points.append(np.array([radius * math.cos(t), 0.72 * radius * math.sin(t) - 0.15, 0]))
        path = self.polyline(points, CYAN, 4)
        particle = Dot(points[0], radius=0.1).set_color(GOLD)
        self.play(LaggedStartMap(GrowArrow, arrows, lag_ratio=0.006), run_time=1.0)
        self.play(ShowCreation(path), MoveAlongPath(particle, path), run_time=2.0, rate_func=linear)
        self.add(particle)
        self.formula("state derivative = local arrow  ⇒  trajectory")


class DifferentialModes(BrowserLectureScene):
    title = "Diffusion removes fine detail first"
    subtitle = "High-frequency modes decay faster"
    accent = MINT

    def wave(self, frequency, amplitude, color):
        points = [np.array([x, amplitude * math.sin(frequency * x) - 0.25, 0]) for x in np.linspace(-5.7, 5.7, 180)]
        return self.polyline(points, color, 3)

    def animate_concept(self):
        modes = VGroup(self.wave(4.0, 0.62, CORAL), self.wave(2.2, 0.85, VIOLET), self.wave(0.72, 1.25, CYAN))
        self.play(LaggedStartMap(ShowCreation, modes, lag_ratio=0.15), run_time=1.2)
        smooth = self.wave(0.72, 0.92, MINT)
        ghosts = VGroup(modes[0].copy().set_opacity(0.08), modes[1].copy().set_opacity(0.12))
        self.play(Transform(modes[0], ghosts[0]), Transform(modes[1], ghosts[1]), Transform(modes[2], smooth), run_time=1.7)
        self.formula("mode amplitude ∝ exp(−frequency² · time)")


class FourierEpicycles(BrowserLectureScene):
    title = "Frequencies add as rotating vectors"
    subtitle = "Magnitude and phase reconstruct a signal"
    accent = GOLD

    def animate_concept(self):
        center = 3.6 * LEFT + 0.25 * DOWN
        radii = [1.25, 0.68, 0.38]
        angles = [0.2, 1.2, -0.7]
        circles = VGroup()
        arrows = VGroup()
        current = center
        tips = []
        for index, (radius, angle) in enumerate(zip(radii, angles)):
            circle = Circle(radius=radius).set_stroke(GRID, 1.5).move_to(current)
            tip = current + radius * np.array([math.cos(angle), math.sin(angle), 0])
            arrow = Arrow(current, tip, buff=0).set_color([CYAN, VIOLET, CORAL][index])
            circles.add(circle); arrows.add(arrow); tips.append(tip); current = tip
        signal_points = [current + np.array([x, 0.72 * math.sin(1.25 * x), 0]) for x in np.linspace(0, 5.7, 120)]
        signal = self.polyline(signal_points, GOLD, 4)
        bridge = DashedLine(current, signal_points[0]).set_stroke(GOLD, 2)
        self.play(LaggedStartMap(ShowCreation, circles, lag_ratio=0.15), LaggedStartMap(GrowArrow, arrows, lag_ratio=0.15), run_time=1.2)
        self.play(ShowCreation(bridge), ShowCreation(signal), run_time=1.4)
        self.play(arrows.animate.rotate(0.9, about_point=center), run_time=1.0)
        self.formula("signal = sum of rotating frequency components")


class NeuralSignals(BrowserLectureScene):
    title = "A neural network composes transformations"
    subtitle = "Signals move forward; responsibility moves backward"
    accent = CORAL

    def animate_concept(self):
        layer_positions = [(-5.2, [-1.25, 1.0]), (-1.9, [-1.8, 0, 1.8]), (1.8, [-1.1, 1.1]), (5.1, [0])]
        layers = []
        for x, ys in layer_positions:
            layer = VGroup(*[Circle(radius=0.32).set_fill("#FFFFFF", 1).set_stroke(CORAL if x > 3 else VIOLET if x > 0 else CYAN, 2).move_to([x, y - 0.2, 0]) for y in ys])
            layers.append(layer)
        edges = VGroup()
        for left, right in zip(layers, layers[1:]):
            for source in left:
                for target in right:
                    edges.add(Line(source.get_center(), target.get_center()).set_stroke(GRID, 1.2))
        nodes = VGroup(*layers)
        pulse = Dot(layers[0][0].get_center(), radius=0.1).set_color(GOLD)
        self.play(LaggedStartMap(ShowCreation, edges, lag_ratio=0.006), LaggedStartMap(FadeIn, nodes, lag_ratio=0.05), run_time=1.0)
        self.add(pulse)
        for layer in layers[1:]:
            self.play(pulse.animate.move_to(layer[0].get_center()), layer.animate.set_fill(CYAN, 0.16), run_time=0.42)
        self.play(pulse.animate.set_color(CORAL).move_to(layers[0][-1].get_center()), run_time=1.0)
        self.formula("forward prediction  ⇄  backward credit assignment")


class GradientDescent(BrowserLectureScene):
    title = "Gradient descent follows local steepness"
    subtitle = "Small corrections navigate a curved loss landscape"
    accent = VIOLET

    def animate_concept(self):
        contours = VGroup(*[
            Ellipse(width=1.15 + index * 1.05, height=0.58 + index * 0.52).rotate(-0.23).set_stroke(VIOLET, 1.4).set_opacity(0.22 + index * 0.06).shift(0.2 * DOWN)
            for index in range(7)
        ])
        path_points = [np.array([5.0, 1.8, 0]), np.array([3.2, 0.7, 0]), np.array([1.8, 0.55, 0]), np.array([0.7, -0.05, 0]), np.array([0.1, -0.18, 0])]
        path = self.polyline(path_points, GOLD, 3)
        point = Dot(path_points[0], radius=0.12).set_color(CORAL)
        self.play(LaggedStartMap(ShowCreation, contours, lag_ratio=0.08), FadeIn(point), run_time=1.0)
        self.play(ShowCreation(path), MoveAlongPath(point, path), run_time=2.0, rate_func=smooth)
        gradient = Arrow(point.get_center() + 1.0 * RIGHT + 0.7 * UP, point.get_center(), buff=0).set_color(CYAN)
        self.play(GrowArrow(gradient), run_time=0.5)
        self.formula("parameters ← parameters − learning rate · gradient")


class TransformerFlow(BrowserLectureScene):
    title = "Transformers repeatedly edit a residual stream"
    subtitle = "Attention routes information; MLPs transform features"
    accent = CORAL

    def animate_concept(self):
        labels = ["tokens", "embed", "attention", "MLP", "logits"]
        colors = [CYAN, VIOLET, CORAL, MINT, GOLD]
        nodes = VGroup(*[self.node(label, color, width=1.7) for label, color in zip(labels, colors)])
        nodes.arrange(RIGHT, buff=0.55).shift(0.25 * DOWN)
        arrows = VGroup(*[Arrow(nodes[i].get_right(), nodes[i + 1].get_left(), buff=0.06).set_color(colors[i + 1]) for i in range(4)])
        residual = Line(nodes[1].get_bottom() + 0.22 * DOWN, nodes[3].get_bottom() + 0.22 * DOWN).set_stroke(CYAN, 5)
        pulse = Dot(nodes[0].get_center(), radius=0.1).set_color(GOLD)
        self.play(LaggedStartMap(FadeIn, nodes, lag_ratio=0.1), LaggedStartMap(GrowArrow, arrows, lag_ratio=0.1), run_time=1.0)
        self.play(ShowCreation(residual), run_time=0.55)
        self.add(pulse)
        for node in nodes[1:]:
            self.play(pulse.animate.move_to(node.get_center()), run_time=0.4)
        self.formula("representation + learned update → richer context")


class AttentionRouting(BrowserLectureScene):
    title = "Attention is content-dependent routing"
    subtitle = "Every row becomes a probability distribution over sources"
    accent = CORAL

    def animate_concept(self):
        values = np.array([
            [0.82, 0.08, 0.04, 0.03, 0.03],
            [0.20, 0.64, 0.08, 0.05, 0.03],
            [0.10, 0.18, 0.58, 0.09, 0.05],
            [0.08, 0.13, 0.24, 0.47, 0.08],
            [0.05, 0.12, 0.18, 0.25, 0.40],
        ])
        squares = VGroup()
        for row in range(5):
            for col in range(5):
                square = Square(side_length=0.62).set_stroke("#FFFFFF", 1)
                square.set_fill(CORAL, float(0.08 + 0.88 * values[row, col]))
                square.move_to(np.array([-2.3 + col * 0.66, 1.2 - row * 0.66, 0]))
                squares.add(square)
        queries = self.text("queries", 19, MUTED).rotate(PI / 2).next_to(squares, LEFT)
        keys = self.text("keys / values", 19, MUTED).next_to(squares, UP)
        output = self.node("context vector", CYAN, width=2.4).move_to([4.25, -0.1, 0])
        route = Arrow(squares.get_right(), output.get_left(), buff=0.18).set_color(GOLD)
        self.play(LaggedStartMap(FadeIn, squares, lag_ratio=0.018), FadeIn(queries), FadeIn(keys), run_time=1.2)
        self.play(GrowArrow(route), FadeIn(output), run_time=0.8)
        row_highlight = SurroundingRectangle(VGroup(*squares[15:20]), buff=0.07).set_stroke(CYAN, 3)
        self.play(ShowCreation(row_highlight), run_time=0.7)
        self.formula("softmax(query · keys) × values")


class DiffusionDenoising(BrowserLectureScene):
    title = "Diffusion generates through local denoising"
    subtitle = "Many small conditional corrections reveal structure"
    accent = CORAL

    def stage(self, x, noise, clarity):
        box = RoundedRectangle(width=1.65, height=2.55, corner_radius=0.18)
        box.set_fill("#FFFFFF", 1).set_stroke(CYAN, 1.5).move_to([x, -0.15, 0])
        dots = VGroup()
        rng = np.random.default_rng(int((x + 7) * 100))
        for _ in range(noise):
            point = box.get_center() + np.array([rng.uniform(-0.7, 0.7), rng.uniform(-1.1, 1.1), 0])
            dots.add(Dot(point, radius=0.025).set_color(CORAL if rng.random() > 0.5 else VIOLET).set_opacity(0.42))
        shape = VGroup(
            Circle(radius=0.42).set_stroke(GOLD, 3).move_to(box.get_center() + 0.15 * UP),
            ArcBetweenPoints(box.get_center() + 0.42 * LEFT + 0.52 * DOWN, box.get_center() + 0.42 * RIGHT + 0.52 * DOWN, angle=-PI / 2).set_stroke(MINT, 3),
        ).set_opacity(clarity)
        return VGroup(box, dots, shape)

    def animate_concept(self):
        stages = VGroup(
            self.stage(-5.0, 62, 0.08),
            self.stage(-2.5, 42, 0.28),
            self.stage(0.0, 26, 0.52),
            self.stage(2.5, 12, 0.78),
            self.stage(5.0, 4, 1.0),
        )
        arrows = VGroup(*[Arrow(stages[i].get_right(), stages[i + 1].get_left(), buff=0.12).set_color(GRID) for i in range(4)])
        self.play(FadeIn(stages[0]), run_time=0.45)
        for index in range(4):
            self.play(GrowArrow(arrows[index]), FadeIn(stages[index + 1]), run_time=0.5)
        self.play(LaggedStart(*[stage.animate.set_stroke(CYAN, 3) for stage in stages], lag_ratio=0.08, rate_func=there_and_back), run_time=1.0)
        self.formula("noise  →  prediction  →  correction  →  structure")
