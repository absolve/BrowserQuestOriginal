var Area = require('./area'),
    _ = require('underscore'),
    Types = require("../../shared/js/gametypes");

/**
 * ChestArea类 - 继承自Area类，表示包含宝箱的区域
 * @param {number} id - 区域ID
 * @param {number} x - 区域左上角x坐标
 * @param {number} y - 区域左上角y坐标
 * @param {number} width - 区域宽度
 * @param {number} height - 区域高度
 * @param {number} cx - 宝箱x坐标
 * @param {number} cy - 宝箱y坐标
 * @param {Array} items - 宝箱内物品列表
 * @param {Object} world - 世界对象引用
 */
module.exports = ChestArea = Area.extend({
    init: function (id, x, y, width, height, cx, cy, items, world) {
        this._super(id, x, y, width, height, world);
        this.items = items;
        this.chestX = cx;
        this.chestY = cy;
    },

    /**
     * 判断实体是否在区域内
     * @param {Object} entity - 要检查的实体对象
     * @returns {boolean} 如果实体在区域内返回true，否则返回false
     */
    contains: function (entity) {
        // 检查实体是否在矩形区域内
        if (entity) {
            return entity.x >= this.x
                && entity.y >= this.y
                && entity.x < this.x + this.width
                && entity.y < this.y + this.height;
        } else {
            return false;
        }
    }
});
