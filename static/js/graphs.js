var columns = [
    ['x', '1'],
    ['Altitude', 0],
    ['Speed', 0]
];

var chart = c3.generate({
    bindto: '#chart',
    data: {
        x: 'x',
        columns: columns
    },
    axes: {
        Altitude: 'y',
        Speed: 'y2'
    },
    axis: {
        y: {
            max: 30,
            min: 0,
            padding: {top:0, bottom:0},
            label: 'Altitude (m)'
        },
        y2: {
            show: true,
            max: 10,
            min: 0,
            padding: {top:0, bottom:0},
            label: 'Speed (m/s)'
        },
        x: {
            label: 'Time (s)'
        }
    },
    transition: {
        duration: 0
    }
});

chart.data.axes({'Speed':'y2'});

function InitialiseAltitudeChart() {
    graphTick = setInterval(function () {
        // Get the last x value
        var lastX = columns[0][(columns[0].length)-1];

        // Check if the x axis is full
        var full = true;
        if (columns[0].length < 61) {
            full = false;
        }

        if (full) {
            // Add the next value to x
            // This shift will move all items left, therefore removing the first item
            columns[0].shift();
            // Overwrite the first item
            columns[0][0] = 'x';
            // Add the new item
            columns[0][columns[0].length] = (parseInt(lastX) + 1).toString();

            // The same with the altitude
            columns[1].shift();
            columns[1][0] = 'Altitude';
            columns[1][columns[1].length] = lastAltitude;

            // The same with the speed
            columns[2].shift();
            columns[2][0] = 'Speed';
            columns[2][columns[2].length] = lastSpeed;
        }
        else {
            // We're not full, so just push the new values to the end of the column arrays
            var nextX = (parseInt(columns[0][columns[0].length-1]) + 1).toString();
            columns[0].push(nextX);

            // Add to the altitude data
            columns[1].push(lastAltitude);

            // Add to the speed data
            columns[2].push(lastSpeed);
        }

        chart.load({
            columns: columns
        });
    }, 1000);
}

