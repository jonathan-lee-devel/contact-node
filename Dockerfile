FROM node:16-alpine3.15

WORKDIR /usr/src/contact-node

COPY package*.json ./

RUN npm install
RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]
