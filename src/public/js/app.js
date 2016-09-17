init();

function init() {

	Webcam.set({
		width: 1280,
		height: 720,
		image_format: 'jpeg',
		jpeg_quality: 100
	});

	Webcam.attach( '#my_camera');
}

function take_snapshot() {
    console.log('Taking photo');
	Webcam.snap(function(data_uri) {

		// server side cognitive processing
		POSTPicDataServer(data_uri);

		// client side cognitive processing
		// POSTPicDataClient(data_uri);

	});
}

function makeblob (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

function saveToSQL(data, key) {

	var mskey = key;

	$.ajax({
        type:"POST",
        beforeSend: function (request){
            request.setRequestHeader("Content-Type", "application/json");
        },
        url: "/api/sql",
        data:JSON.stringify({
        	"data":data, 
        	"apikey": mskey
        }),
        success: function(msg) {
            console.log(msg);

        }
    });
}


function POSTPicDataServer(url) {

	var mskey = $("#apikeyinput").val();

	$.ajax({
        type:"POST",
        beforeSend: function (request){
            request.setRequestHeader("Content-Type", "application/json");
        },
        url: "/api/photo",
        data:JSON.stringify({
        	"data":url, 
        	"apikey": mskey
        }),
        success: function(msg) {
            console.log(msg);

            var message = JSON.parse(msg);
   
          	var output = "";

          	for(var i=0; i<message.length; i++) {
          		output += "<strong>Person " + i + "</strong><br>"
          		output += "anger: " + message[i].scores.anger;
          		output += ", contempt: " + message[i].scores.contempt;
          		output += ", disgust: " + message[i].scores.disgust;
          		output += ", fear: " + message[i].scores.fear;
          		output += ", happiness: " + message[i].scores.happiness;
          		output += ", neutral: " + message[i].scores.neutral;
          		output += ", sadness: " + message[i].scores.sadness;
          		output += ", surprise: " + message[i].scores.surprise;

          		output += "<br><br>";

          	}

          	$("#emotionresults").html(output);

        }
    });

}

function POSTPicDataClient(data_uri) {
	var mskey = $("#apikeyinput").val();

		$.ajax({
		    url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
		    type: 'POST',
		    processData: false,
		    contentType: 'application/octet-stream',
		    headers: {
		        "Ocp-Apim-Subscription-Key" : mskey
		    },
		    data: makeblob(data_uri)
		}).done(function(data) {
			console.log(data);

			saveToSQL(data, mskey);

			var message = data;
   
          	var output = "";

          	for(var i=0; i<message.length; i++) {
          		output += "<strong>Person " + i + "</strong><br>"
          		output += "anger: " + message[i].scores.anger;
          		output += ", contempt: " + message[i].scores.contempt;
          		output += ", disgust: " + message[i].scores.disgust;
          		output += ", fear: " + message[i].scores.fear;
          		output += ", happiness: " + message[i].scores.happiness;
          		output += ", neutral: " + message[i].scores.neutral;
          		output += ", sadness: " + message[i].scores.sadness;
          		output += ", surprise: " + message[i].scores.surprise;

          		output += "<br><br>";

          	}

          	$("#emotionresults").html(output);

		}).fail(function(err) {
			console.log(err);
		});
}