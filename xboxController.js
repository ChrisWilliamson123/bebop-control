var XboxController = require('xbox-controller'),
    ControllerFile = require('./xboxKeyController'),
    xbox = new XboxController,
    keyController = new ControllerFile(xbox);

var drone,
    droneOrigin = '',
    socket,
    speed = 50,
    defaultTilt = -10,
    defaultPan = 0,
    currentTilt = -10,
    currentPan = 0,
    panTiltStep = 10,
    triggerThreshold = 120,
    stickThreshold = 20,
    lastXPercentage = 0,
    lastYPercentage = 0,
    lastRightXPercentage = 0,
    keysToFunctions = {
        "LT": "drone.down(speed)",
        "RT": "drone.up(speed)",
        "LB": "drone.counterClockwise(speed)",
        "RB": "drone.clockwise(speed)",
        "LS": "leftStickHandler(leftStickValues)",
        "RS": "rightStickHandler(rightStickValues)"
    },
    recording = false;

function init(droneInstance, socketInstance) {
    drone = droneInstance;
    socket = socketInstance;

    xbox.on('a:press', function() {
        drone.takeOff();
    });

    xbox.on('b:press', function() {
        drone.land();
    });

    xbox.on('y:press', function() {
        if (!recording) {
            drone.MediaStreaming.videoEnable(1);
            drone.getVideoStream();
        }
        else {
            drone.MediaStreaming.videoEnable(0);
        }
    });

    xbox.within('righttrigger', [triggerThreshold+1,255], function(err, data){
        drone.up(speed);
        keyController.addKey("RT");
        var pixelFillWidth = ((data/256) * 100 * 2) - 6;
        socket.emit('trigger', {side: 'right', fillAmount: pixelFillWidth});
    });

    xbox.within('righttrigger', [0, triggerThreshold], function(err, data){
        keyController.removeKey("RT");
        var pixelFillWidth = ((data/256) * 100 * 2) - 6;
        socket.emit('trigger', {side: 'right', fillAmount: pixelFillWidth});
        restartMovement();
    });

    xbox.within('lefttrigger', [triggerThreshold+1,255], function(err, data){
        drone.down(speed);
        keyController.addKey("LT");
        var pixelFillWidth = ((data/256) * 100 * 2) - 6;
        socket.emit('trigger', {side: 'left', fillAmount: pixelFillWidth});
    });

    xbox.within('lefttrigger', [0, triggerThreshold], function(err, data){
        keyController.removeKey("LT");
        restartMovement();
        var pixelFillWidth = ((data/256) * 100 * 2) - 6;
        socket.emit('trigger', {side: 'left', fillAmount: pixelFillWidth});
    });

    xbox.on('rightshoulder:press', function () {
        drone.clockwise(speed);
        keyController.addKey("RB");
    });

    xbox.on('rightshoulder:release', function() {
        keyController.removeKey("RB");
        restartMovement();
    });

    xbox.on('leftshoulder:press', function () {
        drone.counterClockwise(speed);
        keyController.addKey("LB");
    });

    xbox.on('leftshoulder:release', function() {
        keyController.removeKey("LB");
        restartMovement();
    });

    xbox.on('left:move', function(){
        // Get the new percentages of the stick values
        var xPercentage = positionAsPercentage(xbox.leftx);
        var yPercentage = positionAsPercentage(xbox.lefty);

        // Emit the position of the stick so that we can display it in the web app
        socket.emit('left stick', {x: xPercentage, y:yPercentage});

        // If the sticks positions are different to the last
        if (xPercentage != lastXPercentage || yPercentage != lastYPercentage) {
            // If the stick is below the threshold, remove it from the list and restart movement
            if ((xPercentage > (stickThreshold*-1) && xPercentage < stickThreshold) && (yPercentage > (stickThreshold*-1) && yPercentage < stickThreshold)) {
                keyController.removeKey("LS");
                restartMovement();
            }
            else {
                keyController.addKey("LS");
                lastXPercentage = xPercentage;
                lastYPercentage = yPercentage;
                leftStickHandler({x:lastXPercentage, y: lastYPercentage})
            }
        }
    });

    xbox.on('right:move', function(){
        // Get the new percentages of the stick values
        var xPercentage = positionAsPercentage(xbox.rightx);

        // Emit the position of the stick so that we can display it in the web app
        socket.emit('right stick', {x: xPercentage});

        // If the sticks positions are different to the last
        if (xPercentage != lastRightXPercentage) {
            // If the stick is below the threshold, remove it from the list and restart movement
            if ((xPercentage > (stickThreshold*-1) && xPercentage < stickThreshold)) {
                keyController.removeKey("RS");
                restartMovement();
            }
            else {
                keyController.addKey("RS");
                lastRightXPercentage = xPercentage;
                rightStickHandler({x:lastRightXPercentage})
            }
        }
    });

    xbox.on('dup:press', function () {
        if (currentTilt + panTiltStep > 100) {
            console.log("Tilt cannot go any higher");
        }
        else {
            currentTilt += panTiltStep;
            drone.Camera.orientation(currentTilt, currentPan);
        }
    });

    xbox.on('dright:press', function () {
        if (currentPan + panTiltStep > 100) {
            console.log("Pan cannot go any higher");
        }
        else {
            currentPan += panTiltStep;
            drone.Camera.orientation(currentTilt, currentPan);
        }
    });

    xbox.on('ddown:press', function () {
        if (currentTilt - panTiltStep < -100) {
            console.log("Tilt cannot go any lower");
        }
        else {
            currentTilt -= panTiltStep;
            drone.Camera.orientation(currentTilt, currentPan);
        }
    });

    xbox.on('dleft:press', function () {
        if (currentPan - panTiltStep < -100) {
            console.log("Pan cannot go any lower");
        }
        else {
            currentPan -= panTiltStep;
            drone.Camera.orientation(currentTilt, currentPan);
        }
    });

    drone.on('takingOff', function() {
        socket.emit('takingOff');
    });

    drone.on('landing', function() {
        socket.emit('landing');
        drone.MediaStreaming.videoEnable(0);
    });

    drone.on('AltitudeChanged', function(data) {
        socket.emit('altitude', Math.round(data.altitude));
    });

    drone.on('HomeChanged', function(data) {
        droneOrigin = {
            'lat': data.latitude,
            'lng': data.longitude
        }
    });

    drone.on('PositionChanged', function(data) {
        if (droneOrigin !== '') {
            var newCoords = {
                'lat': data.latitude,
                'lng': data.longitude
            };
            var distance = calculateDistance(droneOrigin, newCoords);
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
            recording = true;
            console.log('Drone is recording.')
        }
        else {
            recording = false;
            console.log('Drone is not recording.')
        }
    });

    drone.on('WifiSignalChanged', function(data) {
        var strength = data.rssi;
        // The normal wifi range is -80 to -20 where -80 is weak and -20 is strong
        // Here we will get that from -60 to 0
        strength += 20;
        strength = Math.round(100 - ((strength / -60) * 100));
        socket.emit('wifiStrength', strength);
    });

    socket.on('defaultSpeedChange', function(newSpeed) {
        speed = newSpeed;
    });
}

function positionAsPercentage(position) {
    return (position / 32768) * 100;
}

function leftStickHandler(stickValues) {
    if (Math.abs(stickValues.x) > stickThreshold) {
        if (stickValues.x < 0) {
            drone.left(stickValues.x * -1);
        }
        else {
            drone.right(stickValues.x);
        }
    }

    if (Math.abs(stickValues.y) > stickThreshold) {
        if (stickValues.y < 0) {
            drone.forward(stickValues.y * -1);
        }
        else {
            drone.backward(stickValues.y);
        }
    }
}

function rightStickHandler(stickValues) {
    if (Math.abs(stickValues.x) > stickThreshold) {
        if (stickValues.x < 0) {
            drone.counterClockwise(stickValues.x * -0.75);
        }
        else {
            drone.clockwise(stickValues.x * 0.75);
        }
    }
}

function restartMovement() {
    // Stop the drone, get keys, get values, move drone
    drone.stop();
    var leftStickValues = keyController.getLSValues();
    var rightStickValues = keyController.getRSValues();
    for (var i = 0; i < keyController.keys.length; i++) {
        eval(keysToFunctions[keyController.keys[i]]);
    }
}

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

function emitBattery() {
    socket.emit("battery", drone.navData['battery']);
}

module.exports.init = init;
