var io = require('socket.io-client');


var Player = require('./node_modules/broadway-player/Player/Player');
var player = new Player({
    useWorker: true,
    workerFile: './node_modules/broadway-player/Player/Decoder.js',
});

player.canvas.id = 'videoCanvas';
$('#main').append(player.canvas);


var toUint8Array = function (parStr) {
    var raw = atob(parStr);
    var array = new Uint8Array(new ArrayBuffer(raw.length));

    Array.prototype.forEach.call(raw, function (data, index) {
        array[index] = raw.charCodeAt(index);
    });

    return array;
};

socket.on('data', function (data) {
    player.decode(toUint8Array(data));
});