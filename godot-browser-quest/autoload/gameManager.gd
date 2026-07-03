extends Node
#保存游戏信息

#实体类型
enum Entities {
		WARRIOR = 1, # 战士（玩家角色）
		
		# Mobs - 怪物类型
		RAT = 2, # 老鼠
		SKELETON = 3, # 骷髅
		GOBLIN = 4, # 哥布林
		OGRE = 5, # 食人魔
		SPECTRE = 6, # 幽灵
		CRAB = 7, # 螃蟹
		BAT = 8, # 蝙蝠
		WIZARD = 9, # 巫师
		EYE = 10, # 眼魔
		SNAKE = 11, # 蛇
		SKELETON2 = 12, # 骷髅战士
		BOSS = 13, # BOSS
		DEATHKNIGHT = 14, # 死亡骑士
		
		# Armors - 护甲类型
		FIREFOX = 20, # 火狐护甲（无敌状态）
		CLOTHARMOR = 21, # 布甲
		LEATHERARMOR = 22, # 皮甲
		MAILARMOR = 23, # 锁甲
		PLATEARMOR = 24, # 板甲
		REDARMOR = 25, # 红甲
		GOLDENARMOR = 26, # 金甲
		
		# Objects - 物品类型
		FLASK = 35, # 药水瓶
		BURGER = 36, # 汉堡
		CHEST = 37, # 宝箱
		FIREPOTION = 38, # 火焰药水
		CAKE = 39, # 蛋糕
		
		# NPCs - 非玩家角色类型
		GUARD = 40, # 卫兵
		KING = 41, # 国王
		OCTOCAT = 42, # Octocat
		VILLAGEGIRL = 43, # 村庄女孩
		VILLAGER = 44, # 村民
		PRIEST = 45, # 牧师
		SCIENTIST = 46, # 科学家
		AGENT = 47, # 特工
		RICK = 48, # Rick
		NYAN = 49, # Nyan Cat
		SORCERER = 50, # 巫师
		BEACHNPC = 51, # 海滩NPC
		FORESTNPC = 52, # 森林NPC
		DESERTNPC = 53, # 沙漠NPC
		LAVANPC = 54, # 熔岩NPC
		CODER = 55, # 程序员
		
		# Weapons - 武器类型
		SWORD1 = 60, # 铁剑
		SWORD2 = 61, # 钢剑
		REDSWORD = 62, # 红剑
		GOLDENSWORD = 63, # 金剑
		MORNINGSTAR = 64, # 晨星锤
		AXE = 65, # 斧头
		BLUESWORD = 66 # 蓝剑
		}
		
#方向		
enum Orientations {
			UP = 1, # 向上
			DOWN = 2, # 向下
			LEFT = 3, # 向左
			RIGHT = 4 # 向右
		}
		
		
var kinds = {
	Entities.WARRIOR: "player",
	
	Entities.RAT: "mob",
	Entities.SKELETON: "mob",
	Entities.GOBLIN: "mob",
	Entities.OGRE: "mob",
	Entities.SPECTRE: "mob",
	Entities.DEATHKNIGHT: "mob",
	Entities.CRAB: "mob",
	Entities.SNAKE: "mob",
	Entities.BAT: "mob",
	Entities.WIZARD: "mob",
	Entities.EYE: "mob",
	Entities.SKELETON2: "mob",
	Entities.BOSS: "mob",

	Entities.SWORD1: "weapon",
	Entities.SWORD2: "weapon",
	Entities.AXE: "weapon",
	Entities.REDSWORD: "weapon",
	Entities.BLUESWORD: "weapon",
	Entities.GOLDENSWORD: "weapon",
	Entities.MORNINGSTAR: "weapon",
	
	Entities.FIREFOX: "armor",
	Entities.CLOTHARMOR: "armor",
	Entities.LEATHERARMOR: "armor",
	Entities.MAILARMOR: "armor",
	Entities.PLATEARMOR: "armor",
	Entities.REDARMOR: "armor",
	Entities.GOLDENARMOR: "armor",

	Entities.FLASK: "object",
	Entities.CAKE: "object",
	Entities.BURGER: "object",
	Entities.CHEST: "object",
	Entities.FIREPOTION: "object",

	Entities.GUARD: "npc",
	Entities.VILLAGEGIRL: "npc",
	Entities.VILLAGER: "npc",
	Entities.CODER: "npc",
	Entities.SCIENTIST: "npc",
	Entities.PRIEST: "npc",
	Entities.KING: "npc",
	Entities.RICK: "npc",
	Entities.NYAN: "npc",
	Entities.SORCERER: "npc",
	Entities.AGENT: "npc",
	Entities.OCTOCAT: "npc",
	Entities.BEACHNPC: "npc",
	Entities.FORESTNPC: "npc",
	Entities.DESERTNPC: "npc",
	Entities.LAVANPC: "npc",
   
};
