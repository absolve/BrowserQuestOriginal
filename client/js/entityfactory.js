/**
 * 定义实体工厂模块，用于创建游戏中的各种实体对象
 * @param {Object} Mobs - 怪物模块
 * @param {Object} Items - 物品模块
 * @param {Object} NPCs - 非玩家角色模块
 * @param {Object} Warrior - 战士类
 * @param {Object} Chest - 宝箱类
 */
define(['mobs', 'items', 'npcs', 'warrior', 'chest'], function(Mobs, Items, NPCs, Warrior, Chest) {

    var EntityFactory = {};

    /**
     * 创建实体对象
     * @param {string} kind - 实体类型标识符
     * @param {number} id - 实体ID
     * @param {string} name - 实体名称
     * @returns {Object|undefined} 创建的实体对象或undefined（当kind无效时）
     */
    EntityFactory.createEntity = function(kind, id, name) {
        if(!kind) {
            log.error("kind is undefined", true);
            return;
        }

        if(!_.isFunction(EntityFactory.builders[kind])) {
            throw Error(kind + " is not a valid Entity type");
        }

        return EntityFactory.builders[kind](id, name);
    };

    //===== mobs ======

    EntityFactory.builders = [];

    /**
     * 战士实体构建器
     * @param {number} id - 实体ID
     * @param {string} name - 实体名称
     * @returns {Warrior} 战士实例
     */
    EntityFactory.builders[Types.Entities.WARRIOR] = function(id, name) {
        return new Warrior(id, name);
    };

    /**
     * 老鼠怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Rat} 老鼠实例
     */
    EntityFactory.builders[Types.Entities.RAT] = function(id) {
        return new Mobs.Rat(id);
    };

    /**
     * 骷髅怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Skeleton} 骷髅实例
     */
    EntityFactory.builders[Types.Entities.SKELETON] = function(id) {
        return new Mobs.Skeleton(id);
    };

    /**
     * 骷髅2怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Skeleton2} 骷髅2实例
     */
    EntityFactory.builders[Types.Entities.SKELETON2] = function(id) {
        return new Mobs.Skeleton2(id);
    };

    /**
     * 幽灵怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Spectre} 幽灵实例
     */
    EntityFactory.builders[Types.Entities.SPECTRE] = function(id) {
        return new Mobs.Spectre(id);
    };

    /**
     * 死亡骑士怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Deathknight} 死亡骑士实例
     */
    EntityFactory.builders[Types.Entities.DEATHKNIGHT] = function(id) {
        return new Mobs.Deathknight(id);
    };

    /**
     * 哥布林怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Goblin} 哥布林实例
     */
    EntityFactory.builders[Types.Entities.GOBLIN] = function(id) {
        return new Mobs.Goblin(id);
    };

    /**
     * 食人魔怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Ogre} 食人魔实例
     */
    EntityFactory.builders[Types.Entities.OGRE] = function(id) {
        return new Mobs.Ogre(id);
    };

    /**
     * 螃蟹怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Crab} 螃蟹实例
     */
    EntityFactory.builders[Types.Entities.CRAB] = function(id) {
        return new Mobs.Crab(id);
    };

    /**
     * 蛇怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Snake} 蛇实例
     */
    EntityFactory.builders[Types.Entities.SNAKE] = function(id) {
        return new Mobs.Snake(id);
    };

    /**
     * 眼球怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Eye} 眼球实例
     */
    EntityFactory.builders[Types.Entities.EYE] = function(id) {
        return new Mobs.Eye(id);
    };

    /**
     * 蝙蝠怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Bat} 蝙蝠实例
     */
    EntityFactory.builders[Types.Entities.BAT] = function(id) {
        return new Mobs.Bat(id);
    };

    /**
     * 巫师怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Wizard} 巫师实例
     */
    EntityFactory.builders[Types.Entities.WIZARD] = function(id) {
        return new Mobs.Wizard(id);
    };

    /**
     * Boss怪物实体构建器
     * @param {number} id - 实体ID
     * @returns {Mobs.Boss} Boss实例
     */
    EntityFactory.builders[Types.Entities.BOSS] = function(id) {
        return new Mobs.Boss(id);
    };

    //===== items ======
    // 物品实体构建器集合：包括武器、防具、药水等各类物品

    /**
     * 二级剑物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.Sword2} 二级剑实例
     */
    EntityFactory.builders[Types.Entities.SWORD2] = function(id) {
        return new Items.Sword2(id);
    };

    /**
     * 斧头物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.Axe} 斧头实例
     */
    EntityFactory.builders[Types.Entities.AXE] = function(id) {
        return new Items.Axe(id);
    };

    /**
     * 红剑物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.RedSword} 红剑实例
     */
    EntityFactory.builders[Types.Entities.REDSWORD] = function(id) {
        return new Items.RedSword(id);
    };

    /**
     * 蓝剑物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.BlueSword} 蓝剑实例
     */
    EntityFactory.builders[Types.Entities.BLUESWORD] = function(id) {
        return new Items.BlueSword(id);
    };

    /**
     * 金剑物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.GoldenSword} 金剑实例
     */
    EntityFactory.builders[Types.Entities.GOLDENSWORD] = function(id) {
        return new Items.GoldenSword(id);
    };

    /**
     * 晨星锤物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.MorningStar} 晨星锤实例
     */
    EntityFactory.builders[Types.Entities.MORNINGSTAR] = function(id) {
        return new Items.MorningStar(id);
    };

    /**
     * 锁子甲物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.MailArmor} 锁子甲实例
     */
    EntityFactory.builders[Types.Entities.MAILARMOR] = function(id) {
        return new Items.MailArmor(id);
    };

    /**
     * 皮甲物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.LeatherArmor} 皮甲实例
     */
    EntityFactory.builders[Types.Entities.LEATHERARMOR] = function(id) {
        return new Items.LeatherArmor(id);
    };

    /**
     * 板甲物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.PlateArmor} 板甲实例
     */
    EntityFactory.builders[Types.Entities.PLATEARMOR] = function(id) {
        return new Items.PlateArmor(id);
    };

    /**
     * 红甲物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.RedArmor} 红甲实例
     */
    EntityFactory.builders[Types.Entities.REDARMOR] = function(id) {
        return new Items.RedArmor(id);
    };

    /**
     * 金甲物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.GoldenArmor} 金甲实例
     */
    EntityFactory.builders[Types.Entities.GOLDENARMOR] = function(id) {
        return new Items.GoldenArmor(id);
    };

    /**
     * 药瓶物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.Flask} 药瓶实例
     */
    EntityFactory.builders[Types.Entities.FLASK] = function(id) {
        return new Items.Flask(id);
    };

    /**
     * 火焰药水物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.FirePotion} 火焰药水实例
     */
    EntityFactory.builders[Types.Entities.FIREPOTION] = function(id) {
        return new Items.FirePotion(id);
    };

    /**
     * 汉堡食物物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.Burger} 汉堡实例
     */
    EntityFactory.builders[Types.Entities.BURGER] = function(id) {
        return new Items.Burger(id);
    };

    /**
     * 蛋糕食物物品实体构建器
     * @param {number} id - 实体ID
     * @returns {Items.Cake} 蛋糕实例
     */
    EntityFactory.builders[Types.Entities.CAKE] = function(id) {
        return new Items.Cake(id);
    };

    /**
     * 宝箱实体构建器
     * @param {number} id - 实体ID
     * @returns {Chest} 宝箱实例
     */
    EntityFactory.builders[Types.Entities.CHEST] = function(id) {
        return new Chest(id);
    };

    //====== NPCs ======
    // 非玩家角色实体构建器集合：包括守卫、国王、村民等各种NPC

    /**
     * 守卫NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Guard} 守卫实例
     */
    EntityFactory.builders[Types.Entities.GUARD] = function(id) {
        return new NPCs.Guard(id);
    };

    /**
     * 国王NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.King} 国王实例
     */
    EntityFactory.builders[Types.Entities.KING] = function(id) {
        return new NPCs.King(id);
    };

    /**
     * 村庄女孩NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.VillageGirl} 村庄女孩实例
     */
    EntityFactory.builders[Types.Entities.VILLAGEGIRL] = function(id) {
        return new NPCs.VillageGirl(id);
    };

    /**
     * 村民NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Villager} 村民实例
     */
    EntityFactory.builders[Types.Entities.VILLAGER] = function(id) {
        return new NPCs.Villager(id);
    };

    /**
     * 程序员NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Coder} 程序员实例
     */
    EntityFactory.builders[Types.Entities.CODER] = function(id) {
        return new NPCs.Coder(id);
    };

    /**
     * 代理NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Agent} 代理实例
     */
    EntityFactory.builders[Types.Entities.AGENT] = function(id) {
        return new NPCs.Agent(id);
    };

    /**
     * Rick NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Rick} Rick实例
     */
    EntityFactory.builders[Types.Entities.RICK] = function(id) {
        return new NPCs.Rick(id);
    };

    /**
     * 科学家NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Scientist} 科学家实例
     */
    EntityFactory.builders[Types.Entities.SCIENTIST] = function(id) {
        return new NPCs.Scientist(id);
    };

    /**
     * Nyan NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Nyan} Nyan实例
     */
    EntityFactory.builders[Types.Entities.NYAN] = function(id) {
        return new NPCs.Nyan(id);
    };

    /**
     * 牧师NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Priest} 牧师实例
     */
    EntityFactory.builders[Types.Entities.PRIEST] = function(id) {
        return new NPCs.Priest(id);
    };

    /**
     * 巫师NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Sorcerer} 巫师实例
     */
    EntityFactory.builders[Types.Entities.SORCERER] = function(id) {
        return new NPCs.Sorcerer(id);
    };

    /**
     * Octocat NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.Octocat} Octocat实例
     */
    EntityFactory.builders[Types.Entities.OCTOCAT] = function(id) {
        return new NPCs.Octocat(id);
    };

    /**
     * 海滩NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.BeachNpc} 海滩NPC实例
     */
    EntityFactory.builders[Types.Entities.BEACHNPC] = function(id) {
        return new NPCs.BeachNpc(id);
    };

    /**
     * 森林NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.ForestNpc} 森林NPC实例
     */
    EntityFactory.builders[Types.Entities.FORESTNPC] = function(id) {
        return new NPCs.ForestNpc(id);
    };

    /**
     * 沙漠NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.DesertNpc} 沙漠NPC实例
     */
    EntityFactory.builders[Types.Entities.DESERTNPC] = function(id) {
        return new NPCs.DesertNpc(id);
    };

    /**
     * 熔岩NPC实体构建器
     * @param {number} id - 实体ID
     * @returns {NPCs.LavaNpc} 熔岩NPC实例
     */
    EntityFactory.builders[Types.Entities.LAVANPC] = function(id) {
        return new NPCs.LavaNpc(id);
    };
    
    return EntityFactory;
});
