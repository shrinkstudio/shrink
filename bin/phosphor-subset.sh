#!/bin/sh
# Builds the self-hosted Phosphor subset from icons/phosphor.txt:
#   dist/icons/phosphor.woff2      the glyphs listed, nothing else (a few KB)
#   dist/icons/phosphor-embed.html paste into the Icons embed (Custom Code component)
# Needs python3 with fonttools + brotli (pip install fonttools brotli).
set -eu
VERSION=2.1.1
SRC="https://unpkg.com/@phosphor-icons/web@$VERSION/src/regular"
CDN="https://cdn.jsdelivr.net/gh/shrinkstudio/shrink@master/dist/icons"
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
curl -sf "$SRC/style.css" -o "$TMP/style.css"
curl -sf "$SRC/Phosphor.woff2" -o "$TMP/Phosphor.woff2"
mkdir -p dist/icons

RULES=""
CODES=""
for NAME in $(grep -v '^#' icons/phosphor.txt | grep .); do
  CODE=$(grep -A1 "^\.ph\.ph-$NAME:before" "$TMP/style.css" | grep -o '\\[0-9a-f]*' | tr -d '\\')
  [ -n "$CODE" ] || { echo "Unknown icon: $NAME" >&2; exit 1; }
  CODES="$CODES,U+$CODE"
  RULES="$RULES.ph.ph-$NAME:before{content:\"\\$CODE\"}"
done

python3 -m fontTools.subset "$TMP/Phosphor.woff2" --unicodes="${CODES#,}" \
  --flavor=woff2 --output-file=dist/icons/phosphor.woff2 2>/dev/null

cat > dist/icons/phosphor-embed.html <<HTML
<!-- Phosphor regular icons: self-hosted subset, no script, so icons show in the Designer too; each glyph keeps its 1em box.
     Only the icons in icons/phosphor.txt (shrinkstudio/shrink) render: add a name there and run bin/phosphor-subset.sh -->
<link rel="preload" as="font" type="font/woff2" crossorigin href="$CDN/phosphor.woff2" />
<style>@font-face{font-family:"Phosphor";src:url("$CDN/phosphor.woff2") format("woff2");font-weight:normal;font-style:normal;font-display:block}.ph{display:inline-block;width:1em;height:1em;font-family:"Phosphor"!important;speak:never;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;letter-spacing:0;font-feature-settings:"liga";font-variant-ligatures:discretionary-ligatures;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}$RULES</style>
HTML
rm -rf "$TMP"
echo "dist/icons/phosphor.woff2 $(wc -c < dist/icons/phosphor.woff2 | tr -d ' ') bytes, $(echo "${CODES#,}" | tr ',' '\n' | wc -l | tr -d ' ') icons"
