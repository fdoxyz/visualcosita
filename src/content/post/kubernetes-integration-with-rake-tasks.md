---
title: Kubernetes integration with Rake tasks
date: 2019-06-02
layout: post.jade
lang: en
tags: Activek8s Docker Kubernetes cluster kubectl Ruby Rails Rake Tasks microservices
---

[Activek8s](https://github.com/fdoxyz/activek8s) is a gem that relies on certain conventions to provide a thorough [Kubernetes](https://kubernetes.io/) integration on a set of Rake tasks. The gem is a byproduct of a project I'm currently working on that relies on [Kubernetes](https://kubernetes.io/) to orchestrate our services and other tools (Redis, CI/CD, logging, etc). This is not the absolute truth, it's only a solution that worked for our team and we [open sourced on GitHub](https://github.com/fdoxyz/activek8s).

## Motivation

Maybe your team isn't entirely comfortable with port-forwarding a service in order to debug a certain problem found in the staging environment or rolling back a service's container image to the previous stable build. Maybe understanding the basics of Docker and Kubernetes is a challenging task to a considerable portion of your team. Maybe your project benefits from a SOA/microservices architecture, or maybe microservices were imposed on your project by someone, the fact is Kubernetes might be a good choice for it.

There's lots of ways to get to this point, but you're here. You're using Kubernetes on your project and not everyone on your team is comfortable with the tools or even the terms. Our team works on Rails, so my solution was to wrap complex & low level [kubectl](https://kubernetes.io/docs/reference/kubectl/overview/) commands with Rake tasks. The tool is intended to rely on a few conventions while trying to stay as customizable as possible.

## Objectives & capabilities

There's certain situations where being handy with kubectl is 
