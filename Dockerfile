FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    libglib2.0-0 \
    libgl1 \
    libegl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY backend/python/requirements.txt ./backend/python/requirements.txt

RUN pip3 install --no-cache-dir --break-system-packages \
    -r backend/python/requirements.txt

COPY . .

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]