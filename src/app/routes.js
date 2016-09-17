 // app/routes.js
var request = require('request');

var mysql = require('mysql');
//var bodyParser = require('body-parser')

function getConnection() {
    return mysql.createConnection({
              host     : 'localhost',
              user     : 'root',
              password : 'test123',
              database : 'mtp_prototype_db'
            });
}

var mysqlConn;

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

module.exports = function(app) {

    // server routes ===========================================================
//    app.get('*', function(req, res) {
//        res.sendfile('./public/views/index.html'); // load our public/index.html file
//    });

    app.get('/getemotion', function(req, res) {
        res.sendfile('./public/views/index.html'); // load our public/index.html file
    });
    
    app.get('/g', function(req, res) {
        res.sendfile('./public/views/index.html'); // load our public/index.html file
    });
//    app.use(this.bodyParser);
    app.get('/api/registerMessage', function(req, res) {
        console.log('Original URL : ' + req.query.json);
        console.log('Decoded URL : ' + decodeURIComponent(req.query.json));
        
//        console.log('Original BODY : ' + req.body.data);
//        console.log('Decoded BODY  : ' + decodeURIComponent(req.body.data));
//        console.log('JSON.parse    : ' + JSON.parse(req.body));

        
//        console.log('Body parser : ' + req.body);
        
        var inputJson = JSON.parse(req.query.json);
        
        console.log('content_producer : ' + inputJson.content_producer);
        console.log('content_to_deliver : ' + inputJson.content_to_deliver);
        console.log('triggering_emotion : ' + inputJson.triggering_emotion);
        res.send("Success");
        writeRequestToDB(inputJson);
    });
    
    app.post('/api/photo', function(req, res) {

        var url = req.body.data;
        var apikey = req.body.apikey;
        if(!apikey) {apikey = '6c252f89e302408c9a1d2dff47cc38f2';}

        var buffer = new Buffer(url.split(",")[1], 'base64');

        request({
            url: 'https://api.projectoxford.ai/emotion/v1.0/recognize', //URL to hit
            method: 'POST',
            headers: {
                "content-type" : 'application/octet-stream',
                "Ocp-Apim-Subscription-Key" : apikey
            },
            body: buffer
            }, function(error, response, body){
                if(error) {
                    console.log(error);
                    res.send(error);
                } else {
                    console.log(response.statusCode, body);
                    res.send(body);
                    analyzePhoto(body);
                }
        });

    });

    app.post('/api/emotion', function(req, res) {
        var mysqlConn = getConnection(function(err) {
            if(err) {console.log('Error creating a connection : ' + err);}
        });
        mysqlConn.connect();
        var selQuery = 'SELECT * from faceframes ORDER BY ID DESC LIMIT 1;';
        mysqlConn.query(selQuery, function(err,rows, fields) {
            if(!err) {
                console.log('# of rows : ' + rows.length);
                var results = JSON.stringify(rows);
                console.log('Column Values : ' + results);
                mysqlConn.end();
                res.send(results);
            } else {
                console.log('Error selecting TOP 1 from from faceframes : ' + err);
                mysqlConn.end();
            }
        });
    });

};

function analyzePhoto(data) {
    
    var emotions = ["anger", "contempt", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"];

    var obj = JSON.parse(data);

    var timestamp = Math.floor(new Date() / 1000);
    
    var numberoffaces = obj.length;
    var avg_anger = 0;
    var avg_contempt = 0;
    var avg_disgust = 0;
    var avg_fear = 0;
    var avg_happiness = 0;
    var avg_neutral = 0;
    var avg_sadness = 0;
    var avg_surprise = 0;

    for(var i=0; i<obj.length; i++) {
        avg_anger += obj[i].scores.anger;
        avg_contempt += obj[i].scores.contempt;
        avg_disgust += obj[i].scores.disgust;
        avg_fear += obj[i].scores.fear;
        avg_happiness += obj[i].scores.happiness;
        avg_neutral += obj[i].scores.neutral;
        avg_sadness += obj[i].scores.sadness;
        avg_surprise += obj[i].scores.surprise;
    }

    avg_anger = avg_anger/numberoffaces;
    avg_contempt = avg_contempt/numberoffaces;
    avg_disgust = avg_disgust/numberoffaces;
    avg_fear = avg_fear/numberoffaces;
    avg_happiness = avg_happiness/numberoffaces;
    avg_neutral = avg_neutral/numberoffaces;
    avg_sadness = avg_sadness/numberoffaces;
    avg_surprise = avg_surprise/numberoffaces;

    console.log("avg_anger", avg_anger);
    console.log("avg_contempt", avg_contempt);
    console.log("avg_disgust", avg_disgust);
    console.log("avg_fear", avg_fear);
    console.log("avg_happiness", avg_happiness);
    console.log("avg_neutral", avg_neutral);
    console.log("avg_sadness", avg_sadness);
    console.log("avg_surprise", avg_surprise);

    var overallemotion_index = getOverallEmotion([avg_anger, avg_contempt, avg_disgust, avg_fear, avg_happiness, avg_neutral, avg_sadness, avg_surprise]);
    var overallemotion_text = emotions[overallemotion_index];
    console.log("overall emotion: ", overallemotion_text);

    writeToMySQLDB(timestamp, overallemotion_text, avg_anger.toFixed(9), avg_contempt.toFixed(9), avg_disgust.toFixed(9), avg_fear.toFixed(9), avg_happiness.toFixed(9), avg_neutral.toFixed(9), avg_sadness.toFixed(9), avg_surprise.toFixed(9), numberoffaces);
}

function writeRequestToDB(inputJson) {
    var mysqlConn = getConnection(function(err) {
        if(err) {console.log('Error creating a connection : ' + err);}
    });
    var timestamp = Math.floor(new Date() / 1000);
    var insertQuery = "INSERT message_registry (epochtime, triggering_emotion, content_producer, content_to_deliver) VALUES (" + timestamp + ", '" + inputJson.triggering_emotion + "', '" + inputJson.content_producer + "', '" + inputJson.content_to_deliver + "');"
    console.log('INSERT QUERY : \n' + insertQuery);
    mysqlConn.query(insertQuery, function(err, result) {
        if(!err) {
            console.log('Result of INSERT query : ' + result);
            console.log('Values inserted : ' + result.affectedRows);
        } else {
            console.log('Error inserting into faceframes : ' + err);
        }
    });
    mysqlConn.end();    
}

function writeToMySQLDB(timestamp, overallemotion, anger, contempt, disgust, fear, happiness, neutral, sadness, surprise, number_of_faces){

    var mysqlConn = getConnection(function(err) {
        if(err) {console.log('Error creating a connection : ' + err);}
    });
    var insertQuery = "INSERT faceframes (epochtime, number_of_faces, overall_emotion, anger, contempt, disgust, fear, happiness, neutral, sadness, surprise) VALUES (" + timestamp + "," + number_of_faces + ",'" + overallemotion + "'," + anger + "," + contempt + "," + disgust + "," + fear + "," + happiness + "," + neutral + "," + sadness + "," + surprise + ");"
    console.log('INSERT QUERY : \n' + insertQuery);
    mysqlConn.query(insertQuery, function(err, result) {
        if(!err) {
            console.log('Result of INSERT query : ' + result);
            console.log('Values inserted : ' + result.affectedRows);
        } else {
            console.log('Error inserting into faceframes : ' + err);
        }
    });
    mysqlConn.end();
}

function getOverallEmotion(emotion_array) {
    var greatest = Math.max.apply(Math, emotion_array);
    return emotion_array.indexOf(greatest);
}
//create table faceframes (epochtime DATE, number_of_faces INTEGER, overall_emotion DOUBLE, anger DOUBLE, contempt DOUBLE, disgust DOUBLE, fear DOUBLE, happiness DOUBLE, neutral DOUBLE, sadness DOUBLE, surprise DOUBLE)

//"Ocp-Apim-Subscription-Key", "6c252f89e302408c9a1d2dff47cc38f2"