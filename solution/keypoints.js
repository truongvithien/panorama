//Detect các keypoint trên pyramid
function detectPyrKeypoints(pyramid, context, threshold, subpixel)
{
  if (pyramid === null) {
    return null;
  }

  if (subpixel === undefined) {
    subpixel = false;
  }

  var keyPts = [];
  for (var i = 0; i < pyramid.length; i++) {
    keyPts = keyPts.concat(detectKeypoints(pyramid[i], context, threshold, i, subpixel));
  }
  
  return keyPts;
}

//Detect các keypoint
function detectKeypoints(srcImg, context, threshold, level, subpixel)
{
  if (srcImg === null || context === null || threshold <= 0.0) {
      return null;
  }

  if (level === undefined) {
    level = 0;
  }

  if (subpixel === undefined) {
    subpixel = false;
  }

  var keyPts = [];
  var scale = Math.pow(2, level);

  //Convert ảnh sang gray scale
  var grayImg = grayImage(srcImg, context);
  var gradImg = context.createImageData(srcImg);
  
  //Blur ảnh
  grayImg = blurImage(grayImg, context);
  
  var Ix = [], Iy = [];
  var maxI = 0;
  var width = grayImg.width;
  var height = grayImg.height;

  for(var h = 1; h + 1 < height; h++) {
    for(var w = 1; w + 1 < width; w++) {
      var x0 = (4 * h) * width + (4 * (w - 1));
      var x1 = (4 * h) * width + (4 * (w + 1));
      var y0 = (4 * (h - 1)) * width + (4 * w);
      var y1 = (4 * (h + 1)) * width + (4 * w);
      
      var px1 = grayImg.data[x1];
      var px0 = grayImg.data[x0];
      var IIx = (grayImg.data[x1] - grayImg.data[x0]);
      var IIy = (grayImg.data[y1] - grayImg.data[y0]);
      
      Ix.push(IIx);
      Iy.push(IIy);

      if (IIx > maxI) {
        maxI = IIx;
      }

      if (IIy > maxI) {
        maxI = IIy;
      }
    }
  }

  var width = grayImg.width;
  var height = grayImg.height;

  for(var h = 1; h + 1 < height; h++) {
    for(var w = 1; w + 1 < width; w++) {
      var indexI = (h - 1) * (width - 2) + (w - 1);

      var IIx = Ix[indexI] / maxI;
      var IIy = Iy[indexI] / maxI;
          
      var Ixx = IIx * IIx * 255.0;
      var Iyy = IIy * IIy * 255.0;
      var Ixy = IIx * IIy * 255.0;
      
      var index = (4 * h) * width + (4 * w);
      gradImg.data[index + 0] = Ixx;
      gradImg.data[index + 1] = Iyy;
      gradImg.data[index + 2] = Ixy;
      gradImg.data[index + 3] = 255;
    }
  }
      
  gradImg = blurImage(blurImage(gradImg, context), context);
  
  //Corner scores
  var score = [];

  for(var h = 1; h + 1 < height; h++) {
    for(var w = 1; w + 1 < width; w++) {
      var index = (4 * h) * width + (4 * w);

      var Ixx = gradImg.data[index + 0] / 255.0;
      var Iyy = gradImg.data[index + 1] / 255.0;
      var Ixy = gradImg.data[index + 2] / 255.0;
          
      var det = Ixx * Iyy - 2.0 * Ixy;
      var trace = Ixx + Iyy;
      
      //Harmonic mean (HM) scroe R = det / trace > threshold -> conner
      var R = 0.0;
      if (trace > 0.0) {
        R = det / trace;
      }

      score.push(R);
    }
  }

  //Local non-max suppression
  width = width - 2;
  height = height - 2;
  for(var h = 8; h + 8 < height; h++) {
    for(var w = 8; w + 8 < width; w++) {
      var index = h * width + w;
      var R = score[index];

      //So sánh với những pixel xung quanh (3x3)
      if (R > threshold) { 
        var r00 = score[(h - 1) * width + (w - 1)], r01 = score[(h - 1) * width + w], r02 = score[(h - 1) * width + (w + 1)];
        var r10 = score[ h * width + (w - 1)],      r11 = R,                          r12 = score[ h * width + (w + 1)];
        var r20 = score[(h + 1) * width + (w - 1)], r21 = score[(h + 1) * width + w], r22 = score[(h + 1) * width + (w + 1)];
        
        if (R > r00 && R > r01 && R > r02 && R > r10 && R > r12 && R > r20 && R > r21 && R > r22) {
          var x = w;
          var y = h;
          
          if (subpixel) { //subpixel
            var IIx = (r12 - r10) / 2.0;
            var IIy = (r21 - r01) / 2.0;
            var Ixx = r12 - 2.0 * r11 + r10;
            var Iyy = r21 - 2.0 * r11 + r01;
            var Ixy = (r22 - r20 - r02 + r00) / 4.0;
            var det = Ixx * Iyy - Ixy * Ixy;
            x = w - (Iyy * IIx - Ixy * IIy) / det;
            y = h - (Ixx * IIy - Ixy * IIx) / det;

            if (Math.abs(x - w) * scale > 1.0 || Math.abs(y - h) * scale > 1.0) {
                continue;
            }
          }

          keyPts.push(new objKP(x * scale, y * scale, level, R, 0.0));
        }
      }
    }
  }

  //Sắp xếp giảm dần theo giá trị response
  keyPts.sort(function(a, b){ return (b.response - a.response); });

  return keyPts;
}

//Adaptive Non-Maximal Suppression (ANMS) filters the current keypoints in keyPts leaving
//at most "count" keypoints with maximum response and evenly distributed in the image
function nonMaxSuppression(keyPts, count)
{
  if (keyPts === null || keyPts.length < count) {
    return keyPts;
  }

  var cRobust = 0.9;

  //Tính toán radius
  for (var i = 0; i < keyPts.length; i++) {
    if (keyPts[i].radius === 0.0) {
      keyPts[i].radius = 1e8;
    }
  
    for (var j = i + 1; j < keyPts.length; j++) {
      if (keyPts[j].radius === 0.0) {
        keyPts[j].radius = 1e8;
      }
  
      var x = keyPts[i].x - keyPts[j].x;
      var y = keyPts[i].y - keyPts[j].y;
      var d = x * x + y * y;

      if (keyPts[i].response < cRobust * keyPts[j].response) {
        if (d < keyPts[i].radius) {
          keyPts[i].radius = d;
        }
      } else if (keyPts[j].response < cRobust * keyPts[i].response) {
        if (d < keyPts[j].radius) {
          keyPts[j].radius = d;
        }
      }
    }
  }

  //Sắp xếp giảm dần theo radius
  keyPts.sort(function(a, b){ return (b.radius - a.radius); });

  return keyPts.slice(0, count);
}

// Hiển thị các keypoint được detect lên ảnh
function drawKeypoints(srcImg, context, keyPts, r, g, b)
{
  if (srcImg === null || context === null || keyPts === null) {
    return null;
  }

  if (r === undefined) {  //Nếu không quy định màu hiển thị
    //RGB(225, 0, 0) : màu đỏ
    r = 255;
    g = 0;
    b = 0;
  }

  var width  = srcImg.width;
  var height = srcImg.height;
  var dstImg = context.createImageData(srcImg);
  dstImg.data.set(srcImg.data);

  var s = 2;

  //Vẽ các keypoint
  var nKeypoints = keyPts.length;
  for (var i = 0; i < nKeypoints; i++) {
    //Vị trí (x, y) của keypoint thứ i trên ảnh
    var x = Math.floor(keyPts[i].x);
    var y = Math.floor(keyPts[i].y);

    //Hiển thị keypoint bằng một dấu cộng có kích thước (2s + 1)x(2s + 1), với tâm tại vị trí (x, y)
    for (var j = -s; j <= s; j++) {
      if (x + j >= 0 && x + j < width) {
        var index = (4 * y) * width + (4 * (x + j));
        
        dstImg.data[index+0] = r;
        dstImg.data[index+1] = g;
        dstImg.data[index+2] = b;
        dstImg.data[index+3] = 255;
      }

      if (y + j >= 0 && y + j < height) {
        var index = (4 * (y + j)) * width + (4 * x);

        dstImg.data[index+0] = r;
        dstImg.data[index+1] = g;
        dstImg.data[index+2] = b;
        dstImg.data[index+3] = 255;
      }
    }
  }

  return dstImg;
}