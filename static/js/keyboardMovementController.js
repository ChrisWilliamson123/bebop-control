$(document).ready(function() {
    var keysPressed = [];

    var movementKeys = [87, 65, 83, 68, 38, 37, 40, 39];

    var keyIdsToNames = {
        87: 'w',
        65: 'a',
        83: 's',
        68: 'd',
        38: 'u',
        37: 'l',
        40: 'down',
        39: 'r'
    };

    function keyHighlighter(key, addHighlight) {
        var $keyDiv = $('#' + keyIdsToNames[key]);
        if (addHighlight) {
            $keyDiv.addClass('active');
        }
        else {
            $keyDiv.removeClass('active');
        }
    }

    $(document).keydown(function(event) {
        var key = event.which;
        console.log(key);
        keyHighlighter(key, true);
        if (movementKeys.indexOf(key) >= 0) {
            if (keysPressed.indexOf(key) < 0) {
                keysPressed.push(key);
                socket.emit('droneMovement', keysPressed);
            }
        }
        else if (key == 84) {
            console.log('here');
            socket.emit('TOL', 'drone.takeoff()');
        }
        else if (key == 76) {
            socket.emit('TOL', 'drone.land()');
        }
        else if (key == 67) {
            socket.emit('connectToDrone');
        }
    });

    $(document).keyup(function(event) {
        var key = event.which;
        keyHighlighter(key, false);
        var index = keysPressed.indexOf(key);
        if (index >= 0) {
            keysPressed.splice(index, 1);
            socket.emit('droneMovement', keysPressed);
        }
    });

    socket.emit('keyboardInitialised');
});
