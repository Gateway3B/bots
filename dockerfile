# Stage 1
FROM node:16.14.0-alpine AS build-step

RUN mkdir -p /app

WORKDIR /app

COPY package.json /app

RUN npm install --legacy-peer-dep

COPY . /app

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]