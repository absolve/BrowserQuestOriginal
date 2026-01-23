
define(['character', 'timer'], function(Character, Timer) {

    var Updater = Class.extend({
        init: function(game) {
            this.game = game;
            this.playerAggroTimer = new Timer(1000);
        },

        update: function() {
            this.updateZoning();
            this.updateCharacters();
            this.updatePlayerAggro();
            this.updateTransitions();
            this.updateAnimations();
            this.updateAnimatedTiles();
            this.updateChatBubbles();
            this.updateInfos();
        },

        updateCharacters: function() {
            var self = this;

            this.game.forEachEntity(function(entity) {
                var isCharacter = entity instanceof Character;

                if(entity.isLoaded) {
                    if(isCharacter) {
                        self.updateCharacter(entity);
                        self.game.onCharacterUpdate(entity);
                    }
                    self.updateEntityFading(entity);
                }
            });
        },

        updatePlayerAggro: function() {
            var t = this.game.currentTime,
                player = this.game.player;

            // Check player aggro every 1s when not moving nor attacking
            if(player && !player.isMoving() && !player.isAttacking()  && this.playerAggroTimer.isOver(t)) {
                player.checkAggro();
            }
        },

        updateEntityFading: function(entity) {
            if(entity && entity.isFading) {
                var duration = 1000,
                    t = this.game.currentTime,
                    dt = t - entity.startFadingTime;

                if(dt > duration) {
                    this.isFading = false;
                    entity.fadingAlpha = 1;
                } else {
                    entity.fadingAlpha = dt / duration;
                }
            }
        },

        updateTransitions: function() {
            var self = this,
                m = null,
                z = this.game.currentZoning;

            this.game.forEachEntity(function(entity) {
                m = entity.movement;
                if(m) {
                    if(m.inProgress) {
                        m.step(self.game.currentTime);
                    }
                }
            });

            if(z) {
                if(z.inProgress) {
                    z.step(this.game.currentTime);
                }
            }
        },

        updateZoning: function() {
            var g = this.game,
                c = g.camera,
                z = g.currentZoning,
                s = 3,
                ts = 16,
                speed = 500;

            if(z && z.inProgress === false) {
                var orientation = this.game.zoningOrientation,
                    startValue = endValue = offset = 0,
                    updateFunc = null,
                    endFunc = null;

                if(orientation === Types.Orientations.LEFT || orientation === Types.Orientations.RIGHT) {
                    offset = (c.gridW - 2) * ts;
                    startValue = (orientation === Types.Orientations.LEFT) ? c.x - ts : c.x + ts;
                    endValue = (orientation === Types.Orientations.LEFT) ? c.x - offset : c.x + offset;
                    updateFunc = function(x) {
                        c.setPosition(x, c.y);
                        g.initAnimatedTiles();
                        g.renderer.renderStaticCanvases();
                    }
                    endFunc = function() {
                        c.setPosition(z.endValue, c.y);
                   define(['character', 'timer'], function(Character, Timer) {

    /**
     * 游戏更新器类，负责管理游戏中的各种更新逻辑
     * @param {Object} game - 游戏实例对象
     */
    var Updater = Class.extend({
        /**
         * 初始化更新器
         * @param {Object} game - 游戏实例对象
         */
        init: function(game) {
            this.game = game;
            this.playerAggroTimer = new Timer(1000);
        },

        /**
         * 主更新函数，调用所有子系统的更新方法
         */
        update: function() {
            this.updateZoning();
            this.updateCharacters();
            this.updatePlayerAggro();
            this.updateTransitions();
            this.updateAnimations();
            this.updateAnimatedTiles();
            this.updateChatBubbles();
            this.updateInfos();
        },

        /**
         * 更新游戏中所有角色实体的状态
         */
        updateCharacters: function() {
            var self = this;

            this.game.forEachEntity(function(entity) {
                var isCharacter = entity instanceof Character;

                if(entity.isLoaded) {
                    if(isCharacter) {
                        self.updateCharacter(entity);
                        self.game.onCharacterUpdate(entity);
                    }
                    self.updateEntityFading(entity);
                }
            });
        },

        /**
         * 更新玩家的仇恨系统，检查是否有怪物对玩家产生攻击意图
         */
        updatePlayerAggro: function() {
            var t = this.game.currentTime,
                player = this.game.player;

            // Check player aggro every 1s when not moving nor attacking
            if(player && !player.isMoving() && !player.isAttacking()  && this.playerAggroTimer.isOver(t)) {
                player.checkAggro();
            }
        },

        /**
         * 更新实体的淡入淡出效果
         * @param {Object} entity - 需要更新淡入淡出效果的游戏实体
         */
        updateEntityFading: function(entity) {
            if(entity && entity.isFading) {
                var duration = 1000,
                    t = this.game.currentTime,
                    dt = t - entity.startFadingTime;

                if(dt > duration) {
                    this.isFading = false;
                    entity.fadingAlpha = 1;
                } else {
                    entity.fadingAlpha = dt / duration;
                }
            }
        },

        /**
         * 更新所有移动过渡动画，包括实体移动和区域切换
         */
        updateTransitions: function() {
            var self = this,
                m = null,
                z = this.game.currentZoning;

            this.game.forEachEntity(function(entity) {
                m = entity.movement;
                if(m) {
                    if(m.inProgress) {
                        m.step(self.game.currentTime);
                    }
                }
            });

            if(z) {
                if(z.inProgress) {
                    z.step(this.game.currentTime);
                }
            }
        },

        /**
         * 处理区域切换（zoning）逻辑，根据方向进行相机位置调整
         */
        updateZoning: function() {
            var g = this.game,
                c = g.camera,
                z = g.currentZoning,
                s = 3,
                ts = 16,
                speed = 500;

            if(z && z.inProgress === false) {
                var orientation = this.game.zoningOrientation,
                    startValue = endValue = offset = 0,
                    updateFunc = null,
                    endFunc = null;

                if(orientation === Types.Orientations.LEFT || orientation === Types.Orientations.RIGHT) {
                    offset = (c.gridW - 2) * ts;
                    startValue = (orientation === Types.Orientations.LEFT) ? c.x - ts : c.x + ts;
                    endValue = (orientation === Types.Orientations.LEFT) ? c.x - offset : c.x + offset;
                    updateFunc = function(x) {
                        c.setPosition(x, c.y);
                        g.initAnimatedTiles();
                        g.renderer.renderStaticCanvases();
                    }
                    endFunc = function() {
                        c.setPosition(z.endValue, c.y);
                        g.endZoning();
                    }
                } else if(orientation === Types.Orientations.UP || orientation === Types.Orientations.DOWN) {
                    offset = (c.gridH - 2) * ts;
                    startValue = (orientation === Types.Orientations.UP) ? c.y - ts : c.y + ts;
                    endValue = (orientation === Types.Orientations.UP) ? c.y - offset : c.y + offset;
                    updateFunc = function(y) {
                        c.setPosition(c.x, y);
                        g.initAnimatedTiles();
                        g.renderer.renderStaticCanvases();
                    }
                    endFunc = function() {
                        c.setPosition(c.x, z.endValue);
                        g.endZoning();
                    }
                }

                z.start(this.game.currentTime, updateFunc, endFunc, startValue, endValue, speed);
            }
        },

        /**
         * 更新单个角色的移动状态和位置
         * @param {Object} c - 需要更新的角色对象
         */
        updateCharacter: function(c) {
            var self = this;

            // Estimate of the movement distance for one update
            var tick = Math.round(16 / Math.round((c.moveSpeed / (1000 / this.game.renderer.FPS))));

            if(c.isMoving() && c.movement.inProgress === false) {
                if(c.orientation === Types.Orientations.LEFT) {
                    c.movement.start(this.game.currentTime,
                                     function(x) {
                                        c.x = x;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.x = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.x - tick,
                                     c.x - 16,
                                     c.moveSpeed);
                }
                else if(c.orientation === Types.Orientations.RIGHT) {
                    c.movement.start(this.game.currentTime,
                                     function(x) {
                                        c.x = x;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.x = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.x + tick,
                                     c.x + 16,
                                     c.moveSpeed);
                }
                else if(c.orientation === Types.Orientations.UP) {
                    c.movement.start(this.game.currentTime,
                                     function(y) {
                                        c.y = y;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.y = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.y - tick,
                                     c.y - 16,
                                     c.moveSpeed);
                }
                else if(c.orientation === Types.Orientations.DOWN) {
                    c.movement.start(this.game.currentTime,
                                     function(y) {
                                        c.y = y;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.y = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.y + tick,
                                     c.y + 16,
                                     c.moveSpeed);
                }
            }
        },

        /**
         * 更新所有动画效果，包括实体动画、火花动画和目标标记动画
         */
        updateAnimations: function() {
            var t = this.game.currentTime;

            this.game.forEachEntity(function(entity) {
                var anim = entity.currentAnimation;

                if(anim) {
                    if(anim.update(t)) {
                        entity.setDirty();
                    }
                }
            });

            var sparks = this.game.sparksAnimation;
            if(sparks) {
                sparks.update(t);
            }

            var target = this.game.targetAnimation;
            if(target) {
                target.update(t);
            }
        },

        /**
         * 更新所有动态瓦片的动画效果
         */
        updateAnimatedTiles: function() {
            var self = this,
                t = this.game.currentTime;

            this.game.forEachAnimatedTile(function (tile) {
                if(tile.animate(t)) {
                    tile.isDirty = true;
                    tile.dirtyRect = self.game.renderer.getTileBoundingRect(tile);

                    if(self.game.renderer.mobile || self.game.renderer.tablet) {
                        self.game.checkOtherDirtyRects(tile.dirtyRect, tile, tile.x, tile.y);
                    }
                }
            });
        },

        /**
         * 更新聊天气泡的显示状态
         */
        updateChatBubbles: function() {
            var t = this.game.currentTime;

            this.game.bubbleManager.update(t);
        },

        /**
         * 更新信息管理器中的显示信息
         */
        updateInfos: function() {
            var t = this.game.currentTime;

            this.game.infoManager.update(t);
        }
    });

    return Updater;
});
     g.endZoning();
                    }
                } else if(orientation === Types.Orientations.UP || orientation === Types.Orientations.DOWN) {
                    offset = (c.gridH - 2) * ts;
                    startValue = (orientation === Types.Orientations.UP) ? c.y - ts : c.y + ts;
                    endValue = (orientation === Types.Orientations.UP) ? c.y - offset : c.y + offset;
                    updateFunc = function(y) {
                        c.setPosition(c.x, y);
                        g.initAnimatedTiles();
                        g.renderer.renderStaticCanvases();
                    }
                    endFunc = function() {
                        c.setPosition(c.x, z.endValue);
                        g.endZoning();
                    }
                }

                z.start(this.game.currentTime, updateFunc, endFunc, startValue, endValue, speed);
            }
        },

        updateCharacter: function(c) {
            var self = this;

            // Estimate of the movement distance for one update
            var tick = Math.round(16 / Math.round((c.moveSpeed / (1000 / this.game.renderer.FPS))));

            if(c.isMoving() && c.movement.inProgress === false) {
                if(c.orientation === Types.Orientations.LEFT) {
                    c.movement.start(this.game.currentTime,
                                     function(x) {
                                        c.x = x;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.x = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.x - tick,
                                     c.x - 16,
                                     c.moveSpeed);
                }
                else if(c.orientation === Types.Orientations.RIGHT) {
                    c.movement.start(this.game.currentTime,
                                     function(x) {
                                        c.x = x;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.x = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.x + tick,
                                     c.x + 16,
                                     c.moveSpeed);
                }
                else if(c.orientation === Types.Orientations.UP) {
                    c.movement.start(this.game.currentTime,
                                     function(y) {
                                        c.y = y;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.y = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.y - tick,
                                     c.y - 16,
                                     c.moveSpeed);
                }
                else if(c.orientation === Types.Orientations.DOWN) {
                    c.movement.start(this.game.currentTime,
                                     function(y) {
                                        c.y = y;
                                        c.hasMoved();
                                     },
                                     function() {
                                        c.y = c.movement.endValue;
                                        c.hasMoved();
                                        c.nextStep();
                                     },
                                     c.y + tick,
                                     c.y + 16,
                                     c.moveSpeed);
                }
            }
        },

        updateAnimations: function() {
            var t = this.game.currentTime;

            this.game.forEachEntity(function(entity) {
                var anim = entity.currentAnimation;

                if(anim) {
                    if(anim.update(t)) {
                        entity.setDirty();
                    }
                }
            });

            var sparks = this.game.sparksAnimation;
            if(sparks) {
                sparks.update(t);
            }

            var target = this.game.targetAnimation;
            if(target) {
                target.update(t);
            }
        },

        updateAnimatedTiles: function() {
            var self = this,
                t = this.game.currentTime;

            this.game.forEachAnimatedTile(function (tile) {
                if(tile.animate(t)) {
                    tile.isDirty = true;
                    tile.dirtyRect = self.game.renderer.getTileBoundingRect(tile);

                    if(self.game.renderer.mobile || self.game.renderer.tablet) {
                        self.game.checkOtherDirtyRects(tile.dirtyRect, tile, tile.x, tile.y);
                    }
                }
            });
        },

        updateChatBubbles: function() {
            var t = this.game.currentTime;

            this.game.bubbleManager.update(t);
        },

        updateInfos: function() {
            var t = this.game.currentTime;
        
            this.game.infoManager.update(t);
        }
    });
    
    return Updater;
});
