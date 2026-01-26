define(function() {

    var Entity = Class.extend({
        /**
         * 初始化实体对象
         * @param {string|number} id - 实体的唯一标识符
         * @param {string|number} kind - 实体的类型
         */
        init: function(id, kind) {
    	    var self = this;

            this.id = id;
            this.kind = kind;

            // Renderer
    		this.sprite = null;
    		this.flipSpriteX = false;
        	this.flipSpriteY = false;
    		this.animations = null;
    		this.currentAnimation = null;
            this.shadowOffsetY = 0;

    		// Position
    		this.setGridPosition(0, 0);

            // Modes
            this.isLoaded = false;
            this.isHighlighted = false;
            this.visible = true;
            this.isFading = false;
            this.setDirty();
    	},

    	/**
         * 设置实体名称
         * @param {string} name - 实体名称
         */
    	setName: function(name) {
    		this.name = name;
    	},

    	/**
         * 设置实体在屏幕上的位置坐标
         * @param {number} x - X轴坐标
         * @param {number} y - Y轴坐标
         */
    	setPosition: function(x, y) {
    		this.x = x;
    		this.y = y;
    	},

    	/**
         * 设置实体在网格中的位置坐标，并根据网格坐标计算屏幕坐标
         * @param {number} x - 网格X轴坐标
         * @param {number} y - 网格Y轴坐标
         */
    	setGridPosition: function(x, y) {
    		this.gridX = x;
    		this.gridY = y;

    		this.setPosition(x * 16, y * 16);
    	},

    	/**
         * 设置实体的精灵图
         * @param {Object} sprite - 精灵图对象
         */
    	setSprite: function(sprite) {
    	    if(!sprite) {
    	        log.error(this.id + " : sprite is null", true);
    	        throw "Error";
    	    }

    	    if(this.sprite && this.sprite.name === sprite.name) {
    	        return;
    	    }

    	    this.sprite = sprite;
            this.normalSprite = this.sprite;

            // 为怪物或玩家创建受伤状态精灵图
            if(Types.isMob(this.kind) || Types.isPlayer(this.kind)) {
            	this.hurtSprite = sprite.getHurtSprite();
            }

    		this.animations = sprite.createAnimations();

    		this.isLoaded = true;
    		if(this.ready_func) {
    			this.ready_func();
    		}
    	},

    	/**
         * 获取实体的精灵图
         * @returns {Object} 精灵图对象
         */
    	getSprite: function() {
    	    return this.sprite;
    	},

    	/**
         * 获取精灵图名称
         * @returns {string} 精灵图名称
         */
    	getSpriteName: function() {
    	    return Types.getKindAsString(this.kind);
    	},

    	/**
         * 根据名称获取动画对象
         * @param {string} name - 动画名称
         * @returns {Object|null} 动画对象或null
         */
    	getAnimationByName: function(name) {
            var animation = null;

            if(name in this.animations) {
                animation = this.animations[name];
            }
            else {
                log.error("No animation called "+ name);
            }
            return animation;
        },

    	/**
         * 设置当前播放的动画
         * @param {string} name - 动画名称
         * @param {number} speed - 动画播放速度
         * @param {number} [count] - 动画播放次数，默认为0（无限循环）
         * @param {Function} [onEndCount] - 动画播放结束时的回调函数
         */
    	setAnimation: function(name, speed, count, onEndCount) {
    	    var self = this;

            if(this.isLoaded) {
    		    if(this.currentAnimation && this.currentAnimation.name === name) {
    		        return;
    		    }

    		    var s = this.sprite,
                    a = this.getAnimationByName(name);

    			if(a) {
    				this.currentAnimation = a;
    				if(name.substr(0, 3) === "atk") {
    				    this.currentAnimation.reset();
    				}
    				this.currentAnimation.setSpeed(speed);
    				this.currentAnimation.setCount(count ? count : 0, onEndCount || function() {
    				    self.idle();
    				});
    			}
    		}
    		else {
    			this.log_error("Not ready for animation");
    		}
    	},

    	/**
         * 判断实体是否有阴影
         * @returns {boolean} 是否有阴影
         */
    	hasShadow: function() {
    	    return false;
    	},

    	/**
         * 设置实体就绪时的回调函数
         * @param {Function} f - 回调函数
         */
    	ready: function(f) {
    		this.ready_func = f;
    	},

    	/**
         * 清理实体状态
         */
    	clean: function() {
            this.stopBlinking();
    	},

        /**
         * 记录信息日志
         * @param {string} message - 日志消息
         */
        log_info: function(message) {
            log.info("["+this.id+"] " + message);
        },

        /**
         * 记录错误日志
         * @param {string} message - 错误消息
         */
        log_error: function(message) {
            log.error("["+this.id+"] " + message);
        },

        /**
         * 设置实体高亮状态
         * @param {boolean} value - 高亮状态值
         */
        setHighlight: function(value) {
            if(value === true) {
                this.sprite = this.sprite.silhouetteSprite;
                this.isHighlighted = true;
            }
            else {
                this.sprite = this.normalSprite;
                this.isHighlighted = false;
            }
        },

        /**
         * 设置实体可见性
         * @param {boolean} value - 可见性状态
         */
        setVisible: function(value) {
            this.visible = value;
        },

        /**
         * 获取实体可见性状态
         * @returns {boolean} 可见性状态
         */
        isVisible: function() {
            return this.visible;
        },

        /**
         * 切换实体可见性状态
         */
        toggleVisibility: function() {
            if(this.visible) {
                this.setVisible(false);
            } else {
                this.setVisible(true);
            }
        },

        /**
         * 计算到另一个实体的距离
         * @param {Object} entity - 目标实体对象
         * @returns {number} 距离值
         */
        getDistanceToEntity: function(entity) {
            var distX = Math.abs(entity.gridX - this.gridX);
            var distY = Math.abs(entity.gridY - this.gridY);

            return (distX > distY) ? distX : distY;
        },

        /**
         * 判断实体是否接近给定实体
         * @param {Object} entity - 目标实体对象
         * @returns {boolean} 是否接近
         */
        isCloseTo: function(entity) {
            var dx, dy, d, close = false;
            if(entity) {
                dx = Math.abs(entity.gridX - this.gridX);
                dy = Math.abs(entity.gridY - this.gridY);

                if(dx < 30 && dy < 14) {
                    close = true;
                }
            }
            return close;
        },

        /**
         * 返回true如果实体与给定实体相邻
         * @param {Object} entity - 目标实体对象
         * @returns {boolean} 是否相邻
         */
        isAdjacent: function(entity) {
            var adjacent = false;

            if(entity) {
                adjacent = this.getDistanceToEntity(entity) > 1 ? false : true;
            }
            return adjacent;
        },

        /**
         * 检查实体是否与目标实体正交相邻（非对角线相邻）
         * @param {Object} entity - 目标实体对象
         * @returns {boolean} 是否正交相邻
         */
        isAdjacentNonDiagonal: function(entity) {
            var result = false;

            if(this.isAdjacent(entity) && !(this.gridX !== entity.gridX && this.gridY !== entity.gridY)) {
                result = true;
            }

            return result;
        },

        /**
         * 判断实体是否与目标实体对角线相邻
         * @param {Object} entity - 目标实体对象
         * @returns {boolean} 是否对角线相邻
         */
        isDiagonallyAdjacent: function(entity) {
            return this.isAdjacent(entity) && !this.isAdjacentNonDiagonal(entity);
        },

        /**
         * 遍历所有正交相邻的位置并执行回调函数
         * @param {Function} callback - 回调函数，接收x坐标、y坐标和方向参数
         */
        forEachAdjacentNonDiagonalPosition: function(callback) {
            callback(this.gridX - 1, this.gridY, Types.Orientations.LEFT);
            callback(this.gridX, this.gridY - 1, Types.Orientations.UP);
            callback(this.gridX + 1, this.gridY, Types.Orientations.RIGHT);
            callback(this.gridX, this.gridY + 1, Types.Orientations.DOWN);

        },

        /**
         * 开始淡入效果
         * @param {number} currentTime - 当前时间戳
         */
        fadeIn: function(currentTime) {
            this.isFading = true;
            this.startFadingTime = currentTime;
        },

        /**
         * 开始闪烁效果
         * @param {number} speed - 闪烁间隔时间
         * @param {Function} callback - 回调函数
         */
        blink: function(speed, callback) {
            var self = this;

            this.blinking = setInterval(function() {
                self.toggleVisibility();
            }, speed);
        },

        /**
         * 停止闪烁效果
         */
        stopBlinking: function() {
            if(this.blinking) {
                clearInterval(this.blinking);
            }
            this.setVisible(true);
        },

        /**
         * 设置实体为脏状态，表示需要更新
         */
        setDirty: function() {
            this.isDirty = true;
            if(this.dirty_callback) {
                this.dirty_callback(this);
            }
        },

        /**
         * 设置脏状态回调函数
         * @param {Function} dirty_callback - 脏状态回调函数
         */
        onDirty: function(dirty_callback) {
            this.dirty_callback = dirty_callback;
        }
    });
    
    return Entity;
});
