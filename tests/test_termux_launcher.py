"""Portable, offline QA for Termux launcher. Never operates on the user's phone."""
from __future__ import annotations
import functools
import http.server
import os
import pathlib
import shutil
import signal
import socket
import subprocess
import tempfile
import threading
import time
import unittest
import urllib.request

SOURCE = pathlib.Path(__file__).resolve().parents[1] / "tools" / "termux-hrabrolap.sh"


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class LauncherTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="hrabrolap-termux-")
        self.addCleanup(self.tmp.cleanup)
        self.base = pathlib.Path(self.tmp.name)
        self.root = self.base / "repo"
        (self.root / "tools").mkdir(parents=True)
        shutil.copyfile(SOURCE, self.root / "tools" / "termux-hrabrolap.sh")
        for filename in ("game.mjs", "p3-review.html", "index.html",
                         "equipment-preview.html", "save-manager.html"):
            (self.root / filename).write_text("fixture-" + filename, encoding="utf-8")
        self.home = self.base / "home"
        self.home.mkdir()
        self.prefix = self.base / "prefix"
        (self.prefix / "bin").mkdir(parents=True)
        self.mock_bin = self.base / "mock-bin"
        self.mock_bin.mkdir()
        git = self.mock_bin / "git"
        git.write_text(
            "#!/bin/sh\n"
            "if [ \"$1\" = -C ]; then shift 2; fi\n"
            "case \"$1\" in\n"
            " rev-parse) if [ \"$2\" = --short ]; then echo abc123; else echo true; fi ;;\n"
            " pull) echo 'Already up to date.' ;;\n"
            " *) exit 3 ;;\n"
            "esac\n", encoding="utf-8"
        )
        git.chmod(0o755)
        opener = self.mock_bin / "termux-open-url"
        opener.write_text("#!/bin/sh\nprintf '%s\\n' \"$1\" >> \"$OPENED_URL_FILE\"\n",
                          encoding="utf-8")
        opener.chmod(0o755)
        self.urls = self.base / "opened.txt"
        self.port = free_port()
        self.env = {
            **os.environ,
            "PATH": str(self.mock_bin) + os.pathsep + os.environ["PATH"],
            "PREFIX": str(self.prefix),
            "HOME": str(self.home),
            "OPENED_URL_FILE": str(self.urls),
            "HRABROLAP_PORT": str(self.port),
        }

    def launch(self, *args):
        return subprocess.run(
            ["bash", str(self.root / "tools" / "termux-hrabrolap.sh"), *args],
            cwd=str(self.root), env=self.env, capture_output=True, text=True, timeout=20
        )

    def http_server(self, directory):
        server = http.server.ThreadingHTTPServer(
            ("127.0.0.1", self.port),
            functools.partial(QuietHandler, directory=str(directory))
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        return server

    def test_shell_syntax(self):
        p = subprocess.run(["bash", "-n", str(SOURCE)], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stderr)

    def test_reuse_matching_server_and_install_single_word_command(self):
        self.http_server(self.root)
        result = self.launch("p3")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("существующий сервер", result.stdout)
        self.assertIn("/p3-review.html?v=abc123", self.urls.read_text())
        launcher = self.prefix / "bin" / "hrabrolap"
        self.assertTrue(launcher.exists())
        self.assertIn("exec bash", launcher.read_text())
        self.urls.unlink()
        cmd = subprocess.run(
            [str(launcher), "game"], env=self.env, capture_output=True,
            text=True, timeout=20
        )
        self.assertEqual(cmd.returncode, 0, cmd.stdout + cmd.stderr)
        self.assertIn("/index.html?v=abc123", self.urls.read_text())

    def test_foreign_server_stays_alive_and_browser_is_not_opened(self):
        foreign = self.base / "other-website"
        foreign.mkdir()
        (foreign / "game.mjs").write_text("unrelated application", encoding="utf-8")
        (foreign / "p3-review.html").write_text("unrelated page", encoding="utf-8")
        self.http_server(foreign)
        result = self.launch("p3")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("занят другим сервером", result.stderr)
        self.assertFalse(self.urls.exists())
        with urllib.request.urlopen(
            f"http://127.0.0.1:{self.port}/game.mjs"
        ) as response:
            self.assertEqual(response.read(), b"unrelated application")

    def test_first_launch_starts_server_without_changing_page_origin(self):
        result = self.launch("p3")
        pidfile = self.home / ".cache" / "hrabrolap" / f"http-{self.port}.pid"
        self.assertTrue(pidfile.exists(), result.stdout + result.stderr)
        pid = int(pidfile.read_text())
        try:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn(f":{self.port}/p3-review.html?v=abc123",
                          self.urls.read_text())
            with urllib.request.urlopen(
                f"http://127.0.0.1:{self.port}/p3-review.html"
            ) as response:
                self.assertEqual(response.read(), b"fixture-p3-review.html")
        finally:
            os.kill(pid, signal.SIGTERM)
            time.sleep(0.1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
