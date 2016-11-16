var FtpClient = require('ftp');
var fs = require('fs');

var ftpController = function(socket) {

    // Connect to the drone FTP file system
    this.client = new FtpClient();
    client = this.client;

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

    function setupDownloader() {
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
                    var progressPercentage = Math.round((fileSizeInBytes / fileSize) * 100);
                    console.log(progressPercentage);
                    socket.emit('downloadProgress', {
                        'name': filename,
                        'progress': progressPercentage
                    });
                }, 500);

                stream.once('close', function() {
                    console.log('Transfer complete!');
                    socket.emit('downloadComplete', filename);
                    clearInterval(progress);
                });

                stream.pipe(fs.createWriteStream(filename));
            });
        })
    }

    function getFiles(files, directory, downloadIndex) {
        if (downloadIndex === undefined) {
            downloadIndex = 0;
        }
        client.get(files[downloadIndex], function(err, stream) {
            if (err) throw err;
            stream.once('close', function() {
                console.log('Transfer complete: ' + files[downloadIndex]);
                downloadIndex++;
                if (downloadIndex != files.length) {
                    getFiles(files, directory, downloadIndex);
                }
                else {
                    // We are complete, so change directory and list actual files
                    setupDownloader(client);
                }
            });
            stream.pipe(fs.createWriteStream(directory + '/' + files[downloadIndex]));
        });
    }

    this.downloadThumbnails = function() {
        client.cwd('/internal_000/Bebop_2/thumb', function(err, wd) {console.log(wd);});
        client.list(function (err, list) {
            var thumbnails = [];
            for (var i = 0; i < list.length; i++) {
                thumbnails.push(list[i].name);
            }
            console.log(thumbnails);
            getFiles(thumbnails, 'thumbnails');
        });
    }
};

module.exports = ftpController;
