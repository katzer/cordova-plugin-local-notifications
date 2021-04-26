const { exec } = require("child_process");
var fs = require("fs");

if(process.env.npm_config_buildID == null) {
    throw new Error("Missing BuildID/RunID argument");
}

if(process.env.npm_config_buildsPath == null) {
    throw new Error("Missing builds folder path argument \"buildsPath\"");
}

var dir = process.env.npm_config_buildsPath;
var runID = process.env.npm_config_buildID;

fs.readdirSync(dir).forEach(function(appDir) {
    fs.stat(dir + appDir, (err, stats) => {
      if (err) { 
        throw new Error(err);
      } else if (stats.isDirectory()) {
        fs.readdirSync(dir + appDir).forEach(function(appFile) {
            archiveBuild(dir + appDir + "/" + appFile, appDir, appFile);
        });
      }
    });
});

function archiveBuild(buildPath, appName, filename) {
    exec("az pipelines runs artifact upload --artifact-name '" + appName + "." + filename + "' --path '" + buildPath + "' --run-id '" + runID +"'", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}
