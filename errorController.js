var errorController = function(droneInstance, socketInstance) {
    var drone = droneInstance,
        socket = socketInstance,
        handlingError = false;

    process.on('uncaughtException', function(err) {
        if(err.errno === 'EADDRNOTAVAIL' && !handlingError) {
            handlingError = true;
            console.log('WiFi network changed.');
            setTimeout(function() {
                var reconnected = drone.reconnect();
            }, 10000);
        }
        else if (!handlingError) {
            console.log(err);
            process.exit(1);
        }
    });
};

module.exports = errorController;