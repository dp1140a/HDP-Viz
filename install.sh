#!/bin/bash

#http://www.unixmen.com/install-node-js-centos-7/
sudo yum install gcc gcc-c++
cd ~
wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
tar -xvzf node-v0.12.0.tar.gz
cd node-v*

./configure
make
make install

node --version

echo 'Installing grunt-cli'
npm -g install grunt-cli
echo 'Installing Grunt'
npm -g install grunt
echo 'Installing Bower'
npm -g install bower

npm install --production

echo 'All setup. Edit server.server.properties and then start the server with node server/server.js'