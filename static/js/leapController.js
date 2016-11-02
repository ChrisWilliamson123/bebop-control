var hands = {},
    calibrationHands = {},
    output = document.getElementById('output'),
    currentDirections = [],
    inFlight = false,
    tolTimer = false,
    calibrationValues = {
        'left': -95,
        'right': 128,
        'forward': -81,
        'backward': 117,
        'up': 253,
        'down': 79
    },
// calibrationValues = {
//         'left': 0,
//         'right': 0,
//         'forward': 0,
//         'backward': 0,
//         'up': 0,
//         'down': 0
//     },
    grabTracker = {
        'startFrame': 0,
        'endFrame': 0,
        'enabled': false
    },
    leapFPS = 74,
    calibrationTime = false,
    calibrationDirections = [
        'left',
        'right',
        'forward',
        'backward',
        'up',
        'down'
    ],
    calibrationIndex = 0,
    waitingForOpenHand = false,
    magnificPopup = $.magnificPopup.instance;

applyZoneCSS();

var controller = new Leap.Controller();
controller.on('deviceStreaming', function() {
    console.log("A Leap device has been connected.");
    $('#controller').addClass('connected');
    $('#controller').text('Connected');
});

controller.on('deviceStopped', function() {
    console.log("A Leap device has been disconnected.");
    $('#controller').removeClass('connected');
    $('#controller').text('Disconnected');
});
controller.connect();

function applyZoneCSS() {
    $('#left').width(210 + calibrationValues['left']);
    $('#right').width(210 - calibrationValues['right']);
    $('#forward').height(150 + calibrationValues['forward'] + 10);
    $('#backward').height(350 - (150 + calibrationValues['backward'] - 10));

    var upPercentage = Math.round(((calibrationValues['up'] - 60) / 350) * 100);
    var downPercentage = Math.round(((calibrationValues['down'] - 40) / 350) * 100);
    $('#upIndicator').css('top', 100-upPercentage + '%');
    $('#downIndicator').css('bottom', downPercentage + '%');
}

function resetGrabTracker() {
    grabTracker.enabled = false;
    grabTracker.startFrame = 0;
    grabTracker.endFrame = 0;
}

function saveCalibrationValue(palmCoords, calibrationDirection) {
    console.log(calibrationDirection);
    switch (calibrationDirection) {
        case 'left':
        case 'right':
            calibrationValues[calibrationDirection] = Math.round(palmCoords[0]);
            break;
        case 'forward':
        case 'backward':
            calibrationValues[calibrationDirection] = Math.round(palmCoords[2]);
            break;
        default:
            calibrationValues[calibrationDirection] = Math.round(palmCoords[1]);
    }
}

function checkZoneConfirmation(frame, hand) {

    if (waitingForOpenHand && hand.grabStrength < 0.9) {
        waitingForOpenHand = false;
    }

    if (!waitingForOpenHand) {
        if (grabTracker.enabled && frame.id >= grabTracker.endFrame) {
            // Grab gesture is complete so save value
            saveCalibrationValue(hand.palmPosition, calibrationDirections[calibrationIndex]);

            calibrationIndex++;

            if (calibrationIndex == calibrationDirections.length) {
                // Calibration is finished
                $('#calibrationPopup #mainContent').hide();
                $('#calibrationComplete').show();

                // In 6 seconds, so the user has enough time to read the message, close the popup and apply the new zones in CSS
                setTimeout(function() {
                    magnificPopup.close();

                    applyZoneCSS();

                    // Set the popup main content to show again incase the user wants to calibrate again
                    $('#calibrationPopup #mainContent').show();
                    $('#calibrationComplete').hide();
                }, 3000);

                // Reset the caibration system back to the beginning
                calibrationIndex = 0;
                calibrationTime = false;
            }

            // Set the source of the gif depending on which stage the user is on
            $('#calibrationGridContainer img').attr('src', 'static/img/' + calibrationDirections[calibrationIndex] + '.gif');

            resetGrabTracker();

            $('#calibrationDirection').text(calibrationDirections[calibrationIndex]);
            $('#calibrationSlider').slider('value', 0);
            waitingForOpenHand = true;
        }
        else if (grabTracker.enabled && hand.grabStrength < 0.9) {
            // Reset the tracker
            resetGrabTracker();
        }
        else if (!grabTracker.enabled && hand.grabStrength >= 0.9) {
            // Start the tracker
            grabTracker.enabled = true;
            grabTracker.startFrame = frame.id;
            grabTracker.endFrame = frame.id + (leapFPS * 3);
        }
        // Fill up the grab slider
        else if (grabTracker.enabled && hand.grabStrength >= 0.9) {
            var start = grabTracker.startFrame;
            var end = grabTracker.endFrame;
            var current = frame.id;
            var percentageComplete = Math.round(((current - start) / (end - start)) * 100);
            $('#calibrationSlider').slider('value', percentageComplete);
        }
    }
}


Leap.loop({enableGestures: true}, function(frame) {
    var handCount = frame.hands.length;

    // If there are no hands detected, we want the drone to hover
    if (!handCount) {
        if (!isEqual(currentDirections, ['stop'])) moveDrone(['stop']);
    }

    else if (handCount == 2) {
        takeoffController(frame.hands);
    }

    // If we only detect the right hand
    else if (handCount == 1 && frame.hands[0].type == 'right') {
        var hand = frame.hands[0];
        // If we're calibrating, move the dot and check the calbration status
        if (calibrationTime) {
            var calibrationDot = (calibrationHands[0] || (calibrationHands[0] = new CalibrationDot()));
            calibrationDot.setTransform(hand.palmPosition);
            checkZoneConfirmation(frame, hand);
        }
        else {
            rightHandController(hand);
        }
    }
    if (handCount == 0 && grabTracker.enabled) {
        console.log('No hands detected, cancelling grab tracker.');
        resetGrabTracker();
    }

    frame.hands.forEach(function(hand, index) {
        // Move the main page dot and height meter
        var handDot = (hands[index] || (hands[index] = new HandDot()));
        handDot.setTransform(hand.palmPosition);
        var heightPercentage = ((hand.palmPosition[1] - 50) / 350) * 100;
        $('#heightSlider').slider('value', heightPercentage);
    });

}).use('screenPosition', {scale: 0.25});

function isEqual(array1, array2) {
    return array1.length == array2.length && array1.every(function(element, index) {
            return array2.indexOf(element) >= 0;
        });
}

function addDirection(direction, newDirections) {
    if (newDirections.indexOf(direction) < 0) {
        newDirections.push(direction);
    }
}

function rightHandController(hand) {
    var newDirections = [];
    // An [x, y, z] unit vector of the hands position relative to the center of the Leap Motion's view
    var position = hand.palmPosition;

    // Get the x distance of the hand from the center of the Motion's view
    var xDistance = position[0];
    if (xDistance >= calibrationValues['right'] - 10) {
        addDirection('right', newDirections);
    }
    else if (xDistance <= calibrationValues['left'] + 10) {
        addDirection('left', newDirections);
    }

    // Get the y distance of the hand from the center of the Motion's view
    var yDistance = position[1];
    if (yDistance <= calibrationValues['down'] + 10) {
        addDirection('down', newDirections);
    }
    else if (yDistance > calibrationValues['up'] - 10) {
        addDirection('up', newDirections);
    }

    // Get the z distance of the hand from the center of the Motion's view
    var zDistance = position[2];
    if (zDistance < calibrationValues['forward'] + 10) {
        addDirection('forward', newDirections);
    }
    else if (zDistance > calibrationValues['backward'] - 10) {
        addDirection('backward', newDirections);
    }
    console.log(newDirections);
    if (!newDirections.length) {
        addDirection('stop', newDirections);
    }

    if (!isEqual(newDirections, currentDirections)) {
        moveDrone(newDirections);
    }
}

function moveDrone(directions) {
    console.log(directions);
    for (var i = 0; i < directions.length; i++) {
        socket.emit('move drone', directions[i]);
        console.log('Drone direction: ' + directions[i]);
    }
    currentDirections = directions;
}

function takeoffController(hands) {
    if (!isEqual(currentDirections, ['stop'])) socket.emit('move drone', 'stop');
    currentDirections = ['stop'];
    var leftNormal = 0;
    var rightNormal = 0;
    var leftHeight = 0;
    var rightHeight = 0;

    hands.forEach(function(hand) {
        if (hand.type == 'right') {
            rightNormal = hand.palmNormal;
            rightHeight = hand.palmPosition[1];
        }
        else {
            leftNormal = hand.palmNormal;
            leftHeight = hand.palmPosition[1];
        }
    });

    if (leftNormal[1] > 0.75 && rightNormal[1] > 0.75 && rightHeight > (calibrationValues['up'] - 10) && (leftHeight > calibrationValues['up'] - 10) && !inFlight && !tolTimer) {
        startTOLTimer();
        console.log('Drone taking off');
        socket.emit('TOL', 'takeOff');
    }
    else if (leftNormal[1] < -0.75 && rightNormal[1] < -0.75 && rightHeight < (calibrationValues['down'] + 10) && leftHeight < (calibrationValues['down'] + 10) && inFlight && !tolTimer) {
        startTOLTimer();
        console.log('Drone is landing');
        socket.emit('TOL', 'land');
    }
}

var HandDot = function() {
    var hand = this;
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.id = 'handDot';
    document.getElementById('leapGrid').appendChild(div);

    hand.setTransform = function(position) {
        div.style.left = ((position[0] + 200)) + 'px';
        div.style.top  = ((position[2] + 150)) + 'px';
    };
};

var CalibrationDot = function() {
    var hand = this;
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.id = 'calibrationDot';
    document.getElementById('calibrationGrid').appendChild(div);

    hand.setTransform = function(position) {
        div.style.left = ((position[0] + 200)) + 'px';
        div.style.top  = ((position[2] + 150)) + 'px';
    };
};

$('.open-popup').magnificPopup({
    type:'inline',
    callbacks: {
        open: function () {
            calibrationTime = true;
            $('#calibrationDirection').text(calibrationDirections[calibrationIndex]);
        }
    }
});

function startTOLTimer() {
    tolTimer = true;
    setTimeout(function() {
        tolTimer = false;
    }, 3000);
}

hands[0] = new HandDot();
calibrationHands[0] = new CalibrationDot();

socket.on('TOL', function (flight) {
    inFlight = flight;
});

