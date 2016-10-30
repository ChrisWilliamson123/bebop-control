$('#slider').slider({
    value:50,
    min: 0,
    max: 100,
    step: 10,
    animate: true,
    range: 'min',
    slide: function( event, ui ) {
        $( '#amount' ).text( ui.value );
        console.log('here');
        socket.emit('defaultSpeedChange', ui.value);
    }
});

$('#amount').text( $('#slider').slider('value') );
$("#slider .ui-slider-handle").unbind('keydown');

$('#wifiStrength').slider({
    value:0,
    min: 0,
    max: 100,
    step: 1,
    range: 'min',
    orientation: 'vertical'
});
$("#slider .ui-slider-handle").unbind('keydown');

$('#heightSlider').slider({
    value:0,
    min: 0,
    max: 100,
    step: 1,
    range: 'min',
    orientation: 'vertical'
});
$("#heightSlider .ui-slider-handle").unbind('keydown');

