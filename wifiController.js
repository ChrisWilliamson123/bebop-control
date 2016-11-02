// Load the wifi control package
var WiFiControl = require('wifi-control');
var freeToScan = true;
var scanner = '';
var socket = '';
var events = '';

// Set up the socket and event objects
function init(socketInstance, eventEmitter) {
    socket = socketInstance;
    events = eventEmitter;
}
//  Initialize wifi-control package
function initialiseWifi() {
    WiFiControl.init({'debug': true});
}


// Check if we are already connected to the drone
function alreadyConnectedToDrone() {
    var ifaceState = WiFiControl.getIfaceState();
    if (ifaceState.ssid.indexOf('Bebop2') == 0) {
        return true;
    }
    return false;
}

function networkScan() {
    freeToScan = false;
    WiFiControl.scanForWiFi( function(err, response) {
        if (err) console.log(err);

        var networks = response.networks;
        for (var i = 0; i < networks.length; i++) {
            var network = networks[i];
            var SSID = network.ssid;
            if (SSID.indexOf('Bebop2') == 0) {
                droneWiFiName = SSID;
                removeScanner();
            }
        }
        freeToScan = true;
    })
}

// We have detected the drone's wifi signal
// Remove the interval for the scanner and connect to the network
function removeScanner() {
    socket.emit('droneWifiDetected', droneWiFiName);
    clearInterval(scanner);
    connectToNetwork(droneWiFiName);
}

function connectToNetwork(SSID) {
    console.log('Connecting to WiFi network: ' + SSID);
    var results = WiFiControl.connectToAP({ssid: SSID}, function(err, response) {
        if (err) console.log(err);
        if (response.success) {
            socket.emit('droneWifiConnected');
            setTimeout(function() {
                events.emit('connectDrone');
                socket.emit('appConnectedToDrone');
            }, 2000);
        }
    });
}

function attemptDroneConnection() {
    initialiseWifi();
    // Try scanning for access points:
    if (alreadyConnectedToDrone()) {
        // WiFi is already connected to drone, so send through socket
        socket.emit('droneWifiConnected');
        setTimeout(function() {
            events.emit('connectDrone');
        }, 2000);
    }
    else {
        // The first scan will be 4s after initialisation, then 1s after, then every 5s
        setTimeout(function() {
            networkScan();
            scanner = setInterval(function(){
                if (freeToScan) {
                    networkScan();
                }
            }, 1000);
        }, 4000);
    }
}

module.exports.init = init;
module.exports.connectDroneWifi = attemptDroneConnection;
