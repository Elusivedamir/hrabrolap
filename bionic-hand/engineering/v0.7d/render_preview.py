"""Render engineering views from the exact CAD pose, with selected guards hidden."""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
from matplotlib import colors, pyplot as plt
from matplotlib.collections import PolyCollection
import numpy as np

from release_cad import COLORS, pose

INK = "#1a2a37"
MUTED = "#486278"
PAPER = "#f4f7fa"
HIDDEN_IN_CUTAWAY = {"guard_fixed_cable_cover", "guard_index_ring"}
TOP = np.eye(3)
ISO = np.array([[0.866, 0.5, 0], [-0.25, 0.433, 0.866], [0.433, -0.75, 0.5]])


def draw_pose(ax, payout, engaged, projection, hidden):
    shaded = []
    for name, shape in pose(payout, engaged).items():
        if name in hidden:
            continue
        vertices, indices = shape.tessellate(0.30, 0.22)
        points = np.asarray([v.toTuple() for v in vertices])
        material = np.asarray(colors.to_rgb(COLORS[name.split("_")[0]]))
        for i, j, k in indices:
            world = points[[i, j, k]]
            triangle = world @ projection.T
            normal = np.cross(world[1] - world[0], world[2] - world[0])
            length = np.linalg.norm(normal)
            if length < 1e-9:
                continue
            light = 0.70 + 0.30 * abs(normal @ np.array([0.25, -0.25, 0.935]) / length)
            shaded.append((triangle[:, 2].mean(), triangle[:, :2], material * light))
    shaded.sort(key=lambda item: item[0])
    ax.add_collection(PolyCollection([tri for _, tri, _ in shaded], facecolors=[c for _, _, c in shaded],
                                     edgecolors="face", linewidths=0.20, antialiaseds=True))
    ax.autoscale()
    ax.set_aspect("equal")
    ax.axis("off")


def callout(ax, text, xy, point):
    ax.annotate(text, point, xytext=xy, color=INK, fontsize=10,
                arrowprops={"arrowstyle": "-", "color": MUTED, "lw": 1.1})


def top_panel(ax, payout, engaged, title):
    draw_pose(ax, payout, engaged, TOP, HIDDEN_IN_CUTAWAY)
    ax.set_xlim(-16, 77)
    ax.set_ylim(-34, 31)
    ax.set_title(title, loc="left", fontsize=13, color=INK, fontweight="bold", pad=7)
    callout(ax, "Винт М6×1", (24, -27), (56 if not payout else 30, -6))
    callout(ax, "Тормоз", (-12, 28), (-1.5, 23))
    callout(ax, "Стопорный штифт", (-14, -33), (1.5, -6))
    callout(ax, "Закрытый анкер троса", (34, 26), (50 + payout, 6))
    ax.axvline(53, ymin=0.27, ymax=0.69, lw=0.7, color="#457889", linestyle="--")
    if payout:
        ax.annotate("", (53, -22), (61, -22), arrowprops={"arrowstyle": "<->", "color": "#127389"})
        ax.text(56.9, -26, "8 мм", ha="center", color="#127389", fontsize=9)


def render(path):
    fig = plt.figure(figsize=(13, 8), facecolor=PAPER)
    grid = fig.add_gridspec(2, 2, left=0.05, right=0.95, top=0.83, bottom=0.085, wspace=0.12, hspace=0.18)
    fig.text(0.05, 0.935, "Аварийное ослабление троса · v0.7d", color=INK, fontsize=27, weight="bold")
    fig.text(0.05, 0.893, "Одноканальный стендовый узел. Трос остаётся закреплённым при ходе каретки.",
             color=MUTED, fontsize=12)
    top_panel(fig.add_subplot(grid[0, 0]), 0, True, "Исходное положение · 0 мм")
    top_panel(fig.add_subplot(grid[0, 1]), 8, False, "Конец хода · 8 мм")
    iso = fig.add_subplot(grid[1, 0])
    draw_pose(iso, 0, True, ISO, set())
    iso.set_title("Наружный вид CAD", loc="left", fontsize=13, color=INK, fontweight="bold")
    note = fig.add_subplot(grid[1, 1])
    note.axis("off")
    note.text(0.04, 0.83, "80 × 53,5 × 41 мм", color=INK, fontsize=22, weight="bold")
    note.text(0.04, 0.68, "Габарит одного канала", color=MUTED, fontsize=11)
    note.text(0.04, 0.50, "1 оборот  →  1 мм хода", color=INK, fontsize=14)
    note.text(0.04, 0.36, "6 положений стопора на оборот", color=INK, fontsize=12)
    note.text(0.04, 0.15, "Стендовая геометрия. Физических испытаний нет.", color="#8a4c29", fontsize=11)
    fig.text(0.05, 0.04, "Виды сверху показаны со снятой крышкой. Тормоз и каретка изображены по CAD.",
             color=MUTED, fontsize=10)
    fig.savefig(path, dpi=140, facecolor=PAPER)
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("preview.png"))
    render(parser.parse_args().output)
