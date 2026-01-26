define(function() {

    /**
     * 信息管理器类，用于管理游戏中的伤害信息显示
     */
    var InfoManager = Class.extend({
        /**
         * 初始化信息管理器
         * @param {Object} game - 游戏实例对象
         */
        init: function(game) {
            this.game = game;
            this.infos = {};
            this.destroyQueue = [];
        },

        /**
         * 添加伤害信息到管理器中
         * @param {number} value - 伤害数值
         * @param {number} x - X坐标位置
         * @param {number} y - Y坐标位置
         * @param {string} type - 伤害类型（received/inflicted/healed）
         */
        addDamageInfo: function(value, x, y, type) {
            var time = this.game.currentTime,
                id = time+""+Math.abs(value)+""+x+""+y,
                self = this,
                info = new DamageInfo(id, value, x, y, DamageInfo.DURATION, type);

            info.onDestroy(function(id) {
                self.destroyQueue.push(id);
            });
            this.infos[id] = info;
        },

        /**
         * 遍历所有信息对象并执行回调函数
         * @param {Function} callback - 回调函数，接收info参数
         */
        forEachInfo: function(callback) {
            var self = this;

            _.each(this.infos, function(info, id) {
                callback(info);
            });
        },

        /**
         * 更新所有信息对象的状态
         * @param {number} time - 当前时间戳
         */
        update: function(time) {
            var self = this;

            this.forEachInfo(function(info) {
                info.update(time);
            });

            // 处理销毁队列中的信息对象
            _.each(this.destroyQueue, function(id) {
                delete self.infos[id];
            });
            this.destroyQueue = [];
        }
    });

    // 定义不同类型伤害信息的颜色配置
    var damageInfoColors = {
        "received": {
            fill: "rgb(255, 50, 50)",
            stroke: "rgb(255, 180, 180)"
        },
        "inflicted": {
            fill: "white",
            stroke: "#373737"
        },
        "healed": {
            fill: "rgb(80, 255, 80)",
            stroke: "rgb(50, 120, 50)"
        }
    };

    /**
     * 伤害信息类，表示单个伤害数字的显示效果
     */
    var DamageInfo = Class.extend({
        DURATION: 1000,

        /**
         * 初始化伤害信息对象
         * @param {string} id - 唯一标识符
         * @param {number} value - 伤害数值
         * @param {number} x - X坐标位置
         * @param {number} y - Y坐标位置
         * @param {number} duration - 持续时间
         * @param {string} type - 伤害类型
         */
        init: function(id, value, x, y, duration, type) {
            this.id = id;
            this.value = value;
            this.duration = duration;
            this.x = x;
            this.y = y;
            this.opacity = 1.0;
            this.lastTime = 0;
            this.speed = 100;
            this.fillColor = damageInfoColors[type].fill;
            this.strokeColor = damageInfoColors[type].stroke;
        },

        /**
         * 判断是否到达动画更新时间
         * @param {number} time - 当前时间
         * @returns {boolean} 是否需要更新动画
         */
        isTimeToAnimate: function(time) {
        	return (time - this.lastTime) > this.speed;
        },

        /**
         * 更新伤害信息状态
         * @param {number} time - 当前时间
         */
        update: function(time) {
            if(this.isTimeToAnimate(time)) {
                this.lastTime = time;
                this.tick();
            }
        },

        /**
         * 执行单次动画帧更新
         */
        tick: function() {
            this.y -= 1;
            this.opacity -= 0.07;
            if(this.opacity < 0) {
                this.destroy();
            }
        },

        /**
         * 设置销毁回调函数
         * @param {Function} callback - 销毁时执行的回调函数
         */
        onDestroy: function(callback) {
            this.destroy_callback = callback;
        },

        /**
         * 销毁当前伤害信息对象
         */
        destroy: function() {
            if(this.destroy_callback) {
                this.destroy_callback(this.id);
            }
        }
    });
    
    return InfoManager;
});
