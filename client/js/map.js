define(['jquery', 'area'], function($, Area) {

    /**
     * 地图类，用于处理游戏地图的加载、初始化和管理
     */
    var Map = Class.extend({
        /**
         * 初始化地图对象
         * @param {Boolean} loadMultiTilesheets 是否加载多个瓦片集
         * @param {Object} game 游戏实例对象
         */
        init: function(loadMultiTilesheets, game) {
            this.game = game;
        	this.data = [];
        	this.isLoaded = false;
        	this.tilesetsLoaded = false;
        	this.mapLoaded = false;
        	this.loadMultiTilesheets = loadMultiTilesheets;

        	var useWorker = !(this.game.renderer.mobile || this.game.renderer.tablet);

        	this._loadMap(useWorker);
        	this._initTilesets();
        },

        /**
         * 检查地图是否完全加载完成
         * 当瓦片集和地图数据都加载完成后，设置isLoaded标志并执行就绪回调函数
         */
        _checkReady: function() {
            if(this.tilesetsLoaded && this.mapLoaded) {
                this.isLoaded = true;
                if(this.ready_func) {
        	    	this.ready_func();
        	    }
        	}
        },

        /**
         * 加载地图数据，根据设备类型选择使用Web Worker或Ajax方式
         * @param {Boolean} useWorker 是否使用Web Worker加载
         */
        _loadMap: function(useWorker) {
        	var self = this,
        	    filepath = "maps/world_client.json";

        	if(useWorker) {
                // 使用Web Worker加载地图数据
                var worker = new Worker('js/mapworker.js');
                worker.postMessage(1);

                worker.onmessage = function(event) {
                    var map = event.data;
                    self._initMap(map);
                    self.grid = map.grid;
                    self.plateauGrid = map.plateauGrid;
                    self.mapLoaded = true;
                    self._checkReady();
                };
            } else {
                // 使用Ajax加载地图数据
                $.get(filepath, function (data) {
                    self._initMap(data);
                    self._generateCollisionGrid();
                    self._generatePlateauGrid();
                    self.mapLoaded = true;
                    self._checkReady();
                }, 'json');
            }
        },

        /**
         * 初始化瓦片集，根据配置决定加载单个或多个瓦片集
         */
        _initTilesets: function() {
            var tileset1, tileset2, tileset3;

            if(!this.loadMultiTilesheets) {
                this.tilesetCount = 1;
                tileset1 = this._loadTileset('img/1/tilesheet.png');
            } else {
                if(this.game.renderer.mobile || this.game.renderer.tablet) {
                    this.tilesetCount = 1;
                    tileset2 = this._loadTileset('img/2/tilesheet.png');
                } else {
                    this.tilesetCount = 2;
                    tileset2 = this._loadTileset('img/2/tilesheet.png');
                    tileset3 = this._loadTileset('img/3/tilesheet.png');
                }
            }

            this.tilesets = [tileset1, tileset2, tileset3];
        },

        /**
         * 初始化地图属性，从地图数据中提取各种配置信息
         * @param {Object} map 地图数据对象
         */
        _initMap: function(map) {
            this.width = map.width;
            this.height = map.height;
            this.tilesize = map.tilesize;
            this.data = map.data;
            this.blocking = map.blocking || [];
            this.plateau = map.plateau || [];
            this.musicAreas = map.musicAreas || [];
            this.collisions = map.collisions;
            this.high = map.high;
            this.animated = map.animated;

            this.doors = this._getDoors(map);
            this.checkpoints = this._getCheckpoints(map);
        },

        /**
         * 从地图数据中解析门的信息
         * @param {Object} map 地图数据对象
         * @returns {Object} 包含门信息的对象，以瓦片索引为键
         */
        _getDoors: function(map) {
            var doors = {},
                self = this;

            _.each(map.doors, function(door) {
                var o;

                switch(door.to) {
                    case 'u': o = Types.Orientations.UP;
                        break;
                    case 'd': o = Types.Orientations.DOWN;
                        break;
                    case 'l': o = Types.Orientations.LEFT;
                        break;
                    case 'r': o = Types.Orientations.RIGHT;
                        break;
                    default : o = Types.Orientations.DOWN;
                }

                doors[self.GridPositionToTileIndex(door.x, door.y)] = {
                    x: door.tx,
                    y: door.ty,
                    orientation: o,
                    cameraX: door.tcx,
                    cameraY: door.tcy,
                    portal: door.p === 1,
                };
            });

            return doors;
        },

        /**
         * 加载瓦片集图片
         * @param {String} filepath 瓦片集图片路径
         * @returns {Image} 图片对象
         */
        _loadTileset: function(filepath) {
        	var self = this;
    	    var tileset = new Image();

        	tileset.src = filepath;

            log.info("Loading tileset: "+filepath);

        	tileset.onload = function() {
                if(tileset.width % self.tilesize > 0) {
                    throw Error("Tileset size should be a multiple of "+ self.tilesize);
                }
                log.info("Map tileset loaded.");

                self.tilesetCount -= 1;
                if(self.tilesetCount === 0) {
                    log.debug("All map tilesets loaded.")

            		self.tilesetsLoaded = true;
            		self._checkReady();
            	}
        	};

        	return tileset;
        },

        /**
         * 设置地图加载完成后的回调函数
         * @param {Function} f 回调函数
         */
        ready: function(f) {
        	this.ready_func = f;
        },

        /**
         * 将瓦片编号转换为网格坐标位置
         * @param {Number} tileNum 瓦片编号
         * @returns {Object} 包含x和y坐标的对象
         */
        tileIndexToGridPosition: function(tileNum) {
            var x = 0,
                y = 0;

            var getX = function(num, w) {
                if(num == 0) {
                    return 0;
                }
                return (num % w == 0) ? w - 1 : (num % w) - 1;
            }

            tileNum -= 1;
            x = getX(tileNum + 1, this.width);
            y = Math.floor(tileNum / this.width);

            return { x: x, y: y };
        },

        /**
         * 将网格坐标位置转换为瓦片索引
         * @param {Number} x X坐标
         * @param {Number} y Y坐标
         * @returns {Number} 瓦片索引
         */
        GridPositionToTileIndex: function(x, y) {
            return (y * this.width) + x + 1;
        },

        /**
         * 检查指定坐标是否发生碰撞
         * @param {Number} x X坐标
         * @param {Number} y Y坐标
         * @returns {Boolean} 是否发生碰撞
         */
        isColliding: function(x, y) {
            if(this.isOutOfBounds(x, y) || !this.grid) {
                return false;
            }
            return (this.grid[y][x] === 1);
        },

        /**
         * 检查指定坐标是否为高原地形
         * @param {Number} x X坐标
         * @param {Number} y Y坐标
         * @returns {Boolean} 是否为高原地形
         */
        isPlateau: function(x, y) {
            if(this.isOutOfBounds(x, y) || !this.plateauGrid) {
                return false;
            }
            return (this.plateauGrid[y][x] === 1);
        },

        /**
         * 生成碰撞网格，将碰撞信息转换为二维数组格式
         */
        _generateCollisionGrid: function() {
            var tileIndex = 0,
                self = this;

            this.grid = [];
            for(var	j, i = 0; i < this.height; i++) {
                this.grid[i] = [];
                for(j = 0; j < this.width; j++) {
                    this.grid[i][j] = 0;
                }
            }

            _.each(this.collisions, function(tileIndex) {
                var pos = self.tileIndexToGridPosition(tileIndex+1);
                self.grid[pos.y][pos.x] = 1;
            });

            _.each(this.blocking, function(tileIndex) {
                var pos = self.tileIndexToGridPosition(tileIndex+1);
                if(self.grid[pos.y] !== undefined) {
                    self.grid[pos.y][pos.x] = 1;
                }
            });
            log.info("Collision grid generated.");
        },

        /**
         * 生成高原网格，标记哪些位置是高原地形
         */
        _generatePlateauGrid: function() {
            var tileIndex = 0;

            this.plateauGrid = [];
            for(var	j, i = 0; i < this.height; i++) {
                this.plateauGrid[i] = [];
                for(j = 0; j < this.width; j++) {
                    if(_.include(this.plateau, tileIndex)) {
                        this.plateauGrid[i][j] = 1;
                    } else {
                        this.plateauGrid[i][j] = 0;
                    }
                    tileIndex += 1;
                }
            }
            log.info("Plateau grid generated.");
        },

        /**
         * Returns true if the given position is located within the dimensions of the map.
         *
         * @returns {Boolean} Whether the position is out of bounds.
         */
        isOutOfBounds: function(x, y) {
            return isInt(x) && isInt(y) && (x < 0 || x >= this.width || y < 0 || y >= this.height);
        },

        /**
         * Returns true if the given tile id is "high", i.e. above all entities.
         * Used by the renderer to know which tiles to draw after all the entities
         * have been drawn.
         *
         * @param {Number} id The tile id in the tileset
         * @see Renderer.drawHighTiles
         */
        isHighTile: function(id) {
            return _.indexOf(this.high, id+1) >= 0;
        },

        /**
         * Returns true if the tile is animated. Used by the renderer.
         * @param {Number} id The tile id in the tileset
         */
        isAnimatedTile: function(id) {
            return id+1 in this.animated;
        },

        /**
         * 获取动画瓦片的长度
         * @param {Number} id 瓦片ID
         * @returns {Number} 动画长度
         */
        getTileAnimationLength: function(id) {
            return this.animated[id+1].l;
        },

        /**
         * 获取动画瓦片的延迟时间
         * @param {Number} id 瓦片ID
         * @returns {Number} 延迟时间，默认为100
         */
        getTileAnimationDelay: function(id) {
            var animProperties = this.animated[id+1];
            if(animProperties.d) {
                return animProperties.d;
            } else {
                return 100;
            }
        },

        /**
         * 检查指定坐标是否有门
         * @param {Number} x X坐标
         * @param {Number} y Y坐标
         * @returns {Boolean} 是否有门
         */
        isDoor: function(x, y) {
            return this.doors[this.GridPositionToTileIndex(x, y)] !== undefined;
        },

        /**
         * 获取门的目的地信息
         * @param {Number} x X坐标
         * @param {Number} y Y坐标
         * @returns {Object} 门的目的地信息
         */
        getDoorDestination: function(x, y) {
            return this.doors[this.GridPositionToTileIndex(x, y)];
        },

        /**
         * 从地图数据中获取检查点信息
         * @param {Object} map 地图数据对象
         * @returns {Array} 检查点数组
         */
        _getCheckpoints: function(map) {
            var checkpoints = [];
            _.each(map.checkpoints, function(cp) {
                var area = new Area(cp.x, cp.y, cp.w, cp.h);
                area.id = cp.id;
                checkpoints.push(area);
            });
            return checkpoints;
        },

        /**
         * 获取实体当前所在的检查点
         * @param {Object} entity 实体对象
         * @returns {Area} 当前检查点区域对象
         */
        getCurrentCheckpoint: function(entity) {
            return _.detect(this.checkpoints, function(checkpoint) {
                return checkpoint.contains(entity);
            });
        }
    });

    return Map;
});

