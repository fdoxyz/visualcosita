---
title: Load balancing a Node.js app behind nginx proxy managed by docker compose
date: 2015-11-30
layout: post.jade
lang: en
tags: docker node.js nginx proxy mongodb docker-compose
---

[Docker](https://www.docker.com/), am I too late for the hype? So, I went to [DockerCon EU](http://europe-2015.dockercon.com/) a couple of weeks ago and even though I was not as experienced on Docker as most people out there, still managed to have a great time. The **speakers**, the **announcements**, the **demos**, the **food**... Everything incredible from beginning to end, on top of it learned lots of cool stuff and met some nice people. [**Swarm 1.0**](https://blog.docker.com/2015/11/swarm-1-0/) was kind of a big deal throughout the conference, and I'm looking forward to getting my hands dirty with it. But one step at a time, let's get into **docker-compose** first.

#### The architecture

Architecture is a big word for this, it's a proxy forwarding requests to a Node.js app that persists data into a mongodb store, basically `nginx -> app -> mongodb`.

In my mind, I wanted to manage distributed architectures as seamlessly as possible. But as soon as I got to Swarm territory I quickly realized that much more would be necessary to run everything the way I was imagining it (of course, a kubernetes-like manager with **waaaay** less functionalities is still a pretty big task).

Therefore the first goal I set myself towards that idea was to scale in a single host. The source is on [github, you can clone the repo](https://github.com/fdoxyz/nodejs-loadbalanced-dockercompose), look into it and try it out for yourself. If you're getting started with docker I recommend starting with their awesome docs for [Linux](https://docs.docker.com/linux/started/), [Windows](https://docs.docker.com/windows/started/) or [Mac](https://docs.docker.com/mac/started/).

#### The Node.js front app

In an attempt to keep it simple, an express generated template `express app_name` was the starting point. [Mongoose](http://mongoosejs.com/) for object modeling on mongodb. This is where I **could've** gone minimalistic but **didn't**, like this python version from [bfirsh's repo](https://github.com/bfirsh/compose-mongodb-demo) (the inspiration of the hit counter idea).

I wanted to include some **good practices** useful on bigger projects, so I decided to go for the overkill. **That's why** there are separated routes files, Schemas and development/production config environments on this micro use case.

The image is on the [docker hub](https://hub.docker.com/r/fdoxyz/node-hit-counter/) or can be built from the project repo. A nice trick is to load the dependencies on a **different layer** of the `Dockerfile` for cache purposes, you don't want to run `npm install` each time ;)

#### Proxy that shit

This is where things started to get tricky, at least on nginx the conf file needs to be reloaded dynamically whenever a new container is spawned. I used [jwilder/nginx-proxy](https://github.com/jwilder/nginx-proxy) that helps for that purpose exactly by listening to the Docker daemon.

Each app container needs to expose `VIRTUAL_HOST` env variable that the proxy will take as the upstream (forwading) addr. An in-depth explanation can be found in the [original post.](http://jasonwilder.com/blog/2014/03/25/automated-nginx-reverse-proxy-for-docker/) The `docker-compose.yml` file is the following:

```Bash
front:
    build: .
    environment:
    - VIRTUAL_HOST=~^front\..*\.xip\.io          #1
    links:
    - mongo                                      #2
    ports:
    - "3000"
mongo:
    image: mongo
loadb:
    image: jwilder/nginx-proxy
    environment:
    - DOCKER_CERT_PATH=/certs                    #3
    - DOCKER_HOST=$DOCKER_HOST
    - DOCKER_TLS_VERIFY=1
    volumes:
    - $DOCKER_CERT_PATH:/certs                   #4
    - /var/run/docker.sock:/tmp/docker.sock      #5
    ports:
    - "80:80"
```

As you can see in **#1**, the `front` container is exposing `~^front\..*\.xip\.io`. This will take advantage of [xip.io](http://xip.io) wildcard DNS, in case you are running on a **docker-machine** (like me) you can browse to `front.MACHINE_IP.xip.io` and they will resolve to `front.MACHINE_IP`, this helps with some development hassle.

The link with the database is made on **#2**.

The nginx-proxy image needs to communicate with the docker daemon, for Mac systems **#3** variables and **#4** volume mount set everything nginx needs (certificates and paths to enable the connection).

**#5** is just there for native Linux support (way simpler: directly mount the docker socket) but it has no effect on Mac systems.

#### JUST DO IT

That's it, let's give it a spin. Execute `docker-compose up -d` or `make` and the 3 base containers should rise. Browse or `curl` to `front.MACHINE_IP.xip.io` and you should see a counter on each visit. Great success!

Now, `docker-compose scale front=3` will spin up 2 extra nodes and the proxy will distribute the requests automatically. You can check if everything is working properly by executing `docker-compose logs` right before scaling up. This way you can see requests coming into nginx and the front node, after scaling you will see each request handled by a different node.

![single front container](/img/compose-scale-1.png "Single front container")

The logs have a nice built in color coding for each container. On the **first image**, the lonely front node (*front_1*) responding to each request behind nginx (*loadb_1*).

**After scaling**, each request is distributed amongst the available nodes (*front_1, front_2 & front_3*).

![front container scaled=3](/img/compose-scale-3.png "3 front containers")

#### Wrap up

If you've got 7mins to spare, there's this fun [video on youtube](https://www.youtube.com/watch?v=FJrs0Ar9asY) about some testing on a node app behind an nginx proxy. What's nice about the docker-compose approach is that there is no need to manually edit and reload the conf file or manually run the docker containers, so again kudos for [jwilder](https://github.com/jwilder/nginx-proxy) and all contributors to the nginx-proxy project.

I hope this might help anyone thinking on doing anything similar, I'm just trying out different stuff and writing about what I've learned. My next post will hopefully be on Swarm and a scalable app throughout multiple hosts. **Cheers & Pura Vida!**
