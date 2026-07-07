#!/bin/sh
echo "yt-dlp version: $(yt-dlp --version)"
if [ -n "$COOKIES_BASE64" ]; then
  echo "$COOKIES_BASE64" | base64 -d > /tmp/ytdlp-cookies.txt
  echo "Cookies file size: $(wc -c < /tmp/ytdlp-cookies.txt) bytes"
  export COOKIES_FILE=/tmp/ytdlp-cookies.txt
fi
exec npm run start
