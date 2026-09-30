#!/usr/bin/env python3
"""Sync NAN II's games into the DAOMOTAN arcade (arcade/ in this site).

The games live on NAN II. Their master copies are on the Mac in ~/b9-games,
built by ~/b9-music/B9 Theme/source, and the same copies are pushed to the
robot's shelf. This script copies them here and makes the few changes a
public web page needs:

  - EXIT GAME goes back to the arcade (../), not to the robot's media library;
  - B9 Sans, the droid's own letterforms, comes from arcade/fonts/, not the
    robot's /library/;
  - the games' music engine is copied to arcade/music/engine.js, for the
    lobby's own arrangement of the NAN II Theme (arcade/music/lobby.js);
  - every page is marked window.DAOMOTAN_ARCADE, so a page can tell it is on
    the web. NAN II Facemaker uses it: it starts from a copy of NAN II's real
    faces (faces.json, copied here) and saves in the visitor's browser.

Everything else is left exactly as it plays on NAN II. On the web, the pages
see that they are not on the robot's shelf and act as plain pages (Melody
Cartridge keeps its songs in the browser, and nothing calls the robot).

    python3 tools/sync_arcade.py      # then look, commit and push

Every edit must match at least once, or the script stops: a game that
changed shape gets looked at before it goes out.
"""
import os
import re
import shutil
import sys

HOME = os.path.expanduser("~")
SHELF = os.path.join(HOME, "b9-games")
FONT = os.path.join(HOME, "b9", "library", "B9Sans.ttf")
ENGINE = os.path.join(HOME, "b9-music", "B9 Theme", "source", "engine.js")
# NAN II's real faces, for Facemaker's starting set. The mirror has the board's own; while the
# NAN II rename waits for the robot (2026-09-30), its branch has the set with the new mark.
FACES = [os.path.join(HOME, "b9-nan2-rename", "library", "b9_expressions.json"),
         os.path.join(HOME, "b9", "library", "b9_expressions.json")]
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCADE = os.path.join(SITE, "arcade")

# (the folder on NAN II's shelf, the arcade's folder)
GAMES = [
    ("NAN II Saves The Humans", "saves-the-humans"),
    ("NAN II Down The Wormhole", "down-the-wormhole"),
    ("NAN II Through The Black Hole", "through-the-black-hole"),
    ("Melody Cartridge", "melody-cartridge"),
    ("Fossegrim", "fossegrim"),
    ("NAN II Facemaker", "facemaker"),
]

EXIT = ("/library/B9_Media_Library.html#games", "../")
FONT_URL = ("/library/B9Sans.ttf", "../fonts/B9Sans.ttf")
MARK = "<script>window.DAOMOTAN_ARCADE = true;</script>\n"


def sync(title, slug):
    s = open(os.path.join(SHELF, title, "index.html"), encoding="utf-8").read()
    if s.count(EXIT[0]) < 1:
        sys.exit("%s: no EXIT GAME address to point at the arcade" % title)
    n_exit = s.count(EXIT[0])
    s = s.replace(*EXIT)
    n_font = s.count(FONT_URL[0])
    s = s.replace(*FONT_URL)
    left = [p for p in ("/library/", "/media/games/") if p in s]
    head = re.search(r"<head[^>]*>", s)          # the page's own; later ones are pages it exports
    if not head:
        sys.exit("%s: no <head> to mark" % title)
    s = s[:head.end()] + "\n" + MARK + s[head.end():]
    dst = os.path.join(ARCADE, slug)
    os.makedirs(dst, exist_ok=True)
    out = os.path.join(dst, "index.html")
    old = open(out, encoding="utf-8").read() if os.path.exists(out) else None
    open(out, "w", encoding="utf-8").write(s)
    state = "new" if old is None else ("unchanged" if old == s else "updated")
    print("%-30s %-9s %4d KB  exit x%d  font x%d%s" % (
        title, state, len(s.encode()) // 1024, n_exit, n_font,
        ("  (still mentions %s: robot-only paths, guarded)" % ", ".join(left)) if left else ""))


if __name__ == "__main__":
    os.makedirs(os.path.join(ARCADE, "fonts"), exist_ok=True)
    shutil.copy2(FONT, os.path.join(ARCADE, "fonts", "B9Sans.ttf"))
    os.makedirs(os.path.join(ARCADE, "music"), exist_ok=True)
    shutil.copy2(ENGINE, os.path.join(ARCADE, "music", "engine.js"))
    for title, slug in GAMES:
        sync(title, slug)
    faces = next(p for p in FACES if os.path.exists(p))
    shutil.copy2(faces, os.path.join(ARCADE, "facemaker", "faces.json"))
    print("faces.json from", faces)
    print("arcade:", ARCADE)
