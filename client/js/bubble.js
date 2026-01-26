define(['jquery', 'timer'], function($, Timer) {

    /**
     * 气泡类，用于管理单个气泡元素及其生命周期
     */
    var Bubble = Class.extend({
        /**
         * 初始化气泡实例
         * @param {string} id - 气泡的唯一标识符
         * @param {HTMLElement} element - 气泡对应的DOM元素
         * @param {number} time - 气泡创建的时间戳
         */
        init: function(id, element, time) {
            this.id = id;
            this.element = element;
            this.timer = new Timer(5000, time);
        },

        /**
         * 判断气泡是否已过期
         * @param {number} time - 当前时间戳
         * @returns {boolean} - 如果气泡已过期返回true，否则返回false
         */
        isOver: function(time) {
            if(this.timer.isOver(time)) {
                return true;
            }
            return false;
        },

        /**
         * 销毁气泡DOM元素
         */
        destroy: function() {
            $(this.element).remove();
        },

        /**
         * 重置气泡计时器
         * @param {number} time - 新的时间戳
         */
        reset: function(time) {
            this.timer.lastTime = time;
        }
    });

    /**
     * 气泡管理器类，用于管理多个气泡实例
     */
    var BubbleManager = Class.extend({
        /**
         * 初始化气泡管理器
         * @param {HTMLElement} container - 气泡容器DOM元素
         */
        init: function(container) {
            this.container = container;
            this.bubbles = {};
        },

        /**
         * 根据ID获取气泡实例
         * @param {string} id - 气泡的唯一标识符
         * @returns {Bubble|null} - 找到的气泡实例或null
         */
        getBubbleById: function(id) {
            if(id in this.bubbles) {
                return this.bubbles[id];
            }
            return null;
        },

        /**
         * 创建或更新气泡
         * @param {string} id - 气泡的唯一标识符
         * @param {string} message - 气泡显示的消息内容
         * @param {number} time - 气泡创建的时间戳
         */
        create: function(id, message, time) {
            if(this.bubbles[id]) {
                this.bubbles[id].reset(time);
                $("#"+id+" p").html(message);
            }
            else {
                var el = $("<div id=\""+id+"\" class=\"bubble\"><p>"+message+"</p><div class=\"thingy\"></div></div>"); //.attr('id', id);
                $(el).appendTo(this.container);

                this.bubbles[id] = new Bubble(id, el, time);
            }
        },

        /**
         * 更新所有气泡状态，清理过期气泡
         * @param {number} time - 当前时间戳
         */
        update: function(time) {
            var self = this,
                bubblesToDelete = [];

            // 遍历所有气泡，标记过期的气泡进行删除
            _.each(this.bubbles, function(bubble) {
                if(bubble.isOver(time)) {
                    bubble.destroy();
                    bubblesToDelete.push(bubble.id);
                }
            });

            // 从管理器中移除已删除的气泡记录
            _.each(bubblesToDelete, function(id) {
                delete self.bubbles[id];
            });
        },

        /**
         * 清理所有气泡
         */
        clean: function() {
            var self = this,
                bubblesToDelete = [];

            // 遍历所有气泡并销毁它们
            _.each(this.bubbles, function(bubble) {
                bubble.destroy();
                bubblesToDelete.push(bubble.id);
            });

            // 从管理器中移除所有气泡记录
            _.each(bubblesToDelete, function(id) {
                delete self.bubbles[id];
            });

            this.bubbles = {};
        },

        /**
         * 销毁指定ID的气泡
         * @param {string} id - 要销毁的气泡ID
         */
        destroyBubble: function(id) {
            var bubble = this.getBubbleById(id);

            if(bubble) {
                bubble.destroy();
                delete this.bubbles[id];
            }
        },

        /**
         * 遍历所有气泡并执行回调函数
         * @param {function} callback - 对每个气泡执行的回调函数
         */
        forEachBubble: function(callback) {
            _.each(this.bubbles, function(bubble) {
                callback(bubble);
            });
        }
    });
    
    return BubbleManager;
});
