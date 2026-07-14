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
LECTURE_PACE = float(os.environ.get("MANIM_LECTURE_PACE", "2.1"))


class BrowserLectureScene(Scene):
    """Shared white-theme grammar for compact browser lecture clips."""

    title = "Mathematical motion"
    subtitle = "Watch the invariant, not just the moving object"
    accent = CYAN

    def play(self, *animations, **kwargs):
        """Slow every staged transition so the geometry can be read before it changes."""
        if "run_time" in kwargs:
            kwargs["run_time"] *= LECTURE_PACE
        return super().play(*animations, **kwargs)

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
        self.wait(1.0)

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


class UnitCircleSine(BrowserLectureScene):
    title = "Sine and cosine are circle coordinates"
    subtitle = "Project one rotating radius to derive both functions"
    accent = CORAL

    def circle_point(self, center, radius, angle):
        return center + radius * np.array([math.cos(angle), math.sin(angle), 0])

    def projection_group(self, center, radius, angle):
        point = self.circle_point(center, radius, angle)
        radius_line = Arrow(center, point, buff=0).set_color(GOLD)
        vertical = DashedLine(point, np.array([point[0], center[1], 0])).set_stroke(CORAL, 2.5)
        horizontal = DashedLine(point, np.array([center[0], point[1], 0])).set_stroke(CYAN, 2.5)
        dot = Dot(point, radius=0.095).set_color(GOLD)
        return VGroup(radius_line, vertical, horizontal, dot)

    def animate_concept(self):
        center = 3.65 * LEFT + 0.35 * DOWN
        radius = 1.62
        x_axis = Line(center + 2.15 * LEFT, center + 2.15 * RIGHT).set_stroke(GRID, 1.5)
        y_axis = Line(center + 2.05 * DOWN, center + 2.05 * UP).set_stroke(GRID, 1.5)
        circle = Circle(radius=radius).move_to(center).set_stroke(CYAN, 3.5)
        angle = 38 * DEGREES
        projection = self.projection_group(center, radius, angle)
        theta_arc = Arc(radius=0.48, start_angle=0, angle=angle).move_arc_center_to(center).set_stroke(VIOLET, 3)
        theta_label = self.text("θ", 22, VIOLET, BOLD).next_to(theta_arc, RIGHT, buff=0.05)
        x_label = self.text("x = r cos θ", 18, CYAN, BOLD).next_to(x_axis, DOWN, buff=0.12).shift(0.25 * RIGHT)
        y_label = self.text("y = r sin θ", 18, CORAL, BOLD).next_to(y_axis, LEFT, buff=0.12).shift(0.3 * UP)

        graph_axes = Axes((0, 2 * PI, PI / 2), (-1.25, 1.25, 1), width=5.1, height=3.4)
        graph_axes.set_stroke(GRID, 1.4).shift(3.35 * RIGHT + 0.28 * DOWN)
        sine = graph_axes.get_graph(math.sin, x_range=(0, 2 * PI)).set_stroke(CORAL, 3.5)
        graph_title = self.text("vertical coordinate", 18, CORAL, BOLD).next_to(graph_axes, UP, buff=0.08)
        graph_point = Dot(graph_axes.c2p(angle, math.sin(angle)), radius=0.085).set_color(GOLD)
        circle_point = projection[-1].get_center()
        bridge = DashedLine(circle_point, graph_point.get_center()).set_stroke(GOLD, 2)

        self.play(ShowCreation(x_axis), ShowCreation(y_axis), ShowCreation(circle), run_time=0.9)
        self.play(GrowArrow(projection[0]), ShowCreation(projection[1]), ShowCreation(projection[2]), FadeIn(projection[3]), ShowCreation(theta_arc), FadeIn(theta_label), run_time=1.15)
        self.play(FadeIn(x_label), FadeIn(y_label), run_time=0.75)
        self.play(ShowCreation(graph_axes), FadeIn(graph_title), ShowCreation(sine), run_time=1.2)
        self.play(ShowCreation(bridge), FadeIn(graph_point), run_time=0.8)

        for next_angle in [72 * DEGREES, 132 * DEGREES, 218 * DEGREES, 318 * DEGREES]:
            next_projection = self.projection_group(center, radius, next_angle)
            next_graph_point = Dot(graph_axes.c2p(next_angle, math.sin(next_angle)), radius=0.085).set_color(GOLD)
            next_bridge = DashedLine(next_projection[-1].get_center(), next_graph_point.get_center()).set_stroke(GOLD, 2)
            self.play(Transform(projection, next_projection), Transform(graph_point, next_graph_point), Transform(bridge, next_bridge), run_time=0.85)

        self.formula("sin θ = y / r     cos θ = x / r     e^(iθ) = cos θ + i sin θ")


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


class StepwiseDerivation(BrowserLectureScene):
    """Concept-specific three-beat argument for topics that are best read as a process."""

    steps = ("starting object", "geometric move", "invariant")
    final_formula = "structure  →  operation  →  consequence"

    def animate_concept(self):
        colors = [CYAN, VIOLET, CORAL]
        nodes = VGroup(*[self.node(label, color, width=2.75) for label, color in zip(self.steps, colors)])
        nodes.arrange(RIGHT, buff=0.9).shift(0.3 * DOWN)
        arrows = VGroup(*[
            Arrow(nodes[index].get_right(), nodes[index + 1].get_left(), buff=0.1).set_color(GOLD)
            for index in range(len(nodes) - 1)
        ])
        captions = VGroup(*[
            self.text(label, 16, MUTED, BOLD).next_to(node, DOWN, buff=0.18)
            for label, node in zip(("identify", "transform", "interpret"), nodes)
        ])
        pulse = Dot(nodes[0].get_center(), radius=0.1).set_color(GOLD)
        self.play(LaggedStartMap(FadeIn, nodes, lag_ratio=0.16), LaggedStartMap(GrowArrow, arrows, lag_ratio=0.18), run_time=1.0)
        self.play(LaggedStartMap(FadeIn, captions, lag_ratio=0.15), run_time=0.65)
        self.add(pulse)
        for node in nodes:
            self.play(pulse.animate.move_to(node.get_center()), Indicate(node, color=self.accent), run_time=0.72)
        self.formula(self.final_formula)


class GeometricPowerRule(BrowserLectureScene):
    title = "The power rule is visible in area"
    subtitle = "First-order strips survive; the tiny corner disappears"
    accent = GOLD

    def animate_concept(self):
        side = 2.35
        dx = 0.48
        square = Square(side_length=side).set_fill(CYAN, 0.12).set_stroke(CYAN, 3).shift(0.4 * LEFT + 0.25 * DOWN)
        right_strip = Rectangle(width=dx, height=side).set_fill(GOLD, 0.35).set_stroke(GOLD, 2).next_to(square, RIGHT, buff=0)
        top_strip = Rectangle(width=side, height=dx).set_fill(GOLD, 0.35).set_stroke(GOLD, 2).next_to(square, UP, buff=0)
        corner = Square(side_length=dx).set_fill(CORAL, 0.5).set_stroke(CORAL, 2).next_to(right_strip, UP, buff=0)
        x_label = self.text("x", 20, CYAN, BOLD).next_to(square, DOWN, buff=0.1)
        dx_label = self.text("dx", 18, CORAL, BOLD).next_to(corner, RIGHT, buff=0.1)
        first_order = self.text("2x · dx", 24, GOLD, BOLD).move_to([3.15, 0.7, 0])
        second_order = self.text("(dx)²", 22, CORAL, BOLD).next_to(first_order, DOWN, buff=0.55)
        arrow = Arrow(first_order.get_left(), right_strip.get_right(), buff=0.25).set_color(GOLD)
        self.play(ShowCreation(square), FadeIn(x_label), run_time=0.9)
        self.play(FadeIn(right_strip), FadeIn(top_strip), GrowArrow(arrow), FadeIn(first_order), run_time=1.05)
        self.play(FadeIn(corner), FadeIn(dx_label), FadeIn(second_order), run_time=0.8)
        self.play(corner.animate.scale(0.18), second_order.animate.set_opacity(0.18), run_time=1.05)
        self.formula("(x + dx)² − x² = 2x·dx + (dx)²   ⇒   d(x²)/dx = 2x")


class EpsilonDeltaLimit(BrowserLectureScene):
    title = "A limit is a tolerance guarantee"
    subtitle = "Choose epsilon first; then find a delta that works"
    accent = VIOLET

    def animate_concept(self):
        axes = self.axes(x_range=(-3.4, 3.4, 1), y_range=(-1.2, 3.2, 1), width=9.3, height=4.2)
        fn = lambda x: 0.25 * (x - 0.4) ** 2 + 0.6
        graph = axes.get_graph(fn).set_stroke(CYAN, 4)
        a = 0.8; limit = fn(a); epsilon = 0.55; delta = 0.85
        band = Rectangle(width=9.3, height=axes.c2p(0, limit + epsilon)[1] - axes.c2p(0, limit - epsilon)[1])
        band.set_fill(VIOLET, 0.12).set_stroke(VIOLET, 1).move_to(axes.c2p(0, limit))
        left = DashedLine(axes.c2p(a - delta, -1.1), axes.c2p(a - delta, 3.0)).set_stroke(GOLD, 2.5)
        right = DashedLine(axes.c2p(a + delta, -1.1), axes.c2p(a + delta, 3.0)).set_stroke(GOLD, 2.5)
        epsilon_label = self.text("L ± ε", 19, VIOLET, BOLD).next_to(band, RIGHT, buff=0.15)
        delta_label = self.text("a ± δ", 19, GOLD, BOLD).next_to(VGroup(left, right), DOWN, buff=0.12)
        self.play(ShowCreation(axes), ShowCreation(graph), run_time=0.95)
        self.play(FadeIn(band), FadeIn(epsilon_label), run_time=0.9)
        self.play(ShowCreation(left), ShowCreation(right), FadeIn(delta_label), run_time=1.0)
        self.play(band.animate.stretch(0.5, 1), left.animate.shift(0.36 * RIGHT), right.animate.shift(0.36 * LEFT), run_time=1.2)
        self.formula("every ε > 0 receives a δ > 0 that keeps nearby outputs inside the band")


class CurvatureOrders(BrowserLectureScene):
    title = "Higher derivatives refine the local model"
    subtitle = "Value, slope, and curvature predict progressively more"
    accent = GOLD

    def animate_concept(self):
        axes = self.axes(x_range=(-3.5, 3.5, 1), y_range=(-2, 2.3, 1), width=9.4, height=4.3)
        target = axes.get_graph(lambda x: 0.22 * x ** 3 - 0.55 * x).set_stroke(CYAN, 4)
        tangent = axes.get_graph(lambda x: -0.55 * x).set_stroke(GOLD, 3)
        quadratic = axes.get_graph(lambda x: -0.55 * x + 0.01 * x ** 2).set_stroke(VIOLET, 3)
        cubic = axes.get_graph(lambda x: -0.55 * x + 0.22 * x ** 3).set_stroke(CORAL, 3)
        center = Dot(axes.c2p(0, 0), radius=0.09).set_color(INK)
        self.play(ShowCreation(axes), ShowCreation(target), FadeIn(center), run_time=0.9)
        self.play(ShowCreation(tangent), run_time=0.85)
        self.play(Transform(tangent, quadratic), run_time=0.95)
        self.play(Transform(tangent, cubic), run_time=1.05)
        self.formula("local model = value + slope·h + ½ curvature·h² + higher orders")


class LocalStretchMap(StepwiseDerivation):
    title = "A derivative is a local stretch map"
    subtitle = "Zoom until nonlinear motion becomes almost linear"
    accent = GOLD
    steps = ("input interval", "zoom near x", "uniform stretch")
    final_formula = "f(x + h) − f(x) = f′(x)h + error smaller than h"


class SpanSweep(StepwiseDerivation):
    title = "Span is every reachable combination"
    subtitle = "Independent coefficient sliders sweep a line, plane, or space"
    accent = VIOLET
    steps = ("scale first vector", "scale second", "add tip-to-tail")
    final_formula = "span{v, w} = {av + bw : a,b are free}"


class AbstractVectorSpace(StepwiseDerivation):
    title = "Vector structure survives abstraction"
    subtitle = "Functions and polynomials obey the same add-and-scale rules"
    accent = VIOLET
    steps = ("choose objects", "define add + scale", "reuse linear tools")
    final_formula = "T(au + bv) = aT(u) + bT(v)"


class MatrixComposition(StepwiseDerivation):
    title = "Matrix multiplication is composition"
    subtitle = "The rightmost transformation moves the grid first"
    accent = VIOLET
    steps = ("x enters B", "B(x) enters A", "one product AB")
    final_formula = "(AB)x = A(Bx)     order matters"


class TransformThreeDimensions(StepwiseDerivation):
    title = "Three columns move three-dimensional space"
    subtitle = "The transformed basis becomes the edge frame of a new cube"
    accent = VIOLET
    steps = ("move i-hat", "move j-hat", "move k-hat")
    final_formula = "Ax = x₁Aî + x₂Aĵ + x₃A k-hat"


class DeterminantArea(BrowserLectureScene):
    title = "The determinant measures area scaling"
    subtitle = "Track the unit square through shear, stretch, and collapse"
    accent = GOLD

    def animate_concept(self):
        plane = NumberPlane((-5, 5), (-3, 3), width=10.3, height=5.0).set_stroke(GRID, 1).shift(0.25 * DOWN)
        origin = plane.c2p(0, 0)
        square = Polygon(origin, plane.c2p(1, 0), plane.c2p(1, 1), plane.c2p(0, 1)).set_fill(GOLD, 0.28).set_stroke(GOLD, 3)
        i_hat = Arrow(origin, plane.c2p(1, 0), buff=0).set_color(CYAN)
        j_hat = Arrow(origin, plane.c2p(0, 1), buff=0).set_color(CORAL)
        group = VGroup(plane, square, i_hat, j_hat)
        self.play(ShowCreation(plane), FadeIn(square), GrowArrow(i_hat), GrowArrow(j_hat), run_time=0.95)
        self.play(group.animate.apply_matrix([[1.45, 0.55], [0.2, 0.9]]), run_time=1.25)
        self.play(Indicate(square, color=GOLD), run_time=0.75)
        self.play(group.animate.apply_matrix([[1.0, -0.6], [0.0, 0.08]]), run_time=1.2)
        self.formula("det A = signed area after / area before     det A = 0 means collapse")


class DimensionBridge(StepwiseDerivation):
    title = "Nonsquare matrices bridge dimensions"
    subtitle = "Columns live in the output space, whatever its dimension"
    accent = MINT
    steps = ("n input numbers", "m × n matrix", "m output numbers")
    final_formula = "A ∈ R^(m×n) maps R^n → R^m     rank ≤ min(m,n)"


class ChangeOfBasis(StepwiseDerivation):
    title = "Change of basis translates coordinates"
    subtitle = "The vector stays fixed while its numerical description changes"
    accent = CYAN
    steps = ("B-coordinates", "translate with B", "apply + translate back")
    final_formula = "[T]_B = B⁻¹ T B"


class CrossProductArea(BrowserLectureScene):
    title = "The cross product packages oriented area"
    subtitle = "Unit-circle sine supplies the perpendicular height"
    accent = CORAL

    def animate_concept(self):
        origin = 3.3 * LEFT + 1.25 * DOWN
        v_end = origin + np.array([3.8, 0.45, 0])
        w_end = origin + np.array([1.65, 2.65, 0])
        v = Arrow(origin, v_end, buff=0).set_color(CYAN)
        w = Arrow(origin, w_end, buff=0).set_color(CORAL)
        parallelogram = Polygon(origin, v_end, v_end + w_end - origin, w_end).set_fill(GOLD, 0.2).set_stroke(GOLD, 2.5)
        height = DashedLine(w_end, np.array([w_end[0], origin[1] + 0.2, 0])).set_stroke(VIOLET, 2.5)
        angle = Arc(radius=0.65, start_angle=angle_of_vector(v_end - origin), angle=angle_of_vector(w_end - origin) - angle_of_vector(v_end - origin)).move_arc_center_to(origin).set_stroke(CORAL, 3)
        theta = self.text("θ", 21, CORAL, BOLD).next_to(angle, RIGHT, buff=0.06)
        height_label = self.text("|w| sin θ", 21, VIOLET, BOLD).next_to(height, RIGHT, buff=0.15)
        normal = Arrow(3.9 * RIGHT + 1.2 * DOWN, 3.9 * RIGHT + 1.75 * UP, buff=0).set_color(GOLD)
        normal_label = self.text("v × w", 20, GOLD, BOLD).next_to(normal, RIGHT, buff=0.12)
        self.play(GrowArrow(v), GrowArrow(w), ShowCreation(angle), FadeIn(theta), run_time=0.95)
        self.play(FadeIn(parallelogram), ShowCreation(height), FadeIn(height_label), run_time=1.05)
        self.play(GrowArrow(normal), FadeIn(normal_label), run_time=0.9)
        self.play(parallelogram.animate.set_fill(GOLD, 0.38), normal.animate.scale(1.2, about_point=normal.get_start()), run_time=0.85)
        self.formula("|v × w| = |v||w| sin θ     direction from the right-hand rule")


class VolumeDuality(StepwiseDerivation):
    title = "Cross-product duality encodes signed volume"
    subtitle = "A scalar volume measurement hides a representing vector"
    accent = GOLD
    steps = ("fix base v,w", "measure det[u,v,w]", "find dual normal")
    final_formula = "(v × w) · u = det[u v w]"


class CramerAreaRatio(StepwiseDerivation):
    title = "Cramer's rule reads coordinates as area ratios"
    subtitle = "Replace one basis column with the target vector"
    accent = GOLD
    steps = ("basis volume det A", "replace column i", "normalize ratio")
    final_formula = "xᵢ = det(Aᵢ) / det(A)"


class PartialDifferentialEquation(StepwiseDerivation):
    title = "A PDE evolves an entire function"
    subtitle = "Every point exchanges information with nearby points"
    accent = MINT
    steps = ("profile T(x,t)", "neighbor curvature", "time update")
    final_formula = "∂T/∂t = α ∂²T/∂x²"


class LaplaceProbes(StepwiseDerivation):
    title = "Laplace transforms test exponential modes"
    subtitle = "Decay and oscillation turn differential equations into algebra"
    accent = GOLD
    steps = ("signal f(t)", "weight by e^(−st)", "integrate response")
    final_formula = "F(s) = ∫₀^∞ f(t)e^(−st)dt     L{f′}=sF−f(0)"


class MatrixExponentialFlow(StepwiseDerivation):
    title = "The matrix exponential accumulates tiny maps"
    subtitle = "Continuous flow is the limit of repeated linear updates"
    accent = MINT
    steps = ("I + A·dt", "repeat n times", "continuous limit")
    final_formula = "e^(At) = lim (I + At/n)^n = Σ(At)^k/k!"


class BackpropagationFlow(BrowserLectureScene):
    title = "Backpropagation assigns responsibility"
    subtitle = "Error moves backward through weights and local derivatives"
    accent = CORAL

    def animate_concept(self):
        positions = [(-4.8, [-1.1, 1.1]), (-1.6, [-1.65, 0, 1.65]), (1.8, [-1.0, 1.0]), (4.8, [0])]
        layers = [VGroup(*[Circle(radius=0.3).set_fill("#FFFFFF", 1).set_stroke(VIOLET if index % 2 else CYAN, 2).move_to([x, y - 0.2, 0]) for y in ys]) for index, (x, ys) in enumerate(positions)]
        edges = VGroup(*[Line(left.get_center(), right.get_center()).set_stroke(GRID, 1.2) for left_layer, right_layer in zip(layers, layers[1:]) for left in left_layer for right in right_layer])
        error = Dot(layers[-1][0].get_center(), radius=0.11).set_color(CORAL)
        self.play(LaggedStartMap(ShowCreation, edges, lag_ratio=0.006), LaggedStart(*[FadeIn(layer) for layer in layers], lag_ratio=0.1), run_time=1.0)
        self.play(FadeIn(error), Indicate(layers[-1], color=CORAL), run_time=0.75)
        for layer in reversed(layers[:-1]):
            self.play(error.animate.move_to(layer[0].get_center()), layer.animate.set_fill(CORAL, 0.16), run_time=0.75)
        self.formula("δˡ = (Wˡ⁺¹ᵀ δˡ⁺¹) ⊙ σ′(zˡ)     gradients reuse cached activations")


class TokenProbabilityFlow(StepwiseDerivation):
    title = "Language models factor sequence probability"
    subtitle = "Each sampled token changes every later conditional distribution"
    accent = CYAN
    steps = ("tokens x₁…xₜ", "contextual logits", "sample next token")
    final_formula = "p(x₁…x_T) = ∏ p(x_t | x_<t)"


class MLPFactMemory(StepwiseDerivation):
    title = "Transformer MLPs detect and write features"
    subtitle = "Facts emerge from distributed gated associations"
    accent = VIOLET
    steps = ("detect direction", "nonlinear gate", "write update")
    final_formula = "MLP(x) = W_out φ(W_in x + b_in) + b_out"


class RiemannFundamentalTheorem(BrowserLectureScene):
    title = "Integration turns pieces into a total"
    subtitle = "Signed sums converge; a marginal strip reveals the derivative"
    accent = MINT

    def rectangles(self, axes, count):
        items = VGroup()
        left, right = -3.2, 2.25
        dx = (right - left) / count
        for index in range(count):
            x = left + index * dx
            height = 0.12 * x * x + 0.3 * x + 0.55
            base = axes.c2p(x + dx / 2, 0)
            top = axes.c2p(x + dx / 2, height)
            rect = Rectangle(width=abs(axes.c2p(x + dx, 0)[0] - axes.c2p(x, 0)[0]), height=abs(top[1] - base[1]))
            rect.set_fill(MINT if height >= 0 else CORAL, 0.2).set_stroke(MINT if height >= 0 else CORAL, 0.9)
            rect.move_to((base + top) / 2)
            items.add(rect)
        return items

    def animate_concept(self):
        axes = self.axes(x_range=(-3.5, 3.5, 1), y_range=(-1, 2.8, 1), width=9.5, height=4.25)
        fn = lambda x: 0.12 * x * x + 0.3 * x + 0.55
        graph = axes.get_graph(fn).set_stroke(CYAN, 4)
        coarse = self.rectangles(axes, 8)
        fine = self.rectangles(axes, 34)
        endpoint = 2.25
        dx = 0.24
        marginal = Rectangle(
            width=abs(axes.c2p(endpoint + dx, 0)[0] - axes.c2p(endpoint, 0)[0]),
            height=abs(axes.c2p(0, fn(endpoint))[1] - axes.c2p(0, 0)[1]),
        ).set_fill(GOLD, 0.45).set_stroke(GOLD, 2.5)
        marginal.move_to((axes.c2p(endpoint + dx / 2, 0) + axes.c2p(endpoint + dx / 2, fn(endpoint))) / 2)
        strip_label = self.text("f(x) · dx", 20, GOLD, BOLD).next_to(marginal, RIGHT, buff=0.12)
        self.play(ShowCreation(axes), ShowCreation(graph), run_time=0.9)
        self.play(FadeIn(coarse, lag_ratio=0.07), run_time=0.95)
        self.play(Transform(coarse, fine), run_time=1.35)
        self.play(FadeIn(marginal), FadeIn(strip_label), run_time=0.95)
        self.play(Indicate(marginal, color=GOLD), run_time=0.75)
        self.formula("∫ₐᵇ f(x)dx = F(b) − F(a)     and     d/dx ∫ₐˣ f(t)dt = f(x)")


class AreaSlopeBridge(BrowserLectureScene):
    title = "Area and slope are the same local change"
    subtitle = "Velocity accumulates into position; endpoint height becomes slope"
    accent = CYAN

    def animate_concept(self):
        velocity_axes = Axes((-3.2, 3.2, 1), (-1.2, 1.6, 1), width=9.2, height=2.0).set_stroke(GRID, 1.3).shift(1.0 * UP)
        position_axes = Axes((-3.2, 3.2, 1), (-1.2, 1.8, 1), width=9.2, height=2.0).set_stroke(GRID, 1.3).shift(1.35 * DOWN)
        velocity = lambda t: 0.72 * math.sin(t) + 0.28
        position = lambda t: -0.72 * math.cos(t) + 0.28 * t + 0.72
        velocity_graph = velocity_axes.get_graph(velocity).set_stroke(CORAL, 4)
        position_graph = position_axes.get_graph(position).set_stroke(CYAN, 4)
        endpoint = 1.45
        v_dot = Dot(velocity_axes.c2p(endpoint, velocity(endpoint)), radius=0.09).set_color(GOLD)
        s_dot = Dot(position_axes.c2p(endpoint, position(endpoint)), radius=0.09).set_color(GOLD)
        boundary = DashedLine(velocity_axes.c2p(endpoint, -1.0), velocity_axes.c2p(endpoint, velocity(endpoint))).set_stroke(GOLD, 2.5)
        slope = velocity(endpoint)
        center = position_axes.c2p(endpoint, position(endpoint))
        tangent = Line(center + np.array([-1.25, -0.36 * slope, 0]), center + np.array([1.25, 0.36 * slope, 0])).set_stroke(GOLD, 3)
        v_label = self.text("velocity v(t)", 18, CORAL, BOLD).next_to(velocity_axes, LEFT, buff=0.12)
        s_label = self.text("position s(t)", 18, CYAN, BOLD).next_to(position_axes, LEFT, buff=0.12)
        bridge = Arrow(v_dot.get_center(), s_dot.get_center(), buff=0.18).set_color(VIOLET)
        self.play(ShowCreation(velocity_axes), ShowCreation(velocity_graph), FadeIn(v_label), run_time=0.9)
        self.play(ShowCreation(position_axes), ShowCreation(position_graph), FadeIn(s_label), run_time=0.9)
        self.play(ShowCreation(boundary), FadeIn(v_dot), FadeIn(s_dot), GrowArrow(bridge), run_time=0.9)
        self.play(ShowCreation(tangent), Indicate(VGroup(v_dot, s_dot), color=GOLD), run_time=1.05)
        self.formula("s(t) = s(0) + ∫₀ᵗ v(τ)dτ     ⇔     s′(t) = v(t)")


class CharacteristicPolynomial(StepwiseDerivation):
    title = "Eigenvalues are the shifts that collapse space"
    subtitle = "The characteristic polynomial detects a nonzero null direction"
    accent = VIOLET
    steps = ("start with A − λI", "set determinant to zero", "solve null direction")
    final_formula = "det(A − λI)=0     in 2D: λ² − tr(A)λ + det(A)=0"


class LaplaceSolveOde(StepwiseDerivation):
    title = "Laplace transforms solve initial-value problems"
    subtitle = "Derivatives become algebra; poles become time-domain modes"
    accent = GOLD
    steps = ("transform ODE + initials", "factor Y(s) into poles", "invert each mode")
    final_formula = "y″+ay′+by=g(t)  →  Y(s)  →  Σ cₖ/(s−pₖ)  →  Σ cₖe^(pₖt)"


class BackpropagationCalculus(StepwiseDerivation):
    title = "Backpropagation is the chain rule organized"
    subtitle = "Multiply along paths, add at merges, reuse downstream factors"
    accent = CORAL
    steps = ("weight w changes z", "z changes activation", "activation changes cost")
    final_formula = "∂C/∂wⱼᵢ = (∂C/∂aⱼ)(∂aⱼ/∂zⱼ)(∂zⱼ/∂wⱼᵢ) = δⱼaᵢ"
