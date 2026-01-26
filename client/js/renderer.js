
define(['camera', 'item', 'character', 'player', 'timer'], 
function(Camera, Item, Character, Player, Timer) {

    var Renderer = Class.extend({
        init: function(game, canvas, background, foreground) {
            this.game = game;
            this.context = (canvas && canvas.getContext) ? canvas.getContext("2d") : null;
            this.background = (background && background.getContext) ? background.getContext("2d") : null;
            this.foreground = (foreground && foreground.getContext) ? foreground.getContext("2d") : null;
        
            this.canvas = canvas;
            this.backcanvas = background;
            this.forecanvas = foreground;

            this.initFPS();
            this.tilesize = 16;
        
            this.upscaledRendering = this.context.mozImageSmoothingEnabled !== undefined;
            this.supportsSilhouettes = this.upscaledRendering;
        
            this.rescale(this.getScaleFactor());
        
            this.lastTime = new Date();
            this.frameCount = 0;
            this.maxFPS = this.FPS;
            this.realFPS = 0;
            this.isDebugInfoVisible = false;
        
            this.animatedTileCount = 0;
            this.highTileCount = 0;
        
            this.tablet = Detect.isTablet(window.innerWidth);
            
            this.fixFlickeringTimer = new Timer(100);
        },
    
        getWidth: function() {
            return this.canvas.width;
        },
    
        getHeight: function() {
            return this.canvas.height;
        },
    
        setTileset: function(tileset) {
            this.tileset = tileset;
        },
    
        getScaleFactor: function() {
            var w = window.innerWidth,
                h = window.innerHeight,
                scale;
        
            this.mobile = false;
        
            if(w <= 1000) {
                scale = 2;
                this.mobile = true;
            }
            else if(w <= 1500 || h <= 870) {
                scale = 2;
            }
            else {
                scale = 3;
            }
        
            return scale;
        },
    
        rescale: function(factor) {
            this.scale = this.getScaleFactor();
        
            this.createCamera();
        
            this.context.mozImageSmoothingEnabled = false;
            this.background.mozImageSmoothingEnabled = false;
            this.foreground.mozImageSmoothingEnabled = false;
        
            this.initFont();
            this.initFPS();
        
            if(!this.upscaledRendering && this.game.map && this.game.map.tilesets) {
                this.setTileset(this.game.map.tilesets[this.scale - 1]);
            }
            if(this.game.renderer) {
                this.game.setSpriteScale(this.scale);
            }
        },

        createCamera: function() {
            this.camera = new Camera(this);
            this.camera.rescale();
        
            this.canvas.width = this.camera.gridW * this.tilesize * this.scale;
            this.canvas.height = this.camera.gridH * this.tilesize * this.scale;
            log.debug("#entities set to "+this.canvas.width+" x "+this.canvas.height);
        
            this.backcanvas.width = this.canvas.width;
            this.backcanvas.height = this.canvas.height;
            log.debug("#background set to "+this.backcanvas.width+" x "+this.backcanvas.height);
        
            this.forecanvas.width = this.canvas.width;
            this.forecanvas.height = this.canvas.height;
            log.debug("#foreground set to "+this.forecanvas.width+" x "+this.forecanvas.height);
        },
    
        initFPS: function() {
            this.FPS = this.mobile ? 50 : 50;
        },
    
        initFont: function() {
            var fontsize;
        
            switch(this.scale) {
                case 1:
                    fontsize = 10; break;
                case 2:
                    fontsize = Detect.isWindows() ? 10 : 13; break;
                case 3:
                    fontsize = 20;
            }
            this.setFontSize(fontsize);
        },
    
        setFontSize: function(size) {
            var font = size+"px GraphicPixel";
        
            this.context.font = font;
            this.background.font = font;
        },

        drawText: function(text, x, y, centered, color, strokeColor) {
            var ctx = this.context;
            
            var strokeSize;
        
            switch(this.scale) {
                case 1:
                    strokeSize = 3; break;
                case 2:
                    strokeSize = 3; break;
                case 3:
                    strokeSize = 5;
            }
            
            if(text && x && y) {
                ctx.save();
                if(centered) {
                    ctx.textAlign = "center";
                }
                ctx.strokeStyle = strokeColor || "#373737";
                ctx.lineWidth = strokeSize;
                ctx.strokeText(text, x, y);
                ctx.fillStyle = color || "white";
                ctx.fillText(text, x, y);
                ctx.restore();
            }
        },
    
        drawCellRect: function(x, y, color) {
            this.context.save();
            this.context.lineWidth = 2*this.scale;
            this.context.strokeStyle = color;
            this.context.translate(x+2, y+2);
            this.context.strokeRect(0, 0, (this.tilesize * this.scale) - 4, (this.tilesize * this.scale) - 4);
            this.context.restore();
        },

        drawCellHighlight: function(x, y, color) {
            var s = this.scale,
                ts = this.tilesize,
                tx = x * ts * s,
                ty = y * ts * s;
        
            this.drawCellRect(tx, ty, color);
        },
    
        drawTargetCell: function() {
            var mouse = this.game.getMouseGridPosition();
        
            if(this.game.targetCellVisible && !(mouse.x === this.game.selectedX && mouse.y === this.game.selectedY)) {
                this.drawCellHighlight(mouse.x, mouse.y, this.game.targetColor);
            }
        },
    
        drawAttackTargetCell: function() {
            var mouse = this.game.getMouseGridPosition(),
                entity = this.game.getEntityAt(mouse.x, mouse.y),
                s = this.scale;
        
            if(entity) {
                this.drawCellRect(entity.x * s, entity.y * s, "rgba(255, 0, 0, 0.5)");
            }
        },
    
        drawOccupiedCells: function() {
            var positions = this.game.entityGrid;
        
            if(positions) {
                for(let i=0; i < positions.length; i += 1) {
                    for(let j=0; j < positions[i].length; j += 1) {
                        if(!_.isNull(positions[i][j])) {
                            this.drawCellHighlight(i, j, "rgba(50, 50, 255, 0.5)");
                        }
                    }
                }
            }
        },
    
        drawPathingCells: function() {
            let grid = this.game.pathingGrid;

            if(grid && this.game.debugPathing) {
                for(let y=0; y < grid.length; y += 1) {
                    for(let x=0; x < grid[y].length; x += 1) {
                        if(grid[y][x] === 1 && this.game.camera.isVisiblePosition(x, y)) {
                            this.drawCellHighlight(x, y, "rgba(50, 50, 255, 0.5)");
                        }
                    }
                }
            }
        },

        drawSelectedCell: function() {
            let sprite = this.game.cursors["target"],
                anim = this.game.targetAnimation,
                os = this.upscaledRendering ? 1 : this.scale,
                ds = this.upscaledRendering ? this.scale : 1;

            if(this.game.selectedCellVisible) {
                if(this.mobile || this.tablet) {
                    if(this.game.drawTarget) {
                        var x = this.game.selectedX,
                            y = this.game.selectedY;
                        
                        this.drawCellHighlight(this.game.selectedX, this.game.selectedY, "rgb(51, 255, 0)");
                        this.lastTargetPos = { x: x,
                                               y: y };
                        this.game.drawTarget = false;
                    }
                } else {
                    if(sprite && anim) {
                        var	frame = anim.currentFrame,
                            s = this.scale,
                            x = frame.x * os,
                            y = frame.y * os,
                            w = sprite.width * os,
                            h = sprite.height * os,
                            ts = 16,
                            dx = this.game.selectedX * ts * s,
                            dy = this.game.selectedY * ts * s,
                            dw = w * ds,
                            dh = h * ds;

                        this.context.save();
                        this.context.translate(dx, dy);
                        this.context.drawImage(sprite.image, x, y, w, h, 0, 0, dw, dh);
                        this.context.restore();
                    }
                }
            }
        },
    
        clearScaledRect: function(ctx, x, y, w, h) {
            var s = this.scale;
        
            ctx.clearRect(x * s, y * s, w * s, h * s);
        },

        drawCursor: function() {
            var mx = this.game.mouse.x,
                my = this.game.mouse.y,
                s = this.scale,
                os = this.upscaledRendering ? 1 : this.scale;
        
            this.context.save();
            if(this.game.currentCursor && this.game.currentCursor.isLoaded) {
                this.context.drawImage(this.game.currentCursor.image, 0, 0, 14 * os, 14 * os, mx, my, 14*s, 14*s);
            }
            this.context.restore();
        },

        drawScaledImage: function(ctx, image, x, y, w, h, dx, dy) {
            var s = this.upscaledRendering ? 1 : this.scale;
            _.each(arguments, function(arg) {
                if(_.isUndefined(arg) || _.isNaN(arg) || _.isNull(arg) || arg < 0) {
                    log.error("x:"+x+" y:"+y+" w:"+w+" h:"+h+" dx:"+dx+" dy:"+dy, true);
                    throw Error("A problem occured when trying to draw on the canvas");
                }
            });
        
            ctx.drawImage(image,
                          x * s,
                          y * s,
                          w * s,
                          h * s,
                          dx * this.scale,
                          dy * this.scale,
                          w * this.scale,
                          h * this.scale);
        },

        drawTile: function(ctx, tileid, tileset, setW, gridW, cellid) {
            var s = this.upscaledRendering ? 1 : this.scale;
            if(tileid !== -1) { // -1 when tile is empty in Tiled. Don't attempt to draw it.
                this.drawScaledImage(ctx,
                                     tileset,
                                     getX(tileid + 1, (setW / s)) * this.tilesize,
                                     Math.floor(tileid / (setW / s)) * this.tilesize,
                                     this.tilesize,
                                     this.tilesize,
                                     getX(cellid + 1, gridW) * this.tilesize,
                                     Math.floor(cellid / gridW) * this.tilesize);
            }
        },
    
        clearTile: function(ctx, gridW, cellid) {
            var s = this.scale,
                ts = this.tilesize,
                x = getX(cellid + 1, gridW) * ts * s,
                y = Math.floor(cellid / gridW) * ts * s,
                w = ts * s,
                h = w;
        
            ctx.clearRect(x, y, h, w);
        },

        /**
         * 绘制游戏实体
         * @param {Object} entity - 要绘制的游戏实体对象
         * @returns {void}
         */
        drawEntity: function(entity) {
            // 获取实体的精灵、阴影、动画等资源引用
            let sprite = entity.sprite,
                shadow = this.game.shadows["small"],
                anim = entity.currentAnimation,
                os = this.upscaledRendering ? 1 : this.scale,
                ds = this.upscaledRendering ? this.scale : 1;

            if(anim && sprite) {
                // 计算精灵帧和绘制尺寸参数
                var	frame = anim.currentFrame,
                    s = this.scale,
                    x = frame.x * os,
                    y = frame.y * os,
                    w = sprite.width * os,
                    h = sprite.height * os,
                    ox = sprite.offsetX * s,
                    oy = sprite.offsetY * s,
                    dx = entity.x * s,
                    dy = entity.y * s,
                    dw = w * ds,
                    dh = h * ds;

                // 处理实体淡入淡出效果
                if(entity.isFading) {
                    this.context.save();
                    this.context.globalAlpha = entity.fadingAlpha;
                }

                // 在非移动设备上绘制实体名称
                if(!this.mobile && !this.tablet) {
                    this.drawEntityName(entity);
                }

                this.context.save();
                // 根据精灵翻转设置应用变换矩阵
                if(entity.flipSpriteX) {
                    this.context.translate(dx + this.tilesize*s, dy);
                    this.context.scale(-1, 1);
                }
                else if(entity.flipSpriteY) {
                    this.context.translate(dx, dy + dh);
                    this.context.scale(1, -1);
                }
                else {
                    this.context.translate(dx, dy);
                }

                // 绘制可见实体及其相关元素
                if(entity.isVisible()) {
                    // 绘制实体阴影
                    if(entity.hasShadow()) {
                        this.context.drawImage(shadow.image, 0, 0, shadow.width * os, shadow.height * os,
                                               0,
                                               entity.shadowOffsetY * ds,
                                               shadow.width * os * ds, shadow.height * os * ds);
                    }

                    this.context.drawImage(sprite.image, x, y, w, h, ox, oy, dw, dh);

                    // 为特殊物品类型添加闪烁效果
                    if(entity instanceof Item && entity.kind !== Types.Entities.CAKE) {
                        var sparks = this.game.sprites["sparks"];
                        anim = this.game.sparksAnimation;
                        var frame = anim.currentFrame,
                            sx = sparks.width * frame.index * os,
                            sy = sparks.height * anim.row * os,
                            sw = sparks.width * os,
                            sh = sparks.width * os;

                        this.context.drawImage(sparks.image, sx, sy, sw, sh,
                                               sparks.offsetX * s,
                                               sparks.offsetY * s,
                                               sw * ds, sh * ds);
                    }
                }

                // 为角色绘制武器
                if(entity instanceof Character && !entity.isDead && entity.hasWeapon()) {
                    var weapon = this.game.sprites[entity.getWeaponName()];

                    if(weapon) {
                        var weaponAnimData = weapon.animationData[anim.name],
                            index = frame.index < weaponAnimData.length ? frame.index : frame.index % weaponAnimData.length;
                            wx = weapon.width * index * os,
                            wy = weapon.height * anim.row * os,
                            ww = weapon.width * os,
                            wh = weapon.height * os;

                        this.context.drawImage(weapon.image, wx, wy, ww, wh,
                                               weapon.offsetX * s,
                                               weapon.offsetY * s,
                                               ww * ds, wh * ds);
                    }
                }

                this.context.restore();

                // 恢复淡入淡出效果的状态
                if(entity.isFading) {
                    this.context.restore();
                }
            }
        },

        /**
         * 绘制游戏实体
         * 遍历所有可见的游戏实体并根据条件进行绘制
         * @param {boolean} dirtyOnly - 是否只绘制脏标记的实体，true表示只绘制有变化的实体，false表示绘制所有实体
         * @returns {void}
         */
        drawEntities: function(dirtyOnly) {
            var self = this;

            // 遍历所有按深度排序的可见实体
            this.game.forEachVisibleEntityByDepth(function(entity) {
                if(entity.isLoaded) {
                    if(dirtyOnly) {
                        // 只绘制标记为脏（有变化）的实体
                        if(entity.isDirty) {
                            self.drawEntity(entity);

                            // 重置实体的脏状态并保存之前的脏矩形区域
                            entity.isDirty = false;
                            entity.oldDirtyRect = entity.dirtyRect;
                            entity.dirtyRect = null;
                        }
                    } else {
                        // 绘制所有已加载的实体
                        self.drawEntity(entity);
                    }
                }
            });
        },
        
        drawDirtyEntities: function() {
            this.drawEntities(true);
        },
        
        clearDirtyRect: function(r) {
            this.context.clearRect(r.x, r.y, r.w, r.h);
        },
    
        /**
         * 清除所有脏矩形区域，用于游戏渲染优化
         * 遍历可见实体、动画瓦片和目标位置，清除对应的脏矩形区域
         * @param {none}
         * @returns {none}
         */
        clearDirtyRects: function() {
            var self = this,
                count = 0;

            // 遍历所有按深度排序的可见实体，清除其旧的脏矩形区域
            this.game.forEachVisibleEntityByDepth(function(entity) {
                if(entity.isDirty && entity.oldDirtyRect) {
                    self.clearDirtyRect(entity.oldDirtyRect);
                    count += 1;
                }
            });

            // 遍历所有动画瓦片，清除其脏矩形区域
            this.game.forEachAnimatedTile(function(tile) {
                if(tile.isDirty) {
                    self.clearDirtyRect(tile.dirtyRect);
                    count += 1;
                }
            });

            // 如果存在需要清除的目标位置，则清除对应区域
            if(this.game.clearTarget && this.lastTargetPos) {
                var last = this.lastTargetPos;
                    rect = this.getTargetBoundingRect(last.x, last.y);
                
                this.clearDirtyRect(rect);
                this.game.clearTarget = false;
                count += 1;
            }
            
            if(count > 0) {
                //log.debug("count:"+count);
            }
        },
        
        /**
         * 获取实体的边界矩形坐标
         * 计算实体在屏幕上的实际渲染区域，考虑相机位置和缩放比例
         * @param {Object} entity - 需要计算边界的实体对象
         * @returns {Object} 包含实体边界信息的矩形对象，包含x, y, w, h, left, right, top, bottom属性
         */
        getEntityBoundingRect: function(entity) {
            var rect = {},
                s = this.scale,
                spr;

            // 检查玩家是否持有武器，如果有则使用武器精灵，否则使用实体本身的精灵
            if(entity instanceof Player && entity.hasWeapon()) {
                var weapon = this.game.sprites[entity.getWeaponName()];
                spr = weapon;
            } else {
                spr = entity.sprite;
            }

            if(spr) {
                rect.x = (entity.x + spr.offsetX - this.camera.x) * s;
                rect.y = (entity.y + spr.offsetY - this.camera.y) * s;
                rect.w = spr.width * s;
                rect.h = spr.height * s;
                rect.left = rect.x;
                rect.right = rect.x + rect.w;
                rect.top = rect.y;
                rect.bottom = rect.y + rect.h;
            }
            return rect;
        },
        
        /**
         * 获取瓦片的边界矩形
         * 计算指定瓦片在屏幕坐标系中的边界矩形，考虑相机位置和缩放比例
         * @param {Object} tile - 瓦片对象，必须包含index属性表示瓦片索引
         * @returns {Object} 返回包含x, y, w, h, left, right, top, bottom属性的矩形对象
         */
        getTileBoundingRect: function(tile) {
            var rect = {},
                gridW = this.game.map.width,
                s = this.scale,
                ts = this.tilesize,
                cellid = tile.index;

            // 计算瓦片在屏幕坐标系中的位置（考虑相机偏移和缩放）
            rect.x = ((getX(cellid + 1, gridW) * ts) - this.camera.x) * s;
            rect.y = ((Math.floor(cellid / gridW) * ts) - this.camera.y) * s;
            rect.w = ts * s;
            rect.h = ts * s;
            rect.left = rect.x;
            rect.right = rect.x + rect.w;
            rect.top = rect.y;
            rect.bottom = rect.y + rect.h;
            
            return rect;
        },
        
        /**
         * 获取目标位置的边界矩形信息
         * 计算指定坐标位置在屏幕上的实际显示区域（考虑缩放、相机偏移等因素）
         * @param {number} [x] - 目标X坐标，如果未提供则使用游戏选中的X坐标
         * @param {number} [y] - 目标Y坐标，如果未提供则使用游戏选中的Y坐标
         * @returns {Object} 包含边界矩形信息的对象，包含x, y, w, h, left, right, top, bottom属性
         */
        getTargetBoundingRect: function(x, y) {
            var rect = {},
                s = this.scale,
                ts = this.tilesize,
                tx = x || this.game.selectedX,
                ty = y || this.game.selectedY;

            // 计算目标位置在屏幕上的实际坐标和尺寸
            rect.x = ((tx * ts) - this.camera.x) * s;
            rect.y = ((ty * ts) - this.camera.y) * s;
            rect.w = ts * s;
            rect.h = ts * s;
            rect.left = rect.x;
            rect.right = rect.x + rect.w;
            rect.top = rect.y;
            rect.bottom = rect.y + rect.h;
            
            return rect;
        },
        
        /**
         * 判断两个矩形是否相交
         * @param {Object} rect1 - 第一个矩形对象，包含left、right、top、bottom属性
         * @param {Object} rect2 - 第二个矩形对象，包含left、right、top、bottom属性
         * @returns {boolean} 返回true表示两个矩形相交，返回false表示不相交
         */
        isIntersecting: function(rect1, rect2) {
            return !((rect2.left > rect1.right) ||
                     (rect2.right < rect1.left) ||
                     (rect2.top > rect1.bottom) ||
                     (rect2.bottom < rect1.top));
        },
        
        /**
         * 绘制实体名称
         * @param {Object} entity - 要绘制名称的实体对象
         */
        drawEntityName: function(entity) {
            this.context.save();
            // 检查实体是否有名称且为Player实例
            if(entity.name && entity instanceof Player) {
                // 根据是否为当前玩家设置不同的颜色
                var color = (entity.id === this.game.playerId) ? "#fcda5c" : "white";
                this.drawText(entity.name,
                              (entity.x + 8) * this.scale,
                              (entity.y + entity.nameOffsetY) * this.scale,
                              true,
                              color);
            }
            this.context.restore();
        },

        /**
         * 绘制地形函数
         * 遍历可见区域内的所有地砖，绘制非高程地砖和非动画地砖到背景层
         * @param {none}
         * @returns {void}
         */
        drawTerrain: function() {
            var self = this,
                m = this.game.map,
                tilesetwidth = this.tileset.width / m.tilesize;

            // 遍历所有可见的地砖并进行绘制
            this.game.forEachVisibleTile(function (id, index) {
                if(!m.isHighTile(id) && !m.isAnimatedTile(id)) { // 不绘制不必要的地砖
                    self.drawTile(self.background, id, self.tileset, tilesetwidth, m.width, index);
                }
            }, 1);
        },
    
        /**
         * 绘制动画瓦片
         * @param {boolean} dirtyOnly - 是否只绘制脏标记的瓦片，true表示只绘制有变化的瓦片，false表示绘制所有动画瓦片
         * @returns {void}
         */
        drawAnimatedTiles: function(dirtyOnly) {
            var self = this,
                m = this.game.map,
                tilesetwidth = this.tileset.width / m.tilesize;

            // 重置动画瓦片计数器
            this.animatedTileCount = 0;

            // 遍历所有动画瓦片并进行绘制处理
            this.game.forEachAnimatedTile(function (tile) {
                if(dirtyOnly) {
                    // 只绘制标记为脏（有变化）的瓦片
                    if(tile.isDirty) {
                        self.drawTile(self.context, tile.id, self.tileset, tilesetwidth, m.width, tile.index);
                        tile.isDirty = false;
                    }
                } else {
                    // 绘制所有动画瓦片，并增加计数器
                    self.drawTile(self.context, tile.id, self.tileset, tilesetwidth, m.width, tile.index);
                    self.animatedTileCount += 1;
                }
            });
        },
        
        /**
         * 绘制脏区域的动画瓦片
         * 该方法调用drawAnimatedTiles方法，并传入true参数来绘制需要更新的动画瓦片
         * @param {boolean} dirty - 标识是否只绘制脏区域的动画瓦片
         * @returns {void}
         */
        drawDirtyAnimatedTiles: function() {
            this.drawAnimatedTiles(true);
        },
    
        /**
         * 绘制高程瓦片（前景瓦片）
         * 遍历所有可见的瓦片，绘制标记为高程瓦片的瓦片到画布上
         * @param {CanvasRenderingContext2D} ctx - 画布渲染上下文
         */
        drawHighTiles: function(ctx) {
            var self = this,
                m = this.game.map,
                tilesetwidth = this.tileset.width / m.tilesize;

            // 重置高程瓦片计数器
            this.highTileCount = 0;

            // 遍历所有可见瓦片
            this.game.forEachVisibleTile(function (id, index) {
                if(m.isHighTile(id)) {
                    self.drawTile(ctx, id, self.tileset, tilesetwidth, m.width, index);
                    self.highTileCount += 1;
                }
            }, 1);
        },

        drawBackground: function(ctx, color) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        },

        /**
         * 绘制并显示当前帧率(FPS)
         * 计算每秒渲染的帧数并在屏幕上显示
         * @param {none}
         * @returns {none}
         */
        drawFPS: function() {
            // 计算当前时间与上次记录时间的时间差
            var nowTime = new Date(),
                diffTime = nowTime.getTime() - this.lastTime.getTime();

            // 如果时间差大于等于1000毫秒(1秒)，则更新FPS统计
            if (diffTime >= 1000) {
                this.realFPS = this.frameCount;
                this.frameCount = 0;
                this.lastTime = nowTime;
            }
            this.frameCount++;

            // 绘制FPS文本到屏幕指定位置
            // 注释掉的代码是显示实际FPS和最大FPS对比
            // 当前显示的是实际FPS数值
            this.drawText("FPS: " + this.realFPS, 30, 30, false);
        },
    
        /**
         * 绘制调试信息
         * 在游戏画布上显示帧率、动画瓦片数量和高优先级瓦片数量等调试信息
         * 只有在调试信息可见标志为true时才会执行绘制操作
         */
        drawDebugInfo: function() {
            if(this.isDebugInfoVisible) {
                this.drawFPS();
                this.drawText("A: " + this.animatedTileCount, 100, 30, false);
                this.drawText("H: " + this.highTileCount, 140, 30, false);
            }
        },
    
        /**
         * 绘制战斗信息
         * 根据当前缩放比例设置字体大小，遍历并绘制所有战斗信息项
         * @param {Object} this - 当前对象实例，包含scale、context、game等属性
         * @returns {void}
         */
        drawCombatInfo: function() {
            var self = this;

            // 根据缩放比例设置对应的字体大小
            switch(this.scale) {
                case 2: this.setFontSize(20); break;
                case 3: this.setFontSize(30); break;
            }

            // 遍历所有战斗信息并绘制到画布上
            this.game.infoManager.forEachInfo(function(info) {
                self.context.save();
                self.context.globalAlpha = info.opacity;
                self.drawText(info.value, (info.x + 8) * self.scale, Math.floor(info.y * self.scale), true, info.fillColor, info.strokeColor);
                self.context.restore();
            });

            // 恢复初始字体设置
            this.initFont();
        },
    
        /**
         * 设置相机视图变换
         * 通过平移Canvas上下文来实现相机效果，使场景相对于相机位置进行偏移显示
         * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
         * @returns {void}
         */
        setCameraView: function(ctx) {
            ctx.translate(-this.camera.x * this.scale, -this.camera.y * this.scale);
        },
    
        /**
         * 清除画布屏幕
         * 使用CanvasRenderingContext2D的clearRect方法清除整个画布区域
         * @param {CanvasRenderingContext2D} ctx - Canvas的2D渲染上下文对象
         * @returns {void}
         */
        clearScreen: function(ctx) {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
    
        /**
         * 获取玩家图像
         * 将玩家角色、武器和阴影合成到一个canvas中，并返回PNG格式的base64数据URL
         *
         * @returns {string} 返回PNG格式的base64编码图像数据URL
         */
        getPlayerImage: function() {
            var canvas = document.createElement('canvas'),
        	    ctx = canvas.getContext('2d'),
        	    os = this.upscaledRendering ? 1 : this.scale,
        	    player = this.game.player,
        	    sprite = player.getArmorSprite(),
        	    spriteAnim = sprite.animationData["idle_down"],
        	    // character
        	    row = spriteAnim.row,
                w = sprite.width * os,
                h = sprite.height * os,
        	    y = row * h,
        	    // weapon
        	    weapon = this.game.sprites[this.game.player.getWeaponName()],
        	    ww = weapon.width * os,
        	    wh = weapon.height * os,
        	    wy = wh * row,
        	    offsetX = (weapon.offsetX - sprite.offsetX) * os,
        	    offsetY = (weapon.offsetY - sprite.offsetY) * os,
        	    // shadow
        	    shadow = this.game.shadows["small"],
        	    sw = shadow.width * os,
        	    sh = shadow.height * os,
        	    ox = -sprite.offsetX * os;
        	    oy = -sprite.offsetY * os;

        	// 设置canvas尺寸
        	canvas.width = w;
        	canvas.height = h;

        	// 清除画布并绘制阴影、角色和武器
        	ctx.clearRect(0, 0, w, h);
        	ctx.drawImage(shadow.image, 0, 0, sw, sh, ox, oy, sw, sh);
        	ctx.drawImage(sprite.image, 0, y, w, h, 0, 0, w, h);
            ctx.drawImage(weapon.image, 0, wy, ww, wh, offsetX, offsetY, ww, wh);
        
            return canvas.toDataURL("image/png");
        },
    
        /**
         * 渲染静态画布
         * 该函数负责渲染背景层和在移动设备上渲染前景层的静态内容
         * @param {none} - 该函数不接受任何参数
         * @returns {undefined} - 该函数没有返回值
         */
        renderStaticCanvases: function() {
            // 渲染背景层：保存状态 -> 设置相机视图 -> 绘制地形 -> 恢复状态
            this.background.save();
                this.setCameraView(this.background);
                this.drawTerrain();
            this.background.restore();

            // 在移动或平板设备上额外渲染前景层
            if(this.mobile || this.tablet) {
                // 清除前景屏幕并渲染高优先级瓦片
                this.clearScreen(this.foreground);
                this.foreground.save();
                    this.setCameraView(this.foreground);
                    this.drawHighTiles(this.foreground);
                this.foreground.restore();
            }
        },

        /**
         * 渲染当前帧的主函数
         * 根据设备类型（移动端或桌面端）调用相应的渲染方法
         *
         * @param {none} 无参数
         * @returns {void} 无返回值
         */
        renderFrame: function() {
            // 根据设备类型选择不同的渲染方法
            if(this.mobile || this.tablet) {
                this.renderFrameMobile();
            }
            else {
                this.renderFrameDesktop();
            }
        },
    
        /**
         * 渲染桌面版游戏帧
         * 负责绘制游戏场景的所有元素，包括地图、实体、UI等
         * @param {none}
         * @returns {void}
         */
        renderFrameDesktop: function() {
            this.clearScreen(this.context);

            this.context.save();
                this.setCameraView(this.context);
                this.drawAnimatedTiles();

                if(this.game.started) {
                    this.drawSelectedCell();
                    this.drawTargetCell();
                }

                //this.drawOccupiedCells();
                this.drawPathingCells();
                this.drawEntities();
                this.drawCombatInfo();
                this.drawHighTiles(this.context);
            this.context.restore();

            // 绘制覆盖层UI元素
            this.drawCursor();
            this.drawDebugInfo();
        },
    
        /**
         * 渲染移动端帧画面
         * 负责清理脏矩形区域、防止闪烁问题，并在保存和恢复上下文状态下绘制游戏元素
         *
         * @param {none} 无参数
         * @returns {void} 无返回值
         */
        renderFrameMobile: function() {
            // 清理脏矩形区域并防止闪烁问题
            this.clearDirtyRects();
            this.preventFlickeringBug();

            this.context.save();
                this.setCameraView(this.context);

                // 绘制需要更新的动画瓦片、选中单元格和实体
                this.drawDirtyAnimatedTiles();
                this.drawSelectedCell();
                this.drawDirtyEntities();
            this.context.restore();
        },
        
        /**
         * 防止闪烁bug的方法
         * 通过在特定时间间隔内执行填充操作来避免渲染过程中的闪烁问题
         * @param {none} 该方法不接受任何参数
         * @returns {void} 该方法没有返回值
         */
        preventFlickeringBug: function() {
            if(this.fixFlickeringTimer.isOver(this.game.currentTime)) {
                this.background.fillRect(0, 0, 0, 0);
                this.context.fillRect(0, 0, 0, 0);
                this.foreground.fillRect(0, 0, 0, 0);
            }
        }
    });

    var getX = function(id, w) {
        if(id == 0) {
            return 0;
        }
        return (id % w == 0) ? w - 1 : (id % w) - 1;
    };
    
    return Renderer;
});
