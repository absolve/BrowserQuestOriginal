define(['jquery', 'storage'], function($, Storage) {

    /**
     * App类 - 主应用程序控制器
     * 负责管理游戏启动流程、UI交互、状态管理和用户界面控制
     */
    var App = Class.extend({
        /**
         * 初始化App实例
         * 设置初始状态变量、存储对象和定时器
         */
        init: function() {
            this.currentPage = 1;
            this.blinkInterval = null;
            this.previousState = null;
            this.isParchmentReady = true;
            this.ready = false;
            this.storage = new Storage();
            this.watchNameInputInterval = setInterval(this.toggleButton.bind(this), 100);
            this.$playButton = $('.play'),
            this.$playDiv = $('.play div');
        },
        
        /**
         * 设置游戏实例并初始化设备类型检测
         * @param {Object} game - 游戏实例对象
         */
        setGame: function(game) {
            this.game = game;
            this.isMobile = this.game.renderer.mobile;
            this.isTablet = this.game.renderer.tablet;
            this.isDesktop = !(this.isMobile || this.isTablet);
            this.supportsWorkers = !!window.Worker;
            this.ready = true;
        },
    
        /**
         * 将页面滚动到顶部位置
         * 用于移动端浏览器地址栏隐藏
         */
        center: function() {
            window.scrollTo(0, 1);
        },
        
        /**
         * 检查是否可以开始游戏
         * @returns {boolean} 是否可以开始游戏
         */
        canStartGame: function() {
            if(this.isDesktop) {
                return (this.game && this.game.map && this.game.map.isLoaded);
            } else {
                return this.game;
            }
        },
        
        /**
         * 尝试启动游戏
         * 如果游戏资源未加载完成，会等待直到可以启动
         * @param {string} username - 用户名
         * @param {Function} starting_callback - 启动回调函数
         */
        tryStartingGame: function(username, starting_callback) {
            var self = this,
                $play = this.$playButton;
            
            if(username !== '') {
                if(!this.ready || !this.canStartGame()) {
                    if(!this.isMobile) {
                        // on desktop and tablets, add a spinner to the play button
                        $play.addClass('loading');
                    }
                    this.$playDiv.unbind('click');
                    var watchCanStart = setInterval(function() {
                        log.debug("waiting...");
                        if(self.canStartGame()) {
                            setTimeout(function() {
                                if(!self.isMobile) {
                                    $play.removeClass('loading');
                                }
                            }, 1500);
                            clearInterval(watchCanStart);
                            self.startGame(username, starting_callback);
                        }
                    }, 100);
                } else {
                    this.$playDiv.unbind('click');
                    this.startGame(username, starting_callback);
                }      
            }
        },
        
        /**
         * 启动游戏
         * 隐藏介绍界面并开始游戏
         * @param {string} username - 用户名
         * @param {Function} starting_callback - 启动回调函数
         */
        startGame: function(username, starting_callback) {
            var self = this;
            
            if(starting_callback) {
                starting_callback();
            }
            this.hideIntro(function() {
                if(!self.isDesktop) {
                    // On mobile and tablet we load the map after the player has clicked
                    // on the PLAY button instead of loading it in a web worker.
                    self.game.loadMap();
                }
                self.start(username);
            });
        },

        /**
         * 开始游戏核心逻辑
         * 设置服务器选项并运行游戏
         * @param {string} username - 用户名
         */
        start: function(username) {
            var self = this,
                firstTimePlaying = !self.storage.hasAlreadyPlayed();
            
            if(username && !this.game.started) {
                var optionsSet = false,
                    config = this.config;

                //>>includeStart("devHost", pragmas.devHost);
                if(config.local) {
                    log.debug("Starting game with local dev config.");
                    this.game.setServerOptions(config.local.host, config.local.port, username);
                } else {
                    log.debug("Starting game with default dev config.");
                    this.game.setServerOptions(config.dev.host, config.dev.port, username);
                }
                optionsSet = true;
                //>>includeEnd("devHost");
                
                //>>includeStart("prodHost", pragmas.prodHost);
                if(!optionsSet) {
                    log.debug("Starting game with build config.");
                    this.game.setServerOptions(config.build.host, config.build.port, username);
                }
                //>>includeEnd("prodHost");

                this.center();
                this.game.run(function() {
                    $('body').addClass('started');
                	if(firstTimePlaying) {
                	    self.toggleInstructions();
                	}
            	});
            }
        },

        /**
         * 设置鼠标坐标
         * 根据容器偏移量和缩放因子计算鼠标在游戏区域内的精确位置
         * @param {Event} event - 鼠标事件对象
         */
        setMouseCoordinates: function(event) {
            var gamePos = $('#container').offset(),
                scale = this.game.renderer.getScaleFactor(),
                width = this.game.renderer.getWidth(),
                height = this.game.renderer.getHeight(),
                mouse = this.game.mouse;

            mouse.x = event.pageX - gamePos.left - (this.isMobile ? 0 : 5 * scale);
        	mouse.y = event.pageY - gamePos.top - (this.isMobile ? 0 : 7 * scale);

        	if(mouse.x <= 0) {
        	    mouse.x = 0;
        	} else if(mouse.x >= width) {
        	    mouse.x = width - 1;
        	}

        	if(mouse.y <= 0) {
        	    mouse.y = 0;
        	} else if(mouse.y >= height) {
        	    mouse.y = height - 1;
        	}
        },

        /**
         * 初始化生命值条
         * 绑定生命值变化事件处理器和受伤闪烁效果
         */
        initHealthBar: function() {
            var scale = this.game.renderer.getScaleFactor(),
                healthMaxWidth = $("#healthbar").width() - (12 * scale);

        	this.game.onPlayerHealthChange(function(hp, maxHp) {
        	    var barWidth = Math.round((healthMaxWidth / maxHp) * (hp > 0 ? hp : 0));
        	    $("#hitpoints").css('width', barWidth + "px");
        	});

        	this.game.onPlayerHurt(this.blinkHealthBar.bind(this));
        },

        /**
         * 生命值条闪烁效果
         * 当玩家受到伤害时触发生命值条变白闪烁效果
         */
        blinkHealthBar: function() {
            var $hitpoints = $('#hitpoints');

            $hitpoints.addClass('white');
            setTimeout(function() {
                $hitpoints.removeClass('white');
            }, 500)
        },

        /**
         * 切换按钮状态
         * 根据输入框内容启用或禁用创建角色按钮
         */
        toggleButton: function() {
            var name = $('#parchment input').val(),
                $play = $('#createcharacter .play');
    
            if(name && name.length > 0) {
                $play.removeClass('disabled');
                $('#character').removeClass('disabled');
            } else {
                $play.addClass('disabled');
                $('#character').addClass('disabled');
            }
        },

        /**
         * 隐藏介绍界面
         * 清理定时器并切换到游戏界面
         * @param {Function} hidden_callback - 隐藏完成后的回调函数
         */
        hideIntro: function(hidden_callback) {
            clearInterval(this.watchNameInputInterval);
            $('body').removeClass('intro');
            setTimeout(function() {
                $('body').addClass('game');
                hidden_callback();
            }, 1000);
        },

        /**
         * 显示聊天界面
         * 在游戏已启动状态下激活聊天功能
         */
        showChat: function() {
            if(this.game.started) {
                $('#chatbox').addClass('active');
                $('#chatinput').focus();
                $('#chatbutton').addClass('active');
            }
        },

        /**
         * 隐藏聊天界面
         * 在游戏已启动状态下关闭聊天功能
         */
        hideChat: function() {
            if(this.game.started) {
                $('#chatbox').removeClass('active');
                $('#chatinput').blur();
                $('#chatbutton').removeClass('active');
            }
        },

        /**
         * 切换说明界面显示/隐藏
         * 处理与成就界面的互斥关系
         */
        toggleInstructions: function() {
            if($('#achievements').hasClass('active')) {
        	    this.toggleAchievements();
        	    $('#achievementsbutton').removeClass('active');
        	}
            $('#instructions').toggleClass('active');
        },

        /**
         * 切换成就界面显示/隐藏
         * 处理与说明界面的互斥关系
         */
        toggleAchievements: function() {
        	if($('#instructions').hasClass('active')) {
        	    this.toggleInstructions();
        	    $('#helpbutton').removeClass('active');
        	}
            this.resetPage();
            $('#achievements').toggleClass('active');
        },

        /**
         * 重置成就页面到第一页
         * 处理页面切换动画完成后的状态重置
         */
        resetPage: function() {
            var self = this,
                $achievements = $('#achievements');

            if($achievements.hasClass('active')) {
                $achievements.bind(TRANSITIONEND, function() {
                    $achievements.removeClass('page' + self.currentPage).addClass('page1');
                    self.currentPage = 1;
                    $achievements.unbind(TRANSITIONEND);
                });
            }
        },

        /**
         * 初始化装备图标
         * 根据玩家当前武器和护甲设置对应的图标背景
         */
        initEquipmentIcons: function() {
            var scale = this.game.renderer.getScaleFactor();
            var getIconPath = function(spriteName) {
                    return 'img/'+ scale +'/item-' + spriteName + '.png';
                },
                weapon = this.game.player.getWeaponName(),
                armor = this.game.player.getSpriteName(),
                weaponPath = getIconPath(weapon),
                armorPath = getIconPath(armor);

            $('#weapon').css('background-image', 'url("' + weaponPath + '")');
            if(armor !== 'firefox') {
                $('#armor').css('background-image', 'url("' + armorPath + '")');
            }
        },

        /**
         * 隐藏所有打开的窗口
         * 关闭成就、说明、关于和信用窗口
         */
        hideWindows: function() {
            if($('#achievements').hasClass('active')) {
        	    this.toggleAchievements();
        	    $('#achievementsbutton').removeClass('active');
        	}
        	if($('#instructions').hasClass('active')) {
        	    this.toggleInstructions();
        	    $('#helpbutton').removeClass('active');
        	}
        	if($('body').hasClass('credits')) {
        	    this.closeInGameCredits();
        	}
        	if($('body').hasClass('about')) {
        	    this.closeInGameAbout();
        	}
        },

        /**
         * 显示成就解锁通知
         * 创建视觉通知并处理首次解锁的特殊效果
         * @param {number} id - 成就ID
         * @param {string} name - 成就名称
         */
        showAchievementNotification: function(id, name) {
            var $notif = $('#achievement-notification'),
                $name = $notif.find('.name'),
                $button = $('#achievementsbutton');

            $notif.removeClass().addClass('active achievement' + id);
            $name.text(name);
            if(this.game.storage.getAchievementCount() === 1) {
                this.blinkInterval = setInterval(function() {
                    $button.toggleClass('blink');
                }, 500);
            }
            setTimeout(function() {
                $notif.removeClass('active');
                $button.removeClass('blink');
            }, 5000);
        },

        /**
         * 显示已解锁的成就
         * 更新成就列表中对应成就的状态
         * @param {number} id - 成就ID
         */
        displayUnlockedAchievement: function(id) {
            var $achievement = $('#achievements li.achievement' + id);

            var achievement = this.game.getAchievementById(id);
            if(achievement && achievement.hidden) {
                this.setAchievementData($achievement, achievement.name, achievement.desc);
            }
            $achievement.addClass('unlocked');
        },

        /**
         * 解锁成就
         * 触发通知显示、列表更新和计数器更新
         * @param {number} id - 成就ID
         * @param {string} name - 成就名称
         */
        unlockAchievement: function(id, name) {
            this.showAchievementNotification(id, name);
            this.displayUnlockedAchievement(id);

            var nb = parseInt($('#unlocked-achievements').text());
            $('#unlocked-achievements').text(nb + 1);
        },

        /**
         * 初始化成就列表
         * 动态创建成就列表项并绑定社交分享功能
         * @param {Array} achievements - 成就数组
         */
        initAchievementList: function(achievements) {
            var self = this,
                $lists = $('#lists'),
                $page = $('#page-tmpl'),
                $achievement = $('#achievement-tmpl'),
                page = 0,
                count = 0,
                $p = null;

            _.each(achievements, function(achievement) {
                count++;
    
                var $a = $achievement.clone();
                $a.removeAttr('id');
                $a.addClass('achievement'+count);
                if(!achievement.hidden) {
                    self.setAchievementData($a, achievement.name, achievement.desc);
                }
                $a.find('.twitter').attr('href', 'http://twitter.com/share?url=http%3A%2F%2Fbrowserquest.mozilla.org&text=I%20unlocked%20the%20%27'+ achievement.name +'%27%20achievement%20on%20Mozilla%27s%20%23BrowserQuest%21&related=glecollinet:Creators%20of%20BrowserQuest%2Cwhatthefranck');
                $a.show();
                $a.find('a').click(function() {
                     var url = $(this).attr('href');

                    self.openPopup('twitter', url);
                    return false;
                });
    
                if((count - 1) % 4 === 0) {
                    page++;
                    $p = $page.clone();
                    $p.attr('id', 'page'+page);
                    $p.show();
                    $lists.append($p);
                }
                $p.append($a);
            });

            $('#total-achievements').text($('#achievements').find('li').length);
        },

        /**
         * 初始化已解锁成就
         * 根据已解锁成就ID列表更新界面显示
         * @param {Array} ids - 已解锁成就ID数组
         */
        initUnlockedAchievements: function(ids) {
            var self = this;
            
            _.each(ids, function(id) {
                self.displayUnlockedAchievement(id);
            });
            $('#unlocked-achievements').text(ids.length);
        },

        /**
         * 设置成就数据
         * 更新成就元素的名称和描述文本
         * @param {jQuery} $el - jQuery元素对象
         * @param {string} name - 成就名称
         * @param {string} desc - 成就描述
         */
        setAchievementData: function($el, name, desc) {
            $el.find('.achievement-name').html(name);
            $el.find('.achievement-description').html(desc);
        },

        /**
         * 切换信用信息显示/隐藏
         * 处理游戏内外不同状态下的信用界面切换
         */
        toggleCredits: function() {
            var currentState = $('#parchment').attr('class');

            if(this.game.started) {
                $('#parchment').removeClass().addClass('credits');
                
                $('body').toggleClass('credits');
                    
                if(!this.game.player) {
                    $('body').toggleClass('death');
                }
                if($('body').hasClass('about')) {
                    this.closeInGameAbout();
                    $('#helpbutton').removeClass('active');
                }
            } else {
                if(currentState !== 'animate') {
                    if(currentState === 'credits') {
                        this.animateParchment(currentState, this.previousState);
                    } else {
            	        this.animateParchment(currentState, 'credits');
            	        this.previousState = currentState;
            	    }
                }
            }
        },
        
        /**
         * 切换关于信息显示/隐藏
         * 处理游戏内外不同状态下的关于界面切换
         */
        toggleAbout: function() {
            var currentState = $('#parchment').attr('class');

            if(this.game.started) {
                $('#parchment').removeClass().addClass('about');
                $('body').toggleClass('about');
                if(!this.game.player) {
                    $('body').toggleClass('death');
                }
                if($('body').hasClass('credits')) {
                    this.closeInGameCredits();
                }
            } else {
                if(currentState !== 'animate') {
                    if(currentState === 'about') {
                        if(localStorage && localStorage.data) {
                            this.animateParchment(currentState, 'loadcharacter');
                        } else {
                            this.animateParchment(currentState, 'createcharacter');
                        }
                    } else {
            	        this.animateParchment(currentState, 'about');
            	        this.previousState = currentState;
            	    }
                }
            }
        },

        /**
         * 关闭游戏内信用窗口
         * 重置相关CSS类和死亡状态
         */
        closeInGameCredits: function() {
            $('body').removeClass('credits');
            $('#parchment').removeClass('credits');
            if(!this.game.player) {
                $('body').addClass('death');
            }
        },
        
        /**
         * 关闭游戏内关于窗口
         * 重置相关CSS类、死亡状态和帮助按钮状态
         */
        closeInGameAbout: function() {
            $('body').removeClass('about');
            $('#parchment').removeClass('about');
            if(!this.game.player) {
                $('body').addClass('death');
            }
            $('#helpbutton').removeClass('active');
        },
        
        /**
         * 切换人口信息显示/隐藏
         * 控制人口统计信息的可见性
         */
        togglePopulationInfo: function() {
            $('#population').toggleClass('visible');
        },

        /**
         * 打开弹出窗口
         * 创建指定类型的社交分享弹窗并居中定位
         * @param {string} type - 弹窗类型 ('twitter' 或 'facebook')
         * @param {string} url - 分享URL
         */
        openPopup: function(type, url) {
            var h = $(window).height(),
                w = $(window).width(),
                popupHeight,
                popupWidth,
                top,
                left;

            switch(type) {
                case 'twitter':
                    popupHeight = 450;
                    popupWidth = 550;
                    break;
                case 'facebook':
                    popupHeight = 400;
                    popupWidth = 580;
                    break;
            }

            top = (h / 2) - (popupHeight / 2);
            left = (w / 2) - (popupWidth / 2);

        	newwindow = window.open(url,'name','height=' + popupHeight + ',width=' + popupWidth + ',top=' + top + ',left=' + left);
        	if (window.focus) {newwindow.focus()}
        },

        /**
         * 动画化羊皮纸切换
         * 处理不同设备类型下的界面切换动画效果
         * @param {string} origin - 源状态类名
         * @param {string} destination - 目标状态类名
         */
        animateParchment: function(origin, destination) {
            let self = this,
                $parchment = $('#parchment'),
                duration = 1;

            if(this.isMobile) {
                $parchment.removeClass(origin).addClass(destination);
            } else {
                if(this.isParchmentReady) {
                    if(this.isTablet) {
                        duration = 0;
                    }
                    this.isParchmentReady = !this.isParchmentReady;
        
                    $parchment.toggleClass('animate');
                    $parchment.removeClass(origin);

                    setTimeout(function() {
                        $('#parchment').toggleClass('animate');
                        $parchment.addClass(destination);
                    }, duration * 1000);
        
                    setTimeout(function() {
                        self.isParchmentReady = !self.isParchmentReady;
                    }, duration * 1000);
        	    }
            }
        },

        /**
         * 动画化消息显示
         * 将通知消息移动到屏幕顶部显示
         */
        animateMessages: function() {
            let $messages = $('#notifications div');

            $messages.addClass('top');
        },

        /**
         * 重置消息位置
         * 将消息从顶部移回原始位置并交换消息内容
         */
        resetMessagesPosition: function() {
            let message = $('#message2').text();

            $('#notifications div').removeClass('top');
            $('#message2').text('');
            $('#message1').text(message);
        },

        /**
         * 显示消息通知
         * 在界面上显示临时消息并设置自动隐藏计时器
         * @param {string} message - 要显示的消息内容
         */
        showMessage: function(message) {
            let $wrapper = $('#notifications div'),
                $message = $('#notifications #message2');

            this.animateMessages();
            $message.text(message);
            if(this.messageTimer) {
                this.resetMessageTimer();
            }

            this.messageTimer = setTimeout(function() {
                    $wrapper.addClass('top');
            }, 5000);
        },

        /**
         * 重置消息计时器
         * 清除当前的消息自动隐藏定时器
         */
        resetMessageTimer: function() {
            clearTimeout(this.messageTimer);
        },
        
        /**
         * 调整UI尺寸
         * 根据当前游戏状态重新调整渲染器和UI元素尺寸
         */
        resizeUi: function() {
            if(this.game) {
                if(this.game.started) {
                    this.game.resize();
                    this.initHealthBar();
                    this.game.updateBars();
                } else {
                    var newScale = this.game.renderer.getScaleFactor();
                    this.game.renderer.rescale(newScale);
                }
            } 
        }
    });

    return App;
});
