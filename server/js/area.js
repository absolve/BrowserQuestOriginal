/**
 * Area类 - 表示游戏世界中的一个区域
 * 用于管理特定范围内的实体对象，处理实体的添加、移除和区域状态管理
 */
var cls = require('./lib/class'),
    _ = require('underscore'),
    Utils = require('./utils'),
    Types = require("../../shared/js/gametypes");

module.exports = Area = cls.Class.extend({
    /**
     * 初始化Area实例
     * @param {number} id - 区域唯一标识符
     * @param {number} x - 区域左上角x坐标
     * @param {number} y - 区域左上角y坐标
     * @param {number} width - 区域宽度
     * @param {number} height - 区域高度
     * @param {object} world - 所属的世界对象
     */
    init: function (id, x, y, width, height, world) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.world = world;
        this.entities = [];
        this.hasCompletelyRespawned = true;
    },

    /**
     * 获取区域内随机有效位置
     * 循环生成随机坐标直到找到有效的世界位置
     * @returns {object} 包含x和y坐标的对象
     */
    _getRandomPositionInsideArea: function () {
        var pos = {},
            valid = false;

        while (!valid) {
            pos.x = this.x + Utils.random(this.width + 1);
            pos.y = this.y + Utils.random(this.height + 1);
            valid = this.world.isValidPosition(pos.x, pos.y);
        }
        return pos;
    },

    /**
     * 从区域中移除实体
     * 当区域变空且完全重生后触发回调函数
     * @param {object} entity - 要移除的实体对象
     */
    removeFromArea: function (entity) {
        var i = _.indexOf(_.pluck(this.entities, 'id'), entity.id);
        this.entities.splice(i, 1);

        if (this.isEmpty() && this.hasCompletelyRespawned && this.empty_callback) {
            this.hasCompletelyRespawned = false;
            this.empty_callback();
        }
    },

    /**
     * 向区域中添加实体
     * 设置实体的区域引用，并根据实体类型添加到世界中
     * @param {object} entity - 要添加的实体对象
     */
    addToArea: function (entity) {
        if (entity) {
            this.entities.push(entity);
            entity.area = this;
            if (entity instanceof Mob) {
                this.world.addMob(entity);
            }
        }

        if (this.isFull()) {
            this.hasCompletelyRespawned = true;
        }
    },

    /**
     * 设置区域中应有的实体数量
     * @param {number} nb - 实体数量
     */
    setNumberOfEntities: function (nb) {
        this.nbEntities = nb;
    },

    /**
     * 检查区域是否为空（没有存活的实体）
     * @returns {boolean} 如果区域中没有存活实体则返回true，否则返回false
     */
    isEmpty: function () {
        return !_.any(this.entities, function (entity) {
            return !entity.isDead
        });
    },

    /**
     * 检查区域是否已满（实体数量达到设定值且不为空）
     * @returns {boolean} 如果区域已满则返回true，否则返回false
     */
    isFull: function () {
        return !this.isEmpty() && (this.nbEntities === _.size(this.entities));
    },

    /**
     * 设置区域变空时的回调函数
     * @param {function} callback - 区域变空时执行的回调函数
     */
    onEmpty: function (callback) {
        this.empty_callback = callback;
    }
});
