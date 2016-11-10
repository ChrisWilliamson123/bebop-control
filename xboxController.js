var XboxController = require('xbox-controller'),
    ControllerFile = require('./xboxKeyController'),
    xbox = new XboxController,
    keyController = new ControllerFile(xbox),
    socket,
    droneController,
    drone,
    triggerThreshold = 120,
    stickThreshold = 20,
    lastXPercentage = 0,
    lastYPercentage = 0,
    lastRightXPercentage = 0,
    keysToFunctions = {
        "LT": "drone.down(droneController.speed)",
        "RT": "drone.up(droneController.speed)",
        "LB": "drone.counterClockwise(droneController.speed)",
        "RB": "drone.clockwise(droneController.speed)",
        "LS": "leftStickHandler(leftStickValues)",
        "RS": "rightStickHandler(rightStickValues)"
    };

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

function init(socketInstance) {
    socket = socketInstance;
    var droneControllerFile = require('./droneController');
    droneController = new droneControllerFile(socket);
    drone = droneController.drone;

    xbox.on('connected', function(){
        socket.emit("controller connected", "Connected");
    });

    xbox.on('not-found', function(){
        socket.emit("controller connected", "Disconnected");
    });

    xbox.on('a:press', function() {
        drone.takeOff();
    });

    xbox.on('b:press', function() {
        drone.land();
    });

    xbox.on('y:press', function() {
        console.log(droneController.recording);
        if (!droneController.recording) {
            drone.MediaStreaming.videoEnable(1);
            drone.getVideoStream();
        }
        else {
            drone.MediaStreaming.videoEnable(0);
        }
    });

    xbox.within('righttrigger', [triggerThreshold+1,255], function(err, data){
        drone.up(droneController.speed);
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
        drone.down(droneController.speed);
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
        drone.clockwise(droneController.speed);
        keyController.addKey("RB");
    });

    xbox.on('rightshoulder:release', function() {
        keyController.removeKey("RB");
        restartMovement();
    });

    xbox.on('leftshoulder:press', function () {
        drone.counterClockwise(droneController.speed);
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
        if (droneController.currentTilt + droneController.panTiltStep > 100) {
            console.log("Tilt cannot go any higher");
        }
        else {
            droneController.currentTilt += droneController.panTiltStep;
            drone.Camera.orientation(droneController.currentTilt, droneController.currentPan);
        }
    });

    xbox.on('dright:press', function () {
        if (droneController.currentPan + droneController.panTiltStep > 100) {
            console.log("Pan cannot go any higher");
        }
        else {
            droneController.currentPan += droneController.panTiltStep;
            drone.Camera.orientation(droneController.currentTilt, droneController.currentPan);
        }
    });

    xbox.on('ddown:press', function () {
        if (droneController.currentTilt - droneController.panTiltStep < -100) {
            console.log("Tilt cannot go any lower");
        }
        else {
            droneController.currentTilt -= droneController.panTiltStep;
            drone.Camera.orientation(droneController.currentTilt, droneController.currentPan);
        }
    });

    xbox.on('dleft:press', function () {
        if (droneController.currentPan - droneController.panTiltStep < -100) {
            console.log("Pan cannot go any lower");
        }
        else {
            droneController.currentPan -= droneController.panTiltStep;
            drone.Camera.orientation(droneController.currentTilt, droneController.currentPan);
        }
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

module.exports.init = init;
