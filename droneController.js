var fs = require('fs');
var socket;

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

// This is used for viewing the files on the drone.
// Returns the human readable file size
function getFileSizeString(fileSize) {
    var inMB = fileSize / 1000000;
    if (inMB > 1000) {
        return (inMB / 1000).toFixed(2).toString() + 'GB';
    }
    else {
        return inMB.toFixed(2).toString() + 'MB';
    }
}

function ISOToReadable(ISODate) {
    var split = ISODate.split('T');
    var date = split[0];
    var time = split[1].substr(0, 5);
    return date + ' at ' + time;
}

function filenameToMediaType(filename) {
    var fileType = filename.split('.')[1];
    if (fileType == 'mp4') {
        return 'Video';
    }
    else {
        return 'Image (' + fileType + ')';
    }
}

function setupDownloader(client) {
    client.cwd('/internal_000/Bebop_2/media', function(err, wd) {console.log(wd);});
    client.list(function (err, list) {
        for (var i = 0; i < list.length; i++) {
            var readableDate = ISOToReadable((list[i].date).toISOString());
            var fileString = getFileSizeString(list[i].size);
            var fileType = filenameToMediaType(list[i].name);
            socket.emit('fileDetected', {
                'name': list[i].name,
                'type': fileType,
                'date': readableDate,
                'size': fileString
            })
        }
    });

    // Function to download the media via ftp
    socket.on('downloadMedia', function(filename) {
        var fileSize;
        // Get the size of the file we want to transfer
        client.size(filename, function(err, filesize) {
            fileSize = filesize;
        });

        // Start the transfer of the file
        client.get(filename, function(err, stream) {
            if (err) throw err;

            var progress = setInterval(function() {
                var stats = fs.statSync(filename);
                var fileSizeInBytes = stats["size"];
                console.log(Math.round((fileSizeInBytes / fileSize) * 100));
            }, 500);

            stream.once('close', function() {
                console.log('Transfer complete!');
                clearInterval(progress);
            });

            stream.pipe(fs.createWriteStream(filename));
        });
    })
}

function getFiles(client, files, directory, downloadIndex) {
    if (downloadIndex === undefined) {
        downloadIndex = 0;
    }
    client.get(files[downloadIndex], function(err, stream) {
        if (err) throw err;
        stream.once('close', function() {
            console.log('Transfer complete: ' + files[downloadIndex]);
            downloadIndex++;
            if (downloadIndex != files.length) {
                getFiles(client, files, directory, downloadIndex);
            }
            else {
                // We are complete, so change directory and list actual files
                setupDownloader(client);
            }
        });
        stream.pipe(fs.createWriteStream(directory + '/' + files[downloadIndex]));
    });
}

function downloadThumbnails(client) {
    client.cwd('/internal_000/Bebop_2/thumb', function(err, wd) {console.log(wd);});
    client.list(function (err, list) {
        var thumbnails = [];
        for (var i = 0; i < list.length; i++) {
            thumbnails.push(list[i].name);
        }
        console.log(thumbnails);
        getFiles(client, thumbnails, 'thumbnails');
    });
}

var droneController = function(socketInstance) {
    var count = 0;
    var controller = this;
    socket = socketInstance;
    var bebop = require('node-bebop');
    var FtpClient = require('ftp');
    var NanoTimer = require('nanotimer');
    // Used this. so that it can be referenced by the initiator file
    this.drone = bebop.createClient();
    // Used just 'drone' here so that events below are more readable
    drone = this.drone;

    this.recording = false;
    this.droneOrigin = '';
    this.speed = 50;
    this.defaultTilt = -10;
    this.defaultPan = 0;
    this.currentTilt = -10;
    this.currentPan = 0;
    this.panTiltStep = 10;

    emitBattery = function() {
        socket.emit('battery', drone.navData['battery']);
    };

    drone.on('takingOff', function() {
        socket.emit('takingOff');
    });

    drone.on('landing', function() {
        socket.emit('landing');
        controller.drone.MediaStreaming.videoEnable(0);
    });

    drone.on('AltitudeChanged', function(data) {
        socket.emit('altitude', Math.round(data.altitude));
    });

    drone.on('WifiSignalChanged', function(data) {
        var strength = data.rssi;
        // The normal wifi range is -80 to -20 where -80 is weak and -20 is strong
        // Here we will get that from -60 to 0
        strength += 20;
        strength = Math.round(100 - ((strength / -60) * 100));
        socket.emit('wifiStrength', strength);
    });

    drone.on('HomeChanged', function(data) {
        controller.droneOrigin = {
            'lat': data.latitude,
            'lng': data.longitude
        }
    });

    drone.on('PositionChanged', function(data) {
        if (controller.droneOrigin !== '') {
            var newCoords = {
                'lat': data.latitude,
                'lng': data.longitude
            };
            var distance = calculateDistance(controller.droneOrigin, newCoords);
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
        console.log('data');
        socket.emit('data', data.toString('base64'));
    });

    drone.on('VideoEnableChanged', function(data) {
        console.log(data);
        if (data.enabled == 'enabled') {
            controller.recording = true;
            // drone.startRecording();
            // drone.getVideoStream();
            console.log('Drone is recording to internal storage.');
        }
        else {
            controller.recording = false;
            // drone.stopRecording();
            console.log('Drone is not recording.')
        }
    });

    drone.on('WifiSelectionChanged', function(data) {
        console.log(data);
    });

    drone.on('CurrentTimeChanged', function(data) {
        console.log(data);
    });

    drone.on('CurrentDateChanged', function(data) {
        console.log(data);
    });

    socket.on('defaultSpeedChange', function(newSpeed) {
        controller.speed = newSpeed;
    });

    setTimeout(function() {
        emitBattery();
    }, 10000);

    // As soon as we build a new object, the app will connect to the drone.
    drone.connect(function() {
        console.log('Drone connected');

        // Connect to the drone FTP file system
        var client = new FtpClient();
        client.on('ready', function() {
            console.log('FTP client is ready.');

            downloadThumbnails(client);
        });
        // Connect to the Bebop drone
        client.connect({'host': '192.168.42.1'});
    });
};

module.exports = droneController;
