//地图
var cls = require('./lib/class')
fs = require('fs'),
    _ = require('underscore'),
    Utils = require('./utils'),
    Log = require('loglevel'),
    Checkpoint = require('./checkpoint');

module.exports = Maps = cls.Class.extend({
    /**
     * 初始化地图加载器
     * @param {string} filepath - 地图文件路径
     */
    init: function (filepath) {
        let self = this;
        // // if(filepath===undefined)return;
        this.isLoaded = false;
        // console.log("----------"+filepath)
        if (fs.lstatSync(filepath).isFile()) {
            fs.readFile(filepath, function (err, file) {
                var json = JSON.parse(file.toString());
                self.initMap(json);
            });
        } else {
            Log.error(filepath + " doesn't exist.");
        }
    },

    /**
     * 初始化地图数据
     * @param {Object} map - 地图JSON对象，包含地图尺寸、碰撞区域等信息
     */
    initMap: function (map) {  //初始化地图
        this.width = map.width;
        this.height = map.height;
        this.collisions = map.collisions;
        this.mobAreas = map.roamingAreas;
        this.chestAreas = map.chestAreas;
        this.staticChests = map.staticChests;
        this.staticEntities = map.staticEntities;
        this.isLoaded = true;

        // zone groups
        this.zoneWidth = 28;
        this.zoneHeight = 12;
        this.groupWidth = Math.floor(this.width / this.zoneWidth);
        this.groupHeight = Math.floor(this.height / this.zoneHeight);

        this.initConnectedGroups(map.doors);
        this.initCheckpoints(map.checkpoints);

        if (this.ready_func) {
            this.ready_func();
        }
    },

    /**
     * 设置地图加载完成回调函数
     * @param {Function} f - 回调函数
     */
    ready: function (f) {
        this.ready_func = f;
    },

    /**
     * 将瓦片索引转换为网格坐标
     * @param {number} tileNum - 瓦片编号
     * @returns {Object} 包含x和y坐标的对象
     */
    tileIndexToGridPosition: function (tileNum) {
        var x = 0,
            y = 0;

        var getX = function (num, w) {
            if (num == 0) {
                return 0;
            }
            return (num % w == 0) ? w - 1 : (num % w) - 1;
        }

        tileNum -= 1;
        x = getX(tileNum + 1, this.width);
        y = Math.floor(tileNum / this.width);

        return {x: x, y: y};
    },

    /**
     * 将网格坐标转换为瓦片索引
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {number} 瓦片索引
     */
    GridPositionToTileIndex: function (x, y) {
        return (y * this.width) + x + 1;
    },

    /**
     * 生成碰撞网格
     */
    generateCollisionGrid: function () {
        this.grid = [];

        if (this.isLoaded) {
            var tileIndex = 0;
            for (var j, i = 0; i < this.height; i++) {
                this.grid[i] = [];
                for (j = 0; j < this.width; j++) {
                    if (_.include(this.collisions, tileIndex)) {
                        this.grid[i][j] = 1;
                    } else {
                        this.grid[i][j] = 0;
                    }
                    tileIndex += 1;
                }
            }
            //log.info("Collision grid generated.");
        }
    },

    /**
     * 检查坐标是否超出边界
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 是否超出边界
     */
    isOutOfBounds: function (x, y) {
        return x <= 0 || x >= this.width || y <= 0 || y >= this.height;
    },

    /**
     * 检查指定位置是否发生碰撞
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 是否发生碰撞
     */
    isColliding: function (x, y) {
        if (this.isOutOfBounds(x, y)) {
            return false;
        }
        return this.grid[y][x] === 1;
    },

    /**
     * 将组ID转换为组位置
     * @param {string} id - 组ID
     * @returns {Object} 位置对象
     */
    GroupIdToGroupPosition: function (id) {
        var posArray = id.split('-');

        return pos(parseInt(posArray[0]), parseInt(posArray[1]));
    },

    /**
     * 遍历所有组
     * @param {Function} callback - 回调函数
     */
    forEachGroup: function (callback) {
        var width = this.groupWidth,
            height = this.groupHeight;

        for (var x = 0; x < width; x += 1) {
            for (var y = 0; y < height; y += 1) {
                callback(x + '-' + y);
            }
        }
    },

    /**
     * 根据坐标获取组ID
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {string} 组ID
     */
    getGroupIdFromPosition: function (x, y) {
        var w = this.zoneWidth,
            h = this.zoneHeight,
            gx = Math.floor((x - 1) / w),
            gy = Math.floor((y - 1) / h);

        return gx + '-' + gy;
    },

    /**
     * 获取相邻组位置列表
     * @param {string} id - 当前组ID
     * @returns {Array} 相邻组位置数组
     */
    getAdjacentGroupPositions: function (id) {
        var self = this,
            position = this.GroupIdToGroupPosition(id),
            x = position.x,
            y = position.y,
            // surrounding groups
            list = [pos(x - 1, y - 1), pos(x, y - 1), pos(x + 1, y - 1),
                pos(x - 1, y), pos(x, y), pos(x + 1, y),
                pos(x - 1, y + 1), pos(x, y + 1), pos(x + 1, y + 1)];

        // groups connected via doors
        _.each(this.connectedGroups[id], function (position) {
            // don't add a connected group if it's already part of the surrounding ones.
            if (!_.any(list, function (groupPos) {
                return equalPositions(groupPos, position);
            })) {
                list.push(position);
            }
        });

        return _.reject(list, function (pos) {
            return pos.x < 0 || pos.y < 0 || pos.x >= self.groupWidth || pos.y >= self.groupHeight;
        });
    },

    /**
     * 遍历相邻组
     * @param {string} groupId - 当前组ID
     * @param {Function} callback - 回调函数
     */
    forEachAdjacentGroup: function (groupId, callback) {
        if (groupId) {
            _.each(this.getAdjacentGroupPositions(groupId), function (pos) {
                callback(pos.x + '-' + pos.y);
            });
        }
    },

    /**
     * 初始化连接的组
     * @param {Array} doors - 门的配置数组
     */
    initConnectedGroups: function (doors) {
        var self = this;

        this.connectedGroups = {};
        _.each(doors, function (door) {
            var groupId = self.getGroupIdFromPosition(door.x, door.y),
                connectedGroupId = self.getGroupIdFromPosition(door.tx, door.ty),
                connectedPosition = self.GroupIdToGroupPosition(connectedGroupId);

            if (groupId in self.connectedGroups) {
                self.connectedGroups[groupId].push(connectedPosition);
            } else {
                self.connectedGroups[groupId] = [connectedPosition];
            }
        });
    },

    /**
     * 初始化检查点
     * @param {Array} cpList - 检查点列表
     */
    initCheckpoints: function (cpList) {
        var self = this;

        this.checkpoints = {};
        this.startingAreas = [];

        _.each(cpList, function (cp) {
            var checkpoint = new Checkpoint(cp.id, cp.x, cp.y, cp.w, cp.h);
            self.checkpoints[checkpoint.id] = checkpoint;
            if (cp.s === 1) {
                self.startingAreas.push(checkpoint);
            }
        });
    },

    /**
     * 获取指定ID的检查点
     * @param {string} id - 检查点ID
     * @returns {Object} 检查点对象
     */
    getCheckpoint: function (id) {
        return this.checkpoints[id];
    },

    /**
     * 获取随机起始位置
     * @returns {Object} 随机起始位置坐标
     */
    getRandomStartingPosition: function () {
        var nbAreas = _.size(this.startingAreas);
        let i = Utils.randomInt(0, nbAreas - 1);
        let area = this.startingAreas[i];

        return area.getRandomPosition();
    }
});

/**
 * 创建位置对象
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @returns {Object} 位置对象
 */
var pos = function (x, y) {
    return {x: x, y: y};
};

/**
 * 比较两个位置是否相等
 * @param {Object} pos1 - 第一个位置对象
 * @param {Object} pos2 - 第二个位置对象
 * @returns {boolean} 位置是否相等
 */
var equalPositions = function (pos1, pos2) {
    return pos1.x === pos2.x && pos2.y === pos2.y;
};
