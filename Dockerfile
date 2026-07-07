FROM node:20-alpine
RUN apk add --no-cache ffmpeg python3 py3-pip curl
RUN pip3 install --break-system-packages --no-cache-dir --upgrade yt-dlp curl_cffi && yt-dlp --version
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
RUN chmod +x start.sh
CMD ["./start.sh"]