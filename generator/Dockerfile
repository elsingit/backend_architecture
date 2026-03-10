FROM node:18-alpine

WORKDIR /app

RUN npm init -y && npm install amqplib

COPY . .

CMD [ "node", "index.js" ]
