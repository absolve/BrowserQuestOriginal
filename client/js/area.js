/**
 * 定义一个模块，返回Area类构造函数
 */
define(function() {

    /**
     * Area类 - 表示一个矩形区域
     * @constructor
     * @param {number} x - 区域左上角的x坐标（网格坐标）
     * @param {number} y - 区域左上角的y坐标（网格坐标）
     * @param {number} width - 区域的宽度
     * @param {number} height - 区域的高度
     */
    var Area = Class.extend({
        init: function(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        },
    
        /**
         * 判断实体是否在当前区域内
         * @param {Object|null} entity - 要检查的实体对象，必须包含gridX和gridY属性
         * @returns {boolean} 如果实体在区域内返回true，否则返回false
         */
        contains: function(entity) {
            // 检查实体是否在矩形区域内，使用左闭右开区间判断
            if(entity) {
                return entity.gridX >= this.x
                    && entity.gridY >= this.y
                    && entity.gridX < this.x + this.width
                    && entity.gridY < this.y + this.height;
            } else {
                return false;
            }
        }
    });
    
    return Area;
});
