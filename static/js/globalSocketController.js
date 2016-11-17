socket.on('takingOff', function() {
    InitialiseAltitudeChart();
});

socket.on('landing', function() {
    clearInterval(graphTick);
});

socket.on('altitude', function(altitude) {
    lastAltitude = altitude;
});

socket.on('battery', function(percentage) {

    console.log('Battery level received');
    console.log(percentage);
    $('#battery span').text(percentage + '%');
});

socket.on('wifiStrength', function(data) {
    $('#wifiStrength').slider('value', data);
    if (data < 20) {
        $('#wifiStrength > div').css('background-color', 'red');
    }
    else if (data < 60) {
        $('#wifiStrength > div').css('background-color', 'yellow');
    }
    else {
        $('#wifiStrength > div').css('background-color', 'green');
    }
});

socket.on('distanceChanged', function(distance) {
    $('#distance').text(distance);
});

socket.on('speedChange', function(speed) {
    lastSpeed = speed;
});

function applyTransferClickEvents() {
    $('.transfer').click(function() {
        console.log('here');
        // Get the file name
        var filename = $(this).parent().parent().data('name');
        socket.emit('downloadMedia', filename);
    });
}
var bars = [];
socket.on('fileDetected', function(file) {
    $('#fileTable').append('<div class="row" data-name="' + file.name + '" data-index="' + files + '"><div class="header"><p>' + (files+1) + ') ' + file.type + ' taken on ' + file.date + '</p><button class="transfer">Transfer</button><span id="fileSize">' + file.size + '</span><div id="circleProgressBar' + files + '" class="circleProgressBar"></div></div><span id="progressBar"></span></div>');
    var bar = new ProgressBar.Circle('#circleProgressBar' + files, {
        color: '#aaa',
        // This has to be the same size as the maximum width to
        // prevent clipping
        strokeWidth: 4,
        trailWidth: 1,
        easing: 'easeInOut',
        duration: 1400,
        text: {
            autoStyleContainer: false
        },
        from: { color: '#aaa', width: 1 },
        to: { color: '#333', width: 4 },
        // Set default step function for all animate calls
        step: function(state, circle) {
            circle.path.setAttribute('stroke', state.color);
            circle.path.setAttribute('stroke-width', state.width);

            var value = Math.round(circle.value() * 100);
            if (value === 0) {
                circle.setText('');
            } else {
                circle.setText(value + '%');
            }

        }
    });
    bars.push(bar);
    // bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
    bar.text.style.fontSize = '2rem';

    // bar.animate(1.0);  // Number from 0.0 to 1.0
    $('.transfer').unbind('click');
    applyTransferClickEvents();
    files++;
});

socket.on('downloadProgress', function(data) {
    var item = $('#fileTable').find('[data-name="' + data.name + '"]');
    // item.find('span#progressBar').css('width', data.progress + '%');
    bars[parseInt(item.data('index'))].animate(data.progress / 100);
});

socket.on('downloadComplete', function(filename) {
    var item = $('#fileTable').find('[data-name="' + filename + '"]');
    // item.find('span#progressBar').css('width', data.progress + '%');
    bars[parseInt(item.data('index'))].animate(1);
});