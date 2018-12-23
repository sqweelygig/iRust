FROM resin/raspberrypi3-node

WORKDIR /usr/src/imuse

RUN mkdir ./.ssh --mode=700 && \
	touch ./.ssh/github && \
	chmod 700 ./.ssh/github

RUN apt-get update && \
	apt-get install -yq git-core libfreetype6-dev && \
	apt-get clean

RUN git clone git://git.drogon.net/wiringPi
RUN cd wiringPi && ./build

RUN npm install -g node-gyp && \
	npm cache clean --force

COPY tsconfig.json ./tsconfig.json
COPY ssh_config /etc/ssh/ssh_config
COPY package.json ./package.json

RUN npm install --unsafe-perm && \
	npm cache clean --force

COPY src ./src

RUN npm run build && \
	rm -rf ./src && \
	rm ./tsconfig.json && \
	npm prune --production && \
	npm cache clean --force

CMD ["npm", "start"]
