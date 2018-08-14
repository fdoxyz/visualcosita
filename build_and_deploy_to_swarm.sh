#!/bin/sh
aws ecr get-login --region us-east-1 | cut -d' ' -f 1,2,3,4,5,6,9 | sh
docker build -t 641394544604.dkr.ecr.us-east-1.amazonaws.com/visualcosita .
docker push 641394544604.dkr.ecr.us-east-1.amazonaws.com/visualcosita
ssh -i /root/.ssh/visualcosita root@10.132.2.7 'cd /root/visualcosita-server && ./deploy_vc_stack.sh'
ssh -i /root/.ssh/visualcosita root@10.132.2.7 docker system prune -f
docker system prune -f
