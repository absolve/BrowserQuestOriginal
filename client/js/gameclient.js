define(['player', 'entityfactory', 'lib/bison'], function(Player, EntityFactory, BISON) {

    /**
     * 游戏客户端类，负责处理与游戏服务器的通信
     * @constructor
     */
    var GameClient = Class.extend({
        /**
         * 初始化游戏客户端
         * @param {string} host - 服务器主机地址
         * @param {number} port - 服务器端口号
         */
        init: function(host, port) {
            this.connection = null;
            this.host = host;
            this.port = port;
    
            this.connected_callback = null;
            this.spawn_callback = null;
            this.movement_callback = null;
        
            this.handlers = [];
            this.handlers[Types.Messages.WELCOME] = this.receiveWelcome;
            this.handlers[Types.Messages.MOVE] = this.receiveMove;
            this.handlers[Types.Messages.LOOTMOVE] = this.receiveLootMove;
            this.handlers[Types.Messages.ATTACK] = this.receiveAttack;
            this.handlers[Types.Messages.SPAWN] = this.receiveSpawn;
            this.handlers[Types.Messages.DESPAWN] = this.receiveDespawn;
            this.handlers[Types.Messages.SPAWN_BATCH] = this.receiveSpawnBatch;
            this.handlers[Types.Messages.HEALTH] = this.receiveHealth;
            this.handlers[Types.Messages.CHAT] = this.receiveChat;
            this.handlers[Types.Messages.EQUIP] = this.receiveEquipItem;
            this.handlers[Types.Messages.DROP] = this.receiveDrop;
            this.handlers[Types.Messages.TELEPORT] = this.receiveTeleport;
            this.handlers[Types.Messages.DAMAGE] = this.receiveDamage;
            this.handlers[Types.Messages.POPULATION] = this.receivePopulation;
            this.handlers[Types.Messages.LIST] = this.receiveList;
            this.handlers[Types.Messages.DESTROY] = this.receiveDestroy;
            this.handlers[Types.Messages.KILL] = this.receiveKill;
            this.handlers[Types.Messages.HP] = this.receiveHitPoints;
            this.handlers[Types.Messages.BLINK] = this.receiveBlink;
        
            this.useBison = false;
            this.enable();
        },
    
        /**
         * 启用消息监听功能
         */
        enable: function() {
            this.isListening = true;
        },
    
        /**
         * 禁用消息监听功能
         */
        disable: function() {
            this.isListening = false;
        },
        
        /**
         * 连接到游戏服务器
         * @param {boolean} dispatcherMode - 是否使用调度器模式连接
         */
        connect: function(dispatcherMode) {
             var url = "http://" + this.host + ":" + this.port + "/",
                self = this;

             console.log("connect")
            this.connection = io(url, {'force new connection':true});
            this.connection.on('connection', function(socket){
                log.info("Connected to server " + url);
            });

            /******
                Dispatcher is a system where you could have another server you connect to first
                which then provides an IP and port for the client to connect to the game server
             ******/
            if(dispatcherMode) {

                this.connection.emit("dispatch", true)

                this.connection.on("dispatched", function(reply) {
                    console.log("Dispatched: ")
                    console.log(reply)
                    if(reply.status === 'OK') {
                        self.dispatched_callback(reply.host, reply.port);
                    } else if(reply.status === 'FULL') {
                        console.log("BrowserQuest is currently at maximum player population. Please retry later.");
                    } else {
                        console.log("Unknown error while connecting to BrowserQuest.");
                    }
                });
                
            } else {

                this.connection.on("message", function(data) {

                    if(data === "go") {
                        if(self.connected_callback) {
                            self.connected_callback();
                        }
                        return;
                    }
                    if(data === 'timeout') {
                        self.isTimeout = true;
                        return;
                    }
                    console.log("message"+data)
                    self.receiveMessage(data);
                });

                /*this.connection.onerror = function(e) {
                    log.error(e, true);
                };*/

                this.connection.on("disconnect", function() {
                    log.debug("Connection closed");
                    $('#container').addClass('error');
                    
                    if(self.disconnected_callback) {
                        if(self.isTimeout) {
                            self.disconnected_callback("You have been disconnected for being inactive for too long");
                        } else {
                            self.disconnected_callback("The connection to BrowserQuest has been lost");
                        }
                    }
                });
            }
        },

        /**
         * 发送消息到服务器
         * @param {Object} json - 要发送的JSON数据
         */
        sendMessage: function(json) {
            if(this.connection.connected) {
                this.connection.emit("message", json);
            }
        },

        /**
         * 接收并处理来自服务器的消息
         * @param {Object} message - 收到的消息数据
         */
        receiveMessage: function(message) {
        
            if(this.isListening) {
       
                log.debug("data: " + message);

                if(message instanceof Array) {
                    if(message[0] instanceof Array) {
                        // Multiple actions received
                        this.receiveActionBatch(message);
                    } else {
                        // Only one action received
                        this.receiveAction(message);
                    }
                }
            }
        },
    
        /**
         * 处理单个动作消息
         * @param {Array} data - 动作数据数组
         */
        receiveAction: function(data) {
            var action = data[0];
            if(this.handlers[action] && _.isFunction(this.handlers[action])) {
                this.handlers[action].call(this, data);
            }
            else {
                log.error("Unknown action : " + action);
            }
        },
    
        /**
         * 批量处理多个动作消息
         * @param {Array} actions - 包含多个动作的数组
         */
        receiveActionBatch: function(actions) {
            var self = this;

            _.each(actions, function(action) {
                self.receiveAction(action);
            });
        },
    
        /**
         * 处理欢迎消息（玩家登录）
         * @param {Array} data - 欢迎消息数据 [messageType, id, name, x, y, hp]
         */
        receiveWelcome: function(data) {
            var id = data[1],
                name = data[2],
                x = data[3],
                y = data[4],
                hp = data[5];
        
            if(this.welcome_callback) {
                this.welcome_callback(id, name, x, y, hp);
            }
        },
    
        /**
         * 处理移动消息
         * @param {Array} data - 移动消息数据 [messageType, id, x, y]
         */
        receiveMove: function(data) {
            var id = data[1],
                x = data[2],
                y = data[3];
        
            if(this.move_callback) {
                this.move_callback(id, x, y);
            }
        },
    
        /**
         * 处理拾取物品移动消息
         * @param {Array} data - 拾取移动消息数据 [messageType, id, item]
         */
        receiveLootMove: function(data) {
            var id = data[1], 
                item = data[2];
        
            if(this.lootmove_callback) {
                this.lootmove_callback(id, item);
            }
        },
    
        /**
         * 处理攻击消息
         * @param {Array} data - 攻击消息数据 [messageType, attacker, target]
         */
        receiveAttack: function(data) {
            var attacker = data[1], 
                target = data[2];
        
            if(this.attack_callback) {
                this.attack_callback(attacker, target);
            }
        },
    
        /**
         * 处理实体生成消息
         * @param {Array} data - 生成消息数据 [messageType, id, kind, x, y, ...]
         */
        receiveSpawn: function(data) {
            var id = data[1],
                kind = data[2],
                x = data[3],
                y = data[4];
        
            if(Types.isItem(kind)) {
                var item = EntityFactory.createEntity(kind, id);
            
                if(this.spawn_item_callback) {
                    this.spawn_item_callback(item, x, y);
                }
            } else if(Types.isChest(kind)) {
                var item = EntityFactory.createEntity(kind, id);
            
                if(this.spawn_chest_callback) {
                    this.spawn_chest_callback(item, x, y);
                }
            } else {
                var name, orientation, target, weapon, armor;
            
                if(Types.isPlayer(kind)) {
                    name = data[5];
                    orientation = data[6];
                    armor = data[7];
                    weapon = data[8];
                    if(data.length > 9) {
                        target = data[9];
                    }
                }
                else if(Types.isMob(kind)) {
                    orientation = data[5];
                    if(data.length > 6) {
                        target = data[6];
                    }
                }

                var character = EntityFactory.createEntity(kind, id, name);
            
                if(character instanceof Player) {
                    character.weaponName = Types.getKindAsString(weapon);
                    character.spriteName = Types.getKindAsString(armor);
                }
            
                if(this.spawn_character_callback) {
                    this.spawn_character_callback(character, x, y, orientation, target);
                }
            }
        },
    
        /**
         * 处理实体消失消息
         * @param {Array} data - 消失消息数据 [messageType, id]
         */
        receiveDespawn: function(data) {
            var id = data[1];
        
            if(this.despawn_callback) {
                this.despawn_callback(id);
            }
        },
    
        /**
         * 处理生命值变化消息
         * @param {Array} data - 生命值消息数据 [messageType, points, isRegen]
         */
        receiveHealth: function(data) {
            var points = data[1],
                isRegen = false;
        
            if(data[2]) {
                isRegen = true;
            }
        
            if(this.health_callback) {
                this.health_callback(points, isRegen);
            }
        },
    
        /**
         * 处理聊天消息
         * @param {Array} data - 聊天消息数据 [messageType, id, text]
         */
        receiveChat: function(data) {
            var id = data[1],
                text = data[2];
        
            if(this.chat_callback) {
                this.chat_callback(id, text);
            }
        },
    
        /**
         * 处理装备物品消息
         * @param {Array} data - 装备消息数据 [messageType, id, itemKind]
         */
        receiveEquipItem: function(data) {
            var id = data[1],
                itemKind = data[2];
        
            if(this.equip_callback) {
                this.equip_callback(id, itemKind);
            }
        },
    
        /**
         * 处理掉落物品消息
         * @param {Array} data - 掉落消息数据 [messageType, mobId, id, kind, playersInvolved]
         */
        receiveDrop: function(data) {
            var mobId = data[1],
                id = data[2],
                kind = data[3];
        
            var item = EntityFactory.createEntity(kind, id);
            item.wasDropped = true;
            item.playersInvolved = data[4];
        
            if(this.drop_callback) {
                this.drop_callback(item, mobId);
            }
        },
    
        /**
         * 处理传送消息
         * @param {Array} data - 传送消息数据 [messageType, id, x, y]
         */
        receiveTeleport: function(data) {
            var id = data[1],
                x = data[2],
                y = data[3];
        
            if(this.teleport_callback) {
                this.teleport_callback(id, x, y);
            }
        },
    
        /**
         * 处理伤害消息
         * @param {Array} data - 伤害消息数据 [messageType, id, dmg]
         */
        receiveDamage: function(data) {
            var id = data[1],
                dmg = data[2];
        
            if(this.dmg_callback) {
                this.dmg_callback(id, dmg);
            }
        },
    
        /**
         * 处理人口统计消息
         * @param {Array} data - 人口消息数据 [messageType, worldPlayers, totalPlayers]
         */
        receivePopulation: function(data) {
            var worldPlayers = data[1],
                totalPlayers = data[2];
        
            if(this.population_callback) {
                this.population_callback(worldPlayers, totalPlayers);
            }
        },
    
        /**
         * 处理击杀消息
         * @param {Array} data - 击杀消息数据 [messageType, mobKind]
         */
        receiveKill: function(data) {
            var mobKind = data[1];
        
            if(this.kill_callback) {
                this.kill_callback(mobKind);
            }
        },
    
        /**
         * 处理实体列表消息
         * @param {Array} data - 列表消息数据 [messageType, ...ids]
         */
        receiveList: function(data) {
            data.shift();
        
            if(this.list_callback) {
                this.list_callback(data);
            }
        },
    
        /**
         * 处理实体销毁消息
         * @param {Array} data - 销毁消息数据 [messageType, id]
         */
        receiveDestroy: function(data) {
            var id = data[1];
        
            if(this.destroy_callback) {
                this.destroy_callback(id);
            }
        },
    
        /**
         * 处理最大生命值消息
         * @param {Array} data - 最大生命值消息数据 [messageType, maxHp]
         */
        receiveHitPoints: function(data) {
            var maxHp = data[1];
        
            if(this.hp_callback) {
                this.hp_callback(maxHp);
            }
        },
    
        /**
         * 处理物品闪烁消息
         * @param {Array} data - 闪烁消息数据 [messageType, id]
         */
        receiveBlink: function(data) {
            var id = data[1];
        
            if(this.blink_callback) {
                this.blink_callback(id);
            }
        },
        
        /**
         * 设置调度器回调函数
         * @param {Function} callback - 调度器回调函数
         */
        onDispatched: function(callback) {
            this.dispatched_callback = callback;
        },

        /**
         * 设置连接成功回调函数
         * @param {Function} callback - 连接成功回调函数
         */
        onConnected: function(callback) {
            this.connected_callback = callback;
        },
        
        /**
         * 设置断开连接回调函数
         * @param {Function} callback - 断开连接回调函数
         */
        onDisconnected: function(callback) {
            this.disconnected_callback = callback;
        },

        /**
         * 设置欢迎消息回调函数
         * @param {Function} callback - 欢迎消息回调函数
         */
        onWelcome: function(callback) {
            this.welcome_callback = callback;
        },

        /**
         * 设置角色生成回调函数
         * @param {Function} callback - 角色生成回调函数
         */
        onSpawnCharacter: function(callback) {
            this.spawn_character_callback = callback;
        },
    
        /**
         * 设置物品生成回调函数
         * @param {Function} callback - 物品生成回调函数
         */
        onSpawnItem: function(callback) {
            this.spawn_item_callback = callback;
        },
    
        /**
         * 设置宝箱生成回调函数
         * @param {Function} callback - 宝箱生成回调函数
         */
        onSpawnChest: function(callback) {
            this.spawn_chest_callback = callback;
        },

        /**
         * 设置实体消失回调函数
         * @param {Function} callback - 实体消失回调函数
         */
        onDespawnEntity: function(callback) {
            this.despawn_callback = callback;
        },

        /**
         * 设置实体移动回调函数
         * @param {Function} callback - 实体移动回调函数
         */
        onEntityMove: function(callback) {
            this.move_callback = callback;
        },

        /**
         * 设置实体攻击回调函数
         * @param {Function} callback - 实体攻击回调函数
         */
        onEntityAttack: function(callback) {
            this.attack_callback = callback;
        },
    
        /**
         * 设置玩家生命值变化回调函数
         * @param {Function} callback - 玩家生命值变化回调函数
         */
        onPlayerChangeHealth: function(callback) {
            this.health_callback = callback;
        },
    
        /**
         * 设置玩家装备物品回调函数
         * @param {Function} callback - 玩家装备物品回调函数
         */
        onPlayerEquipItem: function(callback) {
            this.equip_callback = callback;
        },
    
        /**
         * 设置玩家移动到物品回调函数
         * @param {Function} callback - 玩家移动到物品回调函数
         */
        onPlayerMoveToItem: function(callback) {
            this.lootmove_callback = callback;
        },
    
        /**
         * 设置玩家传送回调函数
         * @param {Function} callback - 玩家传送回调函数
         */
        onPlayerTeleport: function(callback) {
            this.teleport_callback = callback;
        },
    
        /**
         * 设置聊天消息回调函数
         * @param {Function} callback - 聊天消息回调函数
         */
        onChatMessage: function(callback) {
            this.chat_callback = callback;
        },
    
        /**
         * 设置掉落物品回调函数
         * @param {Function} callback - 掉落物品回调函数
         */
        onDropItem: function(callback) {
            this.drop_callback = callback;
        },
    
        /**
         * 设置玩家伤害怪物回调函数
         * @param {Function} callback - 玩家伤害怪物回调函数
         */
        onPlayerDamageMob: function(callback) {
            this.dmg_callback = callback;
        },
    
        /**
         * 设置玩家击杀怪物回调函数
         * @param {Function} callback - 玩家击杀怪物回调函数
         */
        onPlayerKillMob: function(callback) {
            this.kill_callback = callback;
        },
    
        /**
         * 设置人口变化回调函数
         * @param {Function} callback - 人口变化回调函数
         */
        onPopulationChange: function(callback) {
            this.population_callback = callback;
        },
    
        /**
         * 设置实体列表回调函数
         * @param {Function} callback - 实体列表回调函数
         */
        onEntityList: function(callback) {
            this.list_callback = callback;
        },
    
        /**
         * 设置实体销毁回调函数
         * @param {Function} callback - 实体销毁回调函数
         */
        onEntityDestroy: function(callback) {
            this.destroy_callback = callback;
        },
    
        /**
         * 设置玩家最大生命值变化回调函数
         * @param {Function} callback - 玩家最大生命值变化回调函数
         */
        onPlayerChangeMaxHitPoints: function(callback) {
            this.hp_callback = callback;
        },
    
        /**
         * 设置物品闪烁回调函数
         * @param {Function} callback - 物品闪烁回调函数
         */
        onItemBlink: function(callback) {
            this.blink_callback = callback;
        },

        /**
         * 发送玩家登录信息
         * @param {Object} player - 玩家对象
         */
        sendHello: function(player) {
            this.sendMessage([Types.Messages.HELLO,
                              player.name,
                              Types.getKindFromString(player.getSpriteName()),
                              Types.getKindFromString(player.getWeaponName())]);
        },

        /**
         * 发送移动消息
         * @param {number} x - 目标X坐标
         * @param {number} y - 目标Y坐标
         */
        sendMove: function(x, y) {
            this.sendMessage([Types.Messages.MOVE,
                              x,
                              y]);
        },
    
        /**
         * 发送拾取移动消息
         * @param {Object} item - 物品对象
         * @param {number} x - X坐标
         * @param {number} y - Y坐标
         */
        sendLootMove: function(item, x, y) {
            this.sendMessage([Types.Messages.LOOTMOVE,
                              x,
                              y,
                              item.id]);
        },
    
        /**
         * 发送仇恨目标消息
         * @param {Object} mob - 怪物对象
         */
        sendAggro: function(mob) {
            this.sendMessage([Types.Messages.AGGRO,
                              mob.id]);
        },
    
        /**
         * 发送攻击消息
         * @param {Object} mob - 被攻击的怪物对象
         */
        sendAttack: function(mob) {
            this.sendMessage([Types.Messages.ATTACK,
                              mob.id]);
        },
    
        /**
         * 发送命中消息
         * @param {Object} mob - 被命中的怪物对象
         */
        sendHit: function(mob) {
            this.sendMessage([Types.Messages.HIT,
                              mob.id]);
        },
    
        /**
         * 发送受伤消息
         * @param {Object} mob - 受伤的怪物对象
         */
        sendHurt: function(mob) {
            this.sendMessage([Types.Messages.HURT,
                              mob.id]);
        },
    
        /**
         * 发送聊天消息
         * @param {string} text - 聊天文本
         */
        sendChat: function(text) {
            this.sendMessage([Types.Messages.CHAT,
                              text]);
        },
    
        /**
         * 发送拾取物品消息
         * @param {Object} item - 要拾取的物品对象
         */
        sendLoot: function(item) {
            this.sendMessage([Types.Messages.LOOT,
                              item.id]);
        },
    
        /**
         * 发送传送消息
         * @param {number} x - 传送目标X坐标
         * @param {number} y - 传送目标Y坐标
         */
        sendTeleport: function(x, y) {
            this.sendMessage([Types.Messages.TELEPORT,
                              x,
                              y]);
        },
    
        /**
         * 发送查询在线玩家消息
         * @param {Array} ids - 玩家ID数组
         */
        sendWho: function(ids) {
            ids.unshift(Types.Messages.WHO);
            this.sendMessage(ids);
        },
    
        /**
         * 发送区域消息
         */
        sendZone: function() {
            this.sendMessage([Types.Messages.ZONE]);
        },
    
        /**
         * 发送打开宝箱消息
         * @param {Object} chest - 宝箱对象
         */
        sendOpen: function(chest) {
            this.sendMessage([Types.Messages.OPEN,
                              chest.id]);
        },
    
        /**
         * 发送检查实体消息
         * @param {number} id - 实体ID
         */
        sendCheck: function(id) {
            this.sendMessage([Types.Messages.CHECK,
                              id]);
        }
    });
    
    return GameClient;
});
