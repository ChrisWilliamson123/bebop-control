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
        var filename = $(this).parent().data('name');
        socket.emit('downloadMedia', filename);
    });
}

socket.on('fileDetected', function(file) {
    files++;
    $('#fileTable').append('<div class="row" data-name="' + file.name + '"><p>' + files + ') ' + file.type + ' taken on ' + file.date + ' - ' + file.size + '</p><button class="transfer">Transfer</button><span></span></div>');
    $('.transfer').unbind('click');
    applyTransferClickEvents();
});

socket.on('downloadProgress', function(data) {
    $('#fileTable').find('[data-name="' + data.name + '"]').find('span').text(data.progress + '%');
});

socket.on('downloadComplete', function(filename) {
    $('#fileTable').find('[data-name="' + filename + '"]').find('span').text('Download complete!');
});