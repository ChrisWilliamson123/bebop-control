// Setting up the modules
var EventEmitter = require('events').EventEmitter,
    express = require('express'),
    app = express(),
    wifi = require('./wifiController'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    path = require('path'),
    wifiEvents = new EventEmitter(),
    droneController = require('./droneController');

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
http.listen(8001, function() {
    console.log("Listening on port 8001");
});

io.on('connection', function (socket) {
    socket.on('appInitialised', function() {
        // Initialise the wifi module, passing in our socket and our wifiEvent listener
        wifi.init(socket, wifiEvents);
        // Start the process of searching and connecting to the drone's wifi
        wifi.connectDroneWifi();
        // Once we have connected to the drone's wifi, connect the app to the drone
        wifiEvents.on('connectDrone', function() {
            console.log('Wifi Connected, attempting app-drone connection');
            wifiConnection = true;
            socket.emit('appConnectedToDrone');
        });
    });

    socket.on('xboxInitialised', function() {
        console.log('User has chosen Xbox controller as input device');
        var xbox = require('./xboxController');
        xbox.init(socket);
    });
});

// The following will catch uncaught exceptions.
// For example, if we disconnect the WiFi or try to make too many connections to the drone
var handlingUnreachable = false;
// process.on('uncaughtException', function(err) {
//     // handle the error safely
//     if (err.code == 'ENETUNREACH' && !handlingUnreachable) {
//         handlingUnreachable = true;
//         // Drone is unreachable
//         console.log('Network changed / Drone is unreachable');
//         // Initialise the wifi module, passing in our socket and our wifiEvent listener
//         wifi.init(io, wifiEvents);
//         // Start the process of searching and connecting to the drone's wifi
//         wifi.connectDroneWifi();
//         // Once we have connected to the drone's wifi, connect the app to the drone
//         wifiEvents.on('connectDrone', function() {
//             droneController.connectDrone();
//             handlingUnreachable = false;
//         });
//     }
//     else {
//         console.log(err);
//     }
// });
