$(document).ready(function() {
    $.magnificPopup.open({
        items: {
            src: '#calibrationPopup'
        },
        type: 'inline'
    });
});

$('.open-popup').magnificPopup({
    type:'inline',
    callbacks: {
        open: function () {
            calibrationTime = true;
            calibrationApplied = false;
            calibrationIndex = 0;
            $('#initialCheck').hide();
            $('#mainContent').show();
            $('#calibrationDirection').text(calibrationDirections[calibrationIndex]);
            $('#calibrationGridContainer img').attr('src', 'static/img/' + calibrationDirections[calibrationIndex] + '.gif');
        }
    }
});


$('#initialCalibration').click(function() {
    magnificPopup.close();
    calibrationValues = initialCalibrationValues;
    applyZoneCSS();
});

$('#ownCalibration').click(function() {
    $('#initialCheck').hide();
    $('#mainContent').show();
    calibrationTime = true;
    calibrationApplied = false;
    $('#calibrationDirection').text(calibrationDirections[calibrationIndex]);
});
