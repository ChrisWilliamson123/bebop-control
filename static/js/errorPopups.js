var errorPopup;

socket.on('WiFiDisconnected', function() {
    $.magnificPopup.open({
        items: {
            src: $('#wifiPopup')[0].outerHTML
        },
        type: 'inline'
    });
    $('#wifiPopup').show();
    errorPopup = $.magnificPopup.instance;
});

socket.on('droneWifiDetected', function() {
    $('#wifiPopup').html('<h1>Bebop network detected.</h1><p>Establishing WiFi connection...</p>');
});

socket.on('droneWifiConnected', function() {
    $('#wifiPopup').html('<h1>WiFi connection established.</h1><p>You will now be returned to the application...</p>');
    setTimeout(function() {
        errorPopup.close();
    }, 3000);
});