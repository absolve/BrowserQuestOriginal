var Area = require('./area'),
    _ = require('underscore'),
    Types = require("../../shared/js/gametypes");

module.exports = MobArea = Area.extend({
    /**
     * 初始化区域对象
     * @param {string} id - 区域ID
     * @param {number} nb - 实体数量
     * @param {string} kind - 实体类型
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {object} world - 世界对象
     */
    init: function (id, nb, kind, x, y, width, height, world) {
        this._super(id, x, y, width, height, world);
        this.nb = nb;
        this.kind = kind;
        this.respawns = [];
        this.setNumberOfEntities(this.nb);

        //this.initRoaming();
    },

    /**
     * 生成怪物
     */
    spawnMobs: function () {
        for (let i = 0; i < this.nb; i += 1) {
            this.addToArea(this._createMobInsideArea());
        }
    },

    /**
     * 在区域内创建一个怪物
     * @returns {object} 创建的怪物对象
     */
    _createMobInsideArea: function () {
        let k = Types.getKindFromString(this.kind),
            pos = this._getRandomPositionInsideArea(),
            mob = new Mob('1' + this.id + '' + k + '' + this.entities.length, k, pos.x, pos.y);

        mob.onMove(this.world.onMobMoveCallback.bind(this.world));

        return mob;
    },

    /**
     * 重生怪物
     * @param {object} mob - 要重生的怪物对象
     * @param {number} delay - 重生延迟时间
     */
    respawnMob: function (mob, delay) {
        let self = this;

        this.removeFromArea(mob);

        setTimeout(function () {
            let pos = self._getRandomPositionInsideArea();

            mob.x = pos.x;
            mob.y = pos.y;
            mob.isDead = false;
            self.addToArea(mob);
            self.world.addMob(mob);
        }, delay);
    },

    /**
     * 初始化怪物漫游行为
     * @param {object} mob - 怪物对象
     */
    initRoaming: function (mob) {
        var self = this;

        // 每500毫秒检查一次怪物是否可以漫游
        setInterval(function () {
            _.each(self.entities, function (mob) {
                var canRoam = (Utils.random(20) === 1),
                    pos;

                if (canRoam) {
                    if (!mob.hasTarget() && !mob.isDead) {
                        pos = self._getRandomPositionInsideArea();
                        mob.move(pos.x, pos.y);
                    }
                }
            });
        }, 500);
    },

    /**
     * 创建奖励物品（宝箱）
     * @returns {object} 奖励物品对象，包含位置和类型信息
     */
    createReward: function () {
        var pos = this._getRandomPositionInsideArea();

        return {x: pos.x, y: pos.y, kind: Types.Entities.CHEST};
    }
});
