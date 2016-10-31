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