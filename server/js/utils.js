/**
 * 工具类模块，提供各种通用工具函数
 */
var Utils = {},
    sanitizer = require('sanitizer'),
    Types = require("../../shared/js/gametypes");

module.exports = Utils;

/**
 * 清理并转义字符串，移除不安全标签后转换为HTML实体
 * @param {string} string - 需要处理的字符串
 * @returns {string} 处理后的安全字符串
 */
Utils.sanitize = function (string) {
    // Strip unsafe tags, then escape as html entities.
    return sanitizer.escape(sanitizer.sanitize(string));
};

/**
 * 生成0到指定范围内的随机整数
 * @param {number} range - 随机数的最大范围（不包含）
 * @returns {number} 0到range-1之间的随机整数
 */
Utils.random = function (range) {
    return Math.floor(Math.random() * range);
};

/**
 * 生成指定范围内的随机浮点数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} min到max之间的随机浮点数
 */
Utils.randomRange = function (min, max) {
    return min + (Math.random() * (max - min));
};

/**
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} min到max之间的随机整数
 */
Utils.randomInt = function (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
};

/**
 * 将数值限制在指定范围内
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} value - 待限制的值
 * @returns {number} 限制在min和max之间的值
 */
Utils.clamp = function (min, max, value) {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
};

/**
 * 随机选择一个方向
 * @returns {number} 随机的方向常量（左、右、上、下之一）
 */
Utils.randomOrientation = function () {
    var o, r = Utils.random(4);

    if (r === 0)
        o = Types.Orientations.LEFT;
    if (r === 1)
        o = Types.Orientations.RIGHT;
    if (r === 2)
        o = Types.Orientations.UP;
    if (r === 3)
        o = Types.Orientations.DOWN;

    return o;
};

/**
 * 将源对象的属性混入目标对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 混入后的目标对象
 */
Utils.Mixin = function (target, source) {
    if (source) {
        for (var key, keys = Object.keys(source), l = keys.length; l--;) {
            key = keys[l];

            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }
    return target;
};

/**
 * 计算两点之间的距离（使用切比雪夫距离）
 * @param {number} x - 第一个点的x坐标
 * @param {number} y - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 两点之间的距离
 */
Utils.distanceTo = function (x, y, x2, y2) {
    var distX = Math.abs(x - x2);
    var distY = Math.abs(y - y2);

    return (distX > distY) ? distX : distY;
};
