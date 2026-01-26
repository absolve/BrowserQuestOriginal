/**
 * 定义Mob模块，继承自Character类
 * @param {Array} dependencies - 依赖的模块数组
 * @param {Function} factory - 模块工厂函数
 * @returns {Function} Mob构造函数
 */
define(['character'], function(Character) {
    
    /**
     * Mob类 - 游戏中的怪物实体类，继承自Character
     * @class
     * @extends Character
     */
    var Mob = Character.extend({
        /**
         * Mob类的初始化方法
         * @param {string|number} id - 怪物的唯一标识符
         * @param {string} kind - 怪物的类型或种类
         */
        init: function(id, kind) {
            // 调用父类Character的初始化方法
            this._super(id, kind);
        
            // 设置怪物的仇恨范围
            this.aggroRange = 1;
            
            // 标记怪物是否具有攻击性
            this.isAggressive = true;
        }
    });
    
    return Mob;
});
