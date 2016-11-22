var wifi = require('./wifiController'),
    events = require('events'),
    eventEmitter = new events.EventEmitter(),
    dgram = require('dgram'),
    droneControllerFile = require('./droneController');

var errorController = function(socketInstance, droneControllerInstance, wifiController) {
    var droneController = droneControllerInstance,
        drone = droneControllerInstance.drone,
        socket = socketInstance,
        handlingError = false;

    wifiController.init(socket, eventEmitter);

    process.on('uncaughtException', function(err) {
        if ((err.errno === 'EADDRNOTAVAIL' || err.errno ==='ENETUNREACH') && !handlingError) {
            droneController.drone._d2cServer.close();
            handlingError = true;
            console.log('WiFi network changed.');
            socket.emit('WiFiDisconnected');
            wifiController.connectDroneWifi();
        }
        else if (!handlingError) {
            throw err;
            process.exit(1);
        }
    });

    eventEmitter.on('wifiConnected', function() {
        droneController = new droneControllerFile()
        handlingError = false;
    })
};

module.exports = errorController;