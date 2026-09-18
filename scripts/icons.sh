#!/bin/sh
#
# Rasterises icons/icon.svg into the PNGs the manifest and iOS need. PNG because
# Android's launcher and iOS's home screen will not take an SVG, unlike the tab.
#
# The maskable variant carries extra padding: Android crops installed icons to
# a circle, squircle or whatever the launcher likes, and only the central 80%
# is guaranteed to survive, so the stopwatch is shrunk to sit inside that.
#
# Needs rsvg-convert (brew install librsvg).
set -eu
cd "$(dirname "$0")/../icons"

rsvg-convert -w 192 -h 192 icon.svg > icon-192.png
rsvg-convert -w 512 -h 512 icon.svg > icon-512.png
rsvg-convert -w 180 -h 180 icon.svg > apple-touch-icon.png

# Same drawing, scaled to 80% inside the tile.
sed 's/scale(0.72)/scale(0.56)/' icon.svg | rsvg-convert -w 512 -h 512 > icon-maskable-512.png

ls -l *.png
