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

cd -
echo "Running npm installs"
npm install grunt --save-dev
npm install -g grunt-cli 
npm install -g bower
npm install time-grunt
npm install load-grunt-tasks
npm install grunt-autoprefixer
npm install grunt-concurrent
npm install grunt-contrib-clean
npm install grunt-contrib-concat
npm install grunt-contrib-connect
npm install grunt-contrib-copy
npm install grunt-contrib-cssmin
npm install grunt-contrib-htmlmin
npm install grunt-contrib-imagemin
npm install grunt-contrib-jshint
npm install grunt-contrib-uglify
npm install grunt-contrib-watch
npm install grunt-exec
npm install grunt-hapi
npm install grunt-mocha
npm install grunt-newer
npm install grunt-rev
npm install grunt-svgmin
npm install grunt-usemin
npm install grunt-wiredep
npm install jshint-stylish

echo "Running bower install"
bower install --allow-root --config.interactive=false

echo "Running grunt build..."
grunt build  --force

echo "Running HDP-Vize install..."
npm install --production


echo 'All setup. Edit server.server.properties and then start the server with node server/server.js'
