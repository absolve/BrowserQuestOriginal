extends Node
##用来管理网络连接的


#消息类型
enum Messages {
		HELLO = 0, # 客户端握手消息
		WELCOME = 1, # 服务器欢迎消息
		SPAWN = 2, # 实体生成消息
		DESPAWN = 3, # 实体消失消息
		MOVE = 4, # 移动消息
		LOOTMOVE = 5, # 拾取移动消息
		AGGRO = 6, # 仇恨消息
		ATTACK = 7, # 攻击消息
		HIT = 8, # 命中消息
		HURT = 9, # 受伤消息
		HEALTH = 10, # 生命值消息
		CHAT = 11, # 聊天消息
		LOOT = 12, # 拾取消息
		EQUIP = 13, # 装备消息
		DROP = 14, # 掉落消息
		TELEPORT = 15, # 传送消息
		DAMAGE = 16, # 伤害消息
		POPULATION = 17, # 人口统计消息
		KILL = 18, # 击杀消息
		LIST = 19, # 实体列表消息
		WHO = 20, # 查询实体信息根据ID
		ZONE = 21, # 区域切换消息
		DESTROY = 22, # 销毁消息
		HP = 23, # 最大生命值消息
		BLINK = 24, # 闪烁消息
		OPEN = 25, # 打开消息（宝箱）
		CHECK = 26 # 检查点消息
		}

# 映射 Messages 枚举值到其名称字符串（索引即枚举值）
var MESSAGE_NAMES = [
	"HELLO", "WELCOME", "SPAWN", "DESPAWN", "MOVE", "LOOTMOVE", "AGGRO", "ATTACK", "HIT", "HURT",
	"HEALTH", "CHAT", "LOOT", "EQUIP", "DROP", "TELEPORT", "DAMAGE", "POPULATION", "KILL", "LIST",
	"WHO", "ZONE", "DESTROY", "HP", "BLINK", "OPEN", "CHECK"
]

func get_message_name(value: int) -> String:
	if typeof(value) == TYPE_INT:
		if value >= 0 and value < MESSAGE_NAMES.size():
			return MESSAGE_NAMES[value]
	return "UNKNOWN"


@onready var client: SocketIO = $SocketIO

var isConnected = false


func _ready() -> void:
	#client.socket_connected.connect(_on_socket_connected)
	#client.event_received.connect(_on_event_received)
	Log.set_log_level(Log.Levels.DEBUG)
	pass


#连接到服务器
func connectServer():
	client.base_url = "http://localhost:8000"
	#client.socket_path=""
	client.connect_socket()
	
#发送消息
func sendMessage(data):
	if isConnected:
		client.emit("message", data)

#发送玩家登录信息
func sendHello(playerName, armor, weapon):
	sendMessage([Messages.HELLO, playerName, armor, weapon])




func _on_socket_connected(ns: String) -> void:
	#client.emit("hello")
	#client.emit("some_event", { "value": 10 })
	print('_on_socket_connected', ns)
	isConnected = true
	pass
	
func _on_event_received(event: String, data: Variant, _ns: String) -> void:
	#print("event %s with %s as data received" % [event, data])
	Log.debug("event %s with %s as data received " % [event, data])
	if event == 'message':
		if data is Array:
			if !data.is_empty():
				if data[0] is String:
					if data[0] == 'go':
						sendHello("1", 21, 60)
					elif data[0] == 'timeout':
						pass
				elif data[0] is Array: # 数据包
					if !data[0].is_empty() && data[0][0] is Array: # 批量消息
						pass
					elif !data[0].is_empty(): # 单个消息
						Log.debug(get_message_name(data[0][0]))
						
						pass
					else:
						Log.error(event, '未知消息')
	else:
		Log.error(event, '未知事件')

func _on_socket_io_socket_disconnected() -> void:
	isConnected = false
	pass # Replace with function body.
