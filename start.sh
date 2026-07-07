#!/bin/sh
if [ -n "$COOKIES_BASE64" ]; then
  echo "$COOKIES_BASE64" | base64 -d > /tmp/ytdlp-cookies.txt
  export COOKIES_FILE=/tmp/ytdlp-cookies.txt
fi
exec npm run start
