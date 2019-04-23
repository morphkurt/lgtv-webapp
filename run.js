const request = require('request')
const parseString = require('xml2js').parseString
const express = require('express')
const app = express()



const VOLUME_UP=24
const VOLUME_DOWN=25
const MUTE=26
const VOLUME_INFO="volume_info"
const POWER_OFF=1


var volumeData = {};
let ipAddress="x.x.x.x"
let pairCode="xxxx"
let port=8080;

app.get('/api/lgtv/:command/:value?', (req, res) => {
	
	var command = req.params.command
	var value = req.params.value
	if (command == "mute"){
		createAuth()
		.then(sendCommand(MUTE))
	} else if (command == "volume"){
		createAuth()
		.then(queryVolumeData)
		.then(function(o){setVolume(o,parseInt(value))});
	} else if (command == "poweroff"){
		createAuth()
		.then(sendCommand(POWER_OFF))
	} else {
		res.send("INVALID COMMAND")
	}
	res.send("OK")
})

app.listen(port, () => console.log(`LG TV Remote app listening on port ${port}!`))


function queryVolumeData(){
	return new Promise(function(resolve,reject) {
		const options = {
  			url: 'http://'+ipAddress+":8080/roap/api/data?target=volume_info",
  			headers: {
  	  			'User-Agent': 'request',
				'Content-Type':'application/atom+xml'
  			}
		};
		request.get(options,function(error,response,body){
			parseString(body, function (err, result) {
   				var status = result.envelope.ROAPError[0];
				if (status==200){
					volumeData['mute']=result.envelope.data[0].mute[0];
					volumeData['level']=result.envelope.data[0].level[0];
					resolve(volumeData)
				}
				reject(err)
			});	
		}).end()
	});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setVolume(o,reqLevel){
	
	var setLevel=parseInt(o.level);
	
	if (setLevel > reqLevel){
		for (i = reqLevel; i < setLevel ; i++){
			await sendCommand(VOLUME_DOWN)
			await sleep(200);

		}
	}
	if (setLevel < reqLevel){
		for (i = setLevel; i < reqLevel ; i++){
			await sendCommand(VOLUME_UP)
			await sleep(200);
		}
	}
	
}

function createAuth(){
	return new Promise(function(resolve,reject){
		const options = {
  			url: 'http://'+ipAddress+":8080/roap/api/auth",
  			headers: {
  	  			'User-Agent': 'request',
				'Content-Type':'application/atom+xml'
  			}
		};
		body="<?xml version=\"1.0\" encoding=\"utf-8\"?><auth><type>AuthReq</type><value>"+pairCode+"</value></auth>"
		request.post(options,function(error,response,body){
			parseString(body, function (err, result) {
   				var status = result.envelope.ROAPError[0];
   				var session = result.envelope.session[0];
				(status==200) ? resolve(result): reject(err);
			});		
		}).end(body)
	})
}




function sendCommand(commandValue){
	return new Promise(function(resolve,reject) {
		const options = {
  			url: 'http://'+ipAddress+":8080/roap/api/command",
 	 		headers: {
  	  			'User-Agent': 'request',
				'Content-Type':'application/atom+xml'
  			}
		};
		body="<?xml version=\"1.0\" encoding=\"utf-8\"?><command><name>HandleKeyInput</name><value>"+commandValue+"</value></command>"
		request.post(options,function(error,response,body){
			parseString(body, function (err, result) {
   				var status = result.envelope.ROAPError[0];
				if (status==200){
					resolve(status)
				}
				reject(err)
			});			
		}).end(body)
	})
}
