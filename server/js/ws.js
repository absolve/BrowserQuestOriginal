var cls = require("./lib/class"),
    url = require('url'),
    // wsserver = require("websocket-server"),
    // miksagoConnection = require('websocket-server/lib/ws/connection'),
    // worlizeRequest = require('websocket').request,
    http = require('http'),
    Utils = require('./utils'),
    _ = require('underscore'),
    BISON = require('bison'),
    WS = {},
    log = require('loglevel'),
    useBison = false;


module.exports = WS;


/**
 * 抽象服务器类 - 定义WebSocket服务器的基本接口和功能
 * 提供连接管理、广播消息等基础操作
 */
var Server = cls.Class.extend({
    _connections: {},
    _counter: 0,

    /**
     * 初始化服务器实例
     * @param {number} port - 服务器监听的端口号
     */
    init: function (port) {
        this.port = port;
    },

    /**
     * 设置连接建立时的回调函数
     * @param {function} callback - 连接回调函数
     */
    onConnect: function (callback) {  //连接回调函数
        this.connection_callback = callback;
    },

    /**
     * 设置错误发生时的回调函数
     * @param {function} callback - 错误回调函数
     */
    onError: function (callback) {
        this.error_callback = callback;
    },

    /**
     * 向所有连接广播消息（抽象方法）
     * @param {*} message - 要广播的消息
     * @throws {string} 抛出未实现异常
     */
    broadcast: function (message) {
        throw "Not implemented";
    },

    /**
     * 遍历所有连接并执行回调函数
     * @param {function} callback - 对每个连接执行的回调函数
     */
    forEachConnection: function (callback) {
        _.each(this._connections, callback);
    },

    /**
     * 添加新的连接到服务器
     * @param {Connection} connection - 要添加的连接对象
     */
    addConnection: function (connection) {  //添加一个连接
        this._connections[connection.id] = connection;
    },

    /**
     * 根据ID移除连接
     * @param {string} id - 要移除的连接ID
     */
    removeConnection: function (id) {
        delete this._connections[id];
    },

    /**
     * 根据ID获取连接对象
     * @param {string} id - 连接ID
     * @returns {Connection|undefined} 连接对象或undefined
     */
    getConnection: function (id) {
        return this._connections[id];
    },

    /**
     * 获取当前连接数量
     * @returns {number} 当前连接的数量
     */
    connectionsCount: function () {
        return Object.keys(this._connections).length
    }
});


/**
 * 抽象连接类 - 定义WebSocket连接的基本接口和功能
 * 提供消息发送、接收、关闭等基础操作
 */
var Connection = cls.Class.extend({
    /**
     * 初始化连接实例
     * @param {string} id - 连接唯一标识符
     * @param {object} connection - 底层连接对象
     * @param {Server} server - 所属服务器实例
     */
    init: function (id, connection, server) {
        this._connection = connection;
        this._server = server;
        this.id = id;
    },

    /**
     * 设置连接关闭时的回调函数
     * @param {function} callback - 关闭回调函数
     */
    onClose: function (callback) {
        this.close_callback = callback;
    },

    /**
     * 设置消息监听回调函数
     * @param {function} callback - 监听回调函数
     */
    listen: function (callback) {  //设置回调函数
        this.listen_callback = callback;
    },

    /**
     * 向连接广播消息（抽象方法）
     * @param {*} message - 要广播的消息
     * @throws {string} 抛出未实现异常
     */
    broadcast: function (message) {
        throw "Not implemented";
    },

    /**
     * 发送消息到连接（抽象方法）
     * @param {*} message - 要发送的消息
     * @throws {string} 抛出未实现异常
     */
    send: function (message) {
        throw "Not implemented";
    },

    /**
     * 发送UTF8编码的数据（抽象方法）
     * @param {*} data - 要发送的UTF8数据
     * @throws {string} 抛出未实现异常
     */
    sendUTF8: function (data) {
        throw "Not implemented";
    },

    /**
     * 关闭连接
     * @param {string} logError - 关闭原因日志信息
     */
    close: function (logError) {
        log.info("Closing connection to " + this._connection.remoteAddress + ". Error: " + logError);
        this._connection.close();
    }
});

/***************
 SOCKET.IO
 Author: Nenu Adrian
 http://nenuadrian.com
 http://codevolution.com
 ***************/

/**
 * Socket.IO服务器实现类 - 基于Socket.IO库的具体服务器实现
 * 继承自抽象Server类，提供Socket.IO协议支持
 */
WS.socketIOServer = Server.extend({
    /**
     * 初始化Socket.IO服务器
     * @param {string} host - 服务器主机地址
     * @param {number} port - 服务器监听端口
     */
    init: function (host, port) {
        self = this;
        self.host = host;
        self.port = port;
        var app = require('express')();
        var http = require('http').Server(app);
        // self.io = require('socket.io')(http);
        self.io = require('socket.io')(http, {
            cors: {
                // origin: 'http://localhost:9000',
                origin: true,
                credentials: true,
            }
        });

        self.io.on('connection', function (connection) {
            // console.log("a user connected")
            log.info('a user connected');

            connection.remoteAddress = connection.handshake.address.address


            var c = new WS.socketIOConnection(self._createId(), connection, self);

            if (self.connection_callback) {
                self.connection_callback(c);
            }
            self.addConnection(c);

        });


        self.io.on('error', function (err) {
            log.error(err.stack);
            self.error_callback()

        })

        http.listen(port, function () {
            log.info('listening on *:' + port);
        });
    },

    /**
     * 创建唯一的连接ID
     * @returns {string} 生成的连接ID
     */
    _createId: function () { //创建一个id
        return '5' + Utils.random(99) + '' + (this._counter++);
    },


    /**
     * 向所有连接广播消息
     * @param {*} message - 要广播的消息
     */
    broadcast: function (message) {
        self.io.emit("message", message)
    },

    /**
     * 设置状态请求回调函数
     * @param {function} status_callback - 状态回调函数
     */
    onRequestStatus: function (status_callback) {
        this.status_callback = status_callback;
    }


});

/**
 * Socket.IO连接实现类 - 基于Socket.IO库的具体连接实现
 * 继承自抽象Connection类，处理Socket.IO事件和消息
 */
WS.socketIOConnection = Connection.extend({
    /**
     * 初始化Socket.IO连接实例
     * @param {string} id - 连接唯一标识符
     * @param {object} connection - Socket.IO连接对象
     * @param {Server} server - 所属服务器实例
     */
    init: function (id, connection, server) {

        var self = this

        this._super(id, connection, server);

        // HANDLE DISPATCHER IN HERE
        connection.on("dispatch", function (message) {
            console.log("Received dispatch request")
            self._connection.emit("dispatched", {"status": "OK", host: server.host, port: server.port})
        });

        connection.on("message", function (message) {
            log.info("Received: " + message)
            if (self.listen_callback)
                self.listen_callback(message)
        });

        connection.on("disconnect", function () {
            if (self.close_callback) {
                self.close_callback();
            }
            delete self._server.removeConnection(self.id);
        });

    },

    /**
     * 向连接广播消息（未实现）
     * @param {*} message - 要广播的消息
     * @throws {string} 抛出未实现异常
     */
    broadcast: function (message) {
        throw "Not implemented";
    },

    /**
     * 发送消息到连接
     * @param {*} message - 要发送的消息
     */
    send: function (message) { //发送数据
        this._connection.emit("message", message);
    },

    /**
     * 发送UTF8编码的数据
     * @param {*} data - 要发送的UTF8数据
     */
    sendUTF8: function (data) {
        this.send(data)
    },

    /**
     * 关闭Socket.IO连接
     * @param {string} logError - 关闭原因日志信息
     */
    close: function (logError) {
        log.info("Closing connection to socket" + ". Error: " + logError);
        this._connection.disconnect();
    }


});


/**
 * MultiVersionWebsocketServer
 *
 * Websocket server supporting draft-75, draft-76 and version 08+ of the WebSocket protocol.
 * Fallback for older protocol versions borrowed from https://gist.github.com/1219165
 */
/*
WS.MultiVersionWebsocketServer = Server.extend({
   worlizeServerConfig: {
       // All options *except* 'httpServer' are required when bypassing
       // WebSocketServer.
       maxReceivedFrameSize: 0x10000,
       maxReceivedMessageSize: 0x100000,
       fragmentOutgoingMessages: true,
       fragmentationThreshold: 0x4000,
       keepalive: true,
       keepaliveInterval: 20000,
       assembleFragments: true,
       // autoAcceptConnections is not applicable when bypassing WebSocketServer
       // autoAcceptConnections: false,
       disableNagleAlgorithm: true,
       closeTimeout: 5000
   },
   _connections: {},
   _counter: 0,

   init: function(port) {
       var self = this;

       this._super(port);

       this._httpServer = http.createServer(function(request, response) {
           var path = url.parse(request.url).pathname;
           switch(path) {
               case '/status':
                   if(self.status_callback) {
                       response.writeHead(200);
                       response.write(self.status_callback());
                       break;
                   }
               default:
                   response.writeHead(404);
           }
           response.end();
       });
       this._httpServer.listen(port, function() {
           log.info("Server is listening on port "+port);
       });

       this._miksagoServer = wsserver.createServer();
       this._miksagoServer.server = this._httpServer;
       this._miksagoServer.addListener('connection', function(connection) {
           // Add remoteAddress property
           connection.remoteAddress = connection._socket.remoteAddress;

           // We want to use "sendUTF" regardless of the server implementation
           connection.sendUTF = connection.send;
           var c = new WS.miksagoWebSocketConnection(self._createId(), connection, self);

           if(self.connection_callback) {
               self.connection_callback(c);
           }
           self.addConnection(c);
       });

       this._httpServer.on('upgrade', function(req, socket, head) {
           if (typeof req.headers['sec-websocket-version'] !== 'undefined') {
               // WebSocket hybi-08/-09/-10 connection (WebSocket-Node)
               var wsRequest = new worlizeRequest(socket, req, self.worlizeServerConfig);
               try {
                   wsRequest.readHandshake();
                   var wsConnection = wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
                   var c = new WS.worlizeWebSocketConnection(self._createId(), wsConnection, self);
                   if(self.connection_callback) {
                       self.connection_callback(c);
                   }
                   self.addConnection(c);
               }
               catch(e) {
                   console.log("WebSocket Request unsupported by WebSocket-Node: " + e.toString());
                   return;
               }
           } else {
               // WebSocket hixie-75/-76/hybi-00 connection (node-websocket-server)
               if (req.method === 'GET' &&
                   (req.headers.upgrade && req.headers.connection) &&
                   req.headers.upgrade.toLowerCase() === 'websocket' &&
                   req.headers.connection.toLowerCase() === 'upgrade') {
                   new miksagoConnection(self._miksagoServer.manager, self._miksagoServer.options, req, socket, head);
               }
           }
       });
   },

   _createId: function() {
       return '5' + Utils.random(99) + '' + (this._counter++);
   },

   broadcast: function(message) {
       this.forEachConnection(function(connection) {
           connection.send(message);
       });
   },

   onRequestStatus: function(status_callback) {
       this.status_callback = status_callback;
   }
});
*/

/**
 * Connection class for Websocket-Node (Worlize)
 * https://github.com/Worlize/WebSocket-Node
 */
/*
WS.worlizeWebSocketConnection = Connection.extend({
   init: function(id, connection, server) {
       var self = this;

       this._super(id, connection, server);

       this._connection.on('message', function(message) {
           if(self.listen_callback) {
               if(message.type === 'utf8') {
                   if(useBison) {
                       self.listen_callback(BISON.decode(message.utf8Data));
                   } else {
                       try {
                           self.listen_callback(JSON.parse(message.utf8Data));
                       } catch(e) {
                           if(e instanceof SyntaxError) {
                               self.close("Received message was not valid JSON.");
                           } else {
                               throw e;
                           }
                       }
                   }
               }
           }
       });

       this._connection.on('close', function(connection) {
           if(self.close_callback) {
               self.close_callback();
           }
           delete self._server.removeConnection(self.id);
       });
   },

   send: function(message) {
       var data;
       if(useBison) {
           data = BISON.encode(message);
       } else {
           data = JSON.stringify(message);
       }
       this.sendUTF8(data);
   },

   sendUTF8: function(data) {
       this._connection.sendUTF(data);
   }
});
*/

/**
 * Connection class for websocket-server (miksago)
 * https://github.com/miksago/node-websocket-server
 */
/*
WS.miksagoWebSocketConnection = Connection.extend({
   init: function(id, connection, server) {
       var self = this;

       this._super(id, connection, server);

       this._connection.addListener("message", function(message) {
           if(self.listen_callback) {
               if(useBison) {
                   self.listen_callback(BISON.decode(message));
               } else {
                   self.listen_callback(JSON.parse(message));
               }
           }
       });

       this._connection.on('close', function(connection) {
           if(self.close_callback) {
               self.close_callback();
           }
           delete self._server.removeConnection(self.id);
       });
   },

   send: function(message) {
       var data;
       if(useBison) {
           data = BISON.encode(message);
       } else {
           data = JSON.stringify(message);
       }
       this.sendUTF8(data);
   },

   sendUTF8: function(data) {
       this._connection.send(data);
   }
});
*/

