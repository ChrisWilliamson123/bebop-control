function init(socketInstance) {
    socket = socketInstance;
    droneControllerFile = require('./droneController');
    droneController = new droneControllerFile(socket);
    drone = droneController.drone;

    socket.on('move drone', function(direction) {
        var functionAsString = 'drone.' + direction + '(100)';
        console.log(functionAsString);
        eval(functionAsString);
    });

    socket.on('TOL', function(action) {
        var functionAsString = 'drone.' + action + '()';
        console.log(functionAsString);
        eval(functionAsString);
    });

    drone.on("landed", function() {
        socket.emit("TOL", false);
    });

    drone.on("hovering", function() {
        socket.emit("TOL", true);
    });
}

module.exports.init = init;