//实体
var cls = require("./lib/class"),
    Messages = require('./message'),
    Utils = require('./utils');

/**
 * 实体类 - 游戏中的基础实体对象
 * @constructor
 */
module.exports = Entity = cls.Class.extend({
    /**
     * 初始化实体对象
     * @param {number} id - 实体唯一标识符
     * @param {string} type - 实体类型
     * @param {string} kind - 实体种类
     * @param {number} x - X坐标位置
     * @param {number} y - Y坐标位置
     */
    init: function (id, type, kind, x, y) {
        this.id = parseInt(id);
        this.type = type;
        this.kind = kind;
        this.x = x;
        this.y = y;
    },

    /**
     * 销毁实体对象
     */
    destroy: function () {

    },

    /**
     * 获取实体的基础状态信息
     * @returns {Array} 包含实体ID、种类、坐标的状态数组
     */
    _getBaseState: function () {
        return [
            parseInt(this.id),
            this.kind,
            this.x,
            this.y
        ];
    },

    /**
     * 获取实体当前状态
     * @returns {Array} 实体状态数组
     */
    getState: function () {
        return this._getBaseState();
    },

    /**
     * 创建生成消息
     * @returns {Messages.Spawn} 生成消息实例
     */
    spawn: function () {
        return new Messages.Spawn(this);
    },

    /**
     * 创建销毁消息
     * @returns {Messages.Despawn} 销毁消息实例
     */
    despawn: function () {
        return new Messages.Despawn(this.id);
    },

    /**
     * 设置实体位置
     * @param {number} x - 新的X坐标
     * @param {number} y - 新的Y坐标
     */
    setPosition: function (x, y) {
        this.x = x;
        this.y = y;
    },

    /**
     * 获取靠近指定实体的随机位置
     * @param {Entity} entity - 目标实体对象
     * @returns {Object|null} 随机位置对象或null
     */
    getPositionNextTo: function (entity) {
        let pos = null;
        if (entity) {
            pos = {};
            // 这是一种快速简单的方式，为怪物提供一个靠近另一个实体的随机位置
            let r = Utils.random(4);

            pos.x = entity.x;
            pos.y = entity.y;
            if (r === 0)
                pos.y -= 1;
            if (r === 1)
                pos.y += 1;
            if (r === 2)
                pos.x -= 1;
            if (r === 3)
                pos.x += 1;
        }
        return pos;
    }
});
