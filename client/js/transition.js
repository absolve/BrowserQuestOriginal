define(function() {

    /**
     * Transition类用于管理数值过渡动画
     * 提供开始、停止、步进等方法来控制过渡过程
     */
    var Transition = Class.extend({
        /**
         * 初始化Transition实例
         * 设置默认的起始值、结束值、持续时间和状态
         */
        init: function() {
            this.startValue = 0;
            this.endValue = 0;
            this.duration = 0;
            this.inProgress = false;
        },

        /**
         * 开始一个过渡动画
         * @param {number} currentTime - 当前时间戳
         * @param {function} updateFunction - 更新回调函数，在过渡过程中被调用
         * @param {function} stopFunction - 停止回调函数，在过渡完成时被调用
         * @param {number} startValue - 过渡起始值
         * @param {number} endValue - 过渡结束值
         * @param {number} duration - 过渡持续时间
         */
        start: function(currentTime, updateFunction, stopFunction, startValue, endValue, duration) {
            this.startTime = currentTime;
            this.updateFunction = updateFunction;
            this.stopFunction = stopFunction;
            this.startValue = startValue;
            this.endValue = endValue;
            this.duration = duration;
            this.inProgress = true;
            this.count = 0;
        },

        /**
         * 执行一次过渡步骤计算
         * 根据当前时间计算过渡进度并执行相应的回调函数
         * @param {number} currentTime - 当前时间戳
         */
        step: function(currentTime) {
            if(this.inProgress) {
                // 检查是否跳帧
                if(this.count > 0) {
                    this.count -= 1;
                    log.debug(currentTime + ": jumped frame");
                }
                else {
                    var elapsed = currentTime - this.startTime;

                    if(elapsed > this.duration) {
                        elapsed = this.duration;
                    }

                    var diff = this.endValue - this.startValue;
                    var i = this.startValue + ((diff / this.duration) * elapsed);

                    i = Math.round(i);

                    if(elapsed === this.duration || i === this.endValue) {
                        this.stop();
                        if(this.stopFunction) {
                            this.stopFunction();
                        }
                    }
                    else if(this.updateFunction) {
                        this.updateFunction(i);
                    }
                }
            }
        },

        /**
         * 重新启动过渡动画
         * 使用新的起始值和结束值重新开始过渡
         * @param {number} currentTime - 当前时间戳
         * @param {number} startValue - 新的过渡起始值
         * @param {number} endValue - 新的过渡结束值
         */
        restart: function(currentTime, startValue, endValue) {
            this.start(currentTime, this.updateFunction, this.stopFunction, startValue, endValue, this.duration);
            this.step(currentTime);
        },

        /**
         * 停止当前过渡动画
         * 将过渡状态设置为非进行中
         */
        stop: function() {
            this.inProgress = false;
        }
    });
    
    return Transition;
});
