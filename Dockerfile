FROM node:20-alpine
RUN apk add --no-cache ffmpeg python3 py3-pip curl
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp && /usr/local/bin/yt-dlp --version && /usr/local/bin/yt-dlp --list-impersonate-targets
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
RUN chmod +x start.sh
CMD ["./start.sh"]