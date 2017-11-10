// global variables

var images = [];
var pyramidLevels = 1;
var detectorThreshold = 0.001;
var keyPointCount = 500;
var matchMinDist = 0.0001;
var ransacIterations = 1500;
var minInliers = 25;
var inlierRatio = 0.6;
var subpixel = true;

// obj

function objImage() {
  this.img = {}; //image pixel data
  this.pyramid = [];
  this.keyPts = [];
  this.features = [];
  this.matches = [];
  this.matchResult = [];
  this.matchId = -1;
  this.matchedImages = [];
  this.transform = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
}

function objKP(x,y,level,response,radius){
	this.x = x;
	this.y = y;
	this.level = level; 
	this.response = response;
	this.radius = radius;
}

// function in page

function inputImage(files) {
  for (var i=0; i<files.length; i++) {
    var obj = files[i];
    logs(escape(obj.name) + " loaded");
    logs(escape(obj.name) + " (assign id = "+i+")");
    addImage(window.URL.createObjectURL(obj));
    logs(escape(obj.name) + " processed")
  }
}

function logs(content){
  var log_line = document.getElementById("logs")
  log_line.innerHTML += content + "<br />";
}

function addImage(src) {
	var img = new Image();
	img.addEventListener("load",function(){processingImage(img);}, false);
	img.src=src;
}

function doReset() {
  images = [];
  document.getElementById("extraction").innerHTML = "";
  document.getElementById("result").innerHTML = "";
  document.getElementById("logs").innerHTML = "";

}