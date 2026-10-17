# EN: Builds a validated Expo web release and serves the resulting static bundle from a minimal Nginx image.
# UK: Створює перевірений вебреліз Expo та обслуговує готовий статичний пакет із мінімального образу Nginx.

FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./

ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_WEB_URL
ARG RELEASE_BUILD=1
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_WEB_URL=$EXPO_PUBLIC_WEB_URL
ENV RELEASE_BUILD=$RELEASE_BUILD
RUN npx expo export --platform web

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
