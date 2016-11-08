---
title: Publishing services using docker-compose and NGINX with HTTPS
date: 2016-10-29
layout: post.jade
lang: en
tags: Docker docker-compose TLS SSL HTTPS NGINX EC2 AWS Jenkins reverse proxy
---

This post will break down an example setup to deploy multiple HTTP services secured with TLS using [docker-compose](https://docs.docker.com/compose/overview/) with an NGINX proxy. I already had an SSL certificate for this website and figured my experiments could benefit from HTTPS, so here we are.

A single EC2 instance (or DigitalOcean, Azure, GCE, etc. equivalent) is more than enough to handle this, so less is better in this case. The `docker-compose.yml` will take care of the service layout. Since the compose file is integrated with [Docker Swarm](https://docker.github.io/swarm/overview/), scaling to a cluster with built-in orchestration becomes borderline trivial.

#### Before getting started

The services in this example consist of this website, a Jenkins (master) server, a REST API, a (non-publicly accessible) PostgreSQL database and NGINX to serve as reverse proxy.

I'm assuming you deployed an instance in [AWS EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html) and installed [docker](https://docs.docker.com/engine/installation/linux/ubuntulinux/) + [docker-compose](https://github.com/docker/compose/releases).

[EC2 Container Registry (ECR)](https://aws.amazon.com/ecr/) is probably the easiest trusted registry for our private images in this case. Feel free to use a different solution based on your needs/preferences.

__Hint:__ Setup an [IAM user/role](http://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) with restricted access to your account's resources.

#### The Reverse Proxy

You'll need an SSL private key and signed certificate. Check out [this gist](https://gist.github.com/bradmontgomery/6487319) if feeling a little lost on how to get/set it up. My certificate doesn't support subdomains (wildcard certificate = more $$), so I'll be using 'subfolders' to proxy different services.

Note that adding new services or changes in their URIs will require manual editing of this reverse proxy. Maybe not ideal, but a price I'm willing to pay for a few reasons (discussion out of the scope).

Build the reverse proxy image locally:
1. `mkdir r-proxy`
2. Copy your certificates (`.key` & `.crt` files)
3. Create an `nginx.conf` file similar to the following
(disclaimer: I'm [not an NGINX power user](https://twitter.com/thepracticaldev/status/705825638851149824)):

```
events {
  worker_processes 2;
	worker_connections 1024;
}

http {
  server {
    listen 80 default_server;
    listen [::]:80 default_server ipv6only=on;
    server_name visualcosita.xyz;                       ###Your Domain Name###
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl;
    listen [::]:443 default_server ipv6only=on;
    server_name visualcosita.xyz;

    ssl_certificate       /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key   /etc/nginx/ssl/certificate.key;

    location / {
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_pass http://visualcosita:5000;                    ###Service Name###
      proxy_read_timeout  90;
    }

    location /api/ {
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_pass http://api:5000;                             ###Service Name###
      proxy_read_timeout  90;
    }

    location ^~ /jenkins/ {
      proxy_set_header Host $host:$server_port;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_pass http://jenkins:8080/jenkins/;                ###Service Name###
      proxy_redirect http:// https://;

      sendfile off;
      proxy_max_temp_file_size 0;

      client_max_body_size       10m;
      client_body_buffer_size    128k;

      proxy_connect_timeout      90;
      proxy_send_timeout         90;
      proxy_read_timeout         90;

      proxy_buffer_size          4k;
      proxy_buffers              4 32k;
      proxy_busy_buffers_size    64k;
      proxy_temp_file_write_size 64k;
    }
  }
}

```

Notice that the `proxy_pass` in each location entry will depend on the service name declared in the compose file (below).

Now, the following Dockerfile builds the reverse proxy by adding the config file and SSL certificate files.

__Hint:__ Avoid adding your certificates to source control.

```
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY certificate.crt /etc/nginx/ssl/certificate.crt
COPY certificate.key /etc/nginx/ssl/certificate.key
```

Build and push the container image to the trusted registry:
1. Authenticate with ECR `aws ecr login | sh`
2. Create the repository  `aws ecr create-repository --repository-name r-proxy`
2. Build `docker build -t <REPO_URI>.amazonaws.com/r-proxy:latest .`
3. Push `docker push <REPO_URI>.amazonaws.com/r-proxy`

You will need to build and push to the registry all other private images needed.

#### Compose file

Below is a sample compose file to layout the services that match the reverse proxy configuration (or vice versa). To deploy the services:
1. SSH in the instance
2. Fetch/Pull/Copy your `docker-compose.yml`
2. Authenticate with ECR `aws ecr login | sh`
3. `docker-compose up -d`

```
version: '2'

services:
  proxy:
    image: <REPO_URI>.amazonaws.com/r-proxy
    restart: always
    networks:
      - front-tier
    depends_on:
      - api
      - jenkins
      - visualcosita
    ports:
      - "80:80"
      - "443:443"

  jenkins:
    image: jenkins:alpine
    restart: always
    environment:
      JENKINS_OPTS: --prefix=/jenkins
    networks:
      - front-tier
    volumes:
      - /opt/jenkins_home:/var/jenkins_home

  visualcosita:
    image: <REPO_URI>.amazonaws.com/visualcosita
    restart: always
    networks:
      - front-tier

  db:
    image: fdoxyz/test-postgres
    restart: always
    networks:
      - db-tier
    volumes:
      - /opt/postgresql:/var/lib/postgresql/data

  api:
    image: <REPO_URI>.amazonaws.com/jazz
    restart: always
    environment:
      NODE_ENV: development
      DB_CONN_STRING: postgres://test@db:5432/test
    depends_on:
      - db
    networks:
      - front-tier
      - db-tier

networks:
  front-tier:
  db-tier:
```

To update a service:
1. Push a new image to the registry
2. SSH in the instance
3. `docker-compose pull`
4. `docker-compose up -d`.

__FYI:__ In a swarm you get [rolling updates](https://docs.docker.com/engine/swarm/swarm-tutorial/rolling-update/) out of the box.

#### Wrapping up

Now we have 3 services publicly available via HTTPS. Deployments are manual, though.

The Jenkins service comes into play in a following post. I'll detail some configuration to achieve CI tests using on demand instances (not the [hack-ish experiment](/post/running-dockerized-tests-in-jenkins) from a while back).

Pura Vida.
