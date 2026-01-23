//玩家
var cls = require("./lib/class"),
    _ = require("underscore"),
    Messages = require("./message"),
    Utils = require("./utils"),
    Properties = require("./properties"),
    Formulas = require("./formulas"),
    log = require('loglevel'),
    check = require("./format").check,
    Types = require("../../shared/js/gametypes");

module.exports = Player = Character.extend({
    /**
     * 初始化玩家对象
     * @param {Object} connection - Socket连接对象
     * @param {Object} worldServer - 世界服务器对象
     */
    init: function (connection, worldServer) {
        var self = this;
        log.setLevel("debug")
        this.server = worldServer; //世界服务器
        this.connection = connection;  //socket 连接

        this._super(this.connection.id, "player", Types.Entities.WARRIOR, 0, 0, "");

        this.hasEnteredGame = false;
        this.isDead = false;
        this.haters = {};
        this.lastCheckpoint = null;
        // this.formatChecker = new FormatChecker();
        this.disconnectTimeout = null;

        /**
         * 监听客户端消息并进行相应处理
         * 包括握手、移动、攻击、拾取物品等游戏逻辑
         */
        this.connection.listen(function (message) {//消息处理
            var action = parseInt(message[0]);
            log.debug("Received: " + message);
            if (!check(message)) {
                self.connection.close("Invalid " + Types.getMessageTypeAsString(action) + " message format: " + message);
                return;
            }

            if (!self.hasEnteredGame && action !== Types.Messages.HELLO) { // HELLO must be the first message
                self.connection.close("Invalid handshake message: " + message);
                return;
            }
            if (self.hasEnteredGame && !self.isDead && action === Types.Messages.HELLO) { // HELLO can be sent only once
                self.connection.close("Cannot initiate handshake twice: " + message);
                return;
            }

            self.resetTimeout();

            if (action === Types.Messages.HELLO) {  //初始
                var name = Utils.sanitize(message[1]);

                // If name was cleared by the sanitizer, give a default name.
                // Always ensure that the name is not longer than a maximum length.
                // (also enforced by the maxlength attribute of the name input element).
                self.name = (name === "") ? "lorem ipsum" : name.substr(0, 15);

                self.kind = Types.Entities.WARRIOR;
                self.equipArmor(message[2]);
                self.equipWeapon(message[3]);
                self.orientation = Utils.randomOrientation();
                self.updateHitPoints();
                self.updatePosition();

                self.server.addPlayer(self);
                self.server.enter_callback(self);

                self.send([Types.Messages.WELCOME, self.id, self.name, self.x, self.y, self.hitPoints]);
                self.hasEnteredGame = true;
                self.isDead = false;
            } else if (action === Types.Messages.WHO) {
                message.shift();
                self.server.pushSpawnsToPlayer(self, message);
            } else if (action === Types.Messages.ZONE) {
                self.zone_callback();
            } else if (action === Types.Messages.CHAT) {
                var msg = Utils.sanitize(message[1]);

                // Sanitized messages may become empty. No need to broadcast empty chat messages.
                if (msg && msg !== "") {
                    msg = msg.substr(0, 60); // Enforce maxlength of chat input
                    self.broadcastToZone(new Messages.Chat(self, msg), false);
                }
            } else if (action === Types.Messages.MOVE) {
                if (self.move_callback) {
                    var x = message[1],
                        y = message[2];

                    if (self.server.isValidPosition(x, y)) {
                        self.setPosition(x, y);
                        self.clearTarget();

                        self.broadcast(new Messages.Move(self));
                        self.move_callback(self.x, self.y);
                    }
                }
            } else if (action === Types.Messages.LOOTMOVE) {
                if (self.lootmove_callback) {
                    self.setPosition(message[1], message[2]);

                    var item = self.server.getEntityById(message[3]);
                    if (item) {
                        self.clearTarget();

                        self.broadcast(new Messages.LootMove(self, item));
                        self.lootmove_callback(self.x, self.y);
                    }
                }
            } else if (action === Types.Messages.AGGRO) {
                if (self.move_callback) {
                    self.server.handleMobHate(message[1], self.id, 5);
                }
            } else if (action === Types.Messages.ATTACK) {
                var mob = self.server.getEntityById(message[1]);

                if (mob) {
                    self.setTarget(mob);
                    self.server.broadcastAttacker(self);
                }
            } else if (action === Types.Messages.HIT) {
                var mob = self.server.getEntityById(message[1]);

                if (mob) {
                    var dmg = Formulas.dmg(self.weaponLevel, mob.armorLevel);

                    if (dmg > 0) {
                        mob.receiveDamage(dmg, self.id);
                        self.server.handleMobHate(mob.id, self.id, dmg);
                        self.server.handleHurtEntity(mob, self, dmg);
                    }
                }
            } else if (action === Types.Messages.HURT) {
                var mob = self.server.getEntityById(message[1]);
                if (mob && self.hitPoints > 0) {
                    self.hitPoints -= Formulas.dmg(mob.weaponLevel, self.armorLevel);
                    self.server.handleHurtEntity(self, mob);

                    if (self.hitPoints <= 0) {
                        self.isDead = true;
                        if (self.firepotionTimeout) {
                            clearTimeout(self.firepotionTimeout);
                        }
                    }
                }
            } else if (action === Types.Messages.LOOT) {
                var item = self.server.getEntityById(message[1]);

                if (item) {
                    var kind = item.kind;

                    if (Types.isItem(kind)) {
                        self.broadcast(item.despawn());
                        self.server.removeEntity(item);

                        if (kind === Types.Entities.FIREPOTION) {
                            self.updateHitPoints();
                            self.broadcast(self.equip(Types.Entities.FIREFOX));
                            self.firepotionTimeout = setTimeout(function () {
                                self.broadcast(self.equip(self.armor)); // return to normal after 15 sec
                                self.firepotionTimeout = null;
                            }, 15000);
                            self.send(new Messages.HitPoints(self.maxHitPoints).serialize());
                        } else if (Types.isHealingItem(kind)) {
                            var amount;

                            switch (kind) {
                                case Types.Entities.FLASK:
                                    amount = 40;
                                    break;
                                case Types.Entities.BURGER:
                                    amount = 100;
                                    break;
                            }

                            if (!self.hasFullHealth()) {
                                self.regenHealthBy(amount);
                                self.server.pushToPlayer(self, self.health());
                            }
                        } else if (Types.isArmor(kind) || Types.isWeapon(kind)) {
                            self.equipItem(item);
                            self.broadcast(self.equip(kind));
                        }
                    }
                }
            } else if (action === Types.Messages.TELEPORT) {
                var x = message[1],
                    y = message[2];

                if (self.server.isValidPosition(x, y)) {
                    self.setPosition(x, y);
                    self.clearTarget();

                    self.broadcast(new Messages.Teleport(self));

                    self.server.handlePlayerVanish(self);
                    self.server.pushRelevantEntityListTo(self);
                }
            } else if (action === Types.Messages.OPEN) {
                var chest = self.server.getEntityById(message[1]);
                if (chest && chest instanceof Chest) {
                    self.server.handleOpenedChest(chest, self);
                }
            } else if (action === Types.Messages.CHECK) {
                var checkpoint = self.server.map.getCheckpoint(message[1]);
                if (checkpoint) {
                    self.lastCheckpoint = checkpoint;
                }
            } else {
                if (self.message_callback) {
                    self.message_callback(message);
                }
            }
        });

        /**
         * 处理连接关闭事件，清理定时器和回调
         */
        this.connection.onClose(function () {
            if (self.firepotionTimeout) {
                clearTimeout(self.firepotionTimeout);
            }
            clearTimeout(self.disconnectTimeout);
            if (self.exit_callback) {
                self.exit_callback();
            }
        });

        this.connection.sendUTF8("go"); // Notify client that the HELLO/WELCOME handshake can start
    },

    /**
     * 销毁玩家对象，清理相关实体引用
     */
    destroy: function () {
        var self = this;

        this.forEachAttacker(function (mob) {
            mob.clearTarget();
        });
        this.attackers = {};

        this.forEachHater(function (mob) {
            mob.forgetPlayer(self.id);
        });
        this.haters = {};
    },

    /**
     * 获取玩家状态信息
     * @returns {Array} 玩家状态数组，包含基础状态和扩展状态
     */
    getState: function () {
        var basestate = this._getBaseState(),
            state = [this.name, this.orientation, this.armor, this.weapon];

        if (this.target) {
            state.push(this.target);
        }

        return basestate.concat(state);
    },

    /**
     * 发送消息给客户端
     * @param {Object} message - 要发送的消息对象
     */
    send: function (message) {  //发送消息给客户端
        this.connection.send(message);
    },

    /**
     * 广播消息到相关玩家
     * @param {Object} message - 要广播的消息对象
     * @param {boolean} ignoreSelf - 是否忽略自己，默认为true
     */
    broadcast: function (message, ignoreSelf) {
        if (this.broadcast_callback) {
            this.broadcast_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
        }
    },

    /**
     * 向当前区域广播消息
     * @param {Object} message - 要广播的消息对象
     * @param {boolean} ignoreSelf - 是否忽略自己，默认为true
     */
    broadcastToZone: function (message, ignoreSelf) {
        if (this.broadcastzone_callback) {
            this.broadcastzone_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
        }
    },

    /**
     * 设置退出回调函数
     * @param {Function} callback - 退出时执行的回调函数
     */
    onExit: function (callback) {
        this.exit_callback = callback;
    },

    /**
     * 设置移动回调函数
     * @param {Function} callback - 移动时执行的回调函数
     */
    onMove: function (callback) {
        this.move_callback = callback;
    },

    /**
     * 设置拾取移动回调函数
     * @param {Function} callback - 拾取移动时执行的回调函数
     */
    onLootMove: function (callback) {
        this.lootmove_callback = callback;
    },

    /**
     * 设置区域回调函数
     * @param {Function} callback - 区域变化时执行的回调函数
     */
    onZone: function (callback) {
        this.zone_callback = callback;
    },

    /**
     * 设置方向回调函数
     * @param {Function} callback - 方向变化时执行的回调函数
     */
    onOrient: function (callback) {
        this.orient_callback = callback;
    },

    /**
     * 设置消息回调函数
     * @param {Function} callback - 接收消息时执行的回调函数
     */
    onMessage: function (callback) {
        this.message_callback = callback;
    },

    /**
     * 设置广播回调函数
     * @param {Function} callback - 广播消息时执行的回调函数
     */
    onBroadcast: function (callback) {
        this.broadcast_callback = callback;
    },

    /**
     * 设置区域广播回调函数
     * @param {Function} callback - 区域广播消息时执行的回调函数
     */
    onBroadcastToZone: function (callback) {
        this.broadcastzone_callback = callback;
    },

    /**
     * 创建装备物品消息
     * @param {Object} item - 要装备的物品
     * @returns {Object} 装备物品消息对象
     */
    equip: function (item) {
        return new Messages.EquipItem(this, item);
    },

    /**
     * 添加仇恨目标
     * @param {Object} mob - 怪物对象
     */
    addHater: function (mob) {
        if (mob) {
            if (!(mob.id in this.haters)) {
                this.haters[mob.id] = mob;
            }
        }
    },

    /**
     * 移除仇恨目标
     * @param {Object} mob - 怪物对象
     */
    removeHater: function (mob) {
        if (mob && mob.id in this.haters) {
            delete this.haters[mob.id];
        }
    },

    /**
     * 遍历所有仇恨目标
     * @param {Function} callback - 对每个仇恨目标执行的回调函数
     */
    forEachHater: function (callback) {
        _.each(this.haters, function (mob) {
            callback(mob);
        });
    },

    /**
     * 装备护甲
     * @param {number} kind - 护甲类型
     */
    equipArmor: function (kind) {
        this.armor = kind;
        this.armorLevel = Properties.getArmorLevel(kind);
    },

    /**
     * 装备武器
     * @param {number} kind - 武器类型
     */
    equipWeapon: function (kind) {
        this.weapon = kind;
        this.weaponLevel = Properties.getWeaponLevel(kind);
    },

    /**
     * 装备物品
     * @param {Object} item - 要装备的物品对象
     */
    equipItem: function (item) {
        if (item) {
            log.debug(this.name + " equips " + Types.getKindAsString(item.kind));

            if (Types.isArmor(item.kind)) {
                this.equipArmor(item.kind);
                this.updateHitPoints();
                this.send(new Messages.HitPoints(this.maxHitPoints).serialize());
            } else if (Types.isWeapon(item.kind)) {
                this.equipWeapon(item.kind);
            }
        }
    },

    /**
     * 更新生命值
     */
    updateHitPoints: function () {
        this.resetHitPoints(Formulas.hp(this.armorLevel));
    },

    /**
     * 更新位置信息
     */
    updatePosition: function () {
        if (this.requestpos_callback) {
            var pos = this.requestpos_callback();
            this.setPosition(pos.x, pos.y);
        }
    },

    /**
     * 设置请求位置回调函数
     * @param {Function} callback - 请求位置时执行的回调函数
     */
    onRequestPosition: function (callback) {
        this.requestpos_callback = callback;
    },

    /**
     * 重置断线超时定时器
     */
    resetTimeout: function () {
        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = setTimeout(this.timeout.bind(this), 1000 * 60 * 15); // 15 min.
    },

    /**
     * 断线超时处理
     */
    timeout: function () {
        this.connection.sendUTF8("timeout");
        this.connection.close("Player was idle for too long");
    }
});