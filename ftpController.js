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


    // This takes a filename, which will include date and time.
    // Returns a readable sentance with the date and time.
    function filenameToReadableDate(filename) {
        var split = ISODate.split('T');
        var date = split[0].split('_')[2].split('-');
        var time = split[1].substr(0, 4);
        return date[2] + '/' + date[1] + '/' + date[0] + ' at ' + time.substr(0, 2) + ':' + time.substr(2, 4);
    }

    // Takes a filename and returs the media type
    function filenameToMediaType(filename) {
        var fileType = filename.split('.')[1];
        if (fileType == 'mp4') {
            return 'Video';
        }
        else {
            return 'Image (' + fileType + ')';
        }
    }

    // This function is used to setup the list of files in the browser
    function setupDownloader() {
        // Change directory to the drone's media directory
        client.cwd('/internal_000/Bebop_2/media', function(err, wd) {console.log(wd);});
        // List the files in the directory
        client.list(function (err, list) {
            // For each file in the list
            for (var i = 0; i < list.length; i++) {
                // Get the date of creation
                var readableDate = filenameToReadableDate(list[i].name);
                // Get the size of the file
                var fileString = getFileSizeString(list[i].size);
                // Get the file type
                var fileType = filenameToMediaType(list[i].name);

                // Set up the thumbnail name, depends on the filetype
                if (list[i].name.indexOf('mp4') >= 0) {
                    var thumbnailName = list[i].name + '.jpg'
                }
                else {
                    var thumbnailName = list[i].name.split('.')[0] + '.jpg';
                }

                // Send the file to the frontend
                socket.emit('fileDetected', {
                    'name': list[i].name,
                    'type': fileType,
                    'date': readableDate,
                    'size': fileString,
                    'thumbnailName': thumbnailName
                })
            }
        });

        // Function to download the media file via ftp
        socket.on('downloadMedia', function(filename) {
            var fileSize;
            // Get the size of the file we want to transfer
            client.size(filename, function(err, filesize) {
                fileSize = filesize;
            });

            // Start the transfer process
            client.get(filename, function(err, stream) {
                if (err) throw err;

                // Set up the progress interval
                var progress = setInterval(function() {
                    // Get the current size of the downloading file
                    var stats = fs.statSync(filename);
                    var fileSizeInBytes = stats["size"];
                    // Convert it to a percentage of the total file size
                    var progressPercentage = Math.round((fileSizeInBytes / fileSize) * 100);

                    // Send this to the frontend so the progress meter can be updated
                    socket.emit('downloadProgress', {
                        'name': filename,
                        'progress': progressPercentage
                    });
                }, 500);

                // Once we have finished downloading, let the front end know. Also clear the progress interval
                stream.once('close', function() {
                    socket.emit('downloadComplete', filename);
                    clearInterval(progress);
                });

                // Actually start the download
                stream.pipe(fs.createWriteStream(filename));
            });
        })
    }

    // This function uses recursion to download an array of filenames
    function getFiles(files, directory, downloadIndex) {
        // If a download index isn't passed, set it to 0
        if (downloadIndex === undefined) {
            downloadIndex = 0;
        }
        // Start the transfer process
        client.get(files[downloadIndex], function(err, stream) {
            if (err) throw err;

            // Once we have finished downloading the file...
            stream.once('close', function() {
                downloadIndex++;
                // If we still have files to download, call the function again with the next download index
                if (downloadIndex != files.length) {
                    getFiles(files, directory, downloadIndex);
                }
                else {
                    // We are complete, so change directory and list actual files
                    console.log('Thumbnails have finished downloading');
                    setupDownloader(client);
                }
            });
            // Start downloading, in the directory specified
            stream.pipe(fs.createWriteStream(directory + '/' + files[downloadIndex]));
        });
    }

    // Initialiser to download thumbnails
    this.downloadThumbnails = function() {
        // Change to the thumbnailing directory
        client.cwd('/internal_000/Bebop_2/thumb', function(err, wd) {console.log(wd);});
        // List the thumbnails
        client.list(function (err, list) {
            // Add the thumbnail file names to an array
            var thumbnails = [];
            for (var i = 0; i < list.length; i++) {
                thumbnails.push(list[i].name);
            }
            // Start downloading them
            getFiles(thumbnails, 'static/thumbnails');
        });
    }
};

module.exports = ftpController;
