extends Node
##用来管理网络连接的


#消息类型
enum Messages{HELLO= 0,
		WELCOME= 1,
		SPAWN= 2,
		DESPAWN= 3,
		MOVE= 4,
		LOOTMOVE= 5,
		AGGRO= 6,
		ATTACK= 7,
		HIT= 8,
		HURT= 9,
		HEALTH= 10,
		CHAT= 11,
		LOOT= 12,
		EQUIP= 13,
		DROP= 14,
		TELEPORT= 15,
		DAMAGE= 16,
		POPULATION= 17,
		KILL= 18,
		LIST= 19,
		WHO= 20,
		ZONE= 21,
		DESTROY= 22,
		HP= 23,
		BLINK= 24,
		OPEN= 25,
		CHECK= 26}


@onready var client: SocketIO = $SocketIO

func _ready() -> void:
	#client.socket_connected.connect(_on_socket_connected)
	#client.event_received.connect(_on_event_received)


	pass

func connectServer():
	client.base_url="http://localhost:8000"
	#client.socket_path=""
	client.connect_socket()
	pass

func _on_socket_connected(ns: String) -> void:
	#client.emit("hello")
	#client.emit("some_event", { "value": 10 })
	print('_on_socket_connected',ns)
	pass
	
func _on_event_received(event: String, data: Variant, ns: String) -> void:
	print("event %s with %s as data received" % [event, data])
