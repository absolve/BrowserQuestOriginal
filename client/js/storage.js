define(function() {

    /**
     * Storage类用于管理游戏数据的本地存储，包括玩家信息、成就统计等
     */
    var Storage = Class.extend({
        /**
         * 初始化Storage实例，从localStorage加载数据或重置为默认数据
         */
        init: function() {
            if(this.hasLocalStorage() && localStorage.data) {
                this.data = JSON.parse(localStorage.data);
            } else {
                this.resetData();
            }
        },

        /**
         * 重置数据为默认状态
         */
        resetData: function() {
            this.data = {
                hasAlreadyPlayed: false,
                player: {
                    name: "",
                    weapon: "",
                    armor: "",
                    image: ""
                },
                achievements: {
                    unlocked: [],
                    ratCount: 0,
                    skeletonCount: 0,
                    totalKills: 0,
                    totalDmg: 0,
                    totalRevives: 0
                }
            };
        },

        /**
         * 检查浏览器是否支持localStorage
         * @returns {boolean} 浏览器是否支持localStorage
         */
        hasLocalStorage: function() {
            return Modernizr.localstorage;
        },

        /**
         * 将当前数据保存到localStorage
         */
        save: function() {
            if(this.hasLocalStorage()) {
                localStorage.data = JSON.stringify(this.data);
            }
        },

        /**
         * 清空localStorage中的数据并重置为默认状态
         */
        clear: function() {
            if(this.hasLocalStorage()) {
                localStorage.data = "";
                this.resetData();
            }
        },

        // Player

        /**
         * 检查玩家是否已经玩过游戏
         * @returns {boolean} 玩家是否已经玩过游戏
         */
        hasAlreadyPlayed: function() {
            return this.data.hasAlreadyPlayed;
        },

        /**
         * 初始化玩家信息
         * @param {string} name 玩家姓名
         */
        initPlayer: function(name) {
            this.data.hasAlreadyPlayed = true;
            this.setPlayerName(name);
        },

        /**
         * 设置玩家姓名
         * @param {string} name 玩家姓名
         */
        setPlayerName: function(name) {
            this.data.player.name = name;
            this.save();
        },

        /**
         * 设置玩家头像
         * @param {string} img 玩家头像路径
         */
        setPlayerImage: function(img) {
            this.data.player.image = img;
            this.save();
        },

        /**
         * 设置玩家护甲
         * @param {string} armor 玩家护甲类型
         */
        setPlayerArmor: function(armor) {
            this.data.player.armor = armor;
            this.save();
        },

        /**
         * 设置玩家武器
         * @param {string} weapon 玩家武器类型
         */
        setPlayerWeapon: function(weapon) {
            this.data.player.weapon = weapon;
            this.save();
        },

        /**
         * 批量设置玩家外观信息
         * @param {string} img 玩家头像路径
         * @param {string} armor 玩家护甲类型
         * @param {string} weapon 玩家武器类型
         */
        savePlayer: function(img, armor, weapon) {
            this.setPlayerImage(img);
            this.setPlayerArmor(armor);
            this.setPlayerWeapon(weapon);
        },

        // Achievements

        /**
         * 检查指定ID的成就是否已解锁
         * @param {number|string} id 成就ID
         * @returns {boolean} 成就是否已解锁
         */
        hasUnlockedAchievement: function(id) {
            return _.include(this.data.achievements.unlocked, id);
        },

        /**
         * 解锁指定ID的成就
         * @param {number|string} id 成就ID
         * @returns {boolean} 是否成功解锁成就（如果已解锁则返回false）
         */
        unlockAchievement: function(id) {
            if(!this.hasUnlockedAchievement(id)) {
                this.data.achievements.unlocked.push(id);
                this.save();
                return true;
            }
            return false;
        },

        /**
         * 获取已解锁成就的数量
         * @returns {number} 已解锁成就数量
         */
        getAchievementCount: function() {
            return _.size(this.data.achievements.unlocked);
        },

        // Angry rats
        /**
         * 获取击杀老鼠的数量
         * @returns {number} 击杀老鼠数量
         */
        getRatCount: function() {
            return this.data.achievements.ratCount;
        },

        /**
         * 增加击杀老鼠的数量（最多10只）
         */
        incrementRatCount: function() {
            if(this.data.achievements.ratCount < 10) {
                this.data.achievements.ratCount++;
                this.save();
            }
        },

        // Skull Collector
        /**
         * 获取收集骷髅的数量
         * @returns {number} 收集骷髅数量
         */
        getSkeletonCount: function() {
            return this.data.achievements.skeletonCount;
        },

        /**
         * 增加收集骷髅的数量（最多10个）
         */
        incrementSkeletonCount: function() {
            if(this.data.achievements.skeletonCount < 10) {
                this.data.achievements.skeletonCount++;
                this.save();
            }
        },

        // Meatshield
        /**
         * 获取总受伤害数值
         * @returns {number} 总受伤害数值
         */
        getTotalDamageTaken: function() {
            return this.data.achievements.totalDmg;
        },

        /**
         * 添加伤害数值（最多5000点）
         * @param {number} damage 要添加的伤害数值
         */
        addDamage: function(damage) {
            if(this.data.achievements.totalDmg < 5000) {
                this.data.achievements.totalDmg += damage;
                this.save();
            }
        },

        // Hunter
        /**
         * 获取总击杀数
         * @returns {number} 总击杀数
         */
        getTotalKills: function() {
            return this.data.achievements.totalKills;
        },

        /**
         * 增加总击杀数（最多50次）
         */
        incrementTotalKills: function() {
            if(this.data.achievements.totalKills < 50) {
                this.data.achievements.totalKills++;
                this.save();
            }
        },

        // Still Alive
        /**
         * 获取复活次数
         * @returns {number} 复活次数
         */
        getTotalRevives: function() {
            return this.data.achievements.totalRevives;
        },

        /**
         * 增加复活次数（最多5次）
         */
        incrementRevives: function() {
            if(this.data.achievements.totalRevives < 5) {
                this.data.achievements.totalRevives++;
                this.save();
            }
        },
    });
    
    return Storage;
});
