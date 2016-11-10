socket.emit('xboxInitialised');

socket.on('controller connected', function(connected) {
    $('#connection-status #controller').removeClass();
    $('#connection-status #controller').addClass(connected.toLowerCase());
    $('#connection-status #controller').text(connected);
});

socket.on('left stick', function(values) {
    var x = values.x;
    var y = values.y;
    var yPercentage = 0;
    var xPercentage = 0;
    if (y > 0) {
        // Needs to be down
        yPercentage = 50 + (y / 2);

        // Also need to reduce the down value by 10px so that the dot doesn't overflow the box border
        var cssString = 'calc(' + yPercentage.toString() + '% - 10px)';
        $('#left-stick > div').css('top', cssString);
    }
    else {
        // Needs to be up
        yPercentage = 50 - ((y * -1) / 2);
        $('#left-stick > div').css('top', yPercentage + '%');
    }

    if (x > 0) {
        // Needs to be right
        xPercentage = 50 + (x / 2);

        // Also need to reduce the left value by 10px so that the dot doesn't overflow the box border
        var cssString = 'calc(' + xPercentage.toString() + '% - 10px)';
        $('#left-stick > div').css('left', cssString);
    }
    else {
        // Needs to be left
        xPercentage = 50 - ((x * -1 ) / 2);
        $('#left-stick > div').css('left', xPercentage + '%');
    }
});

socket.on('right stick', function(values) {
    var x = values.x;
    var xPercentage = 0;

    if (x > 0) {
        // Needs to be right
        xPercentage = 50 + (x / 2);

        // Also need to reduce the left value by 10px so that the dot doesn't overflow the box border
        var cssString = 'calc(' + xPercentage.toString() + '% - 10px)';
        $('#right-stick > div').css('left', cssString);
    }
    else {
        // Needs to be left
        xPercentage = 50 - ((x * -1 ) / 2);
        $('#right-stick > div').css('left', xPercentage + '%');
    }
});

socket.on('trigger', function(data) {
    $('#' + data.side + '-trigger > div').width(data.fillAmount);
});

socket.on('showHelp', function() {
    $('#' + 'help').toggle();
    $('#' + 'main').toggle();
});
