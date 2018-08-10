---
title: Using NGINX, Let's Encrypt and Docker Swarm together
date: 2018-08-09
layout: post.jade
lang: en
tags: NGINX blog Let's Encrypt HTTPS SSL TLS Certbot Docker Swarm Microservices Kubernetes alternative DigitalOcean Digital Ocean
---

It's no secret that [Kubernetes](https://kubernetes.io/) has seen a booming interest in the past year or two. It's also known that its learning curve is steep and its complexity remains relatively high. Because of this I've been interested in looking for a simpler alternative to it in [Docker Swarm](https://docs.docker.com/engine/swarm/). The following is my **experiment** for setting up a Swarm Cluster that is able to publish different services using [Let's Encrypt](https://letsencrypt.org/) SSL certificates **with ease**.

#### Why Swarm?

I'm not going to talk about the good Kubernetes brings to the table (it's actually plenty of good), if interested you can look that up on your own. I'm just going to list a couple of benefits of Docker Swarm since they are the reason I chose to start dabbling on this topic:

* Swarm **comes packaged** within Docker CE meaning no further installation is needed
* A Swarm cluster is **easy to spin up and manage** with a couple of commands
* Machines/Instances/Droplets can **become worker nodes with a single command**
* Plenty of **great features come without including any other "project"**, i.e:
    * Service discovery
    * Load balancing within services
    * Rolling updates

Despite these (and probably other reasons) the most important for me is: **I want to do less ops**. I can't stress this enough, since I'm using this project to host my [blog](https://visualcosita.xyz/) and other side projects, my main goal is to **focus my time on the development of those services** and not on learning about state of the art container orchestration.

If the buzz is around Kubernetes and Swarm is considered [boring technology](http://mcfunley.com/choose-boring-technology), then good! That's aligned with our needs, which are clearly not the same as a company with employees working full-time.

#### Gateway to our inner network of services

So you want to expose 3 services to the public internet, they're 3 web apps that rely on 2 private services each. The services are called A, B, and C, while the private services are called A1, A2, B1, B2, C1, and C2. You own the domains **a.com**, **b.com**, and **c.com**. In the end we want something like this:

![Service Layout](/img/service-layout-swarm.png "Service Layout")

#### The reverse proxy from all domains to our services

There are many different ways we can achieve this. However we want a way to make each domain accessible with HTTPS using Let's Encrypt. Since this wasn't easy (or maybe not even possible) with existing tools I coded a CLI that would help with this named [lecli](https://github.com/fdoxyz/lecli).

Also, [based on a previous attempt I posted a while ago](/post/publishing-services-using-docker-compose-and-nginx-with-https) we can receive all incoming requests to a small NGINX container that will reverse proxy to the A, B, and C services. This would actually make all services private, and the only public service with access to ports `80` & `443` would be the reverse proxy.

So, a sample NGINX config snippet file to make this happen would be:

```
  http {
    server {
      listen 80 default_server;
      server_name a.com;

      location / {
        return 301 https://$server_name$request_uri;
      }

      location /.well-known/acme-challenge/ {
        proxy_pass http://5.39.70.224/;
      }
    }

    server {
      listen 443 default_server ssl;
      server_name a.com;

      ssl_certificate       /etc/nginx/ssl/swarm.pem;
      ssl_certificate_key   /etc/nginx/ssl/request.pem;

      location / {
        proxy_pass http://service-a:5000;
        proxy_read_timeout  90;
      }
    }

  ...
  # "b.com" and "c.com" should have an almost identical config
  ...

  }
```

Now what's happening here is that incoming requests are being redirected from HTTP to HTTPS **except** when they have the "Let's Encrypt HTTP challenge" form, this will make sense soon. Those requests are being redirected to a hardcoded IP Adress, which will be our "support server".

HTTPS requests will be served from port `443` using Let's Encrypt SSL certificates. Since this NGINX proxy will be another container inside our cluster we will need to create it's image, from a Dockerfile similar to this:

```
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY certificates/request.pem /etc/nginx/ssl/request.pem
COPY certificates/swarm.pem /etc/nginx/ssl/swarm.pem
```

I know this may seem as plenty of moving parts, bear with me though. At this point we have a Dockerfile to create a reverse proxy that will do 3 things:

* Redirect HTTP to HTTPS on 3 websites: a.com, b.com, and c.com
* Work as reverse proxy to 3 webapps that serve each domain (service discovery and load balancing is managed by Swarm networking)
* Redirect Let's Encrypt domain validation requests to our "support server"

We can now proceed by creating a GitHub private repo with the `nginx.conf` and `Dockerfile` for versioning.

#### The support server on DigitalOcean

I know this is lazy naming and there could even be a better way to include this server functionality into the cluster without the need of a separate server instance. But this is a nice balance between ease of setup and cleanliness I found after experimenting different approaches (which I know both terms subjective).

In the end, plenty of cloud providers will give you instances for $5/month or less... [Sign up with this link and get $10 free on DigitalOcean!](https://m.do.co/c/a0486648b173) (which will help me out too :winkwink:)

This server will have a cron job that will execute the [lecli CLI](https://github.com/fdoxyz/lecli). Head over to that repo and take a look at the README to understand the basics of how it works. So besides installing it `gem install lecli` you'll need to create a `build_proxy.sh` script similar to this:

```
#!/bin/sh
aws ecr get-login --region us-east-1 | cut -d' ' -f 1,2,3,4,5,6,9 | sh
docker build -t 123123123.ecr.us-east-1.amazonaws.com/r-proxy .
docker push 123123123.ecr.us-east-1.amazonaws.com/r-proxy
ssh -i /root/.ssh/swarm_manager root@10.2.2.2 'cd ~/server && bash -s' < deploy_stack.sh
ssh -i /root/.ssh/swarm_manager root@10.2.2.2 docker system prune -f
docker system prune -f
```

The previous script will be executed after a successful certificate request by the lecli CLI tool, and it will:

1. Login to [AWS ECR](https://aws.amazon.com/es/ecr/), which you can substitute with any other private container registry
2. Build and push the reverse proxy container image
3. SSH into the Swarm Manager (using private IP's) and execute the `deploy_stack.sh` script (which you'll need to create next)
4. After that it will just cleanup dangling images both locally and in the manager

What's inside the `deploy_stack.sh` file? It's just a simple script to redeploy the stack on the Swarm cluster. That means that the new container image will be pulled from ECR and then a new reverse proxy container with the updated Let's Encrypt certificates will be used. This script can be something similar to:

```
#!/bin/sh
aws ecr get-login --region us-east-1 | cut -d' ' -f 1,2,3,4,5,6,9 | sh
docker stack deploy -c docker-compose.yml --with-registry-auth stack_name
```

Again, this script is run on the Swarm manager which will gain access to ECR (to pull the new container images available) and redeploy the stack defined in the `docker-compose.yml` file.

So far I haven't talked about how to layout your stack, and I won't. You can read the Swarm Docs or take ideas from my previous post on [load balancing services using Swarm](/post/publishing-services-using-docker-compose-and-nginx-with-https) (focus on the `docker-compose.yml` file section) for ideas

#### Making sure Let's Encrypt finds the verification tokens

So by now you should have:

* The domains DNS pointing towards your cluster (more on this later)
* Your reverse proxy is forwarding Let's Encrypt requests to verify the domains to your support server

All you need is a server to respond to those requests. This is a simple solution for that (to run in the support server):

```
docker run -d --name simple-server --restart -p 80:80 -v "$PWD":/usr/local/apache2/htdocs/ httpd:2.4
```

Now just make sure the simple-server containers' volume matches the [challenges_relative_path](https://github.com/fdoxyz/lecli#lecliyml) so the lecli CLI tokens are accessible.

That's it! Your cluster's reverse proxy is relaying Let's Encrypt requests to your support server.

#### Different approaches for different purposes (and scales)

I omitted the way IP addresses are pointing to your cluster, because the reverse proxy has to be on a specific IP address and your domain DNS record pointing there. Or does it?

A simple way to solve this would be using the [options available](https://docs.docker.com/compose/compose-file/) for the `docker-compose.yml`. You could set a single dedicated worker node to host the reverse proxy container. This way you know on which droplet to find that container and use its IP address for your domains' DNS records.

Plenty of different solutions can be *hacked* using this idea. An example could be having 3 nodes for the reverse proxy service, but taking just one instance's IP address for the *a.com* DNS record, another IP address for the *b.com*, and a third IP address for *c.com* DNS record.

Regardless of the technique to be used there are pros and cons, mostly regarding the downtime of the droplets used for this entrypoint.

Since **I don't face heavy traffic on my projects**, my solution went towards housing the reverse proxy on the master node. Not recommended for important production settings because if your only manager node goes down taking along with him your only reverse proxy you'll be in trouble. However this is quite easy to setup using the placement constraint from the reverse proxy service as:

```
placement:
  constraints:
    - node.role == manager
```

The cluster topology would look like the following diagram, with each service in containers distributed throughout worker nodes:

![Manager Reverse Proxy Layout](/img/manager-swarm-layout.png "Manager Reverse Proxy Layout")

It's not difficult to see the bottleneck (or single point of failure) here. As stated before, if for whatever reason the manager node fails your entire cluster is out of reach. Under heavy load a single machine would have trouble keeping up, more even being such a crucial part of your infrastructure.

We all want to have services with millions of users, and we would be forced to scale our infrastructure to keep up with them. So I do have a topology that relies on these same principles to provide a more scalable solution.

As a disclaimer I haven't put this proposed solution to practice so it remains to be tested in a real life scenario. I'm open to suggestions on different approaches, but [hear me out on this one](/img/conspiracy_meme.jpg)...

#### A load balancer in front of your load balancers, [dawg](https://giphy.com/embed/Iiaru8TEGEbQs)

There are certain best practices when implementing high availability on Docker Swarm, like having multiple manager nodes and not placing any workload on them (configurable on `docker-compose.yml`).

In order to distribute the reverse proxy load we can have a reverse proxy on each worker node. This would mean that if a node goes down we still have all other worker nodes to receive any incoming request. To place a container on each worker node we can enable the `mode: global` setting.

The problem with this solution is we can no longer rely on the DNS record to forward towards all worker nodes' IP addresses. But on DigitalOcean we can use their [Load Balancer service](https://www.digitalocean.com/products/load-balancer/) with the following settings:

1. Make sure to mark all worker node droplets with a label "worker node"
2. [Create the Load Balancer](https://www.digitalocean.com/docs/networking/load-balancers/how-to/ssl-passthrough/) with a **passthrough** policy
3. Set the load balancer to forward all incoming traffic towards your droplets that have that "worker node" label

The topology should now resemble the following diagram

![DigitalOcean Reverse Proxy Layout](/img/do-swarm-layout.png "DigitalOcean Reverse Proxy Layout")

#### Conclusions

I don't recommend this for a production usage on a heavy traffic system. There are things that could go wrong and better solved/implemented in Kubernetes. However, for side projects and other smaller implementations it's a relatively easy way to manage a cluster, run your container workloads and host webapps in an efficient way.

There is nothing too scary here for someone with some general SysAdmin/Docker knowledge. Also there's no need to keep up with the fast pace Kubernetes ecosystem. Again, don't get me wrong, Kubernetes is probably "best tool for the job" on most cases, just not for everyone and certainly not me (at least for now).

#### CI/CD

I have my repositories setup with CI/CD using CircleCI and a bit of ducktape (a.k.a. bash). To quote back the previous example, a PR to the service "B1" will trigger CI. Whenever that PR is merged into master a container build is triggered and deployed to the cluster as well. This makes all the effort to set the "service paradigm" worth it. A blog post on this (maybe 4 line bash scripts & CircleCI setup) will hopefully come in the near future.

Until then, Pura Vida!
