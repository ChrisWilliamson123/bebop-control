socket.on('droneWifiDetected', function(wifiName) {
    // Add wifi name to front end
    console.log('Drone wifi detected');
    $('#droneWifiName').text(wifiName);
    // Show wifi detected div and hide welcome div
    $('#welcome').hide();
    $('#wifiDetected').show();
});

socket.on('droneWifiConnected', function(wifiName) {
    // Hide wifi detected div and show connected header
    $('#welcome').hide();
    $('#wifiDetected').hide();
    $('#wifiConnected').show();
});

socket.on('appConnectedToDrone', function() {
    $('#welcome').hide();
    $('#wifiConnected').hide();
    $('#chooseInput').show();
});

socket.emit('appInitialised');
