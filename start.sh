#!/usr/bin/env bash
# 問筊 - 本機部署，供局域網內其他人訪問

cd "$(dirname "$0")"
PORT="${PORT:-8765}"

# 獲取本機局域網 IP（macOS）
get_local_ip() {
  if command -v ipconfig &>/dev/null; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "本機"
  else
    hostname -I 2>/dev/null | awk '{print $1}' || echo "本機"
  fi
}

echo "=========================================="
echo "  問筊 - 擲筊問事"
echo "=========================================="
echo ""
echo "  本機訪問:  http://127.0.0.1:$PORT"
echo "  局域網訪問: http://$(get_local_ip):$PORT"
echo ""
echo "  同一 WiFi 下的手機/電腦可用上面局域網地址打開"
echo "  按 Ctrl+C 停止服務"
echo "=========================================="
echo ""

# 使用 Python 內建 HTTP 服務，綁定到所有網卡
if command -v python3 &>/dev/null; then
  exec python3 -m http.server "$PORT" --bind 0.0.0.0
elif command -v python &>/dev/null; then
  exec python -m http.server "$PORT" --bind 0.0.0.0
else
  echo "錯誤: 未找到 python3 或 python，請先安裝 Python"
  exit 1
fi
