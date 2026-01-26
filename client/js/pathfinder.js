/**
 * 定义路径查找器模块，使用A*算法进行路径计算
 * @param {Object} AStar - A*算法库
 * @returns {Class} Pathfinder类
 */
define(['lib/astar'], function(AStar) {

    /**
     * 路径查找器类，用于处理网格地图上的路径计算
     */
    var Pathfinder = Class.extend({
        /**
         * 初始化路径查找器
         * @param {number} width - 地图宽度
         * @param {number} height - 地图高度
         */
        init: function(width, height) {
            this.width = width;
            this.height = height;
            this.grid = null;
            this.blankGrid = [];
            this.initBlankGrid_();
            this.ignored = [];
        },

        /**
         * 初始化空白网格，所有格子设置为可通行（值为0）
         * @private
         */
        initBlankGrid_: function() {
            for(var i=0; i < this.height; i += 1) {
                this.blankGrid[i] = [];
                for(var j=0; j < this.width; j += 1) {
                    this.blankGrid[i][j] = 0;
                }
            }
        },

        /**
         * 查找从实体当前位置到目标位置的路径
         * @param {Array} grid - 当前路径网格
         * @param {Object} entity - 需要移动的实体对象
         * @param {number} x - 目标x坐标
         * @param {number} y - 目标y坐标
         * @param {boolean} findIncomplete - 是否在无法找到完整路径时寻找不完整路径
         * @returns {Array} 路径数组，包含一系列坐标点
         */
        findPath: function(grid, entity, x, y, findIncomplete) {
            var start = [entity.gridX, entity.gridY],
        		end = [x, y],
        		path;

            this.grid = grid;
        	this.applyIgnoreList_(true);
            path = AStar(this.grid, start, end);

            // 如果没有找到路径且需要寻找不完整路径
            if(path.length === 0 && findIncomplete === true) {
                // 如果没有找到路径，尝试寻找一个不完整的路径
                // 至少让实体更接近目的地。
                path = this.findIncompletePath_(start, end);
            }

            return path;
        },

        /**
         * 寻找一条路径，使其尽可能接近无法到达的x,y位置。
         *
         * 每当A*返回空路径时，意味着目标瓦片不可到达。
         * 我们希望实体尽可能接近该位置，而不是停留在原地不动。
         * 这就是为什么我们有这个函数来返回到所选目的地的不完整路径。
         *
         * @private
         * @param {Array} start - 起始坐标 [x, y]
         * @param {Array} end - 结束坐标 [x, y]
         * @returns {Array} 朝向结束位置的不完整路径
         */
        findIncompletePath_: function(start, end) {
            var perfect, x, y,
                incomplete = [];

            perfect = AStar(this.blankGrid, start, end);

            for(var i=perfect.length-1; i > 0; i -= 1) {
                x = perfect[i][0];
                y = perfect[i][1];

                if(this.grid[y][x] === 0) {
                    incomplete = AStar(this.grid, start, [x, y]);
                    break;
                }
            }
            return incomplete;
        },

        /**
         * 将指定实体添加到忽略列表中，在路径计算时移除该实体位置的碰撞瓦片
         * @param {Object} entity - 需要忽略的实体对象
         */
        ignoreEntity: function(entity) {
            if(entity) {
                this.ignored.push(entity);
            }
        },

        /**
         * 应用忽略列表，根据参数决定是否将被忽略实体的位置设为可通行或不可通行
         * @private
         * @param {boolean} ignored - true表示将忽略实体位置设为可通行(0)，false表示设为不可通行(1)
         */
        applyIgnoreList_: function(ignored) {
            var self = this,
                x, y, g;

            _.each(this.ignored, function(entity) {
                x = entity.isMoving() ? entity.nextGridX : entity.gridX;
                y = entity.isMoving() ? entity.nextGridY : entity.gridY;

                if(x >= 0 && y >= 0) {
                    self.grid[y][x] = ignored ? 0 : 1;
                }
            });
        },

        /**
         * 清空忽略列表，并恢复网格中的障碍物状态
         */
        clearIgnoreList: function() {
            this.applyIgnoreList_(false);
            this.ignored = [];
        }
    });
    
    return Pathfinder;
});
