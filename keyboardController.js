function init(socketInstance, droneControllerInstance) {
    socket = socketInstance;
    droneController = droneControllerInstance;
    drone = droneController.drone;

    // Maps key IDs to drone functions
    var keysToFunctions = {
        87: 'drone.forward(droneController.speed)',
        65: 'drone.left(droneController.speed)',
        83: 'drone.backward(droneController.speed)',
        68: 'drone.right(droneController.speed)',
        38: 'drone.up(droneController.speed)',
        37: 'drone.counterClockwise(droneController.speed)',
        40: 'drone.down(droneController.speed)',
        39: 'drone.clockwise(droneController.speed)'
    };

    socket.on('droneMovement', function(data) {
        drone.stop();
        for (var i = 0; i < data.length; i++) {
            eval(keysToFunctions[data[i]]);
        }
    });

    socket.on('TOL', function(data) {
        eval(data);
    });
}

module.exports.init = init;
