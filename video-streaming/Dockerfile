FROM node:18.17
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY index.js ./
COPY .env ./
COPY ./videos ./videos
CMD npm start
