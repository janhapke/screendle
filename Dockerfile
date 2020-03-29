FROM node:12-alpine

ENV NODE_ENV production
ENV NODE_PORT 80

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install --only=production

EXPOSE 80
CMD [ "npm", "start" ]
