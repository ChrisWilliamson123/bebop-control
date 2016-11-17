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

    function filenameToReadableDate(ISODate) {
        var split = ISODate.split('T');
        var date = split[0].split('_')[2].split('-');
        var time = split[1].substr(0, 4);
        return date[2] + '/' + date[1] + '/' + date[0] + ' at ' + time.substr(0, 2) + ':' + time.substr(2, 4);
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
                console.log(list[i].name);
                var readableDate = filenameToReadableDate(list[i].name);
                var fileString = getFileSizeString(list[i].size);
                var fileType = filenameToMediaType(list[i].name);

                if (list[i].name.indexOf('mp4') >= 0) {
                    var thumbnailName = list[i].name + '.jpg'
                }
                else {
                    var thumbnailName = list[i].name.split('.')[0] + '.jpg';
                }


                socket.emit('fileDetected', {
                    'name': list[i].name,
                    'type': fileType,
                    'date': readableDate,
                    'size': fileString,
                    'thumbnailName': thumbnailName
                })
            }
        });

        // Function to download the media via ftp
        socket.on('downloadMedia', function(filename) {
            var fileSize;
            console.log(filename);
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
            getFiles(thumbnails, 'static/thumbnails');
        });
    }
};

module.exports = ftpController;
