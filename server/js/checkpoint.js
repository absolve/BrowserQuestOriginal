
var cls = require('./lib/class'),
    _ = require('underscore'),
    Utils = require('./utils'),
    Types = require("../../shared/js/gametypes");

/**
 * 检查点类，用于定义游戏中的检查点区域
 * @class Checkpoint
 */
module.exports = Checkpoint = cls.Class.extend({
    /**
     * 初始化检查点对象
     * @param {number} id - 检查点的唯一标识符
     * @param {number} x - 检查点区域的x坐标
     * @param {number} y - 检查点区域的y坐标
     * @param {number} width - 检查点区域的宽度
     * @param {number} height - 检查点区域的高度
     */
    init: function (id, x, y, width, height) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    },

    /**
     * 获取检查点区域内随机位置
     * @returns {Object} 包含x和y坐标的随机位置对象
     */
    getRandomPosition: function () {
        var pos = {};

        pos.x = this.x + Utils.randomInt(0, this.width - 1);
        pos.y = this.y + Utils.randomInt(0, this.height - 1);
        return pos;
    }
});
