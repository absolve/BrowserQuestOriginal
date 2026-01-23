/**
 * 定义精灵类模块，用于处理游戏中的精灵图像、动画和特殊效果
 * @param {Object} $ - jQuery库对象
 * @param {Object} Animation - 动画类构造函数
 * @param {Object} sprites - 精灵数据配置对象
 */
define(['jquery', 'animation', 'sprites'], function($, Animation, sprites) {

    /**
     * 精灵类构造函数，用于创建和管理游戏精灵
     */
    var Sprite = Class.extend({
        /**
         * 初始化精灵实例
         * @param {string} name - 精灵名称
         * @param {number} scale - 精灵缩放比例
         */
        init: function(name, scale) {
        	this.name = name;
        	this.scale = scale;
        	this.isLoaded = false;
        	this.offsetX = 0;
        	this.offsetY = 0;
            this.loadJSON(sprites[name]);
        },
        
        /**
         * 根据JSON数据加载精灵配置信息
         * @param {Object} data - 包含精灵配置信息的JSON对象
         */
        loadJSON: function(data) {
    		this.id = data.id;
    		this.filepath = "img/" + this.scale + "/" + this.id + ".png";
    		this.animationData = data.animations;
    		this.width = data.width;
    		this.height = data.height;
    		this.offsetX = (data.offset_x !== undefined) ? data.offset_x : -16;
            this.offsetY = (data.offset_y !== undefined) ? data.offset_y : -16;
	
    		this.load();
    	},

        /**
         * 加载精灵图像文件
         */
        load: function() {
        	var self = this;

        	this.image = new Image();
        	this.image.src = this.filepath;

        	this.image.onload = function() {
        		self.isLoaded = true;
    		    
                if(self.onload_func) {
                    self.onload_func();
                }
        	};
        },
    
        /**
         * 创建精灵的所有动画实例
         * @returns {Object} 包含所有动画实例的对象，以动画名称为键
         */
        createAnimations: function() {
            var animations = {};
        
    	    for(var name in this.animationData) {
    	        var a = this.animationData[name];
    	        animations[name] = new Animation(name, a.length, a.row, this.width, this.height);
    	    }
	    
    	    return animations;
    	},
	
    	/**
         * 创建受伤状态的精灵图像（白色闪烁效果）
         * 将原图的颜色修改为红白相间的颜色来表示受伤状态
         */
    	createHurtSprite: function() {
    	    var canvas = document.createElement('canvas'),
    	        ctx = canvas.getContext('2d'),
    	        width = this.image.width,
    		    height = this.image.height,
    	        spriteData, data;
    
    	    canvas.width = width;
    	    canvas.height = height;
    	    ctx.drawImage(this.image, 0, 0, width, height);
    	    
    	    try {
        	    spriteData = ctx.getImageData(0, 0, width, height);

        	    data = spriteData.data;

        	    for(var i=0; i < data.length; i += 4) {
        	        data[i] = 255;
        	        data[i+1] = data[i+2] = 75;
        	    }
        	    spriteData.data = data;

        	    ctx.putImageData(spriteData, 0, 0);

        	    this.whiteSprite = { 
                    image: canvas,
            	    isLoaded: true,
            	    offsetX: this.offsetX,
            	    offsetY: this.offsetY,
            	    width: this.width,
            	    height: this.height
            	};
    	    } catch(e) {
    	        log.error("Error getting image data for sprite : "+this.name);
    	    }
        },
	
    	/**
         * 获取受伤状态的精灵对象
         * @returns {Object} 受伤状态的精灵对象
         */
    	getHurtSprite: function() {
    	    return this.whiteSprite;
    	},
	
    	/**
         * 创建精灵的轮廓阴影效果
         * 通过检测相邻像素来生成精灵周围的半透明轮廓
         */
    	createSilhouette: function() {
    	    var canvas = document.createElement('canvas'),
    	        ctx = canvas.getContext('2d'),
    	        width = this.image.width,
    		    height = this.image.height,
    	        spriteData, finalData, data;
	    
    	    canvas.width = width;
    	    canvas.height = height;
    	    ctx.drawImage(this.image, 0, 0, width, height);
    	    data = ctx.getImageData(0, 0, width, height).data;
    	    finalData = ctx.getImageData(0, 0, width, height);
    	    fdata = finalData.data;
	    
    	    // 计算像素在一维数组中的索引位置
    	    var getIndex = function(x, y) {
    	        return ((width * (y-1)) + x - 1) * 4;
    	    };
	    
    	    // 根据一维数组索引计算对应的二维坐标位置
    	    var getPosition = function(i) {
    	        var x, y;
	        
    	        i = (i / 4) + 1;
    	        x = i % width;
    	        y = ((i - x) / width) + 1;
	        
    	        return { x: x, y: y };
    	    };
	    
    	    // 检查指定位置的像素是否有相邻的非空白像素
    	    var hasAdjacentPixel = function(i) {
    	        var pos = getPosition(i);
	        
    	        if(pos.x < width && !isBlankPixel(getIndex(pos.x + 1, pos.y))) {
    	            return true;
    	        }
    	        if(pos.x > 1 && !isBlankPixel(getIndex(pos.x - 1, pos.y))) {
        	        return true;
    	        }
    	        if(pos.y < height && !isBlankPixel(getIndex(pos.x, pos.y + 1))) {
        	        return true;
    	        }
    	        if(pos.y > 1 && !isBlankPixel(getIndex(pos.x, pos.y - 1))) {
        	        return true;
    	        }
    	        return false;
    	    };
	    
    	    // 判断指定索引位置是否为空白像素（RGBA全为0）
    	    var isBlankPixel = function(i) {
    	        if(i < 0 || i >= data.length) {
    	            return true;
    	        }
    	        return data[i] === 0 && data[i+1] === 0 && data[i+2] === 0 && data[i+3] === 0;
    	    };
	    
    	    // 遍历所有像素，为边界空白像素添加轮廓颜色
    	    for(var i=0; i < data.length; i += 4) {
    	        if(isBlankPixel(i) && hasAdjacentPixel(i)) {
    	            fdata[i] = fdata[i+1] = 255;
    	            fdata[i+2] = 150;
    	            fdata[i+3] = 150;
    	        }
    	    }

    	    finalData.data = fdata;
    	    ctx.putImageData(finalData, 0, 0);
	    
    	    this.silhouetteSprite = { 
                image: canvas,
        	    isLoaded: true,
        	    offsetX: this.offsetX,
        	    offsetY: this.offsetY,
        	    width: this.width,
        	    height: this.height
        	};
    	}
    });

    return Sprite;
});
