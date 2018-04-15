var fs = require('fs'); // operowanie na plikach
var http = require('http'); // obsługa http
var path = require('path'); // składanie ścierzek
var mime = require('mime'); // zamienia rozszerzenie plików na content type
var mongo = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;

var debugLog = true; // turning on logging to the console

mongo.connect("mongodb://localhost:27017", function(err, conn) {
    if(err) {
        console.log("Connection failed: " + err);
        return;
    }
    var db = conn.db("bank");
    var accounts = db.collection("accounts");
    var transactions = db.collection("transactions");
    function serveFile(rep, fileName, errorCode, message) {

        if(debugLog) console.log('Serving file ' + fileName + (message ? ' with message \'' + message + '\'': ''));

        fs.readFile(fileName, function(err, data) {
            if(err) {
                serveError(rep, 404, 'Document ' + fileName + ' not found');
            } else {
                rep.writeHead(errorCode, message, { 'Content-Type': mime.getType(path.basename(fileName)) });
                if(message) {
                    data = data.toString().replace('{errMsg}', rep.statusMessage).replace('{errCode}', rep.statusCode);
                }
                rep.end(data);
            }
        });
    }

    function serveError(rep, error, message) {
        serveFile(rep, 'html/error.html', error, message);
    }

    var listeningPort = 8888;
    http.createServer().on('request', function (req, rep) {

            if(debugLog) console.log('HTTP request URL: ' + req.url);

            switch(req.url) {
                case '/':
                    serveFile(rep, 'html/index.html', 200, '');
                    break;
                case '/favicon.ico':
                    serveFile(rep, 'img/favicon.ico', 200, '');
                    break;
                case '/konto':
                    switch (req.method){
                        case 'GET':
                            rep.writeHead(200,'OK',{'Content-type':'application/json'});
                            accounts.findOne({ _id: ObjectId("5aae479024c63d156e2c6acf") }, function(err, konto) {
                                rep.end(JSON.stringify(konto));
                            });
                            break;
                        case 'POST':
                            var data = '';
                            req.on('data', function (part) {
                                data += part;
                            }).on('end', function () {
                                var arg = JSON.parse(data);
                                console.log(arg);
                                accounts.findOne({_id: ObjectId("5aae479024c63d156e2c6acf")}, function (err, konto) {
                                    accounts.findOneAndUpdate({_id: ObjectId("5aae479024c63d156e2c6acf")}, {$set: {balance: konto.balance + arg.kwota}}, function (err, op) {
                                        accounts.findOne({_id: ObjectId("5aae479024c63d156e2c6acf")}, function (err, updated_account) {
                                            rep.writeHead(200, 'OK', {'Content-type': 'application/json'});
                                            rep.end(JSON.stringify(updated_account));

                                            transactions.insertOne({data : new Date(), konto : ObjectId("5aae479024c63d156e2c6acf"), saldoPrzed: konto.balance  , kwota : arg.kwota , saldoPo: konto.balance + arg.kwota}, function(succ, err) {

                                                    console.log("Succes " + succ);
                                                    console.log("Error" + err);
                                            });

                                        });
                                    });
                                });

                            });
                            break;
                        default:
                            rep.writeHead(501,'Not implemeted',{'Content-type':'application/json'});
                            rep.end(JSON.stringify({error : "Not implemented"}));
                    }
                    break;
                default:
                    if(/^\/(html|css|js|fonts|img)\//.test(req.url)) {
                        var fileName = path.normalize('./' + req.url)
                        serveFile(rep, fileName, 200, '');
                    } else {
                        serveError(rep, 403, 'Access denied');
                    }
            }
        }
    ).listen(listeningPort);
});
