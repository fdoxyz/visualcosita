---
title: Running dockerized tests in Jenkins
date: 2016-05-16
layout: post.jade
lang: en
tags: Docker tests Jenkins dokku continuous integration CI
---

This post walks through my setup for managing [Continuous Integration](https://en.wikipedia.org/wiki/Continuous_integration) on personal projects with [Jenkins](https://jenkins.io/) using _dockerized_ tests. A little context: I'm using [Dokku PaaS](http://dokku.viewdocs.io/dokku/) to host most of these experiments (including this blog) so Jenkins will help as a self-hosted & open source CI solution. The example repo will be [fdoxyz/metalsmith-polyglot](https://github.com/fdoxyz/metalsmith-polyglot) and will continue to test all Pull Requests from now on.

A little familiarity with Docker and Dokku is recommended before attempting this _guide (?)_. I've talked about them in other posts and would suggest go read their docs first ([docker](https://docs.docker.com/) & [dokku](http://dokku.viewdocs.io/dokku/)) if not comfortable with them. I had no experience in managing Jenkins before this, therefore no experience on that seems necessary.

I'm using a $10/month droplet on [DigitalOcean](https://m.do.co/c/a0486648b173). $5 droplet worked too but with other containers & nginx running in there every now and then the container crashed w/ out of memory error. I just can't be bothered to find a workaround right now (probably enabling swap for the container or something down that line).

They also have a [_one-click-app_](https://m.do.co/c/a0486648b173) droplet button to deploy Dokku in case you're interested in an easy setup. Btw it's dangerous to go alone, take this [referral bonus for free $10](https://m.do.co/c/a0486648b173) on your first droplet.

Just to clarify: This might not be the best way to test, it's just a way I wanted to try out. Once I got all the pieces working together it plays nicely, I believe __clean containerized tests__ can be reliable. To scale this out for a docker-compose setup is a future endeavour. Before getting started, kudos to [gianarb's blog](http://gianarb.it/blog/docker-inside-docker-and-jenkins-2) & [container-solutions](http://container-solutions.com/running-docker-in-jenkins-in-docker/) for helping me set up most of this 'docker-in-docker' environment.

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

Dokku will build the Dockerfile and now deploy your Jenkins container using all those flags. The container will run in privileged mode, mount the docker client, docker socket and the jenkins_home directory that was created inside the dokku project folder.

The last two options fix a problem where the daemon isn't able to find a couple of files (.so). You might not experience this if you didn't messed up somewhere and didn't noticed like me :wink: . Either way, mounting them as read-only resolves it.

Since Dokku supports [Dockerfile deployments](http://dokku.viewdocs.io/dokku/deployment/dockerfiles/), create a new project named 'jenkins' with a git remote linked to the Dokku deployment. This `Dockerfile` is all it needs:

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

Lots of good tutorials out there cover this in depth, like [terlici blog post](https://www.terlici.com/2015/09/29/automated-testing-with-node-express-github-and-jenkins.html) did for testing node projects (using a plugin we won't need here). I'll just give a quick overview of what's necessary for the GitHub plugin integration I was looking for:

1. Install the [GitHub Pull Request Builder](https://wiki.jenkins-ci.org/display/JENKINS/GitHub+pull+request+builder+plugin) plugin
```bash
Jenkins > Manage Jenkins > Manage Plugins
```

2. Create a separate GitHub account for your Jenkins to use and request an access token in GitHub with the required permissions
```bash
GitHub > Personal settings > Personal access tokens > Generate new token
```

3. Add the access token generated in the previous step as credentials (tip: select __'Kind: Secret Text'__ instead of the default __'Username with password'__, at first it took me a while to figure it out)
```bash
Jenkins > Manage Jenkins > Configure System > Pull Request Builder > Credentials > Add
```

4. Finally add the new user as collaborator to the projects you want to test

### Da test

Tests are going to be executed in isolated containers. Developers will be able to run tests locally with Docker and rest assured the environment where they will execute will be consistent. This is the [Dockerfile](https://github.com/fdoxyz/metalsmith-polyglot/blob/master/Dockerfile) used to execute the example repo tests:

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

If the env variable `MOCHA_FILE` is set, then the JUnit reporter will be used to be consumed by Jenkins (stats, analytics and stuff). This way developers execute a normal mocha test suite but when executed by Jenkins (next step) will use a custom reporter.

### Job configuration & build steps

1. Create a Freestyle Project.
```bash
Jenkins > New Item
```

2. In ___General___ set as GitHub project and provide the repo url.

3. In ___Source Code Management___ select Git and set the Repositories (no credentials needed in this case) and leave blank 'Branches to build' for building all branches.

4. In ___Build Triggers___ select GitHub Request Builder and check 'Use github hooks for build triggering'.

5. In ___Build Environment___ I selected 'Delete workspace before build starts' and also like to see timestamps in the Console Output... Whatever floats your boat.

6. In ___Build___ Docker hits the fan. It consists of 4 build steps, all of them 'Execute shell'. The first one builds the test docker image.
```bash
sudo docker build -t fdoxyz/metalsmith-polyglot .
```

7. The second bash command actually executes the test. It names the container for later disposal, mounts a volume for later retrieval of the JUnit results and sets the `MOCHA_FILE` ENV variable.
```bash
sudo docker run --name $JOB_NAME-$BUILD_NUMBER-test -v $PWD:/opt/results --env MOCHA_FILE=/opt/results/test-results.xml fdoxyz/metalsmith-polyglot
```

8. The third bash command one was a big headache. An alpine container retrieves the results from the volume mounted in the tests container (from the previous step) into the workspace. It's easy to mess up the volume mounts, Jenkins itself is running in a container with a mounted volume. I won't elaborate, but if you have any doubts feel free to ask in the comments.
```bash
sudo docker run --name $JOB_NAME-$BUILD_NUMBER-reader -v $PWD:/opt/results alpine cat /opt/results/test-results.xml > test-results.xml
```

9. Fourth and last build step is basically container cleanup.
```bash
sudo docker rm $JOB_NAME-$BUILD_NUMBER-test $JOB_NAME-$BUILD_NUMBER-reader
```

10. Finally in ___Post-build Actions___ add 'Publish JUnit test result report' and set 'Test report XMLs' to 'test-results.xml', which is the file we retrieved from the container filesystem in the third build step. Also add 'Set status for GitHub commit [universal]'.

### Pull Request

Now PR's will trigger a build and the Jenkins GitHub user will update the status depending on the tests suite result.

![PR passing tests](/img/pr-passing.png "PR passing tests")

A more detailed explanation of the test execution might be possible on failed tests, I might update or give a follow up if I find something more on this subject. Jenkins will also listen to the admin comments in GitHub: 'retest this please' will trigger a new build in Jenkins for example (useful to debug).

### Quick Conclusions

To recap, Jenkins lives inside a container managed by Dokku and runs tests as sibling containers on demand.

[IMHO](http://www.urbandictionary.com/define.php?term=IMHO) Jenkins deployments with master-slave setups are the way to go for serious organizations that require scaling. However, hosting Jenkins with ease in a self-hosted PaaS for personal projects was neat to figure out and now they all live happily in a single VPS, each in their own container :)

Does this testing strategy makes no sense at all? Am I murdering docker-in-docker? Could this actually be an interesting solution for isolated tests? [Is this real life?](http://gph.is/13FrfSQ) Constructive criticism is greatly appreciated, Pura Vida.
