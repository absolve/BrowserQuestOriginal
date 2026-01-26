define(['jquery', 'app'], function($, App) {
    var app, game;

    /**
     * 初始化应用程序，设置各种事件监听器和UI交互功能
     * 包括DOM准备后的初始化、浏览器兼容性处理、按钮点击事件绑定等
     */
    var initApp = function() {
        $(document).ready(function() {
        	app = new App();
            app.center();

            if(Detect.isWindows()) {
                // Workaround for graphical glitches on text
                $('body').addClass('windows');
            }

            if(Detect.isOpera()) {
                // Fix for no pointer events
                $('body').addClass('opera');
            }

            // 处理 parchment 元素上的点击事件，用于切换信用信息和关于页面
            $('body').click(function(event) {
                if($('#parchment').hasClass('credits')) {
                    app.toggleCredits();
                }

                if($('#parchment').hasClass('about')) {
                    app.toggleAbout();
                }
            });

        	// 切换工具栏按钮的激活状态
        	$('.barbutton').click(function() {
        	    $(this).toggleClass('active');
        	});

        	// 聊天按钮点击事件，根据激活状态显示或隐藏聊天界面
        	$('#chatbutton').click(function() {
        	    if($('#chatbutton').hasClass('active')) {
        	        app.showChat();
        	    } else {
                    app.hideChat();
        	    }
        	});

        	// 帮助按钮点击事件，切换关于页面
        	$('#helpbutton').click(function() {
                app.toggleAbout();
        	});

        	// 成就按钮点击事件，切换成就界面并清除闪烁效果
        	$('#achievementsbutton').click(function() {
                app.toggleAchievements();
                if(app.blinkInterval) {
                    clearInterval(app.blinkInterval);
                }
                $(this).removeClass('blink');
        	});

        	// 隐藏所有窗口的指令区域点击事件
        	$('#instructions').click(function() {
                app.hideWindows();
        	});

        	// 玩家数量显示区域点击事件，切换人口信息
        	$('#playercount').click(function() {
        	    app.togglePopulationInfo();
        	});

        	// 人口信息区域点击事件，切换人口信息
        	$('#population').click(function() {
        	    app.togglePopulationInfo();
        	});

        	// 阻止可点击元素的事件冒泡
        	$('.clickable').click(function(event) {
                event.stopPropagation();
        	});

        	// 信用信息切换按钮点击事件
        	$('#toggle-credits').click(function() {
        	    app.toggleCredits();
        	});

        	// 创建新角色确认按钮点击事件
        	$('#create-new span').click(function() {
        	    app.animateParchment('loadcharacter', 'confirmation');
        	});

        	// 删除按钮点击事件，清除存储数据并切换到创建角色界面
        	$('.delete').click(function() {
                app.storage.clear();
        	    app.animateParchment('confirmation', 'createcharacter');
        	});

        	// 取消按钮点击事件，从确认界面切换回加载角色界面
        	$('#cancel span').click(function() {
        	    app.animateParchment('confirmation', 'loadcharacter');
        	});

        	// 丝带点击事件，切换关于页面
        	$('.ribbon').click(function() {
        	    app.toggleAbout();
        	});

            // 名称输入框按键事件，用于切换按钮状态
            $('#nameinput').bind("keyup", function() {
                app.toggleButton();
            });

            // 上一页按钮点击事件，用于成就页面导航
            $('#previous').click(function() {
                var $achievements = $('#achievements');

                if(app.currentPage === 1) {
                    return false;
                } else {
                    app.currentPage -= 1;
                    $achievements.removeClass().addClass('active page' + app.currentPage);
                }
            });

            // 下一页按钮点击事件，用于成就页面导航
            $('#next').click(function() {
                var $achievements = $('#achievements'),
                    $lists = $('#lists'),
                    nbPages = $lists.children('ul').length;

                if(app.currentPage === nbPages) {
                    return false;
                } else {
                    app.currentPage += 1;
                    $achievements.removeClass().addClass('active page' + app.currentPage);
                }
            });

            // 通知区域过渡结束事件绑定
            $('#notifications div').bind(TRANSITIONEND, app.resetMessagesPosition.bind(app));

            // 关闭按钮点击事件，隐藏所有窗口
            $('.close').click(function() {
                app.hideWindows();
            });

            // Twitter链接点击事件，打开Twitter弹窗
            $('.twitter').click(function() {
                var url = $(this).attr('href');

               app.openPopup('twitter', url);
               return false;
            });

            // Facebook链接点击事件，打开Facebook弹窗
            $('.facebook').click(function() {
                var url = $(this).attr('href');

               app.openPopup('facebook', url);
               return false;
            });

            // 根据存储的数据设置玩家名称和头像
            var data = app.storage.data;
    		if(data.hasAlreadyPlayed) {
    		    if(data.player.name && data.player.name !== "") {
		            $('#playername').html(data.player.name);
    		        $('#playerimage').attr('src', data.player.image);
    		    }
    		}

    		// 游戏开始按钮点击事件，尝试启动游戏
    		$('.play div').click(function(event) {
                var nameFromInput = $('#nameinput').val(),
                    nameFromStorage = $('#playername').html(),
                    name = nameFromInput || nameFromStorage;

                app.tryStartingGame(name);
            });

            document.addEventListener("touchstart", function() {},false);

            // 绑定调整UI大小的过渡事件
            $('#resize-check').bind("transitionend", app.resizeUi.bind(app));
            $('#resize-check').bind("webkitTransitionEnd", app.resizeUi.bind(app));
            $('#resize-check').bind("oTransitionEnd", app.resizeUi.bind(app));

            log.info("App initialized.");

            initGame();
        });
    };

    /**
     * 初始化游戏实例，设置游戏画布和事件监听器
     * 加载地图、绑定游戏事件回调函数、设置用户界面交互
     */
    var initGame = function() {
        require(['game'], function(Game) {

            var canvas = document.getElementById("entities"),
        	    background = document.getElementById("background"),
        	    foreground = document.getElementById("foreground"),
        	    input = document.getElementById("chatinput");

    		game = new Game(app);
    		game.setup('#bubbles', canvas, background, foreground, input);
    		game.setStorage(app.storage);
    		app.setGame(game);

    		if(app.isDesktop && app.supportsWorkers) {
    		    game.loadMap();
    		}

    		// 游戏开始时初始化装备图标
    		game.onGameStart(function() {
                app.initEquipmentIcons();
    		});

    		// 断开连接时显示错误消息
    		game.onDisconnect(function(message) {
    		    $('#death').find('p').html(message+"<em>Please reload the page.</em>");
    		    $('#respawn').hide();
    		});

    		// 玩家死亡时显示死亡界面
    		game.onPlayerDeath(function() {
    		    if($('body').hasClass('credits')) {
    		        $('body').removeClass('credits');
    		    }
                $('body').addClass('death');
    		});

    		// 玩家装备变化时重新初始化装备图标
    		game.onPlayerEquipmentChange(function() {
    		    app.initEquipmentIcons();
    		});

    		// 玩家无敌状态切换时更新生命值条样式
    		game.onPlayerInvincible(function() {
    		    $('#hitpoints').toggleClass('invincible');
    		});

    		// 玩家数量变化时更新显示
    		game.onNbPlayersChange(function(worldPlayers, totalPlayers) {
    		    var setWorldPlayersString = function(string) {
        		        $("#instance-population").find("span:nth-child(2)").text(string);
        		        $("#playercount").find("span:nth-child(2)").text(string);
        		    },
        		    setTotalPlayersString = function(string) {
        		        $("#world-population").find("span:nth-child(2)").text(string);
        		    };

    		    $("#playercount").find("span.count").text(worldPlayers);

    		    $("#instance-population").find("span").text(worldPlayers);
    		    if(worldPlayers == 1) {
    		        setWorldPlayersString("player");
    		    } else {
    		        setWorldPlayersString("players");
    		    }

    		    $("#world-population").find("span").text(totalPlayers);
    		    if(totalPlayers == 1) {
    		        setTotalPlayersString("player");
    		    } else {
    		        setTotalPlayersString("players");
    		    }
    		});

    		// 解锁成就时更新应用界面
    		game.onAchievementUnlock(function(id, name, description) {
    		    app.unlockAchievement(id, name);
    		});

    		// 接收到通知时显示消息
    		game.onNotification(function(message) {
    		    app.showMessage(message);
    		});

            app.initHealthBar();

            $('#nameinput').val('');
    		$('#chatbox').attr('value', '');

        	// 移动设备触摸事件处理
        	if(game.renderer.mobile || game.renderer.tablet) {
                $('#foreground').bind('touchstart', function(event) {
                    app.center();
                    app.setMouseCoordinates(event.originalEvent.touches[0]);
                	game.click();
                	app.hideWindows();
                });
            } else {
                // 桌面设备点击事件处理
                $('#foreground').click(function(event) {
                    app.center();
                    app.setMouseCoordinates(event);
                    if(game) {
                	    game.click();
                	}
                	app.hideWindows();
                    // $('#chatinput').focus();
                });
            }

            // 重新绑定 body 点击事件以处理游戏中的特殊逻辑
            $('body').unbind('click');
            $('body').click(function(event) {
                var hasClosedParchment = false;

                if($('#parchment').hasClass('credits')) {
                    if(game.started) {
                        app.closeInGameCredits();
                        hasClosedParchment = true;
                    } else {
                        app.toggleCredits();
                    }
                }

                if($('#parchment').hasClass('about')) {
                    if(game.started) {
                        app.closeInGameAbout();
                        hasClosedParchment = true;
                    } else {
                        app.toggleAbout();
                    }
                }

                if(game.started && !game.renderer.mobile && game.player && !hasClosedParchment) {
                    game.click();
                }
            });

            // 复活按钮点击事件
            $('#respawn').click(function(event) {
                game.audioManager.playSound("revive");
                game.restart();
                $('body').removeClass('death');
            });

            // 鼠标移动事件处理
            $(document).mousemove(function(event) {
            	app.setMouseCoordinates(event);
            	if(game.started) {
            	    game.movecursor();
            	}
            });

            // 键盘按下事件处理（Enter键切换聊天）
            $(document).keydown(function(e) {
            	var key = e.which;

                if(key === 13) {
                    if($('#chatbox').hasClass('active')) {
                        app.hideChat();
                    } else {
                        app.showChat();
                    }
                }
            });

            // 聊天输入框键盘事件处理
            $('#chatinput').keydown(function(e) {
                var key = e.which,
                    chat_el = $('#chatinput');

                if(key === 13) {
                    if(chat_el.val().replace(/\s/g, '').length) {
                        if(game.player) {
                            game.say(chat_el.val());
                        }
                        app.hideChat();
                        $('#foreground').focus();
                        return false;
                    } else {
                        app.hideChat();
                        return false;
                    }
                    chat_el.val("");
                }

                if(key === 27) {
                    app.hideChat();
                    return false;
                }
            });

            // 名称输入框按键事件处理
            $('#nameinput').keypress(function(event) {
                var name_el = $('#nameinput'),
                    name = name_el.val();


                if(event.keyCode === 13) {
                    if(name !== '') {
                        app.tryStartingGame(name, function() {
                            name_el.blur(); // exit keyboard on mobile
                        });
                        return false; // prevent form submit
                    } else {
                        return false; // prevent form submit
                    }
                }
            });

            // 静音按钮点击事件
            $('#mutebutton').click(function() {
                game.audioManager.toggle();
            });

            // 全局键盘事件处理
            $(document).bind("keydown", function(e) {
            	var key = e.which,
            	    $chat = $('#chatinput');

                if($('#chatinput:focus').size() == 0 && $('#nameinput:focus').size() == 0) {
                    if(key === 13) { // Enter
                        if(game.ready) {
                            $chat.focus();
                            return false;
                        }
                    }
                    if(key === 32) { // Space
                        // game.togglePathingGrid();
                        return false;
                    }
                    if(key === 70) { // F
                        // game.toggleDebugInfo();
                        return false;
                    }
                    if(key === 27) { // ESC
                        app.hideWindows();
                        _.each(game.player.attackers, function(attacker) {
                            attacker.stop();
                        });
                        return false;
                    }
                    if(key === 65) { // a
                        // game.player.hit();
                        return false;
                    }
                } else {
                    if(key === 13 && game.ready) {
                        $chat.focus();
                        return false;
                    }
                }
            });

            if(game.renderer.tablet) {
                $('body').addClass('tablet');
            }
        });
    };

    initApp();
});

