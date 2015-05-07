/**
 * Created by zhanghengyang on 15/5/4.
 */
var logger = require("./utils/logger");
var forever = require("forever-monitor");

var configuration = {
    //
    // Basic configuration options
    //
    'silent': false,            // Silences the output from stdout and stderr in the parent process
    'uid': 'senz-log-hooker-UID',          // Custom uid for this forever process. (default: autogen)
    'pidFile': '../senz-log.pid', // Path to put pid information for the process(es) started
    'max': 3,                  // Sets the maximum number of times a given script should run
    'killTree': true,           // Kills the entire child process tree on `exit`

    //
    // These options control how quickly forever restarts a child process
    // as well as when to kill a "spinning" process
    //
    'minUptime': 2000,     // Minimum time a child process has to be up. Forever will 'exit' otherwise.
    'spinSleepTime': 1000, // Interval between restarts if a child is spinning (i.e. alive < minUptime).

    //
    // Command to spawn as well as options and other vars
    // (env, cwd, etc) to pass along
    //
    //'command': 'perl',         // Binary to run (default: 'node')
    //'args':    ['foo','bar'],  // Additional arguments to pass to the script,
    //'sourceDir': 'script/path',// Directory that the source script is in

    //
    // Options for restarting on watched files.
    //
    'watch': true,               // Value indicating if we should watch files.
    'watchIgnoreDotFiles': true, // Whether to ignore file starting with a '.'
    'watchIgnorePatterns': null, // Ignore patterns to use when watching files.
    'watchDirectory': "./",      // Top-level directory to watch from.

    //
    // All or nothing options passed along to `child_process.spawn`.
    //
    //'spawnWith': {
    //    customFds: [-1, -1, -1], // that forever spawns.
    //    setsid: false,
    //    uid: 0, // Custom UID
    //    gid: 0  // Custom GID
    //},

    //
    // More specific options to pass along to `child_process.spawn` which
    // will override anything passed to the `spawnWith` option
    //
    //'env': { 'ADDITIONAL': 'CHILD ENV VARS' },
    //'cwd': '/path/to/child/working/directory',

    //
    // Log files and associated logging options for this instance
    //
    'logFile': './files/logfile', // Path to log output from forever process (when daemonized)
    'outFile': './files/output', // Path to log output from child stdout
    'errFile': './files/error', // Path to log output from child stderr

    //
    // ### function parseCommand (command, args)
    // #### @command {String} Command string to parse
    // #### @args    {Array}  Additional default arguments
    //
    // Returns the `command` and the `args` parsed from
    // any command. Use this to modify the default parsing
    // done by 'forever-monitor' around spaces.
    //
    'parser': function (command, args) {
        return {
            command: command,
            args:    args
        };
    }
}

var child = new (forever.Monitor)("./main.js",configuration);

child.on('watch:restart', function(info) {
    logger.error('Restaring script because ' + info.file + ' changed');
});

child.on('restart', function() {
    logger.warn('Forever restarting script for ' + child.times + ' time');
});

child.on('exit:code', function(code) {
    logger.error('Forever detected script exited with code ' + code);
});

