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

socket.on('droneWifiConnected', function() {
    errorPopup.close();
});