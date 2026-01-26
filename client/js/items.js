/**
 * 定义游戏物品系统模块
 * @param {Array} dependencies - 依赖项数组，包含'item'模块
 * @param {Function} factory - 模块工厂函数
 * @returns {Object} 返回包含所有游戏物品定义的对象
 */
define(['item'], function(Item) {

    /**
     * 游戏物品集合对象
     * 包含各种武器、防具和消耗品的定义
     */
    var Items = {

        /**
         * 钢剑物品定义
         * @constructor
         */
        Sword2: Item.extend({
            /**
             * 初始化钢剑实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.SWORD2, "weapon");
                this.lootMessage = "You pick up a steel sword";
            },
        }),

        /**
         * 斧头物品定义
         * @constructor
         */
        Axe: Item.extend({
            /**
             * 初始化斧头实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.AXE, "weapon");
                this.lootMessage = "You pick up an axe";
            },
        }),

        /**
         * 红色剑物品定义
         * @constructor
         */
        RedSword: Item.extend({
            /**
             * 初始化红色剑实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.REDSWORD, "weapon");
                this.lootMessage = "You pick up a blazing sword";
            },
        }),

        /**
         * 蓝色剑物品定义
         * @constructor
         */
        BlueSword: Item.extend({
            /**
             * 初始化蓝色剑实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.BLUESWORD, "weapon");
                this.lootMessage = "You pick up a magic sword";
            },
        }),

        /**
         * 金剑物品定义
         * @constructor
         */
        GoldenSword: Item.extend({
            /**
             * 初始化金剑实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.GOLDENSWORD, "weapon");
                this.lootMessage = "You pick up the ultimate sword";
            },
        }),

        /**
         * 晨星锤物品定义
         * @constructor
         */
        MorningStar: Item.extend({
            /**
             * 初始化晨星锤实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.MORNINGSTAR, "weapon");
                this.lootMessage = "You pick up a morning star";
            },
        }),

        /**
         * 皮甲物品定义
         * @constructor
         */
        LeatherArmor: Item.extend({
            /**
             * 初始化皮甲实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.LEATHERARMOR, "armor");
                this.lootMessage = "You equip a leather armor";
            },
        }),

        /**
         * 锁子甲物品定义
         * @constructor
         */
        MailArmor: Item.extend({
            /**
             * 初始化锁子甲实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.MAILARMOR, "armor");
                this.lootMessage = "You equip a mail armor";
            },
        }),

        /**
         * 板甲物品定义
         * @constructor
         */
        PlateArmor: Item.extend({
            /**
             * 初始化板甲实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.PLATEARMOR, "armor");
                this.lootMessage = "You equip a plate armor";
            },
        }),

        /**
         * 红甲物品定义
         * @constructor
         */
        RedArmor: Item.extend({
            /**
             * 初始化红甲实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.REDARMOR, "armor");
                this.lootMessage = "You equip a ruby armor";
            },
        }),

        /**
         * 金甲物品定义
         * @constructor
         */
        GoldenArmor: Item.extend({
            /**
             * 初始化金甲实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.GOLDENARMOR, "armor");
                this.lootMessage = "You equip a golden armor";
            },
        }),

        /**
         * 药水物品定义
         * @constructor
         */
        Flask: Item.extend({
            /**
             * 初始化药水实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.FLASK, "object");
                this.lootMessage = "You drink a health potion";
            },
        }),

        /**
         * 蛋糕物品定义
         * @constructor
         */
        Cake: Item.extend({
            /**
             * 初始化蛋糕实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.CAKE, "object");
                this.lootMessage = "You eat a cake";
            },
        }),

        /**
         * 汉堡物品定义
         * @constructor
         */
        Burger: Item.extend({
            /**
             * 初始化汉堡实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.BURGER, "object");
                this.lootMessage = "You can haz rat burger";
            },
        }),

        /**
         * 火焰药水物品定义
         * @constructor
         */
        FirePotion: Item.extend({
            /**
             * 初始化火焰药水实例
             * @param {number} id - 物品唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.FIREPOTION, "object");
                this.lootMessage = "You feel the power of Firefox!";
            },

            /**
             * 当玩家拾取时触发的回调函数
             * @param {Player} player - 拾取物品的玩家对象
             */
            onLoot: function(player) {
                player.startInvincibility();
            },
        }),
    };

    return Items;
});
