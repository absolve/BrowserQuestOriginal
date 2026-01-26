define(['entity', 'transition', 'timer'], function (Entity, Transition, Timer) {
    /**
     * 角色类，继承自Entity类，代表游戏中的角色实体
     * 包含移动、战斗、动画等核心功能
     */
    var Character = Entity.extend({
        /**
         * 初始化角色对象
         * @param {string} id - 角色唯一标识符
         * @param {string} kind - 角色类型
         */
        init: function (id, kind) {
            var self = this;

            this._super(id, kind);

            // Position and orientation
            this.nextGridX = -1;
            this.nextGridY = -1;
            this.orientation = Types.Orientations.DOWN;

            // Speeds
            this.atkSpeed = 50;
            this.moveSpeed = 120;
            this.walkSpeed = 100;
            this.idleSpeed = 450;
            this.setAttackRate(800);

            // Pathing
            this.movement = new Transition();
            this.path = null;
            this.newDestination = null;
            this.adjacentTiles = {};

            // Combat
            this.target = null;
            this.unconfirmedTarget = null;
            this.attackers = {};

            // Health
            this.hitPoints = 0;
            this.maxHitPoints = 0;

            // Modes
            this.isDead = false;
            this.attackingMode = false;
            this.followingMode = false;
        },

        /**
         * 清理角色相关的攻击者状态
         */
        clean: function () {
            this.forEachAttacker(function (attacker) {
                attacker.disengage();
                attacker.idle();
            });
        },

        /**
         * 设置角色的最大生命值
         * @param {number} hp - 最大生命值
         */
        setMaxHitPoints: function (hp) {
            this.maxHitPoints = hp;
            this.hitPoints = hp;
        },

        /**
         * 设置默认动画为待机状态
         */
        setDefaultAnimation: function () {
            this.idle();
        },

        /**
         * 检查角色是否持有武器
         * @returns {boolean} 是否持有武器
         */
        hasWeapon: function () {
            return false;
        },

        /**
         * 检查角色是否有阴影
         * @returns {boolean} 是否有阴影
         */
        hasShadow: function () {
            return true;
        },

        /**
         * 播放角色动画
         * @param {string} animation - 动画名称
         * @param {number} speed - 动画速度
         * @param {number} count - 循环次数
         * @param {function} onEndCount - 循环结束回调函数
         */
        animate: function (animation, speed, count, onEndCount) {
            var oriented = ['atk', 'walk', 'idle'];
            o = this.orientation;

            if (!(this.currentAnimation && this.currentAnimation.name === "death")) { // don't change animation if the character is dying
                this.flipSpriteX = false;
                this.flipSpriteY = false;

                if (_.indexOf(oriented, animation) >= 0) {
                    animation += "_" + (o === Types.Orientations.LEFT ? "right" : Types.getOrientationAsString(o));
                    this.flipSpriteX = (this.orientation === Types.Orientations.LEFT) ? true : false;
                }

                this.setAnimation(animation, speed, count, onEndCount);
            }
        },

        /**
         * 转向指定方向并进入待机状态
         * @param {string} orientation - 方向
         */
        turnTo: function (orientation) {
            this.orientation = orientation;
            this.idle();
        },

        /**
         * 设置角色朝向
         * @param {string} orientation - 方向
         */
        setOrientation: function (orientation) {
            if (orientation) {
                this.orientation = orientation;
            }
        },

        /**
         * 进入待机状态
         * @param {string} orientation - 方向
         */
        idle: function (orientation) {
            this.setOrientation(orientation);
            this.animate("idle", this.idleSpeed);
        },

        /**
         * 进入攻击状态
         * @param {string} orientation - 方向
         */
        hit: function (orientation) {
            this.setOrientation(orientation);
            this.animate("atk", this.atkSpeed, 1);
        },

        /**
         * 进入行走状态
         * @param {string} orientation - 方向
         */
        walk: function (orientation) {
            this.setOrientation(orientation);
            this.animate("walk", this.walkSpeed);
        },

        /**
         * 移动到指定坐标
         * @param {number} x - 目标x坐标
         * @param {number} y - 目标y坐标
         * @param {function} callback - 回调函数
         */
        moveTo_: function (x, y, callback) {
            this.destination = {gridX: x, gridY: y};
            this.adjacentTiles = {};

            if (this.isMoving()) {
                this.continueTo(x, y);
            } else {
                var path = this.requestPathfindingTo(x, y);

                this.followPath(path);
            }
        },

        /**
         * 请求寻路到指定位置
         * @param {number} x - 目标x坐标
         * @param {number} y - 目标y坐标
         * @returns {array} 寻路路径数组
         */
        requestPathfindingTo: function (x, y) {
            if (this.request_path_callback) {
                return this.request_path_callback(x, y);
            } else {
                log.error(this.id + " couldn't request pathfinding to " + x + ", " + y);
                return [];
            }
        },

        /**
         * 设置寻路请求回调函数
         * @param {function} callback - 回调函数
         */
        onRequestPath: function (callback) {
            this.request_path_callback = callback;
        },

        /**
         * 设置开始寻路回调函数
         * @param {function} callback - 回调函数
         */
        onStartPathing: function (callback) {
            this.start_pathing_callback = callback;
        },

        /**
         * 设置停止寻路回调函数
         * @param {function} callback - 回调函数
         */
        onStopPathing: function (callback) {
            this.stop_pathing_callback = callback;
        },

        /**
         * 跟随路径移动
         * @param {array} path - 路径数组
         */
        followPath: function (path) {
            if (path.length > 1) { // Length of 1 means the player has clicked on himself
                this.path = path;
                this.step = 0;

                if (this.followingMode) { // following a character
                    path.pop();
                }

                if (this.start_pathing_callback) {
                    this.start_pathing_callback(path);
                }
                this.nextStep();
            }
        },

        /**
         * 继续移动到新目标位置
         * @param {number} x - 新目标x坐标
         * @param {number} y - 新目标y坐标
         */
        continueTo: function (x, y) {
            this.newDestination = {x: x, y: y};
        },

        /**
         * 更新移动时的角色朝向
         */
        updateMovement: function () {
            var p = this.path,
                i = this.step;

            if (p[i][0] < p[i - 1][0]) {
                this.walk(Types.Orientations.LEFT);
            }
            if (p[i][0] > p[i - 1][0]) {
                this.walk(Types.Orientations.RIGHT);
            }
            if (p[i][1] < p[i - 1][1]) {
                this.walk(Types.Orientations.UP);
            }
            if (p[i][1] > p[i - 1][1]) {
                this.walk(Types.Orientations.DOWN);
            }
        },

        /**
         * 更新角色在网格上的位置
         */
        updatePositionOnGrid: function () {
            this.setGridPosition(this.path[this.step][0], this.path[this.step][1]);
        },

        /**
         * 执行下一步移动
         */
        nextStep: function () {
            var stop = false,
                x, y, path;

            if (this.isMoving()) {
                if (this.before_step_callback) {
                    this.before_step_callback();
                }

                this.updatePositionOnGrid();
                this.checkAggro();

                if (this.interrupted) { // if Character.stop() has been called
                    stop = true;
                    this.interrupted = false;
                } else {
                    if (this.hasNextStep()) {
                        this.nextGridX = this.path[this.step + 1][0];
                        this.nextGridY = this.path[this.step + 1][1];
                    }

                    if (this.step_callback) {
                        this.step_callback();
                    }

                    if (this.hasChangedItsPath()) {
                        x = this.newDestination.x;
                        y = this.newDestination.y;
                        path = this.requestPathfindingTo(x, y);

                        this.newDestination = null;
                        if (path.length < 2) {
                            stop = true;
                        } else {
                            this.followPath(path);
                        }
                    } else if (this.hasNextStep()) {
                        this.step += 1;
                        this.updateMovement();
                    } else {
                        stop = true;
                    }
                }

                if (stop) { // Path is complete or has been interrupted
                    this.path = null;
                    this.idle();

                    if (this.stop_pathing_callback) {
                        this.stop_pathing_callback(this.gridX, this.gridY);
                    }
                }
            }
        },

        /**
         * 设置每步执行前的回调函数
         * @param {function} callback - 回调函数
         */
        onBeforeStep: function (callback) {
            this.before_step_callback = callback;
        },

        /**
         * 设置每步执行的回调函数
         * @param {function} callback - 回调函数
         */
        onStep: function (callback) {
            this.step_callback = callback;
        },

        /**
         * 检查角色是否正在移动
         * @returns {boolean} 是否正在移动
         */
        isMoving: function () {
            return !(this.path === null);
        },

        /**
         * 检查是否还有下一步
         * @returns {boolean} 是否还有下一步
         */
        hasNextStep: function () {
            return (this.path.length - 1 > this.step);
        },

        /**
         * 检查角色是否改变了路径
         * @returns {boolean} 是否改变了路径
         */
        hasChangedItsPath: function () {
            return !(this.newDestination === null);
        },

        /**
         * 检查角色是否接近另一个角色
         * @param {Character} character - 另一个角色
         * @param {number} distance - 距离阈值
         * @returns {boolean} 是否接近
         */
        isNear: function (character, distance) {
            var dx, dy, near = false;

            dx = Math.abs(this.gridX - character.gridX);
            dy = Math.abs(this.gridY - character.gridY);

            if (dx <= distance && dy <= distance) {
                near = true;
            }
            return near;
        },

        /**
         * 设置仇恨回调函数
         * @param {function} callback - 回调函数
         */
        onAggro: function (callback) {
            this.aggro_callback = callback;
        },

        /**
         * 设置检查仇恨回调函数
         * @param {function} callback - 回调函数
         */
        onCheckAggro: function (callback) {
            this.checkaggro_callback = callback;
        },

        /**
         * 检查仇恨状态
         */
        checkAggro: function () {
            if (this.checkaggro_callback) {
                this.checkaggro_callback();
            }
        },

        /**
         * 对指定角色产生仇恨
         * @param {Character} character - 目标角色
         */
        aggro: function (character) {
            if (this.aggro_callback) {
                this.aggro_callback(character);
            }
        },

        /**
         * 设置死亡回调函数
         * @param {function} callback - 回调函数
         */
        onDeath: function (callback) {
            this.death_callback = callback;
        },

        /**
         * 改变角色的朝向使其面向目标
         */
        lookAtTarget: function () {
            if (this.target) {
                this.turnTo(this.getOrientationTo(this.target));
            }
        },

        /**
         * 移动到指定位置
         * @param {number} x - x坐标
         * @param {number} y - y坐标
         */
        go: function (x, y) {
            if (this.isAttacking()) {
                this.disengage();
            } else if (this.followingMode) {
                this.followingMode = false;
                this.target = null;
            }
            this.moveTo_(x, y);
        },

        /**
         * 使角色跟随另一个实体
         * @param {Entity} entity - 被跟随的实体
         */
        follow: function (entity) {
            if (entity) {
                this.followingMode = true;
                this.moveTo_(entity.gridX, entity.gridY);
            }
        },

        /**
         * 停止移动中的角色
         */
        stop: function () {
            if (this.isMoving()) {
                this.interrupted = true;
            }
        },

        /**
         * 使角色攻击另一个角色。类似于follow但具有自动攻击行为
         * @param {Character} character - 被攻击的角色
         */
        engage: function (character) {
            this.attackingMode = true;
            this.setTarget(character);
            this.follow(character);
        },

        /**
         * 取消攻击模式
         */
        disengage: function () {
            this.attackingMode = false;
            this.followingMode = false;
            this.removeTarget();
        },

        /**
         * 返回角色当前是否正在攻击
         * @returns {boolean} 是否正在攻击
         */
        isAttacking: function () {
            return this.attackingMode;
        },

        /**
         * 获取面向目标角色的正确朝向
         * 注意：为了正常工作，此方法应在以下情况下使用：
         *    S
         *  S T S
         *    S
         * (其中S是自己，T是目标角色)
         *
         * @param {Character} character - 面向的目标角色
         * @returns {string} 朝向
         */
        getOrientationTo: function (character) {
            if (this.gridX < character.gridX) {
                return Types.Orientations.RIGHT;
            } else if (this.gridX > character.gridX) {
                return Types.Orientations.LEFT;
            } else if (this.gridY > character.gridY) {
                return Types.Orientations.UP;
            } else {
                return Types.Orientations.DOWN;
            }
        },

        /**
         * 返回此角色是否被给定角色攻击
         * @param {Character} character - 攻击角色
         * @returns {boolean} 是否被该角色攻击
         */
        isAttackedBy: function (character) {
            return (character.id in this.attackers);
        },

        /**
         * 将角色注册为当前攻击者之一
         * @param {Character} character - 攻击角色
         */
        addAttacker: function (character) {
            if (!this.isAttackedBy(character)) {
                this.attackers[character.id] = character;
            } else {
                log.error(this.id + " is already attacked by " + character.id);
            }
        },

        /**
         * 将角色从当前攻击者中注销
         * @param {Character} character - 攻击角色
         */
        removeAttacker: function (character) {
            if (this.isAttackedBy(character)) {
                delete this.attackers[character.id];
            } else {
                log.error(this.id + " is not attacked by " + character.id);
            }
        },

        /**
         * 遍历所有当前攻击此角色的角色
         * @param {function} callback - 接受一个角色参数的函数
         */
        forEachAttacker: function (callback) {
            _.each(this.attackers, function (attacker) {
                callback(attacker);
            });
        },

        /**
         * 设置此角色的攻击目标。任何时候只能有一个目标
         * @param {Character} character - 目标角色
         */
        setTarget: function (character) {
            if (this.target !== character) { // If it's not already set as the target
                if (this.hasTarget()) {
                    this.removeTarget(); // Cleanly remove the previous one
                }
                this.unconfirmedTarget = null;
                this.target = character;
            } else {
                log.debug(character.id + " is already the target of " + this.id);
            }
        },

        /**
         * 移除当前攻击目标
         */
        removeTarget: function () {
            var self = this;

            if (this.target) {
                if (this.target instanceof Character) {
                    this.target.removeAttacker(this);
                }
                this.target = null;
            }
        },

        /**
         * 返回此角色是否有当前攻击目标
         * @returns {boolean} 是否有目标
         */
        hasTarget: function () {
            return !(this.target === null);
        },

        /**
         * 标记此角色为等待攻击目标状态
         * 通过发送"attack"消息，服务器将稍后确认（或不确认）此角色是否被允许获取此目标
         *
         * @param {Character} character - 目标角色
         */
        waitToAttack: function (character) {
            this.unconfirmedTarget = character;
        },

        /**
         * 返回此角色当前是否正在等待攻击目标角色
         * @param {Character} character - 目标角色
         * @returns {boolean} 是否正在等待攻击
         */
        isWaitingToAttack: function (character) {
            return (this.unconfirmedTarget === character);
        },

        /**
         * 检查角色是否可以攻击
         * @param {number} time - 当前时间
         * @returns {boolean} 是否可以攻击
         */
        canAttack: function (time) {
            if (this.canReachTarget() && this.attackCooldown.isOver(time)) {
                return true;
            }
            return false;
        },

        /**
         * 检查是否能到达目标
         * @returns {boolean} 是否能到达目标
         */
        canReachTarget: function () {
            if (this.hasTarget() && this.isAdjacentNonDiagonal(this.target)) {
                return true;
            }
            return false;
        },

        /**
         * 角色死亡
         */
        die: function () {
            this.removeTarget();
            this.isDead = true;

            if (this.death_callback) {
                this.death_callback();
            }
        },

        /**
         * 设置移动完成回调函数
         * @param {function} callback - 回调函数
         */
        onHasMoved: function (callback) {
            this.hasmoved_callback = callback;
        },

        /**
         * 角色已移动
         */
        hasMoved: function () {
            this.setDirty();
            if (this.hasmoved_callback) {
                this.hasmoved_callback(this);
            }
        },

        /**
         * 角色受伤效果
         */
        hurt: function () {
            var self = this;

            this.stopHurting();
            this.sprite = this.hurtSprite;
            this.hurting = setTimeout(this.stopHurting.bind(this), 75);
        },

        /**
         * 停止受伤效果
         */
        stopHurting: function () {
            this.sprite = this.normalSprite;
            clearTimeout(this.hurting);
        },

        /**
         * 设置攻击频率
         * @param {number} rate - 攻击间隔时间
         */
        setAttackRate: function (rate) {
            this.attackCooldown = new Timer(rate);
        }
    });

    return Character;
});
