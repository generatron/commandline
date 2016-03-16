#! /usr/bin/env node

var userArgs = process.argv.slice(2);

var searchPattern = userArgs[0];

//console.log(userArgs)
// var exec = require('child_process').exec;
// var child = exec('git config user.name', function(err, stdout, stderr) {
//   var username = stdout;
//   console.log(username)
// });


//var gitConfig = require('git-config');
//var config = gitConfig.sync();
//var config = {};


var fs = require('fs');
var osenv = require('osenv');
var path = require('path');
var request = require('request-json');
var configdir = osenv.home() + "/.generatron/"


var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

function fileExists(filePath) {
    try {
        var p = path.resolve(filePath);
        //console.log(p);
        var stats = fs.statSync(p);
        return stats.isFile() || stats.isDirectory();
    } catch (err) {
        return false;
    }
}

function saveConfig(config) {
    var fs = require('fs');
    if (!fileExists(configdir + 'config.json')) {
        
        var config = {}
        config.baseurl = "https://www.generatron.com/GeneratronEngine/"

        var mkdirp = require('mkdirp');

        mkdirp(configdir, function(err) {
            if (err) {
                console.error(err)
            } else {
                fs.writeFile(configdir + 'config.json', JSON.stringify(config), function(err) {
                    if (err) return console.log(err);
                    console.log('Stored configuration');
                });
            }

        });
        return

    } else {
        fs.writeFile(configdir + 'config.json', JSON.stringify(config), function(err) {
            if (err) return console.log(err);
            console.log('Stored configuration');
        });
    }

}


if (userArgs[0] == 'logout') {
    deleteFolderRecursive(configdir)
    console.log("removed configuration");
    return;
}

if (userArgs[0] == 'dev') {
    var fs = require('fs');
    var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
    config.baseurl = 'http://localhost:8090/GeneratronEngine/'
    saveConfig(config);

    return;
}

if (userArgs[0] == 'prod') {
    var fs = require('fs');
    var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
    config.baseurl = 'https://www.generatron.com/GeneratronEngine/'
    saveConfig(config);
    return
}

if (userArgs[0] == 'signup') {
    var schema = {
        properties: {
            name: {
                pattern: /^[a-zA-Z\s\-]+$/,
                message: 'Name must be only letters, spaces, or dashes',
                required: true
            },
            email: {
                pattern: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                message: 'Emails must be a valid email',
                required: true
            },
            twitter: {
                required: true
            },
            password: {
                hidden: true
            },
            confirm: {
                hidden: true
            }
        }
    };

    var prompt = require('prompt');

    // 
    // Start the prompt 
    // 
    prompt.start();

    // 
    // Get two properties from the user: username and email 
    // 
    prompt.get(schema, function(err, result) {
        //console.log(result);
        if (result.name != "") {
            var fs = require('fs');
            var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
            var client = request.createClient(config.baseurl);

            client.post('account/register', result, function(err, res, body) {
                //console.log(body)
                if (err) {
                    console.log(err);
                    return;
                }
                body.baseurl = config.baseurl
                saveConfig(body);
            });
        }

    });
    return
}


if (userArgs[0] == 'login') {
    var schema = {
        properties: {
            email: {
                pattern: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                message: 'Emails must be a valid email',
                required: true
            },
            password: {
                hidden: true
            }
        }
    };

    var prompt = require('prompt');

    // 
    // Start the prompt 
    // 
    prompt.start();

    // 
    // Get two properties from the user: username and email 
    // 
    prompt.get(schema, function(err, result) {
        //console.log(result);
        if (result.name != "") {

            var fs = require('fs');
            var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
            var client = request.createClient(config.baseurl);

            client.post('account/loginRemote', result, function(err, res, body) {
                //console.log(body)
                if (err) {
                    console.log(err);
                    return;
                }
                body.baseurl = config.baseurl
                saveConfig(body);

            });
        }

    });
    return
}

if (userArgs[0] == 'help') {
    var fs = require('fs');
    var params = {};
    params.args = userArgs.toString();

    var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
    var client = request.createClient(config.baseurl);
    client.post('api/cli', params, function(err, res, body) {
        console.log(body);
    });
    console.log("\nAvailable only for the CLI")
    console.log("\ngtron login")
    console.log("gtron signup")
    console.log("gtron logout");
    console.log("gtron help for even more options commands");

    return;
}


var fs = require('fs');
var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
var params = {};
params.devkey = config.devkey;
params.args = userArgs.toString();
var client = request.createClient(config.baseurl);
client.post('api/cli', params, function(err, res, body) {
    console.log(body);
});
return;