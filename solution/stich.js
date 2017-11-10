function stitchImages(images, context, transform) 
{
  if (images === null || context === null) {
    return null;
  }

  if (transform === undefined) {
    transform = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
  }
  
  var N = images.length;
  if (N < 1) {
    return null;
  }

  //image transform
  var H = new Array(N);

  //find new image dimensions
  var p0 = [0, 0], p1 = [images[0].img.width, images[0].img.height];
  for (var i = 0; i < N; i++) {
    H[i] = matMult3(images[i].transform, transform);
    
    if (images[i].matchId < 0) { //Ảnh không match
      continue;
    }
    
    //inverse transform
    var Hinv = invertHomography3(H[i]);

    var width = images[i].img.width;
    var height = images[i].img.height;
    var px = [0.0, 0.0, 1.0];
    var p;
    
    //corner0
    px[0] = 0.0; px[1] = 0.0; 
    p = matVecMult3(Hinv, px);
    p[0] = p[0] / p[2];
    p[1] = p[1] / p[2]; 
    if (p[0] < p0[0]) {
      p0[0] = p[0];
    } 
    if (p[1] < p0[1]) {
      p0[1] = p[1];
    }
    if (p[0] > p1[0]) {
      p1[0] = p[0];
    } 
    if (p[1] > p1[1]) {
      p1[1] = p[1];
    } 

    //corner1
    px[0] = width; px[1] = 0.0; 
    p = matVecMult3(Hinv, px);
    p[0] = p[0] / p[2]; 
    p[1] = p[1] / p[2]; 
    if (p[0] < p0[0]) {
      p0[0] = p[0];
    } 
    if (p[1] < p0[1]) {
      p0[1] = p[1];
    }
    if (p[0] > p1[0]) {
      p1[0] = p[0];
    } 
    if (p[1] > p1[1]) {
      p1[1] = p[1];
    }

    //corner2
    px[0] = width; px[1] = height; 
    p = matVecMult3(Hinv, px); 
    p[0] = p[0] / p[2]; 
    p[1] = p[1] / p[2]; 
    if (p[0] < p0[0]) {
      p0[0] = p[0];
    } 
    if (p[1] < p0[1]) {
      p0[1] = p[1];
    }
    if (p[0] > p1[0]) {
      p1[0] = p[0];
    } 
    if (p[1] > p1[1]) {
      p1[1] = p[1];
    }

    //corner3
    px[0] = 0; px[1] = height; 
    p = matVecMult3(Hinv, px);
    p[0] = p[0] / p[2]; 
    p[1] = p[1] / p[2]; 
    if (p[0] < p0[0]) {
      p0[0] = p[0];
    } 
    if (p[1] < p0[1]) {
      p0[1] = p[1];
    }
    if (p[0] > p1[0]) {
      p1[0] = p[0];
    } 
    if (p[1] > p1[1]) {
      p1[1] = p[1];
    }
  }
  
  var newSize = [ Math.floor(p1[0] - p0[0]), Math.floor(p1[1] - p0[1]) ];
  //console.log("new size w="+newSize[0]+" h="+newSize[1]);
  
  //translation
  var T = p0;

  //Make and fill panorama
  var dstImg = context.createImageData(newSize[0], newSize[1]);
  var width  = dstImg.width;
  var height = dstImg.height;
  var data = dstImg.data;
  
  for (var h = 0; h < height; h++) {
    for(var w = 0; w < width; w++) {
      var p = [w + T[0], h + T[1], 1.0];
      var r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < N; i++) {
        if (images[i].matchId < 0) { //Ảnh không match
          continue;
        }
  
        var q = matVecMult3(H[i], p);
        q[0] /= q[2];
        q[1] /= q[2];
        
        var x = Math.floor(q[0]);
        var y = Math.floor(q[1]);
        
        if (x >= 0 && x < images[i].img.width && y >= 0 && y < images[i].img.height) {
          var index = (4 * y) * images[i].img.width + (4 * x);
          r += images[i].img.data[index + 0];
          g += images[i].img.data[index + 1];
          b += images[i].img.data[index + 2];
          n++;
        }
      }

      if (n > 0) {
        r /= n;
        g /= n;
        b /= n;
      }
    
      var index = (4 * h) * width + (4 * w);
      data[index + 0] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  dstImg.data = data;
  
  return dstImg;
}