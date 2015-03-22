# HDP-Viz
HDP Visualizer for component services

##Requirements
* NodeJS -- https://nodejs.org/
* Grunt
* Bower
* A Working HDP Cluster -- http://www.hortonworks.com

##Build Environment Setup
1. Have NodeJS Installed
	```
	sudo yum install gcc gcc-c++
	cd ~
	wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
	tar -xvzf node-v0.12.0.tar.gz
	cd node-v*
	./configure
	make
	make install
	node --version
	```
2. Install Grunt and Bower
	```
	npm -g install grunt-cli
	npm install -g grunt
	npm install -g bower
	```

##Build the App
1. Build the app with Grunt `grunt build`. This will place everything in the `dist` folder
2. Install App Dependecies
	```
	cd dist
	npm install --production
	```
3. Edit the `server.properties` file to point to your Hadoop environment.
4. Start the server with `node server/server.js`