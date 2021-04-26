var azdev = require("azure-devops-node-api")
var atob = require('atob');
var configurations = require('./configurations.json');

if(configurations.testPipelineArgs == null) {
    throw new Error("Missing testPipelineArg from configurations");
}

if(process.env.npm_config_jsonStringBase64 == null) {
    throw new Error("Missing JSON string with appIDs and platforms");
}

if(process.env.npm_config_deviceAndroid == null) {
    throw new Error("Missing Android version to use");
}

if(process.env.npm_config_deviceIos == null) {
    throw new Error("Missing iOS version to use");
}

if(process.env.npm_config_pipelineID == null) {
    throw new Error("Missing Android Pipeline ID");
}


if(process.env.npm_config_azureProjectID == null) {
    throw new Error("Missing azure project ID");
}

if(process.env.npm_config_dataCenter == null) {
    throw new Error("Missing Data Center");
}

if(process.env.npm_config_token == null) {
    throw new Error("Missing Token string to access pipelines");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executePipeline(androidAppID, iosAppID, plugin, androidVersion, iosVersion, azureProject, pipelineId, token, center, thrds, skipiOS, skipAndroid) {
    const FAILED = 8;
    const orgUrl = 'https://dev.azure.com/OutSystemsRD'
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    const connection = new azdev.WebApi(orgUrl, authHandler);
    const buildApi = await connection.getBuildApi();
    const testApi = await connection.getTestApi();
    const build = {
        templateParameters: {
            "ANDROID_APP_ID": androidAppID,
            "IOS_APP_ID": iosAppID,
            "ANDROID_DEVICE_VERSION": androidVersion,
            "IOS_DEVICE_VERSION": iosVersion,
            "DATACENTER": center,
            "MABS": "latest",
            "PLUGIN_NAME": plugin,
            "RETRY": "1",
            "TAGS": " ",
            "TEST_TYPE": "native",
            "THREADS": thrds,
            "TYPE_OF_DEVICE": "real",
            "skipAndroid": skipAndroid,
            "skipIOS": skipiOS
        },
    };
    const url = `${orgUrl}/${azureProject}/_apis/pipelines/${pipelineId}/runs`;
    const reqOpts = {
        acceptHeader: 'application/json;api-version=6.0-preview.1',
    };
    const queuedBuild = await buildApi.rest.create(url, build, reqOpts);
    const id = queuedBuild.result.id;
    let triggeredBuild = await buildApi.getBuild(azureProject, id);
    console.log(`Tests execution for ${triggeredBuild.buildNumber} has started`);
    while (!triggeredBuild.finishTime) {
        await sleep(30000);
        triggeredBuild = await buildApi.getBuild(azureProject, id);
        console.log(`Pipeline execution in progress... ${triggeredBuild._links.web.href}`)
    }
    triggeredBuild = await buildApi.getBuild(azureProject, id);
    const buildReport = await buildApi.getBuildReport(azureProject, id);
    if (triggeredBuild.result == FAILED) {
        var pipelineError = pipelineError 
            + `Tests finish on pipeline ${triggeredBuild._links.web.href}\n`
            + "Tests Failed"
            + `Passed tests: ${runResults.filter((test) => test.outcome == "Passed").map((test) => `\n${test.testCase.name}` )}\n`
            + `Failed tests with bugs: ${runResults.filter((test) => test.outcome != "Passed" && !test.stackTrace.includes('**Unstable**')).map((test) => `${test.testCase.name}\n` )}\n`
            + `Failed tests without bugs: ${runResults.filter((test) => test.outcome != "Passed" && test.stackTrace.includes('**Unstable**')).map((test) => `${test.testCase.name}\n` )}\n`
            + "\n\n"
        throw new Error(pipelineError)
    } else {
        console.log(`Tests finished: ${triggeredBuild.result == FAILED ? 'failed' : 'passed'}`);
        const buildResults = await testApi.getTestResultsByBuild(azureProject, id);
        const runResults = await testApi.getTestResults(azureProject, buildResults[0].runId);
        console.log(`Passed tests: ${runResults.filter((test) => test.outcome == "Passed").map((test) => `\n${test.testCase.name}` )}\n`);
        console.log(`Failed tests with bugs: ${runResults.filter((test) => test.outcome != "Passed" && !test.stackTrace.includes('**Unstable**')).map((test) => `${test.testCase.name}\n` )}\n`);
        console.log(`Failed tests without bugs: ${runResults.filter((test) => test.outcome != "Passed" && test.stackTrace.includes('**Unstable**')).map((test) => `${test.testCase.name}\n` )}\n`);
    }
}

var personalToken = process.env.npm_config_token;
var jsonStringBase64 = process.env.npm_config_jsonStringBase64;
var testPipelineArgs = configurations.testPipelineArgs;
var azureProjectID = process.env.npm_config_azureProjectID;
var dataCenter = process.env.npm_config_dataCenter;
var threads = testPipelineArgs.threads;
var pipelineID = process.env.npm_config_pipelineID;
var jsonString = atob(jsonStringBase64);
var json = JSON.parse(jsonString);
var androidAppId = null;
var iosAppId = null;
var androidDeviceVersion = process.env.npm_config_deviceAndroid;
var iosDeviceVersion = process.env.npm_config_deviceIos;

json.forEach(function(run) {
    if (run.platform == 'android') {
        androidAppId = run.appID;
    } else {
        iosAppId = run.appID;
    }
});

var androidSkip = (androidAppId == null);
var iosSkip = (iosAppId == null);

executePipeline(androidAppId, iosAppId, testPipelineArgs.plugin, androidDeviceVersion, iosDeviceVersion, azureProjectID, pipelineID, personalToken, dataCenter, threads, androidSkip, iosSkip);