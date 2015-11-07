#######################################################
# Dockerfile for building my metalsmith powered website
#######################################################
FROM nginx
MAINTAINER Fernando Valverde <fdov88@gmail.com>

# Install NodeJS
RUN apt-get update && apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_5.x | bash - && \
    apt-get install -y nodejs

# Copy dependencies & install them
# This layer will cache dependencies unless they change
ADD package.json /tmp/package.json
RUN cd /tmp && \
    npm install

# Source->Deploy->Cleanup
ADD . /tmp
RUN cd /tmp && \
    node index.js deploy && \
    mv build/* /usr/share/nginx/html && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
