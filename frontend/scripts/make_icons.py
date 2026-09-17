from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[1] / "public"


def rounded_rect(size: int, radius: int, color: tuple[int, int, int, int]):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=color)
    return img, d


def draw_mark(d: ImageDraw.ImageDraw, size: int) -> None:
    s = size / 32
    width = max(2, int(2.2 * s))
    d.line(
        [(9 * s, 25 * s), (9 * s, 7 * s), (22 * s, 16.2 * s), (22 * s, 25 * s)],
        fill=(255, 255, 255, 255),
        width=width,
        joint="curve",
    )
    r = max(1.5, 2.1 * s)
    cx, cy = 22 * s, 10 * s
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, 255))


def make(size: int, radius: int) -> Image.Image:
    img, d = rounded_rect(size, radius, (107, 78, 163, 255))
    draw_mark(d, size)
    return img


def main() -> None:
    make(192, 44).save(out / "icon-192.png")
    make(512, 112).save(out / "icon-512.png")
    make(180, 40).save(out / "apple-touch-icon.png")
    make(32, 8).save(out / "favicon-32.png")
    make(32, 8).save(out / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
    print("wrote icons into", out)


if __name__ == "__main__":
    main()
