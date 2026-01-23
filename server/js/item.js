/**
 * 物品类 - 继承自Entity类，用于表示游戏中的可拾取物品
 * @param {number} id - 物品唯一标识符
 * @param {string} kind - 物品类型/种类
 * @param {number} x - 物品在地图上的x坐标
 * @param {number} y - 物品在地图上的y坐标
 */
module.exports = Item = Entity.extend({
    init: function (id, kind, x, y) {
        this._super(id, "item", kind, x, y);
        this.isStatic = false;
        this.isFromChest = false;
    },

    /**
     * 处理物品消失逻辑，包括闪烁效果和延迟消失
     * @param {Object} params - 包含回调函数和时间参数的对象
     * @param {Function} params.blinkCallback - 闪烁回调函数
     * @param {Function} params.despawnCallback - 消失回调函数
     * @param {number} params.blinkingDuration - 闪烁持续时间
     * @param {number} params.beforeBlinkDelay - 闪烁前的延迟时间
     */
    handleDespawn: function (params) {
        var self = this;

        // 设置定时器先执行闪烁效果，然后执行消失逻辑
        this.blinkTimeout = setTimeout(function () {
            params.blinkCallback();
            self.despawnTimeout = setTimeout(params.despawnCallback, params.blinkingDuration);
        }, params.beforeBlinkDelay);
    },

    /**
     * 销毁物品实例，清理定时器并处理静态物品的重生逻辑
     */
    destroy: function () {
        // 清理闪烁定时器
        if (this.blinkTimeout) {
            clearTimeout(this.blinkTimeout);
        }
        // 清理消失定时器
        if (this.despawnTimeout) {
            clearTimeout(this.despawnTimeout);
        }

        // 如果是静态物品，则安排30秒后重生
        if (this.isStatic) {
            this.scheduleRespawn(30000);
        }
    },

    /**
     * 安排物品在指定延迟后重生
     * @param {number} delay - 重生延迟时间（毫秒）
     */
    scheduleRespawn: function (delay) {
        var self = this;
        setTimeout(function () {
            if (self.respawn_callback) {
                self.respawn_callback();
            }
        }, delay);
    },

    /**
     * 设置重生回调函数
     * @param {Function} callback - 重生时执行的回调函数
     */
    onRespawn: function (callback) {
        this.respawn_callback = callback;
    }
});
