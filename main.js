// Setting up the modules
var express = require('express'),
    app = express(),
    wifi = require('./wifiController'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    path = require('path'),
    droneControllerFile = require('./droneController'),
    errorControllerFile = require('./errorController');

// Setting up static and getting the hompage
app.use(express.static('.'));
app.get('/', function (req, res) {
    res.sendFile('static/templates/intro.html', { root: __dirname });
});
app.get('/xbox-controller', function (req, res) {
    res.sendFile('static/templates/xbox.html', { root: __dirname });
});
app.get('/leap', function (req, res) {
    res.sendFile('static/templates/leap.html', { root: __dirname });
});
app.get('/keyboard', function (req, res) {
    res.sendFile('static/templates/keyboard.html', { root: __dirname });
});
http.listen(8001, function() {
    console.log("Listening on port 8001");
});

io.on('connection', function (socket) {
    socket.on('appInitialised', function() {
        // Initialise the wifi module, passing in our socket and our wifiEvent listener
        wifi.init(socket);
        // Start the process of searching and connecting to the drone's wifi
        wifi.connectDroneWifi();
    });

    // If the user chooses xbox controller, set up the module and initialise
    socket.on('xboxInitialised', function() {
        console.log('User has chosen Xbox controller as input device');
        var droneController = new droneControllerFile(socket);
        var xbox = require('./xboxController');
        xbox.init(socket, droneController);
        var errorController = new errorControllerFile(socket, droneController, wifi);
    });

    // If the user chooses Leap Motion, set up the module and initialise
    socket.on('leapInitialised', function() {
        console.log('User has chosen Leap Motion as input device');
        var droneController = new droneControllerFile(socket);
        var leap = require('./leapController');
        leap.init(socket, droneController);
        var errorController = new errorControllerFile(socket, droneController, wifi);
    });

    // If the user chooses keyboard, set up the module and initialise
    socket.on('keyboardInitialised', function() {
        console.log('User has chosen keyboard as input device');
        var droneController = new droneControllerFile(socket);
        var keyboard = require('./keyboardController');
        keyboard.init(socket, droneController);
        var errorController = new errorControllerFile(socket, droneController, wifi);
    });
});
