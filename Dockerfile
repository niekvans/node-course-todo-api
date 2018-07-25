FROM node:slim

COPY . /app

RUN cd app && npm install --production && npm install nodemon

WORKDIR /app

CMD ["bash","bootstrap.sh"]