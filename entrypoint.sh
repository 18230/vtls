#!/bin/sh
set -eu

# 输出错误并终止启动，避免平台上静默运行一个不可用实例。
fail() {
  echo "error: $*" >&2
  exit 1
}

PORT="${PORT:-8080}"
XRAY_PORT="${XRAY_PORT:-10000}"
UUID="${UUID:-}"
WS_PATH="${WS_PATH:-/vless}"

case "$PORT" in
  ''|*[!0-9]*) fail "PORT must be a number" ;;
esac

case "$XRAY_PORT" in
  ''|*[!0-9]*) fail "XRAY_PORT must be a number" ;;
esac

if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  fail "PORT must be between 1 and 65535"
fi

if [ "$XRAY_PORT" -lt 1 ] || [ "$XRAY_PORT" -gt 65535 ]; then
  fail "XRAY_PORT must be between 1 and 65535"
fi

if [ "$PORT" = "$XRAY_PORT" ]; then
  fail "PORT and XRAY_PORT must be different"
fi

if ! printf '%s' "$UUID" | grep -Eq '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'; then
  fail "UUID must be a valid UUID"
fi

case "$WS_PATH" in
  /*) ;;
  *) fail "WS_PATH must start with /" ;;
esac

if [ "${#WS_PATH}" -gt 64 ]; then
  fail "WS_PATH is too long"
fi

if printf '%s' "$WS_PATH" | grep -Eq '[[:space:]"'"'"'<>\\]'; then
  fail "WS_PATH contains unsupported characters"
fi

cat > /tmp/config.json <<EOF
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "listen": "127.0.0.1",
      "port": ${XRAY_PORT},
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "${UUID}",
            "email": "northflank"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "${WS_PATH}"
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom"
    }
  ]
}
EOF

xray run -config /tmp/config.json &
xray_pid="$!"

trap 'kill "$xray_pid" 2>/dev/null || true' INT TERM

sleep 1
if ! kill -0 "$xray_pid" 2>/dev/null; then
  fail "xray failed to start"
fi

node /server.js &
server_pid="$!"

wait "$server_pid"
status="$?"

kill "$xray_pid" 2>/dev/null || true
wait "$xray_pid" 2>/dev/null || true

exit "$status"
