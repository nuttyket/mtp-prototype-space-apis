    var Connection = require('tedious').Connection;  
    var config = {  
        userName: 'nuttyket',  
        password: 'Demo@Chicago!',  
        server: 'emotionscore.database.windows.net',  
        // If you are on Microsoft Azure, you need this:  
        options: {encrypt: true, database: 'emotionscore'}  
    };  
    var connection = new Connection(config);  
    connection.on('connect', function(err) {  
    // If no error, then good to proceed.  
        console.log("Connected");
        console.log(err);
        readRow();  
    });  

    var Request = require('tedious').Request;  
    var TYPES = require('tedious').TYPES;  
  
    function readRow() {  
        var request = new Request("SELECT TOP 1 * FROM faceframes ORDER BY ID DESC", function(err) {  
        if (err) {  
            console.log(err);}  
        });  

        var result = "";  
        request.on('row', function(columns) {  
            columns.forEach(function(column) {  
              if (column.value === null) {  
                console.log('NULL');  
              } else {  
                result+= column.value + " ";  
              }  
            });  
            console.log(result);  
            result ="";  
            connection.close();
            
        })

        // connection.close();
  
        request.on('done', function(rowCount, more) {  
        	console.log(rowCount + ' rows returned');  
        });  
        connection.execSql(request);  

    }  

    function writeRow() {  
    	var timestamp = (new Date).getTime();
        request = new Request("INSERT faceframes (epochtime, number_of_faces, overall_emotion, anger, contempt, disgust, fear, happiness, neutral, sadness, surprise) VALUES (" + timestamp + ", 2, 'happiness', 0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1);", function(err) {  
        	if (err) {  
           		console.log(err);
        	} 
        	 connection.close();
        });  

        connection.execSql(request);  
    }  
