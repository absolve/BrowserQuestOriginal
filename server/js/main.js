//主函数
var fs = require('fs'),
    log = require('loglevel'),
    Metrics = require('./metrics');


function main(config) {
    console.log("main")
    var ws = require("./ws"),
        WorldServer = require("./worldserver"),

        _ = require('underscore'),
        server = new ws.socketIOServer(config.host, config.port),
        metrics = config.metrics_enabled ? new Metrics(config) : null;
    worlds = [],  //世界数组
        lastTotalPlayers = 0,
        checkPopulationInterval = setInterval(function () {
            if (metrics && metrics.isReady) {
                metrics.getTotalPlayers(function (totalPlayers) {
                    if (totalPlayers !== lastTotalPlayers) {
                        lastTotalPlayers = totalPlayers;
                        _.each(worlds, function (world) {
                            world.updatePopulation(totalPlayers);
                        });
                    }
                });
            }
        }, 1000);
    console.log(config.debug_level)
    switch (config.debug_level) {
        case "error":
            log.setLevel("error")
            // log = new Log(Log.ERROR); 
            break;
        case "debug":
            log.setLevel("debug")
        // log = new Log(Log.DEBUG); break;
        case "info":
            log.setLevel("info")
            // log = new Log(Log.INFO);
            break;
    }

    // console.log("Starting BrowserQuest game server...")
    log.info("Starting BrowserQuest game server...");
    //设置回调函数
    server.onConnect(function (connection) {
        var world, // the one in which the player will be spawned
            connect = function () {
                if (world) {
                    world.connect_callback(new Player(connection, world));
                }
            };

        if (metrics) {
            metrics.getOpenWorldCount(function (open_world_count) {
                // choose the least populated world among open worlds
                world = _.min(_.first(worlds, open_world_count), function (w) {
                    return w.playerCount;
                });
                connect();
            });
        } else {
            // simply fill each world sequentially until they are full
            world = _.detect(worlds, function (world) {
                return world.playerCount < config.nb_players_per_world;
            });
            world.updatePopulation();
            connect();
        }
    });

    server.onError(function () {
        // console.log(Array.prototype.join.call(arguments, ", "))
        log.error(Array.prototype.join.call(arguments, ", "));
    });

    var onPopulationChange = function () {
        metrics.updatePlayerCounters(worlds, function (totalPlayers) {
            _.each(worlds, function (world) {
                world.updatePopulation(totalPlayers);
            });
        });
        metrics.updateWorldDistribution(getWorldDistribution(worlds));
    };

    _.each(_.range(config.nb_worlds), function (i) {
        var world = new WorldServer('world' + (i + 1), config.nb_players_per_world, server);
        world.run(config.map_filepath);
        worlds.push(world);
        if (metrics) {
            world.onPlayerAdded(onPopulationChange);
            world.onPlayerRemoved(onPopulationChange);
        }
    });

    server.onRequestStatus(function () {
        return JSON.stringify(getWorldDistribution(worlds));
    });

    if (config.metrics_enabled) {
        metrics.ready(function () {
            onPopulationChange(); // initialize all counters to 0 when the server starts
        });
    }

    process.on('uncaughtException', function (e) {
        log.warn('uncaughtException: ' + e);
        // console.log('uncaughtException: ' + e)
    });
}

function getWorldDistribution(worlds) {
    var distribution = [];

    _.each(worlds, function (world) {
        distribution.push(world.playerCount);
    });
    return distribution;
}

function getConfigFile(path, callback) {
    fs.readFile(path, 'utf8', function (err, json_string) {
        if (err) {
            console.error("Could not open config file:", err.path);
            callback(null);
        } else {
            callback(JSON.parse(json_string));
        }
    });
}

var defaultConfigPath = './server/config.json',
    customConfigPath = './server/config_local.json';

process.argv.forEach(function (val, index, array) {
    if (index === 2) {
        customConfigPath = val;
    }
});

getConfigFile(defaultConfigPath, function (defaultConfig) {
    getConfigFile(customConfigPath, function (localConfig) {
        if (localConfig) {
            console.log("localConfig" + localConfig)
            main(localConfig);
        } else if (defaultConfig) {
            console.log("defaultConfig")
            main(defaultConfig);
        } else {
            console.error("Server cannot start without any configuration file.");
            process.exit(1);
        }
    });
});
