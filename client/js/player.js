/**
 * 定义玩家模块，继承自Character类
 * @param {Object} Character - 角色基类
 * @param {Object} Exceptions - 异常处理模块
 * @returns {Function} Player构造函数
 */
define(['character', 'exceptions'], function (Character, Exceptions) {
    var Player = Character.extend({
        MAX_LEVEL: 10,

        /**
         * 初始化玩家实例
         * @param {number} id - 玩家ID
         * @param {string} name - 玩家名称
         * @param {string} kind - 玩家类型
         */
        init: function (id, name, kind) {
            this._super(id, kind);

            this.name = name;

            // Renderer
            this.nameOffsetY = -10;

            // sprites
            this.spriteName = "clotharmor";
            this.weaponName = "sword1";

            // modes
            this.isLootMoving = false;
            this.isSwitchingWeapon = true;
        },

        /**
         * 拾取物品功能
         * @param {Object} item - 要拾取的物品对象
         * @throws {Exceptions.LootException} 当物品等级不够或已拥有相同物品时抛出异常
         */
        loot: function (item) {
            if (item) {
                var rank, currentRank, msg, currentArmorName;

                if (this.currentArmorSprite) {
                    currentArmorName = this.currentArmorSprite.name;
                } else {
                    currentArmorName = this.spriteName;
                }

                if (item.type === "armor") {
                    rank = Types.getArmorRank(item.kind);
                    currentRank = Types.getArmorRank(Types.getKindFromString(currentArmorName));
                    msg = "You are wearing a better armor";
                } else if (item.type === "weapon") {
                    rank = Types.getWeaponRank(item.kind);
                    currentRank = Types.getWeaponRank(Types.getKindFromString(this.weaponName));
                    msg = "You are wielding a better weapon";
                }

                // 检查物品等级和当前装备的比较
                if (rank && currentRank) {
                    if (rank === currentRank) {
                        throw new Exceptions.LootException("You already have this " + item.type);
                    } else if (rank <= currentRank) {
                        throw new Exceptions.LootException(msg);
                    }
                }

                log.info('Player ' + this.id + ' has looted ' + item.id);
                if (Types.isArmor(item.kind) && this.invincible) {
                    this.stopInvincibility();
                }
                item.onLoot(this);
            }
        },

        /**
         * Returns true if the character is currently walking towards an item in order to loot it.
         */
        isMovingToLoot: function () {
            return this.isLootMoving;
        },

        /**
         * 获取角色精灵名称
         * @returns {string} 精灵名称
         */
        getSpriteName: function () {
            return this.spriteName;
        },

        /**
         * 设置角色精灵名称
         * @param {string} name - 新的精灵名称
         */
        setSpriteName: function (name) {
            this.spriteName = name;
        },

        /**
         * 获取护甲名称
         * @returns {string} 护甲ID
         */
        getArmorName: function () {
            var sprite = this.getArmorSprite();
            return sprite.id;
        },

        /**
         * 获取护甲精灵对象
         * @returns {Object} 护甲精灵对象
         */
        getArmorSprite: function () {
            if (this.invincible) {
                return this.currentArmorSprite;
            } else {
                return this.sprite;
            }
        },

        /**
         * 获取武器名称
         * @returns {string} 武器名称
         */
        getWeaponName: function () {
            return this.weaponName;
        },

        /**
         * 设置武器名称
         * @param {string} name - 新的武器名称
         */
        setWeaponName: function (name) {
            this.weaponName = name;
        },

        /**
         * 检查是否持有武器
         * @returns {boolean} 是否持有武器
         */
        hasWeapon: function () {
            return this.weaponName !== null;
        },

        /**
         * 切换武器动画效果
         * @param {string} newWeaponName - 新武器名称
         */
        switchWeapon: function (newWeaponName) {
            var count = 14,
                value = false,
                self = this;

            var toggle = function () {
                value = !value;
                return value;
            };

            if (newWeaponName !== this.getWeaponName()) {
                if (this.isSwitchingWeapon) {
                    clearInterval(blanking);
                }

                this.switchingWeapon = true;
                var blanking = setInterval(function () {
                    if (toggle()) {
                        self.setWeaponName(newWeaponName);
                    } else {
                        self.setWeaponName(null);
                    }

                    count -= 1;
                    if (count === 1) {
                        clearInterval(blanking);
                        self.switchingWeapon = false;

                        if (self.switch_callback) {
                            self.switch_callback();
                        }
                    }
                }, 90);
            }
        },

        /**
         * 切换护甲动画效果
         * @param {Object} newArmorSprite - 新护甲精灵对象
         */
        switchArmor: function (newArmorSprite) {
            var count = 14,
                value = false,
                self = this;

            var toggle = function () {
                value = !value;
                return value;
            };

            if (newArmorSprite && newArmorSprite.id !== this.getSpriteName()) {
                if (this.isSwitchingArmor) {
                    clearInterval(blanking);
                }

                this.isSwitchingArmor = true;
                self.setSprite(newArmorSprite);
                self.setSpriteName(newArmorSprite.id);
                var blanking = setInterval(function () {
                    self.setVisible(toggle());

                    count -= 1;
                    if (count === 1) {
                        clearInterval(blanking);
                        self.isSwitchingArmor = false;

                        if (self.switch_callback) {
                            self.switch_callback();
                        }
                    }
                }, 90);
            }
        },

        /**
         * 设置护甲拾取回调函数
         * @param {Function} callback - 回调函数
         */
        onArmorLoot: function (callback) {
            this.armorloot_callback = callback;
        },

        /**
         * 设置切换物品回调函数
         * @param {Function} callback - 回调函数
         */
        onSwitchItem: function (callback) {
            this.switch_callback = callback;
        },

        /**
         * 设置无敌状态回调函数
         * @param {Function} callback - 回调函数
         */
        onInvincible: function (callback) {
            this.invincible_callback = callback;
        },

        /**
         * 开始无敌状态
         */
        startInvincibility: function () {
            var self = this;

            if (!this.invincible) {
                this.currentArmorSprite = this.getSprite();
                this.invincible = true;
                this.invincible_callback();
            } else {
                // 如果玩家已有无敌状态，重置持续时间
                if (this.invincibleTimeout) {
                    clearTimeout(this.invincibleTimeout);
                }
            }

            this.invincibleTimeout = setTimeout(function () {
                self.stopInvincibility();
                self.idle();
            }, 15000);
        },

        /**
         * 停止无敌状态
         */
        stopInvincibility: function () {
            this.invincible_callback();
            this.invincible = false;

            if (this.currentArmorSprite) {
                this.setSprite(this.currentArmorSprite);
                this.setSpriteName(this.currentArmorSprite.id);
                this.currentArmorSprite = null;
            }
            if (this.invincibleTimeout) {
                clearTimeout(this.invincibleTimeout);
            }
        }
    });

    return Player;
});
