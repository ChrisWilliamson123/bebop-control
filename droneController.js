/*
 This method uses the Haversine formula to determine the distance, in metres, between two sets of coordinates
 I pulled the code from the following Stack Overflow post:
 http://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
 */
function calculateDistance(origin, destination) {
    var lat1 = origin.lat;
    var lon1 = origin.lng;
    var lat2 = destination.lat;
    var lon2 = destination.lng;

    var R = 6371000; // m

    var x1 = lat2 - lat1;
    var dLat = x1.toRad();

    var x2 = lon2 - lon1;
    var dLon = x2.toRad();

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    // Here I'm taking 1 from the calculated distance because I feel GPS coords from the drone are a bit off, which is to be expected.
    // By eye it seemed like the calculation here was about 1m too high.
    var errorCorrected = Math.round(d) - 1;

    // Here I'm checking if the error corrected distance is less than 0, if it is it means that the calculated distance was < 0.5
    // Therefore we should just return 0.
    if (errorCorrected < 0) {
        return 0;
    }
    return errorCorrected;
}

Number.prototype.toRad = function() {
    return this * Math.PI / 180;
};

var droneController = function(socketInstance) {
    controller = this;

    socket = socketInstance;

    bebop = require('node-bebop');
    // Used this. so that it can be referenced by the initiator file
    this.drone = bebop.createClient();
    // Used just 'drone' here so that events below are more readable
    drone = this.drone;

    this.recording = false;
    this.droneOrigin = '';
    this.speed = 50;
    this.defaultTilt = -10;
    this.defaultPan = 0;
    this.currentTilt = -10;
    this.currentPan = 0;
    this.panTiltStep = 10;

    emitBattery = function() {
        socket.emit('battery', drone.navData['battery']);
    };

    drone.on('takingOff', function() {
        socket.emit('takingOff');
    });

    drone.on('landing', function() {
        socket.emit('landing');
        controller.drone.MediaStreaming.videoEnable(0);
    });

    drone.on('AltitudeChanged', function(data) {
        socket.emit('altitude', Math.round(data.altitude));
    });

    drone.on('WifiSignalChanged', function(data) {
        var strength = data.rssi;
        // The normal wifi range is -80 to -20 where -80 is weak and -20 is strong
        // Here we will get that from -60 to 0
        strength += 20;
        strength = Math.round(100 - ((strength / -60) * 100));
        socket.emit('wifiStrength', strength);
    });

    drone.on('HomeChanged', function(data) {
        controller.droneOrigin = {
            'lat': data.latitude,
            'lng': data.longitude
        }
    });

    drone.on('PositionChanged', function(data) {
        if (controller.droneOrigin !== '') {
            var newCoords = {
                'lat': data.latitude,
                'lng': data.longitude
            };
            var distance = calculateDistance(controller.droneOrigin, newCoords);
            socket.emit('distanceChanged', distance);
        }
    });

    drone.on('SpeedChanged', function(data) {
        // We need to figure out which direction the drone is going, z plane or xy plane
        var xyPlaneSpeed = Math.sqrt(Math.pow(Math.abs(data.speedX), 2) + Math.pow(Math.abs(data.speedY), 2));
        var zPlaneSpeed = Math.abs(data.speedZ);

        socket.emit('speedChange', Math.round(Math.max(xyPlaneSpeed, zPlaneSpeed)));
    });

    drone.on('video', function (data) {
        socket.emit('data', data.toString('base64'));
    });

    drone.on('VideoEnableChanged', function(data) {
        if (data.enabled == 'enabled') {
            controller.recording = true;
            console.log('Drone is recording.');
        }
        else {
            controller.recording = false;
            console.log('Drone is not recording.')
        }
    });

    drone.on('WifiSelectionChanged', function(data) {
        console.log(data);
    });

    socket.on('defaultSpeedChange', function(newSpeed) {
        controller.speed = newSpeed;
    });

    setTimeout(function() {
        emitBattery();
    }, 10000);

    // As soon as we build a new object, the app will connect to the drone.
    drone.connect(function() {
        console.log('Drone connected');
        drone.MediaStreaming.videoEnable(1);
        drone.getVideoStream();
    });
};

module.exports = droneController;
