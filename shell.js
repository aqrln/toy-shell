var fs = require('fs'),
    path = require('path'),
    expandTilde = require('expand-tilde'),
    username = require('username'),
    os = require('os');

var user = username.sync(),
    host = os.hostname();

var commands = {
    'pwd': function (args, callback) {
        console.log(process.cwd());
        callback();
    },
    
    'ls': function (args, success, fail) {
        var dir = path.normalize(args[1] || process.cwd());
        dir = expandTilde(dir);
        
        fs.stat(dir, (error, stats) => {
            if (error) {
                fail(error);
                return;
            }
            
            if (stats.isDirectory()) {
                fs.readdir(dir, directoryContent);
            } else {
                console.log(dir);
                success();
            }
        });
        
        function directoryContent(error, entries) {
            if (error) {
                fail(error);
                return;
            }
            
            entries.forEach(entry => {
                console.log(entry);
            });
            
            success();
        }
    },
    
    'whoami': function (args, callback) {
        console.log(user);
        callback();
    }
};

function writePrompt() {
    process.stdout.write(`${user}@${host}$ `)
}

function isQuote(character) {
    return '\'"'.indexOf(character) != -1;
}

function transformArgument(arg, index) {
    if (!arg || !index) {
        return arg;
    }
    
    arg = expandTilde(arg);
    
    if (isQuote(arg[0]) && isQuote(arg.substr(-1))) {
        arg = arg.slice(1, -1);
    }
    
    return arg;
}

process.stdin.on('data', function (input) {
    var commandLine = input.toString(),
        argv = commandLine.split(/\s+/).map(transformArgument),
        commandHandler = commands[argv[0]];
    
    if (commandHandler) {
        commandHandler.call(process, argv, onComplete, onError);
    } else {
        onError(`unknown command: "${argv[0]}"`);
    }
    
    function onComplete() {
        writePrompt();
    }
    
    function onError(error) {
        console.error('Command failed: ' + error);
        onComplete();
    }
});

writePrompt();