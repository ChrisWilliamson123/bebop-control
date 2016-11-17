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

var bars = [];
socket.on('fileDetected', function(file) {
    $('#fileTable').append('<div class="row" data-name="' + file.name + '" data-index="' + files + '">' +
        '<div id="fileInfo">' +
        '<p>Type: ' + file.type + '</p>' +
        '<p>Date taken: ' + file.date + '</p>' +
        '<p>Size: ' + file.size + '</p>' +
        '<img src="static/thumbnails/' + file.thumbnailName + '" />' +
        '</div>' +
        '<div id="transferInformation">' +
        '<button class="transfer">Transfer</button>' +
        '<input id="checkbox' + files + '" class="selectBox" type="checkbox" />' +
        '<div id="circleProgressBar' + files + '" class="circleProgressBar"></div>' +
        '</div>' +
        '</div>');
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
            }
            else if (value === 100) {
                circle.setText('Done');
            }
            else {
                circle.setText(value + '%');
            }

        }
    });
    bar.text.style.fontSize = '2rem';
    bars.push(bar);
    $('.transfer').unbind('click');
    applyTransferClickEvents();
    files++;
});

socket.on('downloadProgress', function(data) {
    var item = $('#fileTable').find('[data-name="' + data.name + '"]');
    // item.find('span#progressBar').css('width', data.progress + '%');
    item.find('.circleProgressBar').fadeIn();
    item.find('button').hide();
    var progressWheelValue = data.progress / 100;
    bars[parseInt(item.data('index'))].animate(data.progress / 100);
});

socket.on('downloadComplete', function(filename) {
    var item = $('#fileTable').find('[data-name="' + filename + '"]');
    // item.find('span#progressBar').css('width', data.progress + '%');
    bars[parseInt(item.data('index'))].animate(1);
});