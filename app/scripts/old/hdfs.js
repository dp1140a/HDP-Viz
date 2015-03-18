function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

(function() {
    var canvas = $('canvas').get(0);
    var ctx = canvas.getContext('2d')
    counterLabel = $('#counter').get(0),
        counter = 0,
        button = $('#submit_button')

    // Spawn the web worker ready to start generating file trees
    var hdfsWorker = new Worker("scripts/hdfsWorker.js");

    // Bind a handler so we know when data is available
    hdfsWorker.onmessage = function(event) {
        if (!event.data.success) {
            $('#errorContainer').trigger('showError', 'There was an error retrieving the data');
            return;
        }
        //console.log(event);
        if (event.data.message == "tree") {
            var data = event.data,
                root = data.tree;

            var assignColor = function(node) {
                var childLength = (node.children) ? node.children.length : 0;
                var base_color = node.color;

                if (base_color) {
                    var scheme = Please.make_scheme(Please.HEX_to_HSV(base_color), {
                        count: childLength,
                        scheme_type: 'analogous'
                    });

                    $.each(node.children, function(index, child) {
                        child.color = scheme[index];
                        assignColor(child);
                    });
                }
            };

            root.color = Please.make_color()[0];
            $.each(root.children, function(_, child) {
                child.color = Please.make_color()[0];
                assignColor(child);
            })
            window.chart = new Chart(ctx).MultiLevelPie([root], {
                animation: true,
                segmentWidth: 25,
                segmentHighlight: null,
                tooltipTemplate: function(c) {
                    return bytesToSize(c.value) + ' (' + c.label + ')';
                },
                responsive: false
            });

            canvas.onclick = function(evt) {
                var element = window.chart.getSegmentsAtEvent(evt);
                if (element) {
                    $('#counter').html(element[0].label + ': ' + bytesToSize(element[0].value));
                }
            }

            counter = 0;
        } else if (event.data.message == "path") {
            var path = event.data.path,
                rev = path.split("").reverse().join("");

            if (rev.length > 140) {
                rev = rev.substr(0, 140);
                path = "..." + rev.split("").reverse().join("");
            }

            counter++;
            $('#counter').html(counter + " paths processed");
        }
    };

    $("#renderForm").submit(function(e) {
        console.log("Getting HDFS");
        e.preventDefault();

        /
        if (window.chart) {
            window.chart.destroy();
        }

        var formData = {};
        $(this).serializeArray().map(function(x) {
            formData[x.name] = x.value;
        });
        //console.log(formData);
        hdfsWorker.postMessage(formData);
    });

}).call(this);
