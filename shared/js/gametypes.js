
/**
 * 游戏类型定义模块
 * 定义游戏中使用的所有消息类型、实体类型和方向常量
 */
Types = {
    /**
     * 消息类型常量
     * 用于客户端和服务器之间的通信协议
     */
    Messages: {
        HELLO: 0,          // 客户端握手消息
        WELCOME: 1,        // 服务器欢迎消息
        SPAWN: 2,          // 实体生成消息
        DESPAWN: 3,        // 实体消失消息
        MOVE: 4,           // 移动消息
        LOOTMOVE: 5,       // 拾取移动消息
        AGGRO: 6,          // 仇恨消息
        ATTACK: 7,         // 攻击消息
        HIT: 8,            // 命中消息
        HURT: 9,           // 受伤消息
        HEALTH: 10,        // 生命值消息
        CHAT: 11,          // 聊天消息
        LOOT: 12,          // 拾取消息
        EQUIP: 13,         // 装备消息
        DROP: 14,          // 掉落消息
        TELEPORT: 15,      // 传送消息
        DAMAGE: 16,        // 伤害消息
        POPULATION: 17,    // 人口统计消息
        KILL: 18,          // 击杀消息
        LIST: 19,          // 实体列表消息
        WHO: 20,           // 查询在线玩家消息
        ZONE: 21,          // 区域切换消息
        DESTROY: 22,       // 销毁消息
        HP: 23,            // 最大生命值消息
        BLINK: 24,         // 闪烁消息
        OPEN: 25,          // 打开消息（宝箱）
        CHECK: 26          // 检查点消息
    },
    
    /**
     * 实体类型常量
     * 定义游戏中所有实体（玩家、怪物、NPC、物品等）的唯一标识符
     */
    Entities: {
        WARRIOR: 1,        // 战士（玩家角色）
        
        // Mobs - 怪物类型
        RAT: 2,            // 老鼠
        SKELETON: 3,       // 骷髅
        GOBLIN: 4,         // 哥布林
        OGRE: 5,           // 食人魔
        SPECTRE: 6,        // 幽灵
        CRAB: 7,           // 螃蟹
        BAT: 8,            // 蝙蝠
        WIZARD: 9,         // 巫师
        EYE: 10,           // 眼魔
        SNAKE: 11,         // 蛇
        SKELETON2: 12,     // 骷髅战士
        BOSS: 13,          // BOSS
        DEATHKNIGHT: 14,   // 死亡骑士
        
        // Armors - 护甲类型
        FIREFOX: 20,       // 火狐护甲（无敌状态）
        CLOTHARMOR: 21,    // 布甲
        LEATHERARMOR: 22,  // 皮甲
        MAILARMOR: 23,     // 锁甲
        PLATEARMOR: 24,    // 板甲
        REDARMOR: 25,      // 红甲
        GOLDENARMOR: 26,   // 金甲
        
        // Objects - 物品类型
        FLASK: 35,         // 药水瓶
        BURGER: 36,        // 汉堡
        CHEST: 37,         // 宝箱
        FIREPOTION: 38,    // 火焰药水
        CAKE: 39,          // 蛋糕
        
        // NPCs - 非玩家角色类型
        GUARD: 40,         // 卫兵
        KING: 41,          // 国王
        OCTOCAT: 42,       // Octocat
        VILLAGEGIRL: 43,   // 村庄女孩
        VILLAGER: 44,      // 村民
        PRIEST: 45,        // 牧师
        SCIENTIST: 46,     // 科学家
        AGENT: 47,         // 特工
        RICK: 48,          // Rick
        NYAN: 49,          // Nyan Cat
        SORCERER: 50,      // 巫师
        BEACHNPC: 51,      // 海滩NPC
        FORESTNPC: 52,     // 森林NPC
        DESERTNPC: 53,     // 沙漠NPC
        LAVANPC: 54,       // 熔岩NPC
        CODER: 55,         // 程序员
        
        // Weapons - 武器类型
        SWORD1: 60,        // 铁剑
        SWORD2: 61,        // 钢剑
        REDSWORD: 62,      // 红剑
        GOLDENSWORD: 63,   // 金剑
        MORNINGSTAR: 64,   // 晨星锤
        AXE: 65,           // 斧头
        BLUESWORD: 66      // 蓝剑
    },
    
    /**
     * 方向常量
     * 定义游戏中实体移动和面向的四个基本方向
     */
    Orientations: {
        UP: 1,             // 向上
        DOWN: 2,           // 向下
        LEFT: 3,           // 向左
        RIGHT: 4           // 向右
    }
};

/**
 * 实体种类映射表
 * 将实体名称映射到 [实体ID, 实体类型] 数组
 * 用于快速查找实体的类型信息
 */
var kinds = {
    warrior: [Types.Entities.WARRIOR, "player"],
    
    rat: [Types.Entities.RAT, "mob"],
    skeleton: [Types.Entities.SKELETON , "mob"],
    goblin: [Types.Entities.GOBLIN, "mob"],
    ogre: [Types.Entities.OGRE, "mob"],
    spectre: [Types.Entities.SPECTRE, "mob"],
    deathknight: [Types.Entities.DEATHKNIGHT, "mob"],
    crab: [Types.Entities.CRAB, "mob"],
    snake: [Types.Entities.SNAKE, "mob"],
    bat: [Types.Entities.BAT, "mob"],
    wizard: [Types.Entities.WIZARD, "mob"],
    eye: [Types.Entities.EYE, "mob"],
    skeleton2: [Types.Entities.SKELETON2, "mob"],
    boss: [Types.Entities.BOSS, "mob"],

    sword1: [Types.Entities.SWORD1, "weapon"],
    sword2: [Types.Entities.SWORD2, "weapon"],
    axe: [Types.Entities.AXE, "weapon"],
    redsword: [Types.Entities.REDSWORD, "weapon"],
    bluesword: [Types.Entities.BLUESWORD, "weapon"],
    goldensword: [Types.Entities.GOLDENSWORD, "weapon"],
    morningstar: [Types.Entities.MORNINGSTAR, "weapon"],
    
    firefox: [Types.Entities.FIREFOX, "armor"],
    clotharmor: [Types.Entities.CLOTHARMOR, "armor"],
    leatherarmor: [Types.Entities.LEATHERARMOR, "armor"],
    mailarmor: [Types.Entities.MAILARMOR, "armor"],
    platearmor: [Types.Entities.PLATEARMOR, "armor"],
    redarmor: [Types.Entities.REDARMOR, "armor"],
    goldenarmor: [Types.Entities.GOLDENARMOR, "armor"],

    flask: [Types.Entities.FLASK, "object"],
    cake: [Types.Entities.CAKE, "object"],
    burger: [Types.Entities.BURGER, "object"],
    chest: [Types.Entities.CHEST, "object"],
    firepotion: [Types.Entities.FIREPOTION, "object"],

    guard: [Types.Entities.GUARD, "npc"],
    villagegirl: [Types.Entities.VILLAGEGIRL, "npc"],
    villager: [Types.Entities.VILLAGER, "npc"],
    coder: [Types.Entities.CODER, "npc"],
    scientist: [Types.Entities.SCIENTIST, "npc"],
    priest: [Types.Entities.PRIEST, "npc"],
    king: [Types.Entities.KING, "npc"],
    rick: [Types.Entities.RICK, "npc"],
    nyan: [Types.Entities.NYAN, "npc"],
    sorcerer: [Types.Entities.SORCERER, "npc"],
    agent: [Types.Entities.AGENT, "npc"],
    octocat: [Types.Entities.OCTOCAT, "npc"],
    beachnpc: [Types.Entities.BEACHNPC, "npc"],
    forestnpc: [Types.Entities.FORESTNPC, "npc"],
    desertnpc: [Types.Entities.DESERTNPC, "npc"],
    lavanpc: [Types.Entities.LAVANPC, "npc"],
    
    /**
     * 根据实体种类ID获取实体类型
     * @param {number} kind - 实体种类ID
     * @returns {string} 实体类型（player/mob/npc/weapon/armor/object）
     */
    getType: function(kind) {
        return kinds[Types.getKindAsString(kind)][1];
    }
};

/**
 * 武器排名数组
 * 按武器强度从低到高排列，用于计算武器等级
 */
Types.rankedWeapons = [
    Types.Entities.SWORD1,
    Types.Entities.SWORD2,
    Types.Entities.AXE,
    Types.Entities.MORNINGSTAR,
    Types.Entities.BLUESWORD,
    Types.Entities.REDSWORD,
    Types.Entities.GOLDENSWORD
];

/**
 * 护甲排名数组
 * 按护甲强度从低到高排列，用于计算护甲等级
 */
Types.rankedArmors = [
    Types.Entities.CLOTHARMOR,
    Types.Entities.LEATHERARMOR,
    Types.Entities.MAILARMOR,
    Types.Entities.PLATEARMOR,
    Types.Entities.REDARMOR,
    Types.Entities.GOLDENARMOR
];

/**
 * 获取武器在排名数组中的索引位置
 * @param {number} weaponKind - 武器种类ID
 * @returns {number} 武器排名索引，-1表示不在排名中
 */
Types.getWeaponRank = function(weaponKind) {
    return _.indexOf(Types.rankedWeapons, weaponKind);
};

/**
 * 获取护甲在排名数组中的索引位置
 * @param {number} armorKind - 护甲种类ID
 * @returns {number} 护甲排名索引，-1表示不在排名中
 */
Types.getArmorRank = function(armorKind) {
    return _.indexOf(Types.rankedArmors, armorKind);
};

/**
 * 检查实体种类是否为玩家
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是玩家返回true
 */
Types.isPlayer = function(kind) {
    return kinds.getType(kind) === "player";
};

/**
 * 检查实体种类是否为怪物
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是怪物返回true
 */
Types.isMob = function(kind) {
    return kinds.getType(kind) === "mob";
};

/**
 * 检查实体种类是否为NPC
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是NPC返回true
 */
Types.isNpc = function(kind) {
    return kinds.getType(kind) === "npc";
};

/**
 * 检查实体种类是否为角色（玩家、怪物或NPC）
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是角色返回true
 */
Types.isCharacter = function(kind) {
    return Types.isMob(kind) || Types.isNpc(kind) || Types.isPlayer(kind);
};

/**
 * 检查实体种类是否为护甲
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是护甲返回true
 */
Types.isArmor = function(kind) {
    return kinds.getType(kind) === "armor";
};

/**
 * 检查实体种类是否为武器
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是武器返回true
 */
Types.isWeapon = function(kind) {
    return kinds.getType(kind) === "weapon";
};

/**
 * 检查实体种类是否为物品对象
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是物品对象返回true
 */
Types.isObject = function(kind) {
    return kinds.getType(kind) === "object";
};

/**
 * 检查实体种类是否为宝箱
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是宝箱返回true
 */
Types.isChest = function(kind) {
    return kind === Types.Entities.CHEST;
};

/**
 * 检查实体种类是否为可拾取物品（武器、护甲或非宝箱物品）
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是可拾取物品返回true
 */
Types.isItem = function(kind) {
    return Types.isWeapon(kind) 
        || Types.isArmor(kind) 
        || (Types.isObject(kind) && !Types.isChest(kind));
};

/**
 * 检查实体种类是否为治疗物品（药水瓶或汉堡）
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是治疗物品返回true
 */
Types.isHealingItem = function(kind) {
    return kind === Types.Entities.FLASK 
        || kind === Types.Entities.BURGER;
};

/**
 * 检查实体种类是否为消耗品（治疗物品、火焰药水或蛋糕）
 * @param {number} kind - 实体种类ID
 * @returns {boolean} 如果是消耗品返回true
 */
Types.isExpendableItem = function(kind) {
    return Types.isHealingItem(kind)
        || kind === Types.Entities.FIREPOTION
        || kind === Types.Entities.CAKE;
};

/**
 * 根据实体名称字符串获取实体种类ID
 * @param {string} kind - 实体名称字符串
 * @returns {number|undefined} 实体种类ID，未找到返回undefined
 */
Types.getKindFromString = function(kind) {
    if(kind in kinds) {
        return kinds[kind][0];
    }
};

/**
 * 根据实体种类ID获取实体名称字符串
 * @param {number} kind - 实体种类ID
 * @returns {string|undefined} 实体名称字符串，未找到返回undefined
 */
Types.getKindAsString = function(kind) {
    for(var k in kinds) {
        if(kinds[k][0] === kind) {
            return k;
        }
    }
};

/**
 * 遍历所有实体种类并执行回调函数
 * @param {Function} callback - 回调函数，参数为(kind, kindName)
 */
Types.forEachKind = function(callback) {
    for(var k in kinds) {
        callback(kinds[k][0], k);
    }
};

/**
 * 遍历所有护甲种类并执行回调函数
 * @param {Function} callback - 回调函数，参数为(kind, kindName)
 */
Types.forEachArmor = function(callback) {
    Types.forEachKind(function(kind, kindName) {
        if(Types.isArmor(kind)) {
            callback(kind, kindName);
        }
    });
};

/**
 * 遍历所有怪物和NPC种类并执行回调函数
 * @param {Function} callback - 回调函数，参数为(kind, kindName)
 */
Types.forEachMobOrNpcKind = function(callback) {
    Types.forEachKind(function(kind, kindName) {
        if(Types.isMob(kind) || Types.isNpc(kind)) {
            callback(kind, kindName);
        }
    });
};

/**
 * 遍历所有护甲种类并执行回调函数（同forEachArmor）
 * @param {Function} callback - 回调函数，参数为(kind, kindName)
 */
Types.forEachArmorKind = function(callback) {
    Types.forEachKind(function(kind, kindName) {
        if(Types.isArmor(kind)) {
            callback(kind, kindName);
        }
    });
};

/**
 * 将方向常量转换为字符串
 * @param {number} orientation - 方向常量
 * @returns {string} 方向字符串（left/right/up/down）
 */
Types.getOrientationAsString = function(orientation) {
    switch(orientation) {
        case Types.Orientations.LEFT: return "left"; break;
        case Types.Orientations.RIGHT: return "right"; break;
        case Types.Orientations.UP: return "up"; break;
        case Types.Orientations.DOWN: return "down"; break;
    }
};

/**
 * 获取随机物品种类ID
 * 从武器和护甲中随机选择一个（排除初始武器和护甲）
 * @param {Object} item - 未使用的参数
 * @returns {number} 随机物品种类ID
 */
Types.getRandomItemKind = function(item) {
    var all = _.union(this.rankedWeapons, this.rankedArmors),
        forbidden = [Types.Entities.SWORD1, Types.Entities.CLOTHARMOR],
        itemKinds = _.difference(all, forbidden),
        i = Math.floor(Math.random() * _.size(itemKinds));
    
    return itemKinds[i];
};

/**
 * 将消息类型常量转换为字符串名称
 * @param {number} type - 消息类型常量
 * @returns {string} 消息类型名称，未找到返回"UNKNOWN"
 */
Types.getMessageTypeAsString = function(type) {
    var typeName;
    _.each(Types.Messages, function(value, name) {
        if(value === type) {
            typeName = name;
        }
    });
    if(!typeName) {
        typeName = "UNKNOWN";
    }
    return typeName;
};

if(!(typeof exports === 'undefined')) {
    module.exports = Types;
}