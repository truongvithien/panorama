/** extractPyrDescriptors
 * Trích xuất decriptor của pyramid
 */
function extractPyrDescriptors(pyramid, context, keyPts)
{
  if (pyramid === null || context === null || keyPts === null) {
      return null;
  }

  var features = [];
  
  var img = new Array(pyramid.length);
  for (var i = 0; i < pyramid.length; i++) {
    img[i] = blurImage(blurImage(pyramid[i], context), context);
  }
  
  //Tạo descriptors
  for (var i = 0; i < keyPts.length; i++) {
    features.push(makeDescriptor(img[keyPts[i].level], context, keyPts[i]));
  }
  
  return features;
}

//Trích xuất descriptors từ ảnh srcImg
function extractDescriptors(srcImg, context, keyPts)
{
  if (srcImg === null || context === null || keyPts === null) {
      return null;
  }

  var features = [];
  
  var img = blurImage(blurImage(srcImg, context), context);
  
  for (var i = 0; i < keyPts.length; i++) {
    features.push(makeDescriptor(img, context, keyPts[i]));
  }
  
  return features;
}

function makeDescriptor(srcImg, context, keypoint)
{
  if (srcImg === null || context === null || keypoint === null) {
      return null;
  }

  var feature = [];
  
  var width = srcImg.width;
  var height = srcImg.height;
  var scale = Math.pow(2.0, keypoint.level);
  var s = 3;
  
  var sum = 0.0;
  var sum_sqr = 0.0;
  
  for (var i = 0; i < 8; i++) {
    var x = keypoint.x / scale + ((i - 4) * s);
    var x0 = Math.floor(x);
    var x1 = x0 + 1;
    var dx = x - x0;

    for (var j = 0; j < 8; j++) { 
      var y = keypoint.y / scale + ((j - 4) * s);
      
      //bilinear
      var y0 = Math.floor(y);
      var y1 = y0 + 1;
      var dy = y - y0;
      
      var p00 = 0, p01 = 0, p10 = 0, p11 = 0;
      
      if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
        var index = (4 * y0) * width + (4 * x0);
        p00 = 0.11 * srcImg.data[index + 0] + 0.59 * srcImg.data[index + 1] + 0.30 * srcImg.data[index + 2];
      }

      if (x1 >= 0 && x1 < width && y0 >= 0 && y0 < height) {
        var index = (4 * y0) * width + (4 * x1);
        p01 = 0.11 * srcImg.data[index + 0] + 0.59 * srcImg.data[index + 1] + 0.30 * srcImg.data[index + 2];
      }

      if (x0 >= 0 && x0 < width && y1 >= 0 && y1 < height) {
        var index = (4 * y1) * width + (4 * x0);
        p10 = 0.11 * srcImg.data[index + 0] + 0.59 * srcImg.data[index + 1] + 0.30 * srcImg.data[index + 2];
      }

      if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height) {
        var index = (4 * y1) * width + (4 * x1);
        p11 = 0.11 * srcImg.data[index + 0] + 0.59 * srcImg.data[index + 1] + 0.30 * srcImg.data[index + 2];
      }
      
      var p0 = (1.0 - dx) * p00 + dx * p01;
      var p1 = (1.0 - dx) * p10 + dx * p11;
      var p = (1.0 - dy) * p0 + dy * p1;
    
      feature.push(p);
      
      sum += p;
      sum_sqr += p * p;
    }
  }

  //Tiêu chuẩn hóa
  var mean = sum / feature.length;
  var dev = Math.sqrt((sum_sqr - ((sum * sum) / feature.length)) / (feature.length - 1.0));
  
  if (dev === 0.0) {
    dev = 1.0;
  }
  
  for (var i = 0; i < feature.length; i++) {
    feature[i] = (feature[i] - mean) / dev;
  }

  return feature;
}