var fs = require('fs');
var nStatic = require('node-static');

var options = {
    serverInfo: 'Visualcosita',
    cache: 10800
};

var fileServer = new nStatic.Server('./build', options);

require('http').createServer(function (req, res) {
    //res.writeHead(302,  {Location: 'https://' + req.headers.host + req.url});
    //res.end();
    req.addListener('end', function () {
        fileServer.serve(req, res, function (err, result) {
            if (err) { // There was an error serving the file
                console.error("Error serving " + res.url + " - " + err.message);

                // Respond to the client
                res.writeHead(err.status, err.headers);
                res.end();
            }
        });
    }).resume();
}).listen(process.env.PORT || 5000);
