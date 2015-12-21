/* jshint strict: false */
/* global d3: false */
/* global HADOOPOPTS: false */
(function() {
    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) {
            return '0 Byte';
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    $('#chartContainer').css('min-height', parseInt($('#page-wrapper').css('min-height')) / 1.25);
    //var canvas = $('canvas').get(0);
    //var ctx = canvas.getContext('2d')
    //var counterLabel = $('#counter').get(0),
    //button = $('#submit_button');
    var counter = 0;


    // Spawn the web worker ready to start generating file trees
    var hdfsWorker = new Worker('scripts/hdfsWorker.js');

    // Bind a handler so we know when data is available
    hdfsWorker.onmessage = function(event) {
        if (!event.data.success) {
            $('#errorContainer').trigger('showError', 'There was an error retrieving the data');
            return;
        }
        //console.log(event);
        if (event.data.message === 'tree') {
            //if () {} else {}

            var data = event.data,
                root = data.tree;
                //console.log(data);

            //d3.select('#chartContainer').append('button').text('Back To Top').on('click', console.log('hello'));
            //console.log($('#vizType option:selected').val().toLowerCase() === 'sunburst');
            if ($('#vizType option:selected').val().toLowerCase() === 'sunburst') {
                //console.log('doing sunburst');
                sunburstLayout(root);
            } else {
                treemapLayout(root);
            }


        } else if (event.data.message === 'path') {
            var path = event.data.path,
                rev = path.split('').reverse().join('');

            if (rev.length > 140) {
                rev = rev.substr(0, 140);
                path = '...' + rev.split('').reverse().join('');
            }

            counter++;
            $('#counter').html(counter + ' paths processed');
        }
    };

    $('#renderForm').submit(function(e) {
        //console.log('Getting HDFS');
        e.preventDefault();

        if ($('#chartContainer').children()) {
            $('#chartContainer').html('');
        }

        var formData = {};
        var curConf = HADOOPOPTS.getConf();
        //console.log(curConf);
        $(this).serializeArray().map(function(x) {
            formData[x.name] = x.value;
            formData['hdfs.namenode.host'] = curConf.hdfs.namenode.host;
            formData['hdfs.namenode.port'] = curConf.hdfs.namenode.port;
        });

        hdfsWorker.postMessage(formData);
    });

    var sunburstLayout = function(root) {
        var margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };
        var width = parseInt(d3.select('#chartContainer').style('width'), 10);
        width = (width - margin.left - margin.right) * 0.85;

        var height = parseInt(d3.select('#chartContainer').style('height'), 10);
        height = (height - margin.top - margin.bottom);
        var radius = Math.min(width, height) / 2;

        var x = d3.scale.linear()
            .range([0, 2 * Math.PI]);

        var y = d3.scale.sqrt()
            .range([0, radius]);

        var color = d3.scale.category20();
        var svg = d3.select('#chartContainer').append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + (height / 2) + ')');

        var partition = d3.layout.partition()
            .sort(null)
            .value(function() {
                return 1;
            });

        var arc = d3.svg.arc()
            .startAngle(function(d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
            })
            .endAngle(function(d) {
                return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
            })
            .innerRadius(function(d) {
                return Math.max(0, y(d.y));
            })
            .outerRadius(function(d) {
                return Math.max(0, y(d.y + d.dy));
            });

        // Keep track of the node that is currently being displayed as the root.
        var node;

        node = root;
        var click = function(d) {
            node = d;
            path.transition()
                .duration(1000)
                .attrTween('d', arcTweenZoom(d));
        };
        d3.select('#chartContainer').style('height', height + 'px');

        // Setup for switching data: stash the old values for transition.
        var stash = function(d) {
            d.x0 = d.x;
            d.dx0 = d.dx;
        };

        var path = svg.datum(root).selectAll('path')
            .data(partition.nodes)
            .enter().append('path')
            .attr('d', arc)
            .attr('flabel', function(d) {
                return d.label;
            })
            .attr('fsize', function(d) {
                return d.value;
            })
            .style('fill', function(d) {
                var name;
                if (d.children) {
                    name = d.label;
                } else if (!d.parent && !d.children) {
                    name = d.label;
                } else {
                    name = d.parent.label;
                }
                return color(name);
            })
            .on('click', click)
            .each(stash);

        $('svg path').tipsy({
            gravity: 'c',
            html: true,
            delayIn: 500,
            title: function() {
                var elm = $(this)[0].__data__;

                if (elm.type === 'FILE') {
                    return elm.label + '<br/>' + bytesToSize(elm.size);
                } else {
                    return 'Directory<br/>' + elm.label;
                }
            }
        });



        // When switching data: interpolate the arcs in data space.
        var arcTweenData = function(a, i) {
            var oi = d3.interpolate({
                x: a.x0,
                dx: a.dx0
            }, a);

            var tween = function(t) {
                var b = oi(t);
                a.x0 = b.x;
                a.dx0 = b.dx;
                return arc(b);
            };
            if (i === 0) {
                // If we are on the first arc, adjust the x domain to match the root node
                // at the current zoom level. (We only need to do this once.)
                var xd = d3.interpolate(x.domain(), [node.x, node.x + node.dx]);
                return function(t) {
                    x.domain(xd(t));
                    return tween(t);
                };
            } else {
                return tween;
            }
        };

        // When zooming: interpolate the scales.
        var arcTweenZoom = function(d) {
            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
            return function(d, i) {
                return i ? function() {
                    return arc(d);
                } : function(t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                    return arc(d);
                };
            };
        };

        svg.onclick = function(evt) {
            var element = window.chart.getSegmentsAtEvent(evt);
            if (element) {
                $('#counter')(element[0].label + ': ' + bytesToSize(element[0].value));
            }
        };

        counter = 0;

        var controlPanel = $('<button/>', {
            class: 'btn btn-sm btn-default',
            text: 'Back To Top',
            click: function() {
                node = root;

                path.transition()
                    .duration(1000)
                    .attrTween('d', arcTweenZoom(root));
            }
        });
        $('#chartContainer').append(controlPanel);
    };

    var treemapLayout = function(root) {
        var w = 1280 - 80,
            h = 800 - 180,
            x = d3.scale.linear().range([0, w]),
            y = d3.scale.linear().range([0, h]),
            color = d3.scale.category20(),
            node;

        var treemap = d3.layout.treemap()
            .round(false)
            .size([w, h])
            .sticky(true)
            .value(function(d) {
                return d.size;
            });

        var svg = d3.select('#chartContainer').append('svg')
            .attr('width', w)
            .attr('height', h)
            .append('g')
            .attr('transform', 'translate(.5,.5)');

        node = root;

        var nodes = treemap.nodes(root)
            .filter(function(d) {
                return !d.children;
            });
        var cell = svg.datum(root).selectAll('g')
            .data(nodes).enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('width', function(d) {
                return d.dx;
            })
            .attr('height', function(d) {
                return d.dy;
            })
            .style('fill', function(d) {
                return color(d.parent.label);
            })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .on('click', function(d) {
                //console.log(d);
                return zoom(node === d.parent ? root : d.parent);
            });

        /**
                cell.append('rect')
                    .attr('width', function(d) {
                            return d.dx;
                    })
                    .attr('height', function(d) {
                            return d.dy;
                    })
                    .style('fill', function(d) {
                        return color(d.parent.label);
                    });
        **/

        cell.append('text')
            .attr('x', function(d) {
                return d.dx / 2;
            })
            .attr('y', function(d) {
                return d.dy / 2;
            })
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .text(function(d) {
                return d.label;
            })
            .style('opacity', function(d) {
                d.w = this.getComputedTextLength();
                return d.dx > d.w ? 1 : 0;
            });

        $('svg rect').tipsy({
            gravity: 'c',
            html: true,
            delayIn: 1250,
            title: function() {
                var elm = $(this)[0].__data__;

                if (elm.type === 'FILE') {
                    return elm.label + '<br/>' + bytesToSize(elm.size);
                } else {
                    return 'Directory<br/>' + elm.label;
                }
            }
        });
        /**
            function size(d) {
                return d.size;
            }

            function count() {
                return 1;
            }
        **/

        function zoom(d) {
            //console.log(d);
            var kx = w / d.dx,
                ky = h / d.dy;
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            var t = svg.selectAll('g').transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .attr('transform', function(d) {
                    return 'translate(' + x(d.x) + ',' + y(d.y) + ')';
                });

            t.select('rect')
                .attr('width', function(d) {
                    return kx * d.dx;
                })
                .attr('height', function(d) {
                    return ky * d.dy;
                });

            t.select('text')
                .attr('x', function(d) {
                    return kx * d.dx / 2;
                })
                .attr('y', function(d) {
                    return ky * d.dy / 2;
                })
                .style('opacity', function(d) {
                    return kx * d.dx > d.w ? 1 : 0;
                });

            node = d;
            d3.event.stopPropagation();
        }
    };
}).call(this);
