var hands = {};
var calibrationHands = {};
var output = document.getElementById('output');

// var calibrationValues = {
//         'left': -95,
//         'right': 128,
//         'forward': -81,
//         'backward': 117,
//         'up': 253,
//         'down': 79
//     },
var calibrationValues = {
        'left': 0,
        'right': 0,
        'forward': 0,
        'backward': 0,
        'up': 0,
        'down': 0
    },
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
    waitingForOpenHand = false;
    magnificPopup = $.magnificPopup.instance;

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
    $('#forward').height(185 + calibrationValues['forward']);
    $('#backward').height(185 - calibrationValues['backward']);
    var upPercentage = Math.round(((calibrationValues['up'] - 50) / 350) * 100);
    var downPercentage = Math.round(((calibrationValues['down'] - 50) / 350) * 100);
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
    // // Just show the number of hands that are currently being detected
    // output.innerHTML = 'Number of hands: ' + handCount;
    //
    // // If there are no hands detected, we want the drone to hover
    // if (!handCount) {
    //     if (!isEqual(currentDirections, ['stop'])) moveDrone(['stop']);
    // }
    // else if (handCount == 2) {
    //     takeoffController(frame.hands);
    // }
    // else if (handCount == 1 && frame.hands[0].type == 'right') {
    //     // if (frame.hands)
    //     console.log(frame.hands[0].grabStrength > 0.9 && !droneConnected);
    //     if (frame.hands[0].grabStrength > 0.9 && !droneConnected) {
    //         socket.emit('connectDrone');
    //         droneConnected = true;
    //     }
    //     else {
    //         rightHandController(frame.hands[0]);
    //     }
    // }
    if (handCount == 0 && grabTracker.enabled) {
        console.log('No hands detected, cancelling grab tracker.');
        resetGrabTracker();
    }

    frame.hands.forEach(function(hand, index) {
        // If we're calibrating, move the dot and check the calbration status
        if (calibrationTime) {
            var calibrationDot = (calibrationHands[index] || (calibrationHands[index] = new CalibrationDot()));
            calibrationDot.setTransform(hand.palmPosition);
            checkZoneConfirmation(frame, hand);
        }
        // Move the main page dot and height meter
        else {
            var handDot = (hands[index] || (hands[index] = new HandDot()));
            handDot.setTransform(hand.palmPosition);
            var heightPercentage = ((hand.palmPosition[1] - 50) / 350) * 100;
            $('#heightSlider').slider('value', heightPercentage);
        }
    });

}).use('screenPosition', {scale: 0.25});

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

var magnificPopup = $.magnificPopup.instance;
$('.open-popup').magnificPopup({
    type:'inline',
    callbacks: {
        open: function () {
            calibrationTime = true;
            $('#calibrationDirection').text(calibrationDirections[calibrationIndex]);
        }
    }
});

hands[0] = new HandDot();
calibrationHands[0] = new CalibrationDot();

