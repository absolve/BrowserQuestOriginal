define(function() {

    /**
     * 动画类，用于处理精灵动画的播放和控制
     */
    var Animation = Class.extend({
        /**
         * 初始化动画对象
         * @param {string} name - 动画名称
         * @param {number} length - 动画帧数长度
         * @param {number} row - 动画在精灵图中的行号
         * @param {number} width - 每帧的宽度
         * @param {number} height - 每帧的高度
         */
        init: function(name, length, row, width, height) {
            this.name = name;
        	this.length = length;
        	this.row = row;
        	this.width = width;
        	this.height = height;
        	this.reset();
        },
    
        /**
         * 更新当前动画帧，处理帧索引循环和计数逻辑
         */
        tick: function() {
        	var i = this.currentFrame.index;
	    
    	    i = (i < this.length - 1) ? i + 1 : 0;
	    
    	    // 处理动画播放次数限制
    	    if(this.count > 0) {
    	        if(i === 0) {
                    this.count -= 1;
                    if(this.count === 0) {
                        this.currentFrame.index = 0;
                        this.endcount_callback();
                        return;
                    }
                }
        	}
	    
        	this.currentFrame.x = this.width * i;
        	this.currentFrame.y = this.height * this.row;
        	this.currentFrame.index = i;
        },
    
        /**
         * 设置动画播放速度
         * @param {number} speed - 动画播放速度
         */
        setSpeed: function(speed) {
            this.speed = speed;
        },
    
        /**
         * 设置动画播放次数和结束回调
         * @param {number} count - 动画播放次数，0表示无限循环
         * @param {function} onEndCount - 播放次数用完时的回调函数
         */
        setCount: function(count, onEndCount) {
            this.count = count;
            this.endcount_callback = onEndCount;
        },

        /**
         * 判断是否到达动画更新时间
         * @param {number} time - 当前时间戳
         * @returns {boolean} 是否到达动画更新时间
         */
        isTimeToAnimate: function(time) {
        	return (time - this.lastTime) > this.speed;
        },
    
        /**
         * 更新动画状态
         * @param {number} time - 当前时间戳
         * @returns {boolean} 动画是否已更新
         */
        update: function(time) {
            // 对于攻击类动画，首次调用时设置起始时间
            if(this.lastTime === 0 && this.name.substr(0, 3) === "atk") {
                this.lastTime = time;
            }
        
            if(this.isTimeToAnimate(time)) {
                this.lastTime = time;
                this.tick();
                return true;
            } else {
                return false;
            }
        },
    
        /**
         * 重置动画到初始状态
         */
        reset: function() {
            this.lastTime = 0;
            this.currentFrame = { index: 0, x: 0, y: this.row * this.height };
        }
    });

    return Animation;
});
