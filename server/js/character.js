var cls = require("./lib/class"),
    Messages = require("./message"),
    Utils = require("./utils"),
    Properties = require("./properties"),
    Types = require("../../shared/js/gametypes");

module.exports = Character = Entity.extend({
    /**
     * 初始化实体对象
     * @param {string} id - 实体唯一标识符
     * @param {string} type - 实体类型
     * @param {string} kind - 实体种类
     * @param {number} x - X坐标位置
     * @param {number} y - Y坐标位置
     */
    init: function (id, type, kind, x, y) {
        this._super(id, type, kind, x, y);

        this.orientation = Utils.randomOrientation();  //方向
        this.attackers = {};
        this.target = null;
    },

    /**
     * 获取实体的当前状态信息
     * @returns {Array} 包含基础状态、方向和目标的状态数组
     */
    getState: function () {
        let basestate = this._getBaseState(),
            state = [];

        state.push(this.orientation);
        if (this.target) {
            state.push(this.target);
        }

        return basestate.concat(state);
    },

    /**
     * 重置实体的生命值到最大值
     * @param {number} maxHitPoints - 最大生命值
     */
    resetHitPoints: function (maxHitPoints) {
        this.maxHitPoints = maxHitPoints;
        this.hitPoints = this.maxHitPoints;
    },

    /**
     * 按指定数值恢复生命值
     * @param {number} value - 要恢复的生命值数量
     */
    regenHealthBy: function (value) {
        var hp = this.hitPoints,
            max = this.maxHitPoints;

        if (hp < max) {
            if (hp + value <= max) {
                this.hitPoints += value;
            } else {
                this.hitPoints = max;
            }
        }
    },

    /**
     * 检查实体是否拥有满血状态
     * @returns {boolean} 如果生命值等于最大生命值则返回true，否则返回false
     */
    hasFullHealth: function () {
        return this.hitPoints === this.maxHitPoints;
    },

    /**
     * 设置攻击目标
     * @param {Object} entity - 目标实体对象
     */
    setTarget: function (entity) {
        this.target = entity.id;
    },

    /**
     * 清除当前攻击目标
     */
    clearTarget: function () {
        this.target = null;
    },

    /**
     * 检查是否存在攻击目标
     * @returns {boolean} 如果存在目标返回true，否则返回false
     */
    hasTarget: function () {
        return this.target !== null;
    },

    /**
     * 创建攻击消息
     * @returns {Messages.Attack} 攻击消息对象
     */
    attack: function () {
        return new Messages.Attack(this.id, this.target);
    },

    /**
     * 创建健康状态消息（非再生）
     * @returns {Messages.Health} 健康状态消息对象
     */
    health: function () {
        return new Messages.Health(this.hitPoints, false);
    },

    /**
     * 创建健康状态消息（再生）
     * @returns {Messages.Health} 健康状态消息对象
     */
    regen: function () {
        return new Messages.Health(this.hitPoints, true);
    },

    /**
     * 添加攻击者到攻击者列表
     * @param {Object} entity - 攻击者实体对象
     */
    addAttacker: function (entity) {
        if (entity) {
            this.attackers[entity.id] = entity;
        }
    },

    /**
     * 从攻击者列表中移除指定攻击者
     * @param {Object} entity - 要移除的攻击者实体对象
     */
    removeAttacker: function (entity) {
        if (entity && entity.id in this.attackers) {
            delete this.attackers[entity.id];
            log.debug(this.id + " REMOVED ATTACKER " + entity.id);
        }
    },

    /**
     * 遍历所有攻击者并执行回调函数
     * @param {Function} callback - 对每个攻击者执行的回调函数
     */
    forEachAttacker: function (callback) {
        for (let id in this.attackers) {
            callback(this.attackers[id]);
        }
    }
});