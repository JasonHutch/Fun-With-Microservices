FROM node:18.17
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY index.js ./
COPY .env ./
CMD npm start
