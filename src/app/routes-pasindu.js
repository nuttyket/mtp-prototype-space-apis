 // app/routes.js
var request = require('request');
var Connection = require('tedious').Connection;  
var config = {  

//jdbc:sqlserver://emotionscore.database.windows.net:1433;database=experience_db;user=nuttyket@emotionscore;password={your_password_here};encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;    

    userName: 'pasindu@crowdemotion',  
    password: 'Iota2016!',  
//    userName: 'nuttyket@emotionscore',  
//    password: 'Demo@Chicago!',  

    server: 'crowdemotion.database.windows.net',  
//    server: 'emotionscore.database.windows.net',
    // If you are on Microsoft Azure, you need this:  
    options: {encrypt: true, database: 'crowd_emotion'}  
//    options: {encrypt: true, database: 'experience_db'}
};  

var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;  

module.exports = function(app) {

    // server routes ===========================================================
    app.get('*', function(req, res) {
        res.sendfile('./public/views/index.html'); // load our public/index.html file
    });

    app.get('/getemotion', function(req, res) {
        res.sendfile('./public/views/getemotion.html'); // load our public/index.html file
    });


    app.post('/api/photo', function(req, res) {

        var url = req.body.data;
        var apikey = req.body.apikey;

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

        var result = readLastRowFromSQLDB();

        var connection = new Connection(config);  

         connection.on('connect', function(err) {  

            if (err) {  
                console.log(err);} 
            console.log("Connected");  
            
            var requesty = new Request("SELECT TOP 1 * FROM faceframes ORDER BY ID DESC", function(err) {  
            if (err) {  
                console.log(err);}  
            });  

            var result = ""; 

            requesty.on('row', function(columns) {
                columns.forEach(function(column, i) {  
                  if (column.value === null) {  
                    console.log('NULL');  
                  } else {  
                    result+= column.value + ",";  
                  }  
                });  
                console.log(result);  
                connection.close();
                res.send(result);
            });

            connection.execSql(requesty);  
        });  

    });

};

function analyzePhoto(data) {
    
    var emotions = ["anger", "contempt", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"];

    var obj = JSON.parse(data);

    var timestamp = (new Date).getTime();
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

    writeToSQLDB(timestamp, overallemotion_text, avg_anger.toFixed(9), avg_contempt.toFixed(9), avg_disgust.toFixed(9), avg_fear.toFixed(9), avg_happiness.toFixed(9), avg_neutral.toFixed(9), avg_sadness.toFixed(9), avg_surprise.toFixed(9), numberoffaces);
}

function writeToSQLDB(timestamp, overallemotion, anger, contempt, disgust, fear, happiness, neutral, sadness, surprise, number_of_faces){

    var connection = new Connection(config);  
    connection.on('connect', function(err) {  
        console.log("Connected");  

        var requestx = new Request("INSERT faceframes (epochtime, number_of_faces, overall_emotion, anger, contempt, disgust, fear, happiness, neutral, sadness, surprise) VALUES (" + timestamp + "," + number_of_faces + ",'" + overallemotion + "'," + anger + "," + contempt + "," + disgust + "," + fear + "," + happiness + "," + neutral + "," + sadness + "," + surprise + ");", function(err) {  
           
            if (err) {  
                console.log(err);
            } 
        
            connection.close();
        });  

        connection.execSql(requestx);  
    });  
}

function readLastRowFromSQLDB() {

    

}  

function getOverallEmotion(emotion_array) {
    var greatest = Math.max.apply(Math, emotion_array);
    return emotion_array.indexOf(greatest);
}
//create table faceframes (epochtime DATE, number_of_faces INTEGER, overall_emotion DOUBLE, anger DOUBLE, contempt DOUBLE, disgust DOUBLE, fear DOUBLE, happiness DOUBLE, neutral DOUBLE, sadness DOUBLE, surprise DOUBLE)