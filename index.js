#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var searchPattern = userArgs[0];
var fs = require('fs');
var osenv = require('osenv');
var path = require('path');
var request = require('request-json');
var configdir = osenv.home() + "/.generatron/"

if(!fileExists(configdir + 'config.json')){
    saveConfig({})
    return;
}

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

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function fileExists(filePath) {
    try {
        var p = path.resolve(filePath);
        var stats = fs.statSync(p);
        return stats.isFile() || stats.isDirectory();
    } catch (err) {
        return false;
    }
}

function saveConfig(config) {
    var fs = require('fs');
    if (!fileExists(configdir + 'config.json')) {
        config.baseurl = "https://www.generatron.com/GeneratronEngine/"
        var mkdirp = require('mkdirp');
        mkdirp(configdir, function(err) {
            if (err) {
                console.error(err)
            } else {
                fs.writeFile(configdir + 'config.json', JSON.stringify(config), function(err) {
                    if (err) return console.log(err);
                });
            }

        });
        return

    } else {
        fs.writeFile(configdir + 'config.json', JSON.stringify(config), function(err) {
            if (err){
                console.log("Could not save configuration");
                console.log(err);
            }
            //console.log('Stored configuration');
        });
    }

}


if (userArgs[0] == 'logout') {
    deleteFolderRecursive(configdir)
    //console.log("removed configuration");
    saveConfig({});
    return;
}

if (userArgs[0] == 'dev') {
    var fs = require('fs');
    var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
    config.baseurl = 'http://localhost:8090/GeneratronEngine/'
    //console.log(config);
    saveConfig(config);

    return;
}

if (userArgs[0] == 'prod') {
    var fs = require('fs');
    var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
    config.baseurl = 'https://www.generatron.com/GeneratronEngine/'
    //console.log(config);
    saveConfig(config);
    return
}

if (userArgs[0] == 'signup') {
    var defaultName = ""
    var defaultEmail = ""

    if(fileExists(getUserHome()+'/.gitconfig')){
        var fs = require('fs'), ini = require('ini')
        var gitconfig = ini.parse(fs.readFileSync(getUserHome()+'/.gitconfig', 'utf-8'))
        if(gitconfig.user.name){
            defaultName = gitconfig.user.name
        }

        if(gitconfig.user.email){
            defaultEmail = gitconfig.user.email
        }
    }

    var schema = {
        properties: {
            name: {
                pattern: /^[a-zA-Z\s\-]+$/,
                message: 'Name must be only letters, spaces, or dashes',
                default: defaultName,
                required: true
            },
            email: {
                pattern: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                message: 'Emails must be a valid email',
                default: defaultEmail,
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
                if (err && res.statusCode != 200) {
                    console.log(body)
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
    var defaultName = ""
    var defaultEmail = ""
    if(fileExists(getUserHome()+'/.gitconfig')){
        var fs = require('fs'), ini = require('ini')
        var gitconfig = ini.parse(fs.readFileSync(getUserHome()+'/.gitconfig', 'utf-8'))
        if(gitconfig.user.name){
            defaultName = gitconfig.user.name
        }

        if(gitconfig.user.email){
            defaultEmail = gitconfig.user.email
        }
    }
    var schema = {
        properties: {
            email: {
                pattern: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                message: 'Emails must be a valid email',
                default: defaultEmail,
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
                if (err && res.statusCode != 200) {
                    console.log(body)
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