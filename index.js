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
var client = request.createClient('http://engine.generatron.com:8090/GeneratronEngine/');




var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
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
var configdir = osenv.home() + "/.generatron/"
if(userArgs[0] == 'adduser'){
    deleteFolderRecursive(configdir)
}

if(userArgs[0] == 'link'){
    
}
console.log("Type : gtron help for assistance with commands");
if (!fileExists(configdir + 'config.json')) {
    //if(config.user == null || config.user.name == null || config.user.email == null ){
    console.log("First time using? let's do a quick sign up")

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
        client.post('account/register', result, function(err, res, body) {
            console.log(body)
            if (err) {
            	console.log(err);
            	return;
            }
            var mkdirp = require('mkdirp');

            mkdirp(configdir, function(err) {
                if (err) {
                    console.error(err)
                } else {
                    fs.writeFile(configdir + 'config.json', JSON.stringify(body), function(err) {
                        if (err) return console.log(err);
                        console.log('Stored configuration');
                    });
                }

            });

        });

    });


} else {

    var fs = require('fs');
    var config = JSON.parse(fs.readFileSync(configdir + 'config.json', 'utf8'));
    var params = {};
    params.devkey = config.devkey;
    params.args = userArgs.toString();
    client.post('api/cli', params, function(err, res, body) {
        console.log(body);
    });


}