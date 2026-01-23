var cls = require("./lib/class"),
    _ = require("underscore"),
    Messages = require("./message"),
    Properties = require("./properties"),
    Types = require("../../shared/js/gametypes");

module.exports = Mob = Character.extend({
    /**
     * 初始化怪物实体
     * @param {string|number} id - 怪物唯一标识符
     * @param {string} kind - 怪物类型
     * @param {number} x - 初始X坐标
     * @param {number} y - 初始Y坐标
     * @returns {void}
     */
    init: function (id, kind, x, y) {
        this._super(id, "mob", kind, x, y);

        this.updateHitPoints();
        this.spawningX = x;
        this.spawningY = y;
        this.armorLevel = Properties.getArmorLevel(this.kind);
        this.weaponLevel = Properties.getWeaponLevel(this.kind);
        this.hatelist = [];
        this.respawnTimeout = null;
        this.returnTimeout = null;
        this.isDead = false;
    },

    /**
     * 销毁怪物实体并处理相关清理工作
     * @returns {void}
     */
    destroy: function () {
        this.isDead = true;
        this.hatelist = [];
        this.clearTarget();
        this.updateHitPoints();
        this.resetPosition();

        this.handleRespawn();
    },

    /**
     * 接收伤害并减少生命值
     * @param {number} points - 伤害点数
     * @param {string|number} playerId - 造成伤害的玩家ID
     * @returns {void}
     */
    receiveDamage: function (points, playerId) {
        this.hitPoints -= points;
    },

    /**
     * 检查是否对指定玩家存在仇恨
     * @param {string|number} playerId - 玩家ID
     * @returns {boolean} 如果存在仇恨返回true，否则返回false
     */
    hates: function (playerId) {
        return _.any(this.hatelist, function (obj) {
            return obj.id === playerId;
        });
    },

    /**
     * 增加对指定玩家的仇恨值
     * @param {number} playerId - 玩家ID
     * @param {number} points - 要增加的仇恨点数
     * @returns {void}
     */
    increaseHateFor: function (playerId, points) {
        // 检查是否已经存在对该玩家的仇恨记录
        if (this.hates(playerId)) {
            // 如果存在，则更新现有仇恨值
            _.detect(this.hatelist, function (obj) {
                return obj.id === playerId;
            }).hate += points;
        } else {
            // 如果不存在，则创建新的仇恨记录
            this.hatelist.push({id: playerId, hate: points});
        }

        /*
        log.debug("Hatelist : "+this.id);
        _.each(this.hatelist, function(obj) {
            log.debug(obj.id + " -> " + obj.hate);
        });*/

        // 如果存在返回计时器，则清除它以防止怪物回到出生位置
        if (this.returnTimeout) {
            // 防止怪物回到其生成位置
            // 因为它已经对新玩家产生了仇恨
            clearTimeout(this.returnTimeout);
            this.returnTimeout = null;
        }
    },


    /**
     * 获取仇恨列表中指定仇恨等级的玩家ID
     * @param {number} hateRank - 仇恨等级（1为最高仇恨，依次递减），如果未提供或超出范围则获取最高仇恨的玩家
     * @returns {string|number|undefined} 指定仇恨等级对应的玩家ID，如果不存在则返回undefined
     */
    getHatedPlayerId: function (hateRank) {
        // 按仇恨值从小到大排序仇恨列表
        let i, playerId,
            sorted = _.sortBy(this.hatelist, function (obj) {
                return obj.hate;
            }),
            size = _.size(this.hatelist);

        // 根据仇恨等级计算数组索引（hateRank=1对应最高仇恨，即数组末尾）
        if (hateRank && hateRank <= size) {
            i = size - hateRank;
        } else {
            i = size - 1;
        }

        // 获取对应索引位置的玩家ID
        if (sorted && sorted[i]) {
            playerId = sorted[i].id;
        }

        return playerId;
    },

    /**
     * 移除指定玩家并根据情况决定是否返回生成点
     * @param {string|number} playerId - 要移除的玩家ID
     * @param {number} duration - 返回生成点时的持续时间参数
     * @returns {void}
     */
    forgetPlayer: function (playerId, duration) {
        // 从仇恨列表中移除指定ID的玩家对象
        this.hatelist = _.reject(this.hatelist, function (obj) {
            return obj.id === playerId;
        });

        // 当仇恨列表为空时，返回到初始生成位置
        if (this.hatelist.length === 0) {
            this.returnToSpawningPosition(duration);
        }
    },


    /**
     * 清空仇恨列表并返回刷新点
     * 该方法用于重置实体的仇恨目标列表，并将其位置重置到初始刷新位置
     * @param {number} [positionIndex=1] - 刷新位置索引，默认为1
     * @returns {void}
     */
    forgetEveryone: function () {
        this.hatelist = [];
        this.returnToSpawningPosition(1);
    },

    /**
     * 处理物品掉落操作
     * @param {Object} item - 要掉落的物品对象
     * @returns {Messages.Drop} 返回一个新的Drop消息实例
     */
    drop: function (item) {
        if (item) {
            return new Messages.Drop(this, item);
        }
    },

    /**
     * 处理怪物重生逻辑
     * @returns {void}
     */
    handleRespawn: function () {
        let delay = 30000,
            self = this;

        if (this.area && this.area instanceof MobArea) {
            // Respawn inside the area if part of a MobArea
            this.area.respawnMob(this, delay);
        } else {
            if (this.area && this.area instanceof ChestArea) {
                this.area.removeFromArea(this);
            }

            setTimeout(function () {
                if (self.respawn_callback) {
                    self.respawn_callback();
                }
            }, delay);
        }
    },

    /**
     * 设置重生回调函数
     * @param {Function} callback - 重生时执行的回调函数
     * @returns {void}
     */
    onRespawn: function (callback) {
        this.respawn_callback = callback;
    },

    /**
     * 重置怪物位置到初始生成点
     * @returns {void}
     */
    resetPosition: function () {
        this.setPosition(this.spawningX, this.spawningY);
    },

    /**
     * 返回到初始生成位置
     * @param {number} waitDuration - 等待返回的时间间隔
     * @returns {void}
     */
    returnToSpawningPosition: function (waitDuration) {
        var self = this,
            delay = waitDuration || 4000;

        this.clearTarget();

        this.returnTimeout = setTimeout(function () {
            self.resetPosition();
            self.move(self.x, self.y);
        }, delay);
    },

    /**
     * 设置移动回调函数
     * @param {Function} callback - 移动时执行的回调函数
     * @returns {void}
     */
    onMove: function (callback) {
        this.move_callback = callback;
    },

    /**
     * 移动到指定位置
     * @param {number} x - 目标X坐标
     * @param {number} y - 目标Y坐标
     * @returns {void}
     */
    move: function (x, y) {
        this.setPosition(x, y);
        if (this.move_callback) {
            this.move_callback(this);
        }
    },

    /**
     * 更新怪物的生命值
     * @returns {void}
     */
    updateHitPoints: function () {
        this.resetHitPoints(Properties.getHitPoints(this.kind));
    },

    /**
     * 计算到生成点的距离
     * @param {number} x - 当前X坐标
     * @param {number} y - 当前Y坐标
     * @returns {number} 到生成点的欧几里得距离
     */
    distanceToSpawningPoint: function (x, y) {
        return Utils.distanceTo(x, y, this.spawningX, this.spawningY);
    }
});
