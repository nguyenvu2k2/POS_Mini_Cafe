FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p uploads/products && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "run", "pos:start"]
