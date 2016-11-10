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


// Returns true if the wifi network we are connected to is a Bebop 2 network.
function alreadyConnectedToDrone() {
    var ifaceState = WiFiControl.getIfaceState();
    if (ifaceState.ssid.indexOf('Bebop') == 0) {
        return true;
    }
    return false;
}

function networkScan() {
    // We are scanning, so set freeToScan to false
    freeToScan = false;
    WiFiControl.scanForWiFi( function(err, response) {
        if (err) console.log(err);

        var networks = response.networks;
        // Loop through all found networks.
        // If we find a Bebop 2 network, set the wifi name and remove the scanner interval.
        for (var i = 0; i < networks.length; i++) {
            var network = networks[i];
            var SSID = network.ssid;
            if (SSID.indexOf('Bebop') == 0) {
                droneWiFiName = SSID;
                removeScanner();
            }
        }
        // Finished doing scanning logic, we are free to scan again
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
        }
    });
}

function attemptDroneConnection() {
    initialiseWifi();
    // Try scanning for access points:
    if (alreadyConnectedToDrone()) {
        // WiFi is already connected to drone, so send through socket
        socket.emit('droneWifiConnected');
    }
    else {
        // Here, the first network scan will be 4 seconds after the app is initialised.
        // After that, every 1s there will be a check to see if a scan is already in place.
        // If it is not, we will scan again.
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
