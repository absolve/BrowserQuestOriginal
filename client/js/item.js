/**
 * 定义Item模块，继承自Entity类
 * @param {Array} dependencies - 依赖项数组
 * @param {Function} factory - 工厂函数
 */
define(['entity'], function(Entity) {

    /**
     * Item类 - 游戏物品实体类，继承自Entity
     */
    var Item = Entity.extend({
        /**
         * 初始化Item实例
         * @param {number} id - 物品ID
         * @param {number} kind - 物品类型编号
         * @param {string} type - 物品分类（如weapon、armor等）
         */
        init: function(id, kind, type) {
    	    this._super(id, kind);

            this.itemKind = Types.getKindAsString(kind);
    	    this.type = type;
    	    this.wasDropped = false;
        },

        /**
         * 判断物品是否有阴影效果
         * @returns {boolean} 总是返回true，表示物品有阴影
         */
        hasShadow: function() {
            return true;
        },

        /**
         * 处理玩家拾取物品的逻辑
         * @param {Player} player - 拾取物品的玩家对象
         */
        onLoot: function(player) {
            // 根据物品类型执行不同的拾取处理逻辑
            if(this.type === "weapon") {
                player.switchWeapon(this.itemKind);
            }
            else if(this.type === "armor") {
                player.armorloot_callback(this.itemKind);
            }
        },

        /**
         * 获取物品对应的精灵名称
         * @returns {string} 物品精灵名称，格式为"item-物品类型"
         */
        getSpriteName: function() {
            return "item-"+ this.itemKind;
        },

        /**
         * 获取物品拾取消息
         * @returns {string} 拾取消息文本
         */
        getLootMessage: function() {
            return this.lootMessage;
        }
    });
    
    return Item;
});
