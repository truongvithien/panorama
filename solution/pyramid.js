function makePyramid(srcImg, context, levels)
{
  if (srcImg === null || context === null || levels < 0) {
    return null;
  }

  var pyramid = new Array(levels + 1);
  pyramid[0] = srcImg;
  for (var i = 1; i <= levels; i++){
    pyramid[i] = makePyramidLevel(pyramid[i - 1], context);
  }

  return pyramid;
}

function makePyramidLevel(srcImg, context)
{
    if (srcImg === null || context === null) {
        return null;
    }
  
    var width = srcImg.width;
    var height = srcImg.height;
    var newWidth = width / 2;
    var newHeight = height / 2;

    //Ảnh thu được sau khi makePyramidLevel (tức pyramic có level cao hơn 1 bậc) sẽ có kích thước w, h bằng 1/2 so vs pyramic hiện tại
    var dstImg = context.createImageData(newWidth, newHeight);
    var tmpImg = context.createImageData(newWidth, height);
    
    var kernel = [1,4,6,4,1];

    //Resize ảnh theo chiều ngang
    for (var h = 0; h < height; h++) {
        for (var w = 0; w < width; w += 2) {
            var r = 0; 
            var g = 0; 
            var b = 0;
            var weight = 0;

            for (var i = 0; i < 5; i++) {
                var k = w + i - 2;
                if (k >= 0 && k < width) {
                    var index = (4 * h) * width + (4 * k);

                    r += kernel[i] * srcImg.data[index + 0];
                    g += kernel[i] * srcImg.data[index + 1];
                    b += kernel[i] * srcImg.data[index + 2];
                    weight += kernel[i];
                }
            }
          
            r = (r / weight) & 0xff;
            g = (g / weight) & 0xff;
            b = (b / weight) & 0xff;

            //Set giá trị mới cho pixel
            var index = (4 * h) * newWidth + (2 * w);
            tmpImg.data[index+0] = r;
            tmpImg.data[index+1] = g;
            tmpImg.data[index+2] = b;
            tmpImg.data[index+3] = 255;
        }
    }
    
    //Resize ảnh theo chiều dọc
    for (var h = 0; h < height; h += 2) {
        for (var w = 0; w < newWidth; w++) {
            var r = 0; 
            var g = 0; 
            var b = 0;
            var weight = 0;

            for (var i = 0; i < 5; i++) {
                var k = h + i - 2;
                if (k >= 0 && k < height) {
                    var index = (4 * k) * newWidth + (4 * w);

                    r += kernel[i] * tmpImg.data[index + 0];
                    g += kernel[i] * tmpImg.data[index + 1];
                    b += kernel[i] * tmpImg.data[index + 2];
                    weight += kernel[i];
                }
            }
          
            r = (r / weight) & 0xff;
            g = (g / weight) & 0xff;
            b = (b / weight) & 0xff;

            //Set giá trị mới cho pixel
            var index = (2 * h) * newWidth + (4 * w);
            dstImg.data[index + 0] = r;
            dstImg.data[index + 1] = g;
            dstImg.data[index + 2] = b;
            dstImg.data[index + 3] = 255;
        }
    }

    return dstImg;
}