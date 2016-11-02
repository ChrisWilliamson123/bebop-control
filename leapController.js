var droneController,
    drone,
    socket;

function init(socketInstance) {
    socket = socketInstance;
    var droneControllerFile = require('./droneController');
    droneController = new droneControllerFile(socket);
    drone = droneController.drone;

    // We will receive this from the front end.
    // We build a function string from the direction and drone speed, then evaluate it.
    socket.on('move drone', function(direction) {
        var functionAsString = 'drone.' + direction + '(' + droneController.speed + ')';
        console.log(functionAsString);
        eval(functionAsString);
    });

    // Here we build up a takeoff/landing string and evaluate it
    socket.on('TOL', function(action) {
        var functionAsString = 'drone.' + action + '()';
        console.log(functionAsString);
        eval(functionAsString);
    });

    // These two functions will emit whether the drone is in a flight state or not
    drone.on("landed", function() {
        socket.emit("TOL", false);
    });

    drone.on("hovering", function() {
        socket.emit("TOL", true);
    });
}

module.exports.init = init;