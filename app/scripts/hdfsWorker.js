/* jshint strict: false */
(function() {

    var HDFSCalculator = function(options) {
        this.options = options;

        this.verifyFilesystem = function() {
            return false; // TODO?
        };

        this.calculateSize = function(path) {
            var self = this;
            return new Promise(function(resolve, reject) {
                self.listPath(path).then(function(files) {
                    //console.log(files);
                    var promises = [],
                        children = [],
                        totalSize = 0;

                    for (var index in files) {
                        //console.log(file);
                        var file = files[index];
                        if (file.type === 'FILE') {
                            //console.log(file);
                            if (file.length === 0){
                                totalSize += 1;
                            }
                            else{
                                totalSize += file.length;
                            }

                            postMessage({
                                success: true,
                                message: 'path',
                                path: path + '/' + file.pathSuffix
                            });

                            var fileSize = file.length;
                            //console.log(fileSize);

                            children.push({
                                value: fileSize,
                                label: path + '/' + file.pathSuffix,
                                type: file.type,
                                size: fileSize,
                                children: []
                            });
                        } else {
                            if (path === '/') {
                                path = '';
                            }
                            promises.push(self.calculateSize(path + '/' + file.pathSuffix));
                        }
                    }

                    Promise.all(promises).then(function(files) {
                        for (index in files) {
                            var file = files[index];
                            //console.log(file);
                            totalSize += file.value;
                            children.push(file);
                        }

                        resolve({
                            label: path,
                            value: totalSize,
                            type: 'DIRECTORY',
                            children: children
                        });
                    }, function() {
                        reject();
                    });
                }, function() {
                    reject();
                });
            });
        };

        this.listPath = function(path) {
            var self = this;
            return new Promise(function(resolve, reject) {
                try {
                    //var url = "http://" + self.options.base_url + path + "?op=LISTSTATUS"
                    var url = '/hdfs?server=' + self.options.baseURL + '&path=' + path;
                    //console.log(url);
                    var req = new XMLHttpRequest();

                    req.onload = function() {
                        if (req.readyState === 4) {
                            if (req.status >= 200 && req.status < 400) {
                                //console.log(req.responseText);
                                resolve(JSON.parse(req.responseText).FileStatuses.FileStatus);
                            } else {
                                reject();
                            }
                        }
                    };

                    req.open('GET', url, true);
                    req.send();
                } catch (err) {
                    console.log(err);
                }
            });
        };
    };

    self.onmessage = function(e) {
        console.log(e.data['hdfs.namenode.host']);
        console.log(e.data['hdfs.namenode.port']);
        var baseURL = e.data['hdfs.namenode.host'] + ':' + e.data['hdfs.namenode.port'] + '/webhdfs/v1',
            calculator = new HDFSCalculator({
                baseURL: baseURL
            });

        calculator.calculateSize(e.data['hdfs.path'].replace(/\/{2,}$/, '')).then(function(tree) {
            //console.log(JSON.stringify(tree));
            postMessage({
                message: 'tree',
                success: true,
                tree: tree
            });
        }, function() {
            postMessage({
                success: false
            });
        });
    };
}).call(this);