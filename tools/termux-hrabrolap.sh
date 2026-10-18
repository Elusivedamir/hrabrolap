#!/usr/bin/env bash
# Hrabrolap Termux launcher: safe git update, reuse/start the existing-origin server,
# then open the chosen page. Never kill a server or change the save origin silently.
set -euo pipefail

fail() { printf '\nОшибка: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd -P)/$(basename "$0")"
ROOT="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd -P)"
PORT="${HRABROLAP_PORT:-8090}"
HOST="127.0.0.1"
MODE="${1:-p3}"
EXTRA=""

case "$MODE" in
  p3|review) PAGE="p3-review.html"; TITLE="просмотрщик первой главы" ;;
  game|play) PAGE="index.html"; TITLE="игра" ;;
  art|game-art) PAGE="index.html"; TITLE="игра · художественные кандидаты P3"; EXTRA="&p3Art=1" ;;
  atelier|armor) PAGE="equipment-preview.html"; TITLE="ателье анимаций" ;;
  save|backup) PAGE="save-manager.html"; TITLE="резервные копии" ;;
  ice|salamander|ice-boss) PAGE="ice-salamander-test.html"; TITLE="тест анимаций ледяной саламандры" ;;
  *) fail "Неизвестный режим '$MODE'. Используй: hrabrolap [p3|game|art|atelier|save|ice]" ;;
esac

[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT>=1024 && PORT<=65535 )) || fail "Некорректный порт: $PORT"
command -v git >/dev/null 2>&1 || fail "Установи git: pkg install git"
command -v python3 >/dev/null 2>&1 || fail "Установи Python: pkg install python"
git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Папка $ROOT не является репозиторием GitHub"

info "Храбролап · обновление main..."
# --ff-only never rewrites local commits, staged work or history.
if ! GIT_TERMINAL_PROMPT=0 git -C "$ROOT" pull --ff-only origin main; then
  fail "Не удалось безопасно обновиться. Не удаляй файлы и не делай git reset; пришли вывод Termux."
fi
[ -f "$ROOT/$PAGE" ] || fail "Файл $PAGE отсутствует после обновления"
[ -f "$ROOT/game.mjs" ] || fail "Не найден game.mjs"

# Install a one-word command for subsequent launches. Never overwrite a foreign launcher.
PREFIX_DIR="${PREFIX:-}"
if [ -n "$PREFIX_DIR" ] && [ -d "$PREFIX_DIR/bin" ]; then
  LAUNCHER="$PREFIX_DIR/bin/hrabrolap"
  if [ ! -e "$LAUNCHER" ]; then
    printf '#!/usr/bin/env bash\nexec bash %q "$@"\n' "$SCRIPT_PATH" > "$LAUNCHER"
    chmod 755 "$LAUNCHER"
    info "Установлена команда hrabrolap (можно: hrabrolap game)."
  elif ! grep -Fq "$SCRIPT_PATH" "$LAUNCHER" 2>/dev/null; then
    info "Команда hrabrolap уже занята другим файлом; существующий файл не меняю."
  fi
fi

if [ "$PORT" != "8090" ]; then
  info "Внимание: другой порт = другое браузерное сохранение. Штатный порт — 8090."
fi

# Exit 0 if server serves exact current assets; 1 if no listener; 2 if busy/wrong root.
probe_server() {
  python3 - "$ROOT" "$PAGE" "$PORT" <<'PY'
import pathlib, sys, urllib.request, urllib.error
root, page, port = pathlib.Path(sys.argv[1]), sys.argv[2], int(sys.argv[3])
for relative in ('game.mjs', page):
    url = f'http://127.0.0.1:{port}/{relative}'
    try:
        request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=1.5) as response:
            remote = response.read()
    except urllib.error.HTTPError:
        sys.exit(2)
    except (urllib.error.URLError, TimeoutError, OSError):
        sys.exit(1)
    if remote != (root / relative).read_bytes():
        sys.exit(2)
sys.exit(0)
PY
}

if probe_server; then
  info "Порт $PORT уже обслуживает актуальный Храбролап. Использую существующий сервер."
else
  STATUS="$?"
  if [ "$STATUS" -eq 2 ]; then
    fail "Порт $PORT занят другим сервером/старой копией. Не останавливаю его и не меняю порт, чтобы сохранить прогресс. Пришли скриншот этой ошибки."
  fi
  CACHE_DIR="$HOME/.cache/hrabrolap"
  mkdir -p "$CACHE_DIR"
  LOG="$CACHE_DIR/http-$PORT.log"
  info "Запускаю сервер на $HOST:$PORT..."
  nohup python3 -m http.server "$PORT" --bind "$HOST" --directory "$ROOT" > "$LOG" 2>&1 < /dev/null &
  SERVER_PID="$!"
  printf '%s\n' "$SERVER_PID" > "$CACHE_DIR/http-$PORT.pid"
  READY=0
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if probe_server; then READY=1; break; fi
    sleep 0.25
  done
  if [ "$READY" -ne 1 ]; then
    fail "Сервер не запустился или $PORT занят. Лог: $LOG. Не отключаю другие процессы."
  fi
fi

REV="$(git -C "$ROOT" rev-parse --short HEAD)"
URL="http://$HOST:$PORT/$PAGE?v=$REV$EXTRA"
info "Открываю $TITLE:"
info "$URL"
if command -v termux-open-url >/dev/null 2>&1; then
  if termux-open-url "$URL"; then exit 0; fi
fi
if command -v am >/dev/null 2>&1; then
  if am start -a android.intent.action.VIEW -d "$URL" >/dev/null 2>&1; then exit 0; fi
fi
info "Не получилось открыть браузер автоматически. Скопируй URL выше в Chrome."
