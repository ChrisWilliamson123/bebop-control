// Setting up the modules
var bebop = require('node-bebop'),
    EventEmitter = require('events').EventEmitter,
    express = require('express'),
    app = express(),
    wifi = require('./wifiController'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    path = require('path'),
    drone = bebop.createClient(),
    wifiEvents = new EventEmitter();

// Setting up static and getting the hompage
app.use(express.static('.'));
app.get('/', function (req, res) {
    res.sendFile('static/templates/intro.html', { root: __dirname });
});
app.get('/xbox-controller', function (req, res) {
    res.sendFile('static/templates/xbox.html', { root: __dirname });
});
http.listen(8001, function() {
    console.log("Listening on port 8001");
});

function connectDrone() {
    drone.connect(function() {console.log('Drone connected.')});
}

io.on('connection', function (socket) {
    console.log('Socket set up');
    socket.on('appInitialised', function() {
        // Initialise the wifi module, passing in our socket and our wifiEvent listener
        wifi.init(socket, wifiEvents);
        // Start the process of searching and connecting to the drone's wifi
        wifi.connectDroneWifi();
        // Once we have connected to the drone's wifi, connect the app to the drone
        wifiEvents.on('connectDrone', function() {
            connectDrone();
        });
    });

    socket.on('xboxInitialised', function() {
        console.log('User has chosen Xbox controller as input device');
        var xbox = require('./xboxController');
        xbox.init(drone, socket);
    });
});
