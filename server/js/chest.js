var Utils = require('./utils'),
    Types = require("../../shared/js/gametypes");

/**
 * Chest类 - 宝箱实体类，继承自Item类
 * 表示游戏中的宝箱对象，可以包含随机物品
 */
module.exports = Chest = Item.extend({
    /**
     * 构造函数 - 初始化宝箱实例
     * @param {number} id - 宝箱的唯一标识符
     * @param {number} x - 宝箱在地图上的x坐标
     * @param {number} y - 宝箱在地图上的y坐标
     */
    init: function (id, x, y) {
        this._super(id, Types.Entities.CHEST, x, y);
    },

    /**
     * 设置宝箱内的物品列表
     * @param {Array} items - 物品数组，包含该宝箱可掉落的所有物品
     */
    setItems: function (items) {
        this.items = items;
    },

    /**
     * 获取宝箱内的随机物品
     * 从宝箱的物品列表中随机选择一个物品返回
     * @returns {Object|null} 随机选中的物品对象，如果宝箱内没有物品则返回null
     */
    getRandomItem: function () {
        // 计算宝箱内物品数量
        var nbItems = _.size(this.items),
            item = null;

        // 如果宝箱内有物品，则随机选择一个
        if (nbItems > 0) {
            item = this.items[Utils.random(nbItems)];
        }
        return item;
    }
});
