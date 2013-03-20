

window.ntp = window.ntp || {

    m0: null,
    o0: null,

    scale: {
        orthographic: 380,
        stereographic: 380,
        gnomonic: 380,
        equidistant: 380 / Math.PI * 2,
        equalarea: 380 / Math.SQRT2
    },

    mouseDown: function mouseDownF() {
        this.m0 = [d3.event.pageX, d3.event.pageY];
        this.o0 = this.projection.origin();
        d3.event.preventDefault();
    },

    bindMouseEvents: function () {
        var that = this;

        var mouseMove = function mouseMoveF() {
            if (that.m0) {
                var m1 = [d3.event.pageX, d3.event.pageY],
                    o1 = [that.o0[0] + (that.m0[0] - m1[0]) / 8, that.o0[1] + (m1[1] - that.m0[1]) / 8];

                that.projection.origin(o1);
                that.circle.origin(o1)
                that.refresh();
            }
        };

        var mouseUp = function mouseUpF() {
            if (that.m0) {
                mouseMove();
                that.m0 = null;
            }
        };

        d3.select(window)
            .on('mousemove', mouseMove)
            .on('mouseup', mouseUp);
    },

    refresh: function refreshF(duration) {
        var that = this;
        (duration ? this.feature.transition().duration(duration) : this.feature).attr('d', function (d) {return that.clip.apply(that, [d])});
    },

    clip: function clipF(d) {
        return this.path(this.circle.clip(d));
    },

    start: function startF() {
        var that = this;

        this.projection = d3.geo.azimuthal()
            .scale(500)
            .origin([-73.74, 45.66]) // Center on montreal
            .mode('orthographic')
            .translate([500, 500]);

        this.circle = d3.geo.greatCircle()
            .origin(this.projection.origin());

        this.path = d3.geo.path()
            .projection(this.projection);

        this.svg = d3.select('#body').append('svg:svg')
            .attr('width', 980)
            .attr('height', 800)
            .on('mousedown', function (d) {that.mouseDown.apply(that);});

        d3.json('world-countries.json', function (collection) {
            that.feature = that.svg.selectAll('path')
                .data(collection.features)
                .enter()
                .append('svg:path')
                .attr('d', function (d) {return that.clip.apply(that, [d]);});

            /*
            that.feature.append('svg:title')
                .text(function(d) { return d.properties.name; });
            */
        });

        this.bindMouseEvents();

        d3.select('select').on('change', function() {
            that.projection.mode(this.value).scale(that.scale[this.value]);
            that.refresh(750);
        });

        ntp.listen();
    },

    listen: function listenF() {
        var that = this;
        var socket = io.connect('/latlon');
        socket.on('latlon', function pingReceived(lat, lon) {
            drawCircle([lat, lon]);
        });
	socket.on('qps', function qpsReceived(qps) {
            document.getElementById("qps").innerHTML = qps;
        });
        socket.on('viewers', function viewersReceived(viewers) {
            document.getElementById("viewers").innerHTML = viewers;
        });

        var drawCircle = function drawCircleF(d) {
            var coord = that.projection([d[1], d[0]]);
            var c = that.svg.append('circle')
                .data([d])
                .attr('r', 4)
                .attr('cx', function cxF(d) {
                    return coord[0];
                })
                .attr('cy', function cyF(d) {
                    return coord[1];
                })
                .attr('stroke','red')
                .attr('fill','red');

            setTimeout(function destroyCircle() {
                c.remove();
            }, 100);
        };
    }
};

ntp.start();
