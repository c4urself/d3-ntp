
window.ntp = window.ntp || {

    timeout: 100,
    m0: null,
    o0: null,
    countries: {},

    mouseDown: function mouseDownF() {
        this.m0 = [d3.event.pageX, d3.event.pageY];
        this.o0 = this.projection.rotate();
        d3.event.preventDefault();
    },

    bindMouseEvents: function () {
        var that = this;

        var mouseMove = function mouseMoveF() {
            if (that.m0) {
                var m1 = [d3.event.pageX, d3.event.pageY],
                    o1 = [that.o0[0] - (that.m0[0] - m1[0]) / 8, that.o0[1] - (m1[1] - that.m0[1]) / 8];

                that.projection.rotate(o1);
                that.svg.selectAll("path").attr("d", that.path);
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
        (duration ? this.feature.transition().duration(duration) : this.feature);
    },

    start: function startF() {
        var that = this;

        this.projection = d3.geo.orthographic()
            .scale(400)
	    .translate([490, 400])
	    .clipAngle(90)
	    .rotate([73.74, -45.66])

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
		.attr("d", that.path)
        });

        this.bindMouseEvents();

        d3.select('select').on('change', function () {
            that.timeout = this.value;
            console.log(that.timeout);
        });

        ntp.listen();
    },

    listen: function listenF() {
        var that = this;
        var socket = io.connect('http://zeit.rcloran.net:8080/latlon');
        socket.on('latlon', function pingReceived(lat, lon, countryName) {

            // draw circle for each hit
            drawCircle([lat, lon]);

            // add country
            //addCountry(countryName);

        });
        socket.on('qps', function qpsReceived(qps) {
            document.getElementById("qps").innerHTML = qps;
        });
        socket.on('viewers', function viewersReceived(viewers) {
            document.getElementById("viewers").innerHTML = viewers;
        });

        var addCountry = function addCountryF(countryName) {
            var name = countryName.replace(/[\s,]/g, '-').toLowerCase(),
                count = that.countries[name],
                $container = $('#countries'),
                $div;

            if (!count) {
                that.countries[name] = 0;
                $div = $('<div class="' + name + '">' + countryName + ': <span></span></div>');
                $container.append($div);
            } else {
                $div = $('.' + name, $container);
            }

            count = that.countries[name] += 1;
            $('span', $div).html(count);
        };

        var drawCircle = function drawCircleF(d) {
		var c = d3.geo.circle()
               		.origin([d[1], d[0]])
			.angle(0.5);
		that.svg.append("path")
			.datum(c())
			.attr("class", "points")
			.attr("d", that.path);
        };
    }
};

$(document).ready(function () {
    ntp.start();
});
