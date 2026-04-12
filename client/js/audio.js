
/**
 * 音频管理模块
 * 管理游戏中的音效和背景音乐播放
 */
define(['area'], function(Area) {

    /**
     * AudioManager类 - 音频管理器
     * 负责加载、播放和管理游戏中的音效和背景音乐
     */
    var AudioManager = Class.extend({
        /**
         * 初始化音频管理器
         * @param {Object} game - 游戏实例对象
         */
        init: function(game) {
            var self = this;
        
            this.enabled = true;
            this.extension = Detect.canPlayMP3() ? "mp3" : "ogg";
            this.sounds = {};
            this.game = game;
            this.currentMusic = null;
            this.areas = [];
            this.musicNames = ["village", "beach", "forest", "cave", "desert", "lavaland", "boss"];
            this.soundNames = ["loot", "hit1", "hit2", "hurt", "heal", "chat", "revive", "death", "firefox", "achievement", "kill1", "kill2", "noloot", "teleport", "chest", "npc", "npc-end"];
            
            var loadSoundFiles = function() {
                var counter = _.size(self.soundNames);
                log.info("Loading sound files...");
                _.each(self.soundNames, function(name) { self.loadSound(name, function() {
                        counter -= 1;
                        if(counter === 0) {
                            if(!Detect.isSafari()) { // Disable music on Safari - See bug 738008
                                loadMusicFiles();
                            }
                        }
                    });
                });
            };
            
            var loadMusicFiles = function() {
                if(!self.game.renderer.mobile) { // disable music on mobile devices
                    log.info("Loading music files...");
                    // Load the village music first, as players always start here
                    self.loadMusic(self.musicNames.shift(), function() {
                        // Then, load all the other music files
                        _.each(self.musicNames, function(name) {
                            self.loadMusic(name);
                        });
                    });
                }
            };
        
            if(!(Detect.isSafari() && Detect.isWindows())) {
                loadSoundFiles();
            } else {
                this.enabled = false; // Disable audio on Safari Windows
            }
        },
    
        /**
         * 切换音频开关状态
         * 开启时会恢复背景音乐，关闭时会停止当前音乐
         */
        toggle: function() {
            if(this.enabled) {
                this.enabled = false;
            
                if(this.currentMusic) {
                    this.resetMusic(this.currentMusic);
                }
            } else {
                this.enabled = true;
            
                if(this.currentMusic) {
                    this.currentMusic = null;
                }
                this.updateMusic();
            }
        },
    
        /**
         * 加载音频文件
         * @param {string} basePath - 音频文件基础路径
         * @param {string} name - 音频文件名称
         * @param {Function} loaded_callback - 加载完成回调函数
         * @param {number} channels - 音频通道数量（用于同时播放多个相同音效）
         */
        load: function (basePath, name, loaded_callback, channels) {
            var path = basePath + name + "." + this.extension,
                sound = document.createElement('audio'),
                self = this;
            
            sound.addEventListener('canplaythrough', function (e) {
                this.removeEventListener('canplaythrough', arguments.callee, false);
                log.debug(path + " is ready to play.");
                if(loaded_callback) {
                    loaded_callback();
                }
            }, false);
            sound.addEventListener('error', function (e) {
                log.error("Error: "+ path +" could not be loaded.");
                self.sounds[name] = null;
            }, false);
        
            sound.preload = "auto";
            sound.autobuffer = true;
            sound.src = path;
            sound.load();
        
            this.sounds[name] = [sound];
            _.times(channels - 1, function() {
                self.sounds[name].push(sound.cloneNode(true));
            });
        },
    
        /**
         * 加载音效文件
         * @param {string} name - 音效名称
         * @param {Function} handleLoaded - 加载完成回调函数
         */
        loadSound: function(name, handleLoaded) {
            this.load("audio/sounds/", name, handleLoaded, 4);
        },
    
        /**
         * 加载背景音乐文件
         * @param {string} name - 音乐名称
         * @param {Function} handleLoaded - 加载完成回调函数
         */
        loadMusic: function(name, handleLoaded) {
            this.load("audio/music/", name, handleLoaded, 1);
            var music = this.sounds[name][0];
            music.loop = true;
            music.addEventListener('ended', function() { music.play() }, false);
        },
    
        /**
         * 获取可用的音频对象
         * 优先返回已播放完毕或暂停的音频，实现音频复用
         * @param {string} name - 音频名称
         * @returns {HTMLAudioElement|null} 音频对象，未找到返回null
         */
        getSound: function(name) {
            if(!this.sounds[name]) {
                return null;
            }
            var sound = _.detect(this.sounds[name], function(sound) {
                return sound.ended || sound.paused;
            });
            if(sound && sound.ended) {
                sound.currentTime = 0;
            } else {
                sound = this.sounds[name][0];
            }
            return sound;
        },
    
        /**
         * 播放音效
         * @param {string} name - 音效名称
         */
        playSound: function(name) {
            var sound = this.enabled && this.getSound(name);
            if(sound) {
                sound.play();
            }
        },
    
        /**
         * 添加音乐区域
         * 当玩家进入该区域时播放对应的背景音乐
         * @param {number} x - 区域左上角X坐标
         * @param {number} y - 区域左上角Y坐标
         * @param {number} width - 区域宽度
         * @param {number} height - 区域高度
         * @param {string} musicName - 该区域对应的音乐名称
         */
        addArea: function(x, y, width, height, musicName) {
            var area = new Area(x, y, width, height);
            area.musicName = musicName;
            this.areas.push(area);
        },
    
        /**
         * 获取实体周围的音乐
         * 根据实体位置查找其所在的音乐区域
         * @param {Object} entity - 游戏实体对象
         * @returns {Object|null} 音乐对象 {sound, name}，未找到返回null
         */
        getSurroundingMusic: function(entity) {
            var music = null,
                area = _.detect(this.areas, function(area) {
                    return area.contains(entity);
                });
        
            if(area) {
                music = { sound: this.getSound(area.musicName), name: area.musicName };
            }
            return music;
        },
    
        /**
         * 更新背景音乐
         * 根据玩家当前位置切换背景音乐
         */
        updateMusic: function() {
            if(this.enabled) {
                var music = this.getSurroundingMusic(this.game.player);
        
                if(music) {
                    if(!this.isCurrentMusic(music)) {
                        if(this.currentMusic) {
                            this.fadeOutCurrentMusic();
                        }
                        this.playMusic(music);
                    }
                } else {
                    this.fadeOutCurrentMusic();
                }
            }
        },
    
        /**
         * 检查是否为当前播放的音乐
         * @param {Object} music - 音乐对象
         * @returns {boolean} 是否为当前音乐
         */
        isCurrentMusic: function(music) {
            return this.currentMusic && (music.name === this.currentMusic.name);
        },
    
        /**
         * 播放背景音乐
         * @param {Object} music - 音乐对象 {sound, name}
         */
        playMusic: function(music) {
            if(this.enabled && music && music.sound) {
                if(music.sound.fadingOut) {
                    this.fadeInMusic(music);
                } else {
                    music.sound.volume = 1;
                    music.sound.play();
                }
                this.currentMusic = music;
            }
        },
    
        /**
         * 重置音乐到初始状态
         * @param {Object} music - 音乐对象
         */
        resetMusic: function(music) {
            if(music && music.sound && music.sound.readyState > 0) {
                music.sound.pause();
                music.sound.currentTime = 0;
            }
        },
    
        /**
         * 淡出音乐
         * @param {Object} music - 音乐对象
         * @param {Function} ended_callback - 淡出完成回调函数
         */
        fadeOutMusic: function(music, ended_callback) {
            var self = this;
            if(music && !music.sound.fadingOut) {
                this.clearFadeIn(music);
                music.sound.fadingOut = setInterval(function() {
                    var step = 0.02;
                        volume = music.sound.volume - step;
                
                    if(self.enabled && volume >= step) {
                        music.sound.volume = volume;
                    } else {
                        music.sound.volume = 0;
                        self.clearFadeOut(music);
                        ended_callback(music);
                    }
                }, 50);
            }
        },
    
        /**
         * 淡入音乐
         * @param {Object} music - 音乐对象
         */
        fadeInMusic: function(music) {
            var self = this;
            if(music && !music.sound.fadingIn) {
                this.clearFadeOut(music);
                music.sound.fadingIn = setInterval(function() {
                    var step = 0.01;
                        volume = music.sound.volume + step;

                    if(self.enabled && volume < 1 - step) {
                        music.sound.volume = volume;
                    } else {
                        music.sound.volume = 1;
                        self.clearFadeIn(music);
                    }
                }, 30);
            }
        },
    
        /**
         * 清除淡出效果定时器
         * @param {Object} music - 音乐对象
         */
        clearFadeOut: function(music) {
            if(music.sound.fadingOut) {
                clearInterval(music.sound.fadingOut);
                music.sound.fadingOut = null;
            }
        },
        
        /**
         * 清除淡入效果定时器
         * @param {Object} music - 音乐对象
         */
        clearFadeIn: function(music) {
            if(music.sound.fadingIn) {
                clearInterval(music.sound.fadingIn);
                music.sound.fadingIn = null;
            }
        },
    
        /**
         * 淡出当前背景音乐
         */
        fadeOutCurrentMusic : function() {
            var self = this;
            if(this.currentMusic) {
                this.fadeOutMusic(this.currentMusic, function(music) {
                    self.resetMusic(music);
                });
                this.currentMusic = null;
            }
        }
    });
    
    return AudioManager;
});
