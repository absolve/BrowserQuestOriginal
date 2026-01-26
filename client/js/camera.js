define(function() {

    /**
     * 相机类，用于管理游戏视图的显示区域和位置
     */
    var Camera = Class.extend({
        /**
         * 初始化相机对象
         * @param {Object} renderer - 渲染器对象
         */
        init: function(renderer) {
            this.renderer = renderer;
            this.x = 0;
            this.y = 0;
            this.gridX = 0;
            this.gridY = 0;
            this.offset = 0.5;
            this.rescale();
        },

        /**
         * 根据设备类型重新计算相机网格尺寸
         */
        rescale: function() {
            var factor = this.renderer.mobile ? 1 : 2;

            this.gridW = 15 * factor;
            this.gridH = 7 * factor;

            log.debug("---------");
            log.debug("Factor:"+factor);
            log.debug("W:"+this.gridW + " H:" + this.gridH);
        },

        /**
         * 设置相机的世界坐标位置
         * @param {number} x - X轴世界坐标
         * @param {number} y - Y轴世界坐标
         */
        setPosition: function(x, y) {
            this.x = x;
            this.y = y;

            // 将世界坐标转换为网格坐标
            this.gridX = Math.floor( x / 16 );
            this.gridY = Math.floor( y / 16 );
        },

        /**
         * 设置相机的网格坐标位置
         * @param {number} x - X轴网格坐标
         * @param {number} y - Y轴网格坐标
         */
        setGridPosition: function(x, y) {
            this.gridX = x;
            this.gridY = y;

            // 将网格坐标转换为世界坐标
            this.x = this.gridX * 16;
            this.y = this.gridY * 16;
        },

        /**
         * 让相机跟随指定实体，将其置于屏幕中央
         * @param {Object} entity - 要跟随的实体对象
         */
        lookAt: function(entity) {
            var r = this.renderer,
                x = Math.round( entity.x - (Math.floor(this.gridW / 2) * r.tilesize) ),
                y = Math.round( entity.y - (Math.floor(this.gridH / 2) * r.tilesize) );

            this.setPosition(x, y);
        },

        /**
         * 遍历所有可见的网格位置并执行回调函数
         * @param {Function} callback - 对每个可见位置执行的回调函数
         * @param {number} extra - 额外扩展的网格范围，默认为0
         */
        forEachVisiblePosition: function(callback, extra) {
            var extra = extra || 0;
            for(var y=this.gridY-extra, maxY=this.gridY+this.gridH+(extra*2); y < maxY; y += 1) {
                for(var x=this.gridX-extra, maxX=this.gridX+this.gridW+(extra*2); x < maxX; x += 1) {
                    callback(x, y);
                }
            }
        },

        /**
         * 检查实体是否在相机可视范围内
         * @param {Object} entity - 要检查的实体对象
         * @returns {boolean} 实体是否可见
         */
        isVisible: function(entity) {
            return this.isVisiblePosition(entity.gridX, entity.gridY);
        },

        /**
         * 检查指定网格位置是否在相机可视范围内
         * @param {number} x - X轴网格坐标
         * @param {number} y - Y轴网格坐标
         * @returns {boolean} 位置是否可见
         */
        isVisiblePosition: function(x, y) {
            if(y >= this.gridY && y < this.gridY + this.gridH
            && x >= this.gridX && x < this.gridX + this.gridW) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * 将相机焦点设置到指定实体所在区域
         * @param {Object} entity - 要聚焦的实体对象
         */
        focusEntity: function(entity) {
            var w = this.gridW - 2,
                h = this.gridH - 2,
                x = Math.floor((entity.gridX - 1) / w) * w,
                y = Math.floor((entity.gridY - 1) / h) * h;

            this.setGridPosition(x, y);
        }
    });

    return Camera;
});
