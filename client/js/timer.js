define(function() {

    /**
     * Timer类用于创建一个计时器，可以检查指定时间间隔是否已过
     */
    var Timer = Class.extend({
        /**
         * Timer构造函数
         * @param {number} duration - 计时器持续时间（毫秒）
         * @param {number} [startTime] - 起始时间，默认为0
         */
        init: function(duration, startTime) {
            this.lastTime = startTime || 0;
            this.duration = duration;
        },

        /**
         * 检查从上次记录的时间点开始，是否已经超过了设定的持续时间
         * 如果超过，则更新最后时间点并返回true，否则返回false
         * @param {number} time - 当前时间戳
         * @returns {boolean} - 如果时间间隔已超过设定的持续时间则返回true，否则返回false
         */
        isOver: function(time) {
            var over = false;
       
            // 检查当前时间与上次记录时间的差值是否超过设定的持续时间
            if((time - this.lastTime) > this.duration) {
                over = true;
                this.lastTime = time;
            }
            return over;
        }
    });

    return Timer;
});
