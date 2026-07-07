#!/bin/sh
if [ -n "$COOKIES_BASE64" ]; then
  echo "$COOKIES_BASE64" | base64 -d > /tmp/ytdlp-cookies.txt
  sed -i '1s/^\xEF\xBB\xBF//' /tmp/ytdlp-cookies.txt 2>/dev/null || true
  export COOKIES_FILE=/tmp/ytdlp-cookies.txt
fi
exec npm run start
