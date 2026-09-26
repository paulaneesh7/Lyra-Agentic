"""Build favicon PNGs and the tab icon from public/favicon.svg.

The SVG is the header mark (no wordmark). Next.js serves src/app/favicon.ico
ahead of public/favicon.ico, so both copies are written.
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "public" / "favicon.svg"
PUBLIC = ROOT / "public"
APP_ICO = ROOT / "src" / "app" / "favicon.ico"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def rasterize(size: int) -> Image.Image:
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{ margin: 0; padding: 0; background: transparent; width: {size}px; height: {size}px; overflow: hidden; }}
  img {{ width: {size}px; height: {size}px; display: block; }}
</style>
</head>
<body><img src="{SVG.as_uri()}" width="{size}" height="{size}"></body>
</html>
"""
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "icon.html"
        shot = Path(tmp) / "icon.png"
        page.write_text(html)
        subprocess.run(
            [
                CHROME,
                "--headless",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                f"--default-background-color=00000000",
                f"--window-size={size},{size}",
                f"--screenshot={shot}",
                page.as_uri(),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        image = Image.open(shot).convert("RGBA")
    if image.size != (size, size):
        image = image.resize((size, size), Image.Resampling.LANCZOS)
    return image


def main() -> None:
    if not SVG.is_file():
        raise SystemExit(f"missing {SVG}")
    if not Path(CHROME).is_file():
        raise SystemExit("Google Chrome is required to rasterize favicon.svg")

    master = rasterize(512)
    master.save(PUBLIC / "icon-512.png")
    master.resize((192, 192), Image.Resampling.LANCZOS).save(PUBLIC / "icon-192.png")
    master.resize((32, 32), Image.Resampling.LANCZOS).save(PUBLIC / "favicon-32.png")

    # iOS paints transparent corners black, so sit the mark on the brand purple.
    apple = Image.new("RGBA", (180, 180), (107, 78, 163, 255))
    apple.alpha_composite(master.resize((180, 180), Image.Resampling.LANCZOS))
    apple.save(PUBLIC / "apple-touch-icon.png")

    ico = master.resize((256, 256), Image.Resampling.LANCZOS)
    ico_path = PUBLIC / "favicon.ico"
    ico.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])
    APP_ICO.write_bytes(ico_path.read_bytes())
    print("wrote icons from", SVG)


if __name__ == "__main__":
    main()
