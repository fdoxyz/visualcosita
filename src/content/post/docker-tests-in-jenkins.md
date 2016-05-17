---
title: Running dockerized tests in Jenkins
date: 2016-05-16
layout: post.jade
lang: en
tags: Docker tests Jenkins dokku continuous integration CI
---

This post walks through my setup for managing [Continuous Integration](https://en.wikipedia.org/wiki/Continuous_integration) on personal projects with [Jenkins](https://jenkins.io/) using _dockerized_ tests. A little context: I'm using [Dokku PaaS](http://dokku.viewdocs.io/dokku/) to host most of these experiments (including this blog) so Jenkins will help as a self-hosted & open source CI solution. The example repo will be [fdoxyz/metalsmith-polyglot](https://github.com/fdoxyz/metalsmith-polyglot) and will continue to test all Pull Requests from now on.

A little familiarity with Docker and Dokku is recommended before attempting this _guide (?)_. I've talked about them in other posts and would suggest go read their docs first ([docker](https://docs.docker.com/) & [dokku](http://dokku.viewdocs.io/dokku/)) if not comfortable with them. I knew nothing about Jenkins before this, so that shouldn't be much of a problem.

I'm using a $10 droplet on [DigitalOcean](https://m.do.co/c/a0486648b173). $5 droplet worked too but every now and then the container crashed w/ out of memory error & I can't be bothered to find a workaround (probably enabling swap for the container or something down that line).

They also have a [_one-click-app_](https://m.do.co/c/a0486648b173) droplet button to deploy Dokku in case you're interested in an easy setup. Btw it's dangerous to go alone, take this [referral bonus for $10](https://m.do.co/c/a0486648b173) on your first droplet.

Making a Jenkins container work with Docker was a little bit of a struggle. There are multiple approaches but none worked with my bizarre ideas. [gianarb's blog](http://gianarb.it/blog/docker-inside-docker-and-jenkins-2) had a great starting point but I had to dig into [container-solutions](http://container-solutions.com/running-docker-in-jenkins-in-docker/) and lots of debugging to make it work the way I wanted.

Just to clarify, this is probably not the best way to test, it's just a way I wanted to try out. Once I got all the pieces working together it actually plays nicely since I believe __clean containerized tests__ can be reliable.

### Jenkins in a container managed by Dokku

First, SSH into your server as root. The following commands will: Create the app, the jenkins_home directory and customize the deployment flags using __docker-options__ plugin.

```bash
dokku apps:create jenkins
mkdir /home/dokku/jenkins/jenkins_home
chown dokku: /home/dokku/jenkins/jenkins_home

dokku docker-options:add jenkins deploy "--privileged"
dokku docker-options:add jenkins deploy "-v /usr/bin/docker:/usr/local/bin/docker"
dokku docker-options:add jenkins deploy "-v /var/run/docker.sock:/var/run/docker.sock"
dokku docker-options:add jenkins deploy "-v /home/dokku/jenkins/jenkins_home:/var/jenkins_home"

dokku docker-options:add jenkins deploy "-v /lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:ro"
dokku docker-options:add jenkins deploy "-v /usr/lib/x86_64-linux-gnu:/usr/lib/x86_64-linux-gnu:ro"
```

Dokku will now deploy your Jenkins after building the Dockerfile using all those flags. The container will run in privileged mode, mount the docker client, docker socket and the jenkins_home directory that was created inside the dokku project folder.

The last two options fix a problem where the daemon isn't able to find a couple of files (.so), you might not even experience this if you're lucky. I have a couple of theories over the origin of this but I'm not completely sure why it happens, however mounting them resolves it.

Since Dokku allows [Dockerfile deployments](http://dokku.viewdocs.io/dokku/deployment/dockerfiles/), create a new project named 'jenkins' with a git remote linked to the Dokku deployment. `Dockerfile` is all it's needed:

```Dockerfile
FROM jenkins:2.0

USER root
RUN apt-get update && \
    apt-get -y upgrade

RUN apt-get install -y sudo && \
    echo "jenkins ALL=NOPASSWD: ALL" >> /etc/sudoers
USER jenkins

EXPOSE 8080
```

This will execute Jenkins in a container with port `8080` exposed and give sudo powers to the jenkins user. [Push](http://dokku.viewdocs.io/dokku/deployment/dockerfiles/) the single-file project to the Dokku droplet and Jenkins should be accessible on port 8080.

First time deployment should [prompt the installation wizard](http://img.memecdn.com/the-wizard-will-install-your-software-now_o_2959609.jpg) (the first time installation secret will be located in `/home/dokku/jenkins/jenkins_home/secrets`). Installing recommended plugins works fine for unexperienced Jenkins users, like me.

To test Jenkins can execute docker commands, create an empty job that executes a bash script: `sudo docker version`. Look for the docker client and daemon versions in the build's Console Output.

### GitHub Integration

Lots of good tutorials out there cover this in depth, like [terlici blog post](https://www.terlici.com/2015/09/29/automated-testing-with-node-express-github-and-jenkins.html) did for testing node projects (using a plugin we won't need here). I'll just give a quick overview of what's necessary for the GitHub plugin integration we'll need.

* First install the [GitHub Pull Request Builder](https://wiki.jenkins-ci.org/display/JENKINS/GitHub+pull+request+builder+plugin) jenkins plugin:

```bash
Jenkins > Manage Jenkins > Manage Plugins
```

* Create a separate GitHub account for your Jenkins to use and request an access token in GitHub with the required permissions:

```bash
GitHub > Personal settings > Personal access tokens > Generate new token
```

* Add the access token generated in the previous step as credentials (tip: select __'Kind: Secret Text'__ instead of the default __'Username with password'__, at first it took me a while to figure it out):

```bash
Jenkins > Manage Jenkins > Configure System > Pull Request Builder > Credentials > Add
```

* Finally add the new user as collaborator to the projects you want to test

### Da test

Tests are going to be executed in isolated containers. Developers will be able to run tests and rest assured the environment where they will execute will be consistent. This is the [Dockerfile](https://github.com/fdoxyz/metalsmith-polyglot/blob/master/Dockerfile) used to execute the example repo tests:

```Dockerfile
####################################################
# Dockerfile for test execution
#
# docker build -t <YOUR_USER>/metalsmith-polyglot .
# docker run <YOUR_USER>/metalsmith-polyglot
####################################################
FROM node
#FROM node:4
#FROM node:5.11

MAINTAINER Fernando Valverde <fdov88@gmail.com>

WORKDIR /opt/test

ADD . /opt/test

CMD ["npm", "test"]
```

The test script inside will invoke `make test`. I chose to set it this way so using either the Makefile or `npm test` would work. The Makefile is also a little interesting:

```bash
.PHONY: test

mocha=node_modules/.bin/mocha

ifeq ("$(MOCHA_FILE)","/opt/results/test-results.xml")
  options=--reporter mocha-junit-reporter
endif

node_modules: package.json
	@npm install

test: node_modules
	$(mocha) $(options)
```

If the env variable `MOCHA_FILE` is set, then the JUnit reporter will be used to be consumed by Jenkins (stats, analytics and stuff). This way developers execute a normal mocha test suite but when executed by Jenkins (later on) will use a custom reporter.

### Job configuration & build steps

* Create a Freestyle Project.

```bash
Jenkins > New Item
```

* In _General_ set as GitHub project and provide the repo url.

* In _Source Code Management_ select Git and set the Repositories (no credentials needed in this case) and leave blank 'Branches to build' for building all branches.

* In _Build Triggers_ select GitHub Request Builder and check 'Use github hooks for build triggering'.

* In _Build Environment_ I selected 'Delete workspace before build starts' and also like to see timestamps in the Console Output... Whatever floats your boat.

* In _Build_ Docker hits the fan. It consists of 4 build steps, all of them 'Execute shell'. First one builds the test docker image.

```bash
sudo docker build -t fdoxyz/metalsmith-polyglot .
```

* Second one executes the test. It names the container for later disposal, mounts a volume for later retrieval of the JUnit results and sets the `MOCHA_FILE`.

```bash
sudo docker run --name $JOB_NAME-$BUILD_NUMBER-test -v $PWD:/opt/results --env MOCHA_FILE=/opt/results/test-results.xml fdoxyz/metalsmith-polyglot
```

* The third one was a big headache. An alpine retrieves the results from the volume mounted in the tests container from the previous step into the workspace. It's easy to mess up the volume mounts, Jenkins itself is running in a container with a mounted volume. I won't elaborate, but if you have any doubts feel free to ask in the comments.

```bash
sudo docker run --name $JOB_NAME-$BUILD_NUMBER-reader -v $PWD:/opt/results alpine cat /opt/results/test-results.xml > test-results.xml
```

* Forth and last build step, container cleanup.

```bash
sudo docker rm $JOB_NAME-$BUILD_NUMBER-test $JOB_NAME-$BUILD_NUMBER-reader
```

* Finally in _Post-build Actions_ add 'Publish JUnit test result report' and set 'Test report XMLs' to 'test-results.xml', which is the file we retrieved from the container filesystem in the third build step. Also add 'Set status for GitHub commit [universal]'.

### Pull Request

Now PR's will trigger a build and the jenkins GitHub user will update the status depending on the tests suite result. This is what to want to look for in your PRs from now on:

![PR passing tests](/img/pr-passing.png "PR passing tests")

A more detailed explanation of the test execution might be possible on failed tests, but again, can't be bothered to look that up right now. Jenkins will also listen to the admin comments: 'retest this please' will trigger a new build in Jenkins for example (useful to debug).

### Quick Conclusions

To recap, Jenkins lives inside a container managed by Dokku and runs tests as sibling containers on demand.

IMHO Jenkins deployments with master-slave setups are the way to go for real projects that require serious scaling, but hosting Jenkins with ease in a PaaS for personal projects was neat to figure out.

Does this makes no sense whatsoever to you? Am I murdering docker-in-docker? Constructive criticism is greatly appreciated, Pura Vida.
