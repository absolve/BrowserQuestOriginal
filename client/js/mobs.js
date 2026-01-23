/**
 * 定义游戏中的怪物类型集合模块
 * @param {Object} Mob - 基础怪物类
 * @param {Object} Timer - 计时器类
 * @returns {Object} 包含各种怪物类型的对象
 */
define(['mob', 'timer'], function(Mob, Timer) {

    /**
     * 游戏中所有怪物类型的定义集合
     * 每种怪物都继承自基础Mob类，并具有各自独特的属性配置
     */
    var Mobs = {
        /**
         * 老鼠怪物类型定义
         * 非攻击性怪物，移动速度较慢
         */
        Rat: Mob.extend({
            /**
             * 初始化老鼠怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.RAT);
                this.moveSpeed = 350;      // 移动速度
                this.idleSpeed = 700;      // 待机动画播放速度
                this.shadowOffsetY = -2;   // 阴影偏移量
                this.isAggressive = false; // 是否具有攻击性
            }
        }),

        /**
         * 骷髅怪物类型定义
         * 标准攻击型怪物，具有基本的攻击能力
         */
        Skeleton: Mob.extend({
            /**
             * 初始化骷髅怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.SKELETON);
                this.moveSpeed = 350;      // 移动速度
                this.atkSpeed = 100;       // 攻击动画播放速度
                this.idleSpeed = 800;      // 待机动画播放速度
                this.shadowOffsetY = 1;    // 阴影偏移量
                this.setAttackRate(1300);  // 设置攻击间隔时间
            }
        }),

        /**
         * 第二种骷髅怪物类型定义
         * 移动速度较慢的骷髅变种
         */
        Skeleton2: Mob.extend({
            /**
             * 初始化第二种骷髅怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.SKELETON2);
                this.moveSpeed = 200;      // 移动速度
                this.atkSpeed = 100;       // 攻击动画播放速度
                this.idleSpeed = 800;      // 待机动画播放速度
                this.walkSpeed = 200;      // 行走速度
                this.shadowOffsetY = 1;    // 阴影偏移量
                this.setAttackRate(1300);  // 设置攻击间隔时间
            }
        }),

        /**
         * 幽灵怪物类型定义
         * 移动缓慢但攻击快速的幽灵类怪物
         */
        Spectre: Mob.extend({
            /**
             * 初始化幽灵怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.SPECTRE);
                this.moveSpeed = 150;      // 移动速度
                this.atkSpeed = 50;        // 攻击动画播放速度
                this.idleSpeed = 200;      // 待机动画播放速度
                this.walkSpeed = 200;      // 行走速度
                this.shadowOffsetY = 1;    // 阴影偏移量
                this.setAttackRate(900);   // 设置攻击间隔时间
            }
        }),

        /**
         * 死亡骑士怪物类型定义
         * 具有特殊待机行为的高级怪物
         */
        Deathknight: Mob.extend({
            /**
             * 初始化死亡骑士怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.DEATHKNIGHT);
                this.atkSpeed = 50;        // 攻击动画播放速度
        		this.moveSpeed = 220;      // 移动速度
        		this.walkSpeed = 100;      // 行走速度
        		this.idleSpeed = 450;      // 待机动画播放速度
        		this.setAttackRate(800);   // 设置攻击间隔时间
        		this.aggroRange = 3;       // 仇恨范围
            },

            /**
             * 重写待机行为方法
             * 当没有目标时始终朝下，否则保持指定方向
             * @param {number} orientation - 期望的朝向
             */
            idle: function(orientation) {
                if(!this.hasTarget()) {
                    this._super(Types.Orientations.DOWN);
                } else {
                    this._super(orientation);
                }
            }
        }),

        /**
         * 哥布林怪物类型定义
         * 快速攻击的小型怪物
         */
        Goblin: Mob.extend({
            /**
             * 初始化哥布林怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.GOBLIN);
                this.moveSpeed = 150;      // 移动速度
                this.atkSpeed = 60;        // 攻击动画播放速度
                this.idleSpeed = 600;      // 待机动画播放速度
                this.setAttackRate(700);   // 设置攻击间隔时间
            }
        }),

        /**
         * 食人魔怪物类型定义
         * 大型怪物，具有较快的移动速度
         */
        Ogre: Mob.extend({
            /**
             * 初始化食人魔怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.OGRE);
                this.moveSpeed = 300;      // 移动速度
                this.atkSpeed = 100;       // 攻击动画播放速度
                this.idleSpeed = 600;      // 待机动画播放速度
            }
        }),

        /**
         * 螃蟹怪物类型定义
         * 中等速度的螃蟹类怪物
         */
        Crab: Mob.extend({
            /**
             * 初始化螃蟹怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.CRAB);
                this.moveSpeed = 200;      // 移动速度
                this.atkSpeed = 40;        // 攻击动画播放速度
                this.idleSpeed = 500;      // 待机动画播放速度
            }
        }),

        /**
         * 蛇怪物类型定义
         * 具有较低阴影偏移的蛇类怪物
         */
        Snake: Mob.extend({
            /**
             * 初始化蛇怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.SNAKE);
                this.moveSpeed = 200;      // 移动速度
                this.atkSpeed = 40;        // 攻击动画播放速度
                this.idleSpeed = 250;      // 待机动画播放速度
                this.walkSpeed = 100;      // 行走速度
                this.shadowOffsetY = -4;   // 阴影偏移量
            }
        }),

        /**
         * 眼球怪物类型定义
         * 待机动画非常快的眼球类怪物
         */
        Eye: Mob.extend({
            /**
             * 初始化眼球怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.EYE);
                this.moveSpeed = 200;      // 移动速度
                this.atkSpeed = 40;        // 攻击动画播放速度
                this.idleSpeed = 50;       // 待机动画播放速度
            }
        }),

        /**
         * 蝙蝠怪物类型定义
         * 非攻击性的飞行怪物
         */
        Bat: Mob.extend({
            /**
             * 初始化蝙蝠怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.BAT);
                this.moveSpeed = 120;      // 移动速度
                this.atkSpeed = 90;        // 攻击动画播放速度
                this.idleSpeed = 90;       // 待机动画播放速度
                this.walkSpeed = 85;       // 行走速度
                this.isAggressive = false; // 是否具有攻击性
            }
        }),

        /**
         * 巫师怪物类型定义
         * 标准魔法攻击型怪物
         */
        Wizard: Mob.extend({
            /**
             * 初始化巫师怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.WIZARD);
                this.moveSpeed = 200;      // 移动速度
                this.atkSpeed = 100;       // 攻击动画播放速度
                this.idleSpeed = 150;      // 待机动画播放速度
            }
        }),

        /**
         * BOSS怪物类型定义
         * 最终BOSS，具有特殊的待机行为和攻击冷却机制
         */
        Boss: Mob.extend({
            /**
             * 初始化BOSS怪物实例
             * @param {number} id - 怪物唯一标识符
             */
            init: function(id) {
                this._super(id, Types.Entities.BOSS);
                this.moveSpeed = 300;                      // 移动速度
                this.atkSpeed = 50;                        // 攻击动画播放速度
                this.idleSpeed = 400;                      // 待机动画播放速度
                this.atkRate = 2000;                       // 攻击间隔时间
                this.attackCooldown = new Timer(this.atkRate); // 攻击冷却计时器
        		this.aggroRange = 3;                       // 仇恨范围
            },

            /**
             * 重写待机行为方法
             * 当没有目标时始终朝下，否则保持指定方向
             * @param {number} orientation - 期望的朝向
             */
            idle: function(orientation) {
                if(!this.hasTarget()) {
                    this._super(Types.Orientations.DOWN);
                } else {
                    this._super(orientation);
                }
            }
        })
    };

    return Mobs;
});
