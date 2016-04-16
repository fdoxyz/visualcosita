#######################################################
# Dockerfile for building my metalsmith powered website
#######################################################
FROM mhart/alpine-node:4
MAINTAINER Fernando Valverde <fdov88@gmail.com>

WORKDIR /app

# Dependencies
ADD package.json /app/package.json
RUN npm config set registry http://registry.npmjs.org
RUN npm install && npm ls
RUN mv /app/node_modules /node_modules

#Generate site
ADD . /app
RUN node build.js deploy

CMD ["node", "server.js"]
