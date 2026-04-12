#!/usr/bin/env node

/**
 * 地图导出工具
 * 将Tiled地图编辑器导出的JSON格式转换为游戏可用的地图格式
 * 
 * 使用方法: ./exportmap.js map_file json_file [mode]
 * 参数:
 *   map_file - 源地图文件路径
 *   json_file - 输出文件路径
 *   mode - 可选，运行模式："server"（默认）或 "client"
 */

var util = require('util'),
    Log = require('log'),
    path = require("path"),
    fs = require("fs"),
    processMap = require('./processmap'),
    log = new Log(Log.DEBUG);
    
var source = process.argv[2],
    destination = process.argv[3],
    mode = process.argv[4];

if(!source || !destination) {
    util.puts("Usage : ./exportmap.js map_file json_file [mode]");
    util.puts("Optional parameter : mode. Values: \"server\" (default) or \"client\".");
    process.exit(0);
}

/**
 * 主函数
 * 加载地图文件，处理并导出为游戏可用的格式
 */
function main() {
    getTiledJSONmap(source, function(json) {
        var options = { mode: mode || "server" },
            map = processMap(json, options);
        
        var jsonMap = JSON.stringify(map); // Save the processed map object as JSON data
        
        if(mode === "client") {
            // map in a .json file for ajax loading
            fs.writeFile(destination+".json", jsonMap, function(err, file) {
                log.info("Finished processing map file: "+ destination + ".json was saved.");
            });
            
            // map in a .js file for web worker loading
            jsonMap = "var mapData = "+JSON.stringify(map);
            fs.writeFile(destination+".js", jsonMap, function(err, file) {
                log.info("Finished processing map file: "+ destination + ".js was saved.");
            });
        } else {
            fs.writeFile(destination, jsonMap, function(err, file) {
                log.info("Finished processing map file: "+ destination + " was saved.");
            });
        }
    });
}

/**
 * 加载Tiled地图JSON文件
 * 读取并解析由tmx2json.py转换的临时JSON地图文件
 * @param {string} filename - 地图文件路径
 * @param {Function} callback - 加载完成后的回调函数，参数为解析后的JSON对象
 */
function getTiledJSONmap(filename, callback) {
    var self = this;
    
    path.exists(filename, function(exists) {
        if(!exists) {  
            log.error(filename + " doesn't exist.")
            return;
        }
    
        fs.readFile(source, function(err, file) {
            callback(JSON.parse(file.toString()));
        });
    });
}

main();