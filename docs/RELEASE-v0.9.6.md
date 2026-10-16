# Release preparation — v0.9.6

This branch starts from the last verified `main` version. It holds the **installer for approved patches v0.9.5 and v0.9.6**. The approved binary PNG sprites are not in GitHub yet; the script below adds them from the user's two ZIP archives.

Use Termux on the Android phone that has the files saved in **Download**:

```sh
cd ~
git clone -b release/v0.9.6 https://github.com/Elusivedamir/hrabrolap.git hrabrolap-v096-release
cd ~/hrabrolap-v096-release
bash tools/import-v096-termux.sh
```

The importer validates ZIP checksums, installs both patches, runs `npm test`, stages only the approved game files, commits and pushes this release branch. It does **not** overwrite `~/hrabrolap-v095-test`, any older clones or browser localStorage. If GitHub authentication blocks the push, authenticate Git once and retry only `git push -u origin release/v0.9.6`.

When pushed, GitHub Actions must pass both Node and real mobile Chromium tests. Then merge into `main`, create immutable tag `v0.9.6`, build verified downloadable ZIP with *canonical-sprites.mjs*, *bucket-rest.mjs*, all 18 new PNGs, 4 bucket SVGs, and HTML preview pages. Never tag or mark release complete before the PNGs are committed and CI is green.

**Protected:** original combat animations, approved cat body, swords and the existing port/house background. Original cached user files and backup directories must never be committed.
