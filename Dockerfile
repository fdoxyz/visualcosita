#######################################################
# Dockerfile for building my metalsmith powered website
#######################################################

FROM nginx
MAINTAINER Fernando Valverde <fdov88@gmail.com>

# Install NodeJS
RUN apt-get update && apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_5.x | bash - && \
    apt-get install -y nodejs

# Copy dependencies & install them (layers cache unless dependencies change)
ADD package.json /tmp/package.json
RUN cd /tmp && \
    npm install

# Setup
RUN mkdir -p /opt/app && \
    cp -a /tmp/node_modules /opt/visualcosita/

ADD . /opt/app
RUN cd /opt/app && \
    node index.js deploy && \
    mv build/* /usr/share/nginx/html && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /opt/visualcosita
