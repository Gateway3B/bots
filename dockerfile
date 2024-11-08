# Stage 1
FROM node:20.10.0-alpine AS build-step

RUN mkdir -p /app

WORKDIR /app

COPY package.json /app

RUN npm install --legacy-peer-dep --ignore-scripts=false

COPY . /app

RUN npm run build:all

CMD ["npm", "run", "start:allprod"]