
/**
 * 宝箱模块
 * 定义客户端宝箱实体类
 */
define(['entity'], function(Entity) {

    /**
     * Chest类 - 客户端宝箱实体
     * 继承自Entity基类，表示游戏中的可打开宝箱
     * @extends Entity
     */
    var Chest = Entity.extend({
        /**
         * 初始化宝箱实例
         * @param {number} id - 宝箱的唯一标识符
         * @param {number} kind - 宝箱的种类（通常为Types.Entities.CHEST）
         */
        init: function(id, kind) {
    	    this._super(id, Types.Entities.CHEST);
        },
    
        /**
         * 获取宝箱精灵图名称
         * @returns {string} 精灵图名称"chest"
         */
        getSpriteName: function() {
            return "chest";
        },
    
        /**
         * 检查宝箱是否正在移动
         * 宝箱是静态实体，始终返回false
         * @returns {boolean} 始终返回false
         */
        isMoving: function() {
            return false;
        },
    
        /**
         * 打开宝箱
         * 触发打开回调函数
         */
        open: function() {
            if(this.open_callback) {
                this.open_callback();
            }
        },
    
        /**
         * 设置宝箱打开时的回调函数
         * @param {Function} callback - 打开时执行的回调函数
         */
        onOpen: function(callback) {
            this.open_callback = callback;
        }
    });
    
    return Chest;
});