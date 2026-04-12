/**
 * 游戏公式模块
 * 定义游戏中使用的各种计算公式，如伤害、生命值等
 */

var Utils = require("./utils");

/**
 * Formulas对象 - 游戏公式集合
 */
var Formulas = {};

/**
 * 计算伤害值
 * 根据武器等级和护甲等级计算实际伤害
 * @param {number} weaponLevel - 武器等级
 * @param {number} armorLevel - 护甲等级
 * @returns {number} 计算后的伤害值（最小为0-3之间的随机值）
 */
Formulas.dmg = function (weaponLevel, armorLevel) {
    var dealt = weaponLevel * Utils.randomInt(5, 10),
        absorbed = armorLevel * Utils.randomInt(1, 3),
        dmg = dealt - absorbed;

    //console.log("abs: "+absorbed+"   dealt: "+ dealt+"   dmg: "+ (dealt - absorbed));
    if (dmg <= 0) {
        return Utils.randomInt(0, 3);
    } else {
        return dmg;
    }
};

/**
 * 计算最大生命值
 * 根据护甲等级计算玩家的最大生命值
 * @param {number} armorLevel - 护甲等级
 * @returns {number} 最大生命值
 */
Formulas.hp = function (armorLevel) {
    var hp = 80 + ((armorLevel - 1) * 30);
    return hp;
};

if (!(typeof exports === 'undefined')) {
    module.exports = Formulas;
}