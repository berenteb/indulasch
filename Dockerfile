FROM node:14.15.4
WORKDIR /indulasch
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
