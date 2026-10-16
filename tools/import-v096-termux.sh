#!/data/data/com.termux/files/usr/bin/bash
# Hrabrolap release/v0.9.6: install the TWO approved patch archives in a clean clone.
# Never touch ~/hrabrolap-v095-test, previous saves or original approved combat assets.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "release/v0.9.6" ]]; then
  echo "STOP: expected release/v0.9.6, got $BRANCH"
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "STOP: working tree has local changes. Nothing will be overwritten."
  git status --short
  exit 1
fi
D="${HOME}/storage/downloads"
P95="$D/hrabrolap-v0.9.5-canonical-patch.zip"
P96="$D/hrabrolap-v0.9.6-bucket-sleep-patch.zip"
for p in "$P95" "$P96"; do
  if [[ ! -f "$p" ]]; then
    echo "NOT FOUND: $p"
    echo "Download BOTH approved ZIP files from ChatGPT to the Android Downloads folder."
    exit 1
  fi
  unzip -tq "$p" >/dev/null
done
for cmd in python node unzip; do
  command -v "$cmd" >/dev/null || { echo "Install missing command: $cmd"; exit 1; }
done
TMP="$(mktemp -d "${TMPDIR:-/tmp}/hrabrolap-v096.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
unzip -qo "$P95" -d "$TMP"
unzip -qo "$P96" -d "$TMP"
echo "Applying canonical 12 frame sprites..."
python "$TMP/hrabrolap-canonical-v095/install_canonical.py" "$ROOT"
echo "Applying fishing buckets and 6 sleep frames..."
python "$TMP/hrabrolap-v096-bucket-sleep/install_v096.py" "$ROOT"
node --check game.mjs
node --check canonical-sprites.mjs
node --check bucket-rest.mjs
npm test
git diff --check
# Stage only the approved game sources, no caches, backups, Android secrets or saves.
git add game.mjs index.html style.css package.json \
  canonical-sprites.mjs bucket-rest.mjs \
  preview-canonical.html preview-bucket-sleep.html \
  tests/canonical.test.mjs tests/bucket-rest.test.mjs \
  assets/canonical/ assets/rest/ \
  art/scenery/bucket-empty.svg art/scenery/bucket-low.svg \
  art/scenery/bucket-mid.svg art/scenery/bucket-full.svg
echo "Check staged files:"
git diff --cached --stat
if git diff --cached --quiet; then
  echo "Nothing changed. Already imported."
  exit 0
fi
echo
echo "Assets and source changes are staged; creating v0.9.6 commit..."
git commit -m "feat: v0.9.6 canonical frames, fishing bucket stages and home sleep"
echo
echo "Pushing release branch to GitHub..."
git push --set-upstream origin release/v0.9.6
echo "UPLOAD COMPLETE: release/v0.9.6. Automated GitHub Actions QA will start."
