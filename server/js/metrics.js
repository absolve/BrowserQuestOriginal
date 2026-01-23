/**
 * @class Metrics
 * @description Metrics class for handling game server metrics using memcached
 */
var cls = require("./lib/class"),
    log = require('loglevel'),
    _ = require("underscore");

module.exports = Metrics = Class.extend({
    /**
     * @function init
     * @description Initializes the Metrics instance with configuration and connects to memcached
     * @param {Object} config - Configuration object containing memcached settings and server info
     * @returns {void}
     */
    init: function (config) {
        let self = this;

        this.config = config;
        this.client = new (require("memcache")).Client(config.memcached_port, config.memcached_host);
        this.client.connect();

        this.isReady = false;

        this.client.on('connect', function () {
            log.info("Metrics enabled: memcached client connected to " + config.memcached_host + ":" + config.memcached_port);
            self.isReady = true;
            if (self.ready_callback) {
                self.ready_callback();
            }
        });
    },

    /**
     * @function ready
     * @description Sets a callback to be called when the memcached client is ready
     * @param {Function} callback - Function to call when connection is established
     * @returns {void}
     */
    ready: function (callback) {
        this.ready_callback = callback;
    },

    /**
     * @function updatePlayerCounters
     * @description Updates player counters in memcached for current server and calculates total players across all servers
     * @param {Array} worlds - Array of world objects containing player counts
     * @param {Function} updatedCallback - Callback function called after updating total players
     * @returns {void}
     */
    updatePlayerCounters: function (worlds, updatedCallback) {
        let self = this,
            config = this.config,
            numServers = _.size(config.game_servers),
            playerCount = _.reduce(worlds, function (sum, world) {
                return sum + world.playerCount;
            }, 0);

        if (this.isReady) {
            // Set the number of players on this server
            this.client.set('player_count_' + config.server_name, playerCount, function () {
                let total_players = 0;

                // Recalculate the total number of players and set it
                _.each(config.game_servers, function (server) {
                    self.client.get('player_count_' + server.name, function (error, result) {
                        var count = result ? parseInt(result) : 0;

                        total_players += count;
                        numServers -= 1;
                        if (numServers === 0) {
                            self.client.set('total_players', total_players, function () {
                                if (updatedCallback) {
                                    updatedCallback(total_players);
                                }
                            });
                        }
                    });
                });
            });
        } else {
            log.error("Memcached client not connected");
        }
    },

    /**
     * @function updateWorldDistribution
     * @description Updates the world distribution data in memcached for the current server
     * @param {Array} worlds - Array of world objects to store in memcached
     * @returns {void}
     */
    updateWorldDistribution: function (worlds) {
        this.client.set('world_distribution_' + this.config.server_name, worlds);
    },

    /**
     * @function getOpenWorldCount
     * @description Retrieves the open world count from memcached for the current server
     * @param {Function} callback - Callback function to receive the world count result
     * @returns {void}
     */
    getOpenWorldCount: function (callback) {
        this.client.get('world_count_' + this.config.server_name, function (error, result) {
            callback(result);
        });
    },

    /**
     * @function getTotalPlayers
     * @description Retrieves the total player count from memcached
     * @param {Function} callback - Callback function to receive the total player count result
     * @returns {void}
     */
    getTotalPlayers: function (callback) {
        this.client.get('total_players', function (error, result) {
            callback(result);
        });
    }
});
