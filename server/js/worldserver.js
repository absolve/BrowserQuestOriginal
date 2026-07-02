var cls = require("./lib/class"),
    _ = require("underscore"),
    log = require('loglevel'),
    Entity = require('./entity'),
    Character = require('./character'),
    Mob = require('./mob'),
    Map = require('./map'),
    Npc = require('./npc'),
    Player = require('./player'),
    Item = require('./item'),
    MobArea = require('./mobarea'),
    ChestArea = require('./chestarea'),
    Chest = require('./chest'),
    Messages = require('./message'),
    Properties = require("./properties"),
    Utils = require("./utils"),
    Types = require("../../shared/js/gametypes");

// ======= GAME SERVER ========
// log.setLevel("debug")
module.exports = World = cls.Class.extend({
    init: function (id, maxPlayers, websocketServer) {  //初始化函数
        var self = this;
        log.setLevel("debug")
        this.id = id;
        this.maxPlayers = maxPlayers;  //最大人数
        this.server = websocketServer;
        this.ups = 50;  //更新频率

        this.map = null;  //地图

        this.entities = {};
        this.players = {};    //key id value 玩家实体
        this.mobs = {};  //key id value 敌人
        this.attackers = {};
        this.items = {};  //key id value 物品
        this.equipping = {};
        this.hurt = {};
        this.npcs = {};  //key id value npc
        this.mobAreas = []; //key id value 怪物区域
        this.chestAreas = [];
        this.groups = {};

        this.outgoingQueues = {}; //消息队列 key id value 数组

        this.itemCount = 0;
        this.playerCount = 0;  //玩家人数

        this.zoneGroupsReady = false;  //

        this.onPlayerConnect(function (player) {
            player.onRequestPosition(function () {
                if (player.lastCheckpoint) {
                    return player.lastCheckpoint.getRandomPosition();
                } else {
                    return self.map.getRandomStartingPosition();
                }
            });
        });

        this.onPlayerEnter(function (player) {
            log.info(player.name + " has joined " + self.id);

            if (!player.hasEnteredGame) {
                self.incrementPlayerCount();
            }

            // Number of players in this world
            // and in the overall server world
            //self.pushToPlayer(player, new Messages.Population(self.playerCount, self.server.connectionsCount()));
            self.updatePopulation();

            self.pushRelevantEntityListTo(player);

            var move_callback = function (x, y) {
                log.debug(player.name + " is moving to (" + x + ", " + y + ").");

                player.forEachAttacker(function (mob) {
                    var target = self.getEntityById(mob.target);
                    if (target) {
                        var pos = self.findPositionNextTo(mob, target);
                        if (mob.distanceToSpawningPoint(pos.x, pos.y) > 50) {
                            mob.clearTarget();
                            mob.forgetEveryone();
                            player.removeAttacker(mob);
                        } else {
                            self.moveEntity(mob, pos.x, pos.y);
                        }
                    }
                });
            };

            player.onMove(move_callback);
            player.onLootMove(move_callback);

            player.onZone(function () {
                var hasChangedGroups = self.handleEntityGroupMembership(player);

                if (hasChangedGroups) {
                    self.pushToPreviousGroups(player, new Messages.Destroy(player));
                    self.pushRelevantEntityListTo(player);
                }
            });

            player.onBroadcast(function (message, ignoreSelf) {
                self.pushToAdjacentGroups(player.group, message, ignoreSelf ? player.id : null);
            });

            player.onBroadcastToZone(function (message, ignoreSelf) {
                self.pushToGroup(player.group, message, ignoreSelf ? player.id : null);
            });

            player.onExit(function () {
                log.info(player.name + " has left the game.");
                self.removePlayer(player);
                self.decrementPlayerCount();

                if (self.removed_callback) {
                    self.removed_callback();
                }
            });

            if (self.added_callback) {
                self.added_callback();
            }
        });

        // Called when an entity is attacked by another entity
        this.onEntityAttack(function (attacker) {
            var target = self.getEntityById(attacker.target);
            if (target && attacker.type === "mob") {
                var pos = self.findPositionNextTo(attacker, target);
                self.moveEntity(attacker, pos.x, pos.y);
            }
        });

        this.onRegenTick(function () {
            self.forEachCharacter(function (character) {
                if (!character.hasFullHealth()) {
                    character.regenHealthBy(Math.floor(character.maxHitPoints / 25));

                    if (character.type === 'player') {
                        self.pushToPlayer(character, character.regen());
                    }
                }
            });
        });
    },

    /**
     * 启动世界运行函数
     * @param {string} mapFilePath - 地图文件路径
     */
    run: function (mapFilePath) { //启动函数
        let self = this;
        // console.log("======"+mapFilePath);
        this.map = new Map(mapFilePath);

        this.map.ready(function () {
            self.initZoneGroups();

            self.map.generateCollisionGrid();

            // Populate all mob "roaming" areas
            _.each(self.map.mobAreas, function (a) {
                var area = new MobArea(a.id, a.nb, a.type, a.x, a.y, a.width, a.height, self);
                area.spawnMobs();
                area.onEmpty(self.handleEmptyMobArea.bind(self, area));

                self.mobAreas.push(area);
            });

            // Create all chest areas
            _.each(self.map.chestAreas, function (a) {
                var area = new ChestArea(a.id, a.x, a.y, a.w, a.h, a.tx, a.ty, a.i, self);
                self.chestAreas.push(area);
                area.onEmpty(self.handleEmptyChestArea.bind(self, area));
            });

            // Spawn static chests
            _.each(self.map.staticChests, function (chest) {
                var c = self.createChest(chest.x, chest.y, chest.i);
                self.addStaticItem(c);
            });

            // Spawn static entities
            self.spawnStaticEntities();

            // Set maximum number of entities contained in each chest area
            _.each(self.chestAreas, function (area) {
                area.setNumberOfEntities(area.entities.length);
            });
        });

        // 设置游戏循环定时器，控制游戏更新频率
        var regenCount = this.ups * 2;
        var updateCount = 0;
        setInterval(function () { //设置定时器
            // console.log('process')
            self.processGroups();
            self.processQueues();

            if (updateCount < regenCount) {
                updateCount += 1;
            } else {
                if (self.regen_callback) {  //玩家生命回复功能
                    self.regen_callback();
                }
                updateCount = 0;
            }
        }, 1000 / this.ups);

        log.info("World:" + this.id + " created (capacity: " + this.maxPlayers + " players).");
    },

    setUpdatesPerSecond: function (ups) {
        this.ups = ups;
    },

    onInit: function (callback) {
        this.init_callback = callback;
    },

    onPlayerConnect: function (callback) {
        this.connect_callback = callback;
    },

    onPlayerEnter: function (callback) {
        this.enter_callback = callback;
    },

    onPlayerAdded: function (callback) {
        this.added_callback = callback;
    },

    onPlayerRemoved: function (callback) {
        this.removed_callback = callback;
    },

    onRegenTick: function (callback) { //玩家生命回复
        this.regen_callback = callback;
    },

    pushRelevantEntityListTo: function (player) {
        var entities;

        if (player && (player.group in this.groups)) {
            entities = _.keys(this.groups[player.group].entities);
            entities = _.reject(entities, function (id) {
                return id == player.id;
            });
            entities = _.map(entities, function (id) {
                return parseInt(id);
            });
            if (entities) {
                this.pushToPlayer(player, new Messages.List(entities));
            }
        }
    },

    pushSpawnsToPlayer: function (player, ids) {
        var self = this;

        _.each(ids, function (id) {
            var entity = self.getEntityById(id);
            if (entity) {
                self.pushToPlayer(player, new Messages.Spawn(entity));
            }
        });

        log.debug("Pushed " + _.size(ids) + " new spawns to " + player.id);
    },

    pushToPlayer: function (player, message) {
        if (player && player.id in this.outgoingQueues) {
            this.outgoingQueues[player.id].push(message.serialize());
        } else {
            log.error("pushToPlayer: player was undefined");
        }
    },

    /**
     * 向指定群组中的所有玩家推送消息（除了被忽略的玩家）
     * @param {string} groupId - 目标群组的ID
     * @param {object} message - 要推送的消息对象
     * @param {string} ignoredPlayer - 需要忽略的玩家ID（可选）
     * @returns {void}
     */
    pushToGroup: function (groupId, message, ignoredPlayer) {
        var self = this,
            group = this.groups[groupId];

        // 遍历群组中的所有玩家并推送消息（跳过被忽略的玩家）
        if (group) {
            _.each(group.players, function (playerId) {
                if (playerId != ignoredPlayer) {
                    self.pushToPlayer(self.getEntityById(playerId), message);
                }
            });
        } else {
            log.error("groupId: " + groupId + " is not a valid group");
        }
    },

    /**
     * 向相邻的群组推送消息
     * 遍历指定群组的所有相邻群组，并向每个相邻群组推送相同的消息（除了被忽略的玩家）
     * @param {string|number} groupId - 当前群组ID，用于查找相邻群组
     * @param {any} message - 要推送的消息内容
     * @param {object} ignoredPlayer - 需要在推送时忽略的玩家对象
     * @returns {void}
     */
    pushToAdjacentGroups: function (groupId, message, ignoredPlayer) {
        var self = this;
        // 遍历所有相邻群组并推送消息
        self.map.forEachAdjacentGroup(groupId, function (id) {
            self.pushToGroup(id, message, ignoredPlayer);
        });
    },

    /**
     * 将消息推送到玩家最近离开的所有群组中
     * 这个方法用于处理玩家离开群组后，将消息发送到那些不再更新的群组
     * @param {Object} player - 玩家对象，包含recentlyLeftGroups属性
     * @param {Object} message - 要推送的消息对象
     */
    pushToPreviousGroups: function (player, message) {
        var self = this;

        // Push this message to all groups which are not going to be updated anymore,
        // since the player left them.
        _.each(player.recentlyLeftGroups, function (id) {
            self.pushToGroup(id, message);
        });
        player.recentlyLeftGroups = [];
    },

    /**
     * 向所有玩家广播消息，除了被忽略的玩家
     * @param {Object} message - 要广播的消息对象
     * @param {string|number} ignoredPlayer - 需要忽略的玩家ID，该玩家不会收到此消息
     * @returns {void}
     */
    pushBroadcast: function (message, ignoredPlayer) {
        // 遍历所有输出队列，向除被忽略玩家外的所有玩家发送序列化后的消息
        for (var id in this.outgoingQueues) {
            if (id != ignoredPlayer) {
                this.outgoingQueues[id].push(message.serialize());
            }
        }
    },

    /**
     * 处理 outgoingQueues 中的消息队列，将待发送的消息通过对应的连接发送出去
     * 遍历所有连接ID，检查每个连接的出站消息队列，如果有消息则获取对应连接并发送
     */
    processQueues: function () { //处理消息
        let self = this,
            connection;

        // 遍历所有连接的出站消息队列
        for (var id in this.outgoingQueues) {
            // 检查当前连接的消息队列是否为空
            if (this.outgoingQueues[id].length > 0) {
                log.debug(this.outgoingQueues[id])
                connection = this.server.getConnection(id); //获取id
                connection.send(this.outgoingQueues[id]);
                this.outgoingQueues[id] = [];
            }
        }
    },

    /**
     * 添加实体到系统中
     * @param {Object} entity - 要添加的实体对象，必须包含id属性
     * @returns {void}
     */
    addEntity: function (entity) { //添加实体
        this.entities[entity.id] = entity;
        this.handleEntityGroupMembership(entity);
    },

    /**
     * 移除游戏中的实体对象
     * @param {Object} entity - 要被移除的实体对象
     * @returns {void}
     */
    removeEntity: function (entity) {  //移除实体
        // 从entities集合中删除实体
        if (entity.id in this.entities) {
            delete this.entities[entity.id];
        }
        // 从mobs集合中删除实体
        if (entity.id in this.mobs) {
            delete this.mobs[entity.id];
        }
        // 从items集合中删除实体
        if (entity.id in this.items) {
            delete this.items[entity.id];
        }

        // 如果是怪物类型实体，清理相关的仇恨和攻击链接
        if (entity.type === "mob") {
            this.clearMobAggroLink(entity);
            this.clearMobHateLinks(entity);
        }

        entity.destroy();
        this.removeFromGroups(entity);
        log.debug("Removed " + Types.getKindAsString(entity.kind) + " : " + entity.id);
    },

    /**
     * 添加玩家到游戏中
     * @param {Object} player - 玩家对象，包含玩家的相关信息和ID
     * @returns {void}
     */
    addPlayer: function (player) {  //添加玩家
        // 将玩家添加到实体管理器中
        this.addEntity(player);
        // 在玩家集合中注册该玩家
        this.players[player.id] = player;
        // 为该玩家创建消息队列
        this.outgoingQueues[player.id] = [];  //消息队列

        //log.info("Added player : " + player.id);
    },

    /**
     * 从游戏中移除玩家
     * @param {Object} player - 要移除的玩家对象
     * @returns {void}
     */
    removePlayer: function (player) {
        // 广播玩家消失消息给其他玩家
        player.broadcast(player.despawn());
        // 从实体列表中移除该玩家
        this.removeEntity(player);
        // 从玩家映射表中删除该玩家
        delete this.players[player.id];
        // 删除该玩家的输出队列
        delete this.outgoingQueues[player.id];
    },

    addMob: function (mob) {
        this.addEntity(mob);
        this.mobs[mob.id] = mob;
    },

    addNpc: function (kind, x, y) {
        var npc = new Npc('8' + x + '' + y, kind, x, y);
        this.addEntity(npc);
        this.npcs[npc.id] = npc;

        return npc;
    },

    addItem: function (item) {
        this.addEntity(item);
        this.items[item.id] = item;

        return item;
    },

    createItem: function (kind, x, y) {
        var id = '9' + this.itemCount++,
            item = null;

        if (kind === Types.Entities.CHEST) {
            item = new Chest(id, x, y);
        } else {
            item = new Item(id, kind, x, y);
        }
        return item;
    },

    createChest: function (x, y, items) {
        var chest = this.createItem(Types.Entities.CHEST, x, y);
        chest.setItems(items);
        return chest;
    },

    addStaticItem: function (item) {
        item.isStatic = true;
        item.onRespawn(this.addStaticItem.bind(this, item));

        return this.addItem(item);
    },

    addItemFromChest: function (kind, x, y) {
        var item = this.createItem(kind, x, y);
        item.isFromChest = true;

        return this.addItem(item);
    },

    /**
     * The mob will no longer be registered as an attacker of its current target.
     */
    clearMobAggroLink: function (mob) {
        var player = null;
        if (mob.target) {
            player = this.getEntityById(mob.target);
            if (player) {
                player.removeAttacker(mob);
            }
        }
    },

    clearMobHateLinks: function (mob) {
        var self = this;
        if (mob) {
            _.each(mob.hatelist, function (obj) {
                var player = self.getEntityById(obj.id);
                if (player) {
                    player.removeHater(mob);
                }
            });
        }
    },

    forEachEntity: function (callback) {
        for (var id in this.entities) {
            callback(this.entities[id]);
        }
    },

    forEachPlayer: function (callback) {
        for (var id in this.players) {
            callback(this.players[id]);
        }
    },

    forEachMob: function (callback) {
        for (var id in this.mobs) {
            callback(this.mobs[id]);
        }
    },

    forEachCharacter: function (callback) {
        this.forEachPlayer(callback);
        this.forEachMob(callback);
    },

    handleMobHate: function (mobId, playerId, hatePoints) {
        var mob = this.getEntityById(mobId),
            player = this.getEntityById(playerId),
            mostHated;

        if (player && mob) {
            mob.increaseHateFor(playerId, hatePoints);
            player.addHater(mob);

            if (mob.hitPoints > 0) { // only choose a target if still alive
                this.chooseMobTarget(mob);
            }
        }
    },

    chooseMobTarget: function (mob, hateRank) {
        var player = this.getEntityById(mob.getHatedPlayerId(hateRank));

        // If the mob is not already attacking the player, create an attack link between them.
        if (player && !(mob.id in player.attackers)) {
            this.clearMobAggroLink(mob);

            player.addAttacker(mob);
            mob.setTarget(player);

            this.broadcastAttacker(mob);
            log.debug(mob.id + " is now attacking " + player.id);
        }
    },

    onEntityAttack: function (callback) {
        this.attack_callback = callback;
    },

    getEntityById: function (id) {
        if (id in this.entities) {
            return this.entities[id];
        } else {
            log.error("Unknown entity : " + id);
        }
    },

    getPlayerCount: function () {
        var count = 0;
        for (var p in this.players) {
            if (this.players.hasOwnProperty(p)) {
                count += 1;
            }
        }
        return count;
    },

    broadcastAttacker: function (character) {
        if (character) {
            this.pushToAdjacentGroups(character.group, character.attack(), character.id);
        }
        if (this.attack_callback) {
            this.attack_callback(character);
        }
    },

    handleHurtEntity: function (entity, attacker, damage) {
        var self = this;

        if (entity.type === 'player') {
            // A player is only aware of his own hitpoints
            this.pushToPlayer(entity, entity.health());
        }

        if (entity.type === 'mob') {
            // Let the mob's attacker (player) know how much damage was inflicted
            this.pushToPlayer(attacker, new Messages.Damage(entity, damage));
        }

        // If the entity is about to die
        if (entity.hitPoints <= 0) {
            if (entity.type === "mob") {
                var mob = entity,
                    item = this.getDroppedItem(mob);

                this.pushToPlayer(attacker, new Messages.Kill(mob));
                this.pushToAdjacentGroups(mob.group, mob.despawn()); // Despawn must be enqueued before the item drop
                if (item) {
                    this.pushToAdjacentGroups(mob.group, mob.drop(item));
                    this.handleItemDespawn(item);
                }
            }

            if (entity.type === "player") {
                this.handlePlayerVanish(entity);
                this.pushToAdjacentGroups(entity.group, entity.despawn());
            }

            this.removeEntity(entity);
        }
    },

    despawn: function (entity) {
        this.pushToAdjacentGroups(entity.group, entity.despawn());

        if (entity.id in this.entities) {
            this.removeEntity(entity);
        }
    },

    spawnStaticEntities: function () {
        var self = this,
            count = 0;

        _.each(this.map.staticEntities, function (kindName, tid) {
            var kind = Types.getKindFromString(kindName),
                pos = self.map.tileIndexToGridPosition(tid);

            if (Types.isNpc(kind)) {
                self.addNpc(kind, pos.x + 1, pos.y);
            }
            if (Types.isMob(kind)) {
                var mob = new Mob('7' + kind + count++, kind, pos.x + 1, pos.y);
                mob.onRespawn(function () {
                    mob.isDead = false;
                    self.addMob(mob);
                    if (mob.area && mob.area instanceof ChestArea) {
                        mob.area.addToArea(mob);
                    }
                });
                mob.onMove(self.onMobMoveCallback.bind(self));
                self.addMob(mob);
                self.tryAddingMobToChestArea(mob);
            }
            if (Types.isItem(kind)) {
                self.addStaticItem(self.createItem(kind, pos.x + 1, pos.y));
            }
        });
    },

    isValidPosition: function (x, y) {
        if (this.map && _.isNumber(x) && _.isNumber(y) && !this.map.isOutOfBounds(x, y) && !this.map.isColliding(x, y)) {
            return true;
        }
        return false;
    },

    handlePlayerVanish: function (player) {
        var self = this,
            previousAttackers = [];

        // When a player dies or teleports, all of his attackers go and attack their second most hated player.
        player.forEachAttacker(function (mob) {
            previousAttackers.push(mob);
            self.chooseMobTarget(mob, 2);
        });

        _.each(previousAttackers, function (mob) {
            player.removeAttacker(mob);
            mob.clearTarget();
            mob.forgetPlayer(player.id, 1000);
        });

        this.handleEntityGroupMembership(player);
    },

    setPlayerCount: function (count) {  //设置玩家数量
        this.playerCount = count;
    },

    incrementPlayerCount: function () {
        this.setPlayerCount(this.playerCount + 1);
    },

    decrementPlayerCount: function () {
        if (this.playerCount > 0) {
            this.setPlayerCount(this.playerCount - 1);
        }
    },

    getDroppedItem: function (mob) {  //获取掉落物品
        var kind = Types.getKindAsString(mob.kind),
            drops = Properties[kind].drops,
            v = Utils.random(100),
            p = 0,
            item = null;

        for (var itemName in drops) {
            var percentage = drops[itemName];

            p += percentage;
            if (v <= p) {
                item = this.addItem(this.createItem(Types.getKindFromString(itemName), mob.x, mob.y));
                break;
            }
        }

        return item;
    },

    onMobMoveCallback: function (mob) {  //怪物移动回调
        this.pushToAdjacentGroups(mob.group, new Messages.Move(mob));
        this.handleEntityGroupMembership(mob);
    },

    findPositionNextTo: function (entity, target) {
        var valid = false,
            pos;

        while (!valid) {
            pos = entity.getPositionNextTo(target);
            valid = this.isValidPosition(pos.x, pos.y);
        }
        return pos;
    },

    initZoneGroups: function () {  //初始化区域
        var self = this;

        this.map.forEachGroup(function (id) {
            self.groups[id] = {
                entities: {},
                players: [],
                incoming: []
            };
        });
        this.zoneGroupsReady = true;
    },

    /**
     * 从组中移除实体
     * @param {Object} entity - 要从组中移除的实体对象
     * @returns {Array} oldGroups - 包含被移除实体之前所属组ID的数组
     */
    removeFromGroups: function (entity) {
        var self = this,
            oldGroups = [];

        if (entity && entity.group) {

            var group = this.groups[entity.group];
            // 如果是玩家类型实体，从组的玩家列表中移除
            if (entity instanceof Player) {
                group.players = _.reject(group.players, function (id) {
                    return id === entity.id;
                });
            }

            // 遍历相邻组，从相邻组的实体映射中删除当前实体
            this.map.forEachAdjacentGroup(entity.group, function (id) {
                if (entity.id in self.groups[id].entities) {
                    delete self.groups[id].entities[entity.id];
                    oldGroups.push(id);
                }
            });
            entity.group = null;
        }
        return oldGroups;
    },

    /**
     * Registers an entity as "incoming" into several groups, meaning that it just entered them.
     * All players inside these groups will receive a Spawn message when WorldServer.processGroups is called.
     */
    addAsIncomingToGroup: function (entity, groupId) {
        var self = this,
            isChest = entity && entity instanceof Chest,
            isItem = entity && entity instanceof Item,
            isDroppedItem = entity && isItem && !entity.isStatic && !entity.isFromChest;

        if (entity && groupId) {
            this.map.forEachAdjacentGroup(groupId, function (id) {
                var group = self.groups[id];

                if (group) {
                    if (!_.include(group.entities, entity.id)
                        //  Items dropped off of mobs are handled differently via DROP messages. See handleHurtEntity.
                        && (!isItem || isChest || (isItem && !isDroppedItem))) {
                        group.incoming.push(entity);
                    }
                }
            });
        }
    },

    /**
     * 将实体添加到指定的组中
     * @param {Object} entity - 要添加的实体对象
     * @param {string|number} groupId - 目标组的ID
     * @returns {Array} 返回实体被添加到的新组ID数组
     */
    addToGroup: function (entity, groupId) {
        var self = this,
            newGroups = [];

        // 检查实体、组ID是否存在且该组在当前系统中存在
        if (entity && groupId && (groupId in this.groups)) {
            // 遍历相邻的组，将实体添加到每个相邻组中
            this.map.forEachAdjacentGroup(groupId, function (id) {
                self.groups[id].entities[entity.id] = entity;
                newGroups.push(id);
            });
            entity.group = groupId;

            // 如果实体是玩家类型，将其ID添加到对应组的玩家列表中
            if (entity instanceof Player) {
                this.groups[groupId].players.push(entity.id);
            }
        }
        return newGroups;
    },

    logGroupPlayers: function (groupId) {
        log.debug("Players inside group " + groupId + ":");
        _.each(this.groups[groupId].players, function (id) {
            log.debug("- player " + id);
        });
    },

    /**
     * 处理实体的群组成员身份变更
     * 检查实体是否需要从当前群组移除并加入新群组
     * @param {Object} entity - 需要处理群组成员身份的实体对象
     * @returns {boolean} - 如果实体的群组发生了变化则返回true，否则返回false
     */
    handleEntityGroupMembership: function (entity) {
        var hasChangedGroups = false;
        if (entity) {
            // 根据实体当前位置获取应属于的群组ID
            var groupId = this.map.getGroupIdFromPosition(entity.x, entity.y);
            if (!entity.group || (entity.group && entity.group !== groupId)) {
                hasChangedGroups = true;
                // 将实体作为新成员添加到目标群组
                this.addAsIncomingToGroup(entity, groupId);
                // 从旧群组中移除实体
                var oldGroups = this.removeFromGroups(entity);
                // 将实体添加到新群组
                var newGroups = this.addToGroup(entity, groupId);

                // 计算并记录实体最近离开的群组
                if (_.size(oldGroups) > 0) {
                    entity.recentlyLeftGroups = _.difference(oldGroups, newGroups);
                    log.debug("group diff: " + entity.recentlyLeftGroups);
                }
            }
        }
        return hasChangedGroups;
    },

    /**
     * 处理游戏中的组群更新逻辑
     * 检查是否有准备好的区域组，如果有则遍历每个组并处理其中的传入实体
     * 将传入的实体生成Spawn消息并推送到对应组中
     * @param {none} 无参数
     * @returns {void} 无返回值
     */
    processGroups: function () {
        let self = this;

        // 检查区域组是否已准备好进行处理
        if (this.zoneGroupsReady) {
            // 遍历地图中的所有组
            this.map.forEachGroup(function (id) {
                var spawns = [];
                // 检查当前组是否有传入的实体需要处理
                if (self.groups[id].incoming.length > 0) {
                    // log.debug("processGroups" + self.groups)
                    // 遍历传入实体数组，为每个实体创建Spawn消息
                    spawns = _.each(self.groups[id].incoming, function (entity) {
                        // 根据实体类型（玩家或其他）创建相应的Spawn消息并推送到组中
                        if (entity instanceof Player) {
                            self.pushToGroup(id, new Messages.Spawn(entity), entity.id);
                        } else {
                            self.pushToGroup(id, new Messages.Spawn(entity));
                        }
                    });
                    // 清空已处理的传入实体列表
                    self.groups[id].incoming = [];
                }
            });
        }
    },

    /**
     * 移动实体到指定位置
     * @param {Object} entity - 要移动的实体对象
     * @param {number} x - 目标x坐标
     * @param {number} y - 目标y坐标
     * @returns {void}
     */
    moveEntity: function (entity, x, y) {
        // 实体移动
        if (entity) {
            entity.setPosition(x, y);
            this.handleEntityGroupMembership(entity);
        }
    },

    /**
     * 处理物品消失逻辑
     * @param {Object} item - 需要处理消失的物品对象
     * @returns {void}
     */
    handleItemDespawn: function (item) {
        var self = this;

        if (item) {
            // 调用物品的消失处理方法，配置消失前的闪烁效果和回调函数
            item.handleDespawn({
                beforeBlinkDelay: 10000,
                blinkCallback: function () {
                    self.pushToAdjacentGroups(item.group, new Messages.Blink(item));
                },
                blinkingDuration: 4000,
                despawnCallback: function () {
                    self.pushToAdjacentGroups(item.group, new Messages.Destroy(item));
                    self.removeEntity(item);
                }
            });
        }
    },

    handleEmptyMobArea: function (area) {

    },

    /**
     * 处理空宝箱区域的逻辑
     * 当指定区域存在时，在该区域创建一个宝箱并添加到游戏中，然后处理宝箱的消失逻辑
     * @param {Object} area - 区域对象，包含宝箱的位置坐标和物品信息
     * @param {number} area.chestX - 宝箱的X坐标
     * @param {number} area.chestY - 宝箱的Y坐标
     * @param {Array} area.items - 宝箱中包含的物品数组
     * @returns {void}
     */
    handleEmptyChestArea: function (area) {
        if (area) {
            var chest = this.addItem(this.createChest(area.chestX, area.chestY, area.items));
            this.handleItemDespawn(chest);
        }
    },

    /**
     * 处理开启的宝箱
     * @param {Object} chest - 宝箱对象
     * @param {Object} player - 玩家对象
     * @returns {void}
     */
    handleOpenedChest: function (chest, player) {
        // 将宝箱组推送到相邻组并让宝箱消失
        this.pushToAdjacentGroups(chest.group, chest.despawn());
        this.removeEntity(chest);

        // 获取随机物品
        var kind = chest.getRandomItem();
        if (kind) {
            // 从宝箱中添加物品到指定位置
            var item = this.addItemFromChest(kind, chest.x, chest.y);
            this.handleItemDespawn(item);
        }
    },

    /**
     * 尝试将怪物添加到宝箱区域中
     * 遍历所有宝箱区域，检查怪物是否在某个区域内，如果是则将其添加到该区域
     * @param {Object} mob - 要添加的怪物对象
     * @returns {void}
     */
    tryAddingMobToChestArea: function (mob) {
        // 遍历所有宝箱区域，查找包含当前怪物的区域并添加
        _.each(this.chestAreas, function (area) {
            if (area.contains(mob)) {
                area.addToArea(mob);
            }
        });
    },

    /**
     * 更新人口数量信息
     * @param {number} [totalPlayers] - 总玩家数量，如果未提供则使用服务器连接数
     * @returns {void}
     */
    updatePopulation: function (totalPlayers) { //更新人数
        totalPlayers = totalPlayers ? totalPlayers : this.server.connectionsCount();

        // 记录人口更新日志并广播给所有客户端
        log.info("Updating population: " + this.playerCount + " " + totalPlayers)
        this.pushBroadcast(new Messages.Population(this.playerCount, totalPlayers));
    },
});
