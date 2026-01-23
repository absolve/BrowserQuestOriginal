define(function() {
    
    var Tile = Class.extend({
    });

    /**
     * 动画瓦片类，用于处理具有动画效果的瓦片
     */
    var AnimatedTile = Tile.extend({
        /**
         * 初始化动画瓦片
         * @param {number} id - 起始ID
         * @param {number} length - 动画序列长度
         * @param {number} speed - 动画播放速度（时间间隔）
         * @param {number} index - 瓦片索引
         */
        init: function(id, length, speed, index) {
            this.startId = id;
        	this.id = id;
        	this.length = length;
        	this.speed = speed;
        	this.index = index;
        	this.lastTime = 0;
        },
    
        /**
         * 执行一次动画步进，更新当前ID
         * 当达到动画序列末尾时循环回到起始ID
         */
        tick: function() {
            if((this.id - this.startId) < this.length - 1) {
    	        this.id += 1;
    	    } else {
    	        this.id = this.startId;
    	    }
        },

        /**
         * 根据时间判断是否执行动画更新
         * @param {number} time - 当前时间戳
         * @returns {boolean} - 如果执行了动画更新则返回true，否则返回false
         */
        animate: function(time) {
            // 检查时间间隔是否超过设定速度，决定是否执行动画步进
            if((time - this.lastTime) > this.speed) {
        	    this.tick();
        	    this.lastTime = time;
        	    return true;
            } else {
                return false;
            }
        }
    });
    
    return AnimatedTile;
});
