$('.open-files-popup').magnificPopup({
    type:'inline'
});

function applyTransferClickEvents() {
    $('.transfer').click(function() {
        $(this).text('Waiting...');
        console.log('here');
        // Get the file name
        var filename = $(this).parent().parent().data('name');
        socket.emit('downloadMedia', filename);
    });
}

$('#selectMode').click(function() {
    $('.transfer').hide();
    $('.selectBox').show();
});