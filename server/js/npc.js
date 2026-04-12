/**
 * NPC模块 - 服务器端
 * 定义服务器端非玩家角色实体类
 */

/**
 * Npc类 - 服务器端NPC实体
 * 继承自Entity基类，表示游戏中的NPC
 * @extends Entity
 */
module.exports = Npc = Entity.extend({
    /**
     * 初始化NPC实例
     * @param {number} id - NPC的唯一标识符
     * @param {number} kind - NPC的种类ID
     * @param {number} x - NPC的X坐标
     * @param {number} y - NPC的Y坐标
     */
    init: function (id, kind, x, y) {
        this._super(id, "npc", kind, x, y);
    }
});