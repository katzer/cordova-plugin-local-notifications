var configurations = require('./configurations.json');
var fs = require("fs");
var http = require('https');

if(configurations.applicationNames == null) {
    throw new Error("Missing applicationNames array configuration in package.json");
}

if(process.env.npm_config_fromEnvironment == null || process.env.npm_config_toEnvironment == null) {
    throw new Error("Missing repositoryURL, branch, environment arguments");
}

if(process.env.npm_config_authentication == null) {
    throw new Error("Missing authentication argument");
}

if(process.env.npm_config_pipelineSupportURL == null) {
    throw new Error("The base pipeline support app URL \"pipelineSupportURL\" not set");
}

if(process.env.npm_config_destinationFolder == null) {
    throw new Error("The destination folder path for the ipa/apks not set \"destinationFolder\"");
}

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var fromEnvironment = process.env.npm_config_fromEnvironment;
var toEnvironment = process.env.npm_config_toEnvironment;
var applicationNames = configurations.applicationNames;
var basicAuthentication = process.env.npm_config_authentication;
var baseURL = process.env.npm_config_pipelineSupportURL;
var downloadDestinationFolder = process.env.npm_config_destinationFolder;

console.log("Start deployment");

var deploymentKey = deploy(baseURL, fromEnvironment, toEnvironment, applicationNames, basicAuthentication);
var pipelineStatus = "";
var lastLog = {"Instant":"", "Message": ""};
var buildProgress = {};
var checkResponse = null;

while(checkCondition(pipelineStatus)) {
	console.log("Checking Status");
	checkResponse = checkStatus(baseURL, deploymentKey, basicAuthentication);
	var newStatus = checkResponse.Status;

	if(pipelineStatus !=  newStatus) {
		pipelineStatus = newStatus;
		console.log("Status is:" + pipelineStatus);
		console.log("");
	}

	if(pipelineStatus=="StartedDeployment" || pipelineStatus=="Success") {
		if(checkResponse.DeploymentResponse.DeploymentLog != null) {
			if(process.env.npm_config_verbose != null) {
				var newLastLog = checkResponse.DeploymentResponse.DeploymentLog[checkResponse.DeploymentLog.length - 1];
				if(lastLog.Instant != newLastLog.Instant) {
					lastLog = newLastLog;
					console.log("Deployment log message date: " + lastLog.Instant + "|| Message: " + lastLog.Message);
				}
			} else {
				checkResponse.DeploymentResponse.DeploymentLog.forEach( (element) => printBuilding(element) );
			}
		}
	}

	if(pipelineStatus=="StartedBuilding" || pipelineStatus=="Success") {
		checkResponse.BuildingResponse.ApplicationPlatform.forEach( (aux) => {
			aux.PlatformProgress.forEach( (element) => {
				console.log(aux.Name + " " + element.Name + ": " + element.Progress);
			});
		});
	}

	if(pipelineStatus=="Fail") {
		throw new Error("Message: " + checkResponse.ErrorResponse.Error);
	}
	if(checkCondition(pipelineStatus)) {
		sleep(5000);
	}
}

var downloadsBaseURL = checkResponse.SuccessResponse.baseURL;
var iosPath = checkResponse.SuccessResponse.iosPath;
var androidPath = checkResponse.SuccessResponse.androidPath;

console.log("Starting download of apps");

checkResponse.SuccessResponse.downloadableApplications.forEach(function(element) {
	var iosURL = downloadsBaseURL + iosPath + "?appKey=" + element.appKey;
	var androidURL = downloadsBaseURL + androidPath + "?appKey=" + element.appKey;

	if (!fs.existsSync(downloadDestinationFolder)){
		console.log("Create build folder: " + downloadDestinationFolder);
		fs.mkdirSync(downloadDestinationFolder);
	}
	console.log("Apps will be available in: " + downloadDestinationFolder);
	console.log("Started download of ios app for " + element.appName);
	
	download(iosURL, downloadDestinationFolder + element.appName, "/ios-app.ipa", function(error) {
		if(error == null) {
			console.log("Download success for ios platform of app " + element.appName);
		} else {
			console.log("Error downloading android platform of app " + element.appName + " with error: " + error);
		}
	});

	console.log("Started download of android app for " + element.appName);
	download(androidURL, downloadDestinationFolder + element.appName, "/android-app.apk", function(error) {
		if(error == null) {
			console.log("Download success for android platform of app " + element.appName);
		} else {
			console.log("Error downloading android platform of app " + element.appName + " with error: " + error);
		}
	});
});

function checkCondition(status) {
	return !(status.includes("Success") || status.includes("Fail"));
}

function deploy(base, fromEnv, toEnv, appNames, basicAuth) {
	var url =  base + "tagDeployBuild";
	var body = {
	    "fromEnvironmentName": fromEnv,
	    "toEnvironmentName": toEnv,
	    "applicationNames": appNames
	};

	var request = new XMLHttpRequest();
	request.open("POST", url, false);
	request.setRequestHeader("Authorization", basicAuth);
	request.setRequestHeader("Content-Type", "application/json");
	request.send(JSON.stringify(body));

	if(request.status == 200) {
	    console.log("Deployment Response:" + request.responseText);
	    return request.responseText;
	} else {
	    console.log("Network Error:", request);
	    console.log("Network Error:", request.statusText);
	    throw new Error("Message: " + request.responseText);
	}
}

function checkStatus(base, deployKey, basicAuth) {
	var url = base + "status?processKey=" + deployKey;

	var request = new XMLHttpRequest();
	request.open("GET", url, false);
	request.setRequestHeader("Authorization", basicAuth);
	request.setRequestHeader("Content-Type", "application/json");
	request.send();

	if(request.status == 200) {
		console.log("Status response: " + request.responseText)
	    return JSON.parse(request.responseText);
	} else {
	    console.log("Network Error:", request);
	    console.log("Network Error:", request.statusText);
	}
}

function printBuilding(element) {
	console.log("Application: " + element.Name)
	element.PlatformProgress.forEach( (platform) => console.log(platform.Name +  "Progress: " + element.Progress + "%") );
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function download(url, dest, filename, cb) {
	if (!fs.existsSync(dest)){
		console.log("Create build folder: " + dest);
		fs.mkdirSync(dest);
	}
	console.log("Starting Stream");
	var file = fs.createWriteStream(dest + filename);
	var options = {
		headers: {
			"Authorization": basicAuthentication
		},
		timeout: 780000
	};
	var request = http.request(url, options, function(response) {
		  response.pipe(file);
	}).on('error', function(err) {
		if (err) {
			fs.unlink(dest + filename, (fileError) => {
				console.log(fileError);
			});
			console.log(err);
			cb(err);
		}
	});
	request.end();
  };