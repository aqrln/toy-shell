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

function reverseCompose(functions) {
    return function () {
        var result = arguments;
        functions.forEach((fn) => {
            result = [fn.apply(this, result)];
        });
        return result[0];
    }
}

function isQuote(character) {
    return '\'"'.indexOf(character) != -1;
}

function removeQuotes(string) {
    if (isQuote(string[0]) && isQuote(string.substr(-1))) {
        return string.slice(1, -1);
    } else {
        return string;
    }
}

function unescape(string) {
    return string;
}

function transformArgument(arg, index) {
    return reverseCompose([
        expandTilde,
        removeQuotes,
        unescape
    ])(arg);
}

process.stdin.on('data', function (input) {
    var commandLine = input.toString(),
        matches = commandLine.match(/'.*'|".*"|((\\\s)*[^\s])+(\\\s)*/g),
        argv = matches.map(transformArgument),
        commandHandler = commands[argv[0]];
    
    commandLine.match(/'.*'|".*"|((\\\s)*[^\s])+(\\\s)*/g);
    
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