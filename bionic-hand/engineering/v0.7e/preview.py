"""Two plan views from the audited solids, seen along the joint axle."""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
from matplotlib import colors, pyplot as plt
from matplotlib.collections import PolyCollection
import numpy as np

from joint_cad import COLORS, cable_bodies, pose

PAPER = "#f5f7fa"
INK = "#233442"
MUTED = "#496475"


def draw(ax, delta):
    parts = pose(60, delta)
    parts.pop("frame_upper_ear")
    parts.update({f"cable_{i}": v for i, v in enumerate(cable_bodies(60))})
    faces = []
    for name, body in parts.items():
        tint = np.array(colors.to_rgb(COLORS[name.split("_")[0]]))
        verts, tris = body.tessellate(.25, .23)
        vertices = np.array([v.toTuple() for v in verts])
        for triangle in tris:
            verts = vertices[list(triangle)]
            normal = np.cross(verts[1]-verts[0], verts[2]-verts[0])
            length = np.linalg.norm(normal)
            if length > 1e-10:
                shade = .74 + .26 * abs(normal[2] / length)
                faces.append((verts[:, 2].mean(), verts[:, :2], shade * tint))
    faces.sort(key=lambda f: f[0])
    ax.add_collection(PolyCollection([f[1] for f in faces], facecolors=[f[2] for f in faces],
                                     edgecolors="face", linewidths=.18))
    ax.set_xlim(-39, 40)
    ax.set_ylim(-21, 35)
    ax.set_aspect("equal")
    ax.axis("off")
    opts = dict(color=INK, fontsize=10, arrowprops=dict(arrowstyle="-", color=MUTED))
    ax.annotate("Винт и ползун", ((-11, 4) if delta == 0 else (-5, 14)), (-36, 28), **opts)
    ax.annotate("Трос зафиксирован", (-17.5, 5.8), (-37, 15), **opts)
    target = (15, 25) if delta == 0 else (29, 0)
    ax.annotate("Рычаг пальца", target, (12, -13 if delta == 0 else -17), **opts)
    ax.scatter([0], [0], s=12, color="#183747", zorder=5)


def render(path):
    fig = plt.figure(figsize=(12, 6), facecolor=PAPER)
    gs = fig.add_gridspec(1, 2, left=.055, right=.945, bottom=.18, top=.77, wspace=.12)
    fig.text(.055, .905, "v0.7e · Освобождение пальца у шарнира", color=INK, fontsize=24, weight="bold")
    fig.text(.055, .85, "Два состояния одной CAD-сборки. Трос и барабан сохраняют положение.", color=MUTED, fontsize=12)
    for j, (d, title) in enumerate(((0, "Барабан 60° · палец 60°"), (60, "Барабан 60° · палец 0°"))):
        ax = fig.add_subplot(gs[0, j])
        draw(ax, d)
        ax.set_title(title, loc="left", fontsize=14, color=INK, fontweight="bold")
    fig.text(.055, .10, "12 мм хода ползуна  ·  около 17 оборотов М4×0,7  ·  ширина узла 19,6 мм без пыльника",
             color=INK, fontsize=12, weight="bold")
    fig.text(.055, .055, "Верхняя опора скрыта на обоих видах. Модель для стенда.", color=MUTED, fontsize=10)
    fig.savefig(path, dpi=140, facecolor=PAPER)
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("preview.png"))
    render(parser.parse_args().output)
