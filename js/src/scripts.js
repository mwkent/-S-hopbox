var TRACKER = function(){
	this.candidate = null;
};

TRACKER.prototype.start = function() {
  var that = this;

  this.tracker = new HT.Tracker();

  this.cbxHull = document.getElementById("cbxHull");
  this.cbxDefects = document.getElementById("cbxDefects");
  this.cbxSkin = document.getElementById("cbxSkin");

  this.video = document.getElementById("video");
  this.canvas = document.getElementById("canvas");
  this.context = this.canvas.getContext("2d");

  this.canvas.width = parseInt(this.canvas.style.width);
  this.canvas.height = parseInt(this.canvas.style.height);
  
  this.image = this.context.createImageData(
	this.canvas.width * 0.2, this.canvas.height * 0.2);
  
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (navigator.getUserMedia){
	navigator.getUserMedia({video: true},
	  function(stream){ return that.videoReady(stream); },
	  function(error){ return that.videoError(error); } );
  }
};

TRACKER.prototype.videoReady = function(stream){
  if (window.webkitURL) {
	this.video.src = window.webkitURL.createObjectURL(stream);
  } else if (video.mozSrcObject !== undefined) {
	this.video.mozSrcObject = stream;
  } else {
	this.video.src = stream;
  }
  
  this.tick();
};
  
TRACKER.prototype.videoError = function(error){
};

TRACKER.prototype.tick = function(){
  var that = this;

  requestAnimationFrame( function() { return that.tick(); } );
  
  if (this.video.readyState === this.video.HAVE_ENOUGH_DATA){
	var image = this.snapshot();
	
	var candidate = this.tracker.detect(image);
	if (candidate) {
  		this.candidate = candidate;
	}
	this.draw(candidate);
  }
};

TRACKER.prototype.getBox = function(){
	if (!this.candidate) {
		return null;
	}
	var hull = this.candidate.hull;
	var xmin = 99999999; // this should be big enough
	var ymin = xmin;
	var xmax = -1;
	var ymax = xmax;
	hull.forEach(function(cor){
		xmin = cor.x < xmin ? cor.x : xmin;
		xmax = cor.x > xmax ? cor.x : xmax;
		ymin = cor.y < ymin ? cor.y : ymin;
		ymax = cor.y > ymax ? cor.y : ymax;
	});
	return [{x: xmin, y: ymin},{x: xmax, y: ymax}];
};

TRACKER.prototype.snapshot = function(){
  this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
	
  return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
};

TRACKER.prototype.draw = function(candidate){
  if (candidate){

  	this.drawHull(candidate.contour, "yellow");

	if (this.cbxHull.checked){
	  this.drawHull(candidate.hull, "red");
	}
	
	if (this.cbxDefects.checked){
	  this.drawDefects(candidate.defects, "blue");
	}
  }
  
  if (this.cbxSkin.checked){
	this.context.putImageData(
	  this.createImage(this.tracker.mask, this.image), 
	  this.canvas.width - this.image.width,
	  this.canvas.height - this.image.height);
  }
};

TRACKER.prototype.drawHull = function(hull, color){
  var len = hull.length, i = 1;

  if (len > 0){
	this.context.beginPath();
	this.context.lineWidth = 3;
	this.context.strokeStyle = color;

	this.context.moveTo(hull[0].x, hull[0].y);
	for (; i < len; ++ i){
	  this.context.lineTo(hull[i].x, hull[i].y);
	}

	this.context.stroke();
	this.context.closePath();
  }
};

TRACKER.prototype.drawDefects = function(defects, color){
  var len = defects.length, i = 0, point;

  if (len > 0){
	this.context.beginPath();
	this.context.lineWidth = 3;
	this.context.strokeStyle = color;

	for (; i < len; ++ i){
	  point = defects[i].depthPoint;
	  this.context.strokeRect(point.x - 4, point.y - 4, 8, 8);
	}

	this.context.stroke();
	this.context.closePath();
  }
};

TRACKER.prototype.createImage = function(imageSrc, imageDst){
  var src = imageSrc.data, dst = imageDst.data,
	  width = imageSrc.width, span = 4 * width,
	  len = src.length, i = 0, j = 0, k = 0;
  
  for(i = 0; i < len; i += span){
  
	for(j = 0; j < width; j += 5){
	
	  dst[k] = dst[k + 1] = dst[k + 2] = src[i];
	  dst[k + 3] = 255;
	  k += 4;
	  
	  i += 5;
	}
  }
  
  return imageDst;
};


var SITE = {
	tracker: null,
	init: function() {
		this.$document = $(window.document);
		this.$body = $('body');

		this.bindEvents();

		var that = this;
		window.onload = function(){
			that.tracker = new TRACKER();
			that.tracker.start();
		};
	},

	bindEvents: function() {
		this.$body.on('click', (function(){console.log(this.getHandPos());}).bind(this));
	},

	getHandPos: function() {
		if (!this.tracker) {
			return null;
		}
		var box = this.tracker.getBox();
		var x = (box[0].x + box[1].x)/2;
		var y = (box[0].y + box[1].y)/2;
		return {x: x, y: y};
	},

	functionName: function(e) {
		var $blah = $(e.currentTarget);
		e.preventDefault();
	}
}

SITE.init();