// Convert ảnh sang gray scale
function grayImage(srcImg, context)
{
	if (srcImg === null || context === null) {
		return null;
	}

	var width  = srcImg.width;
	var height = srcImg.height;
	var dstImg = context.createImageData(srcImg);	
    
	for (var h = 0; h < height; h++) {
		for (var w = 0; w < width; w++) {
			var index = (4 * h) * width + (4 * w);
			var gray = 0.11 * srcImg.data[index + 0] + 0.59 * srcImg.data[index + 1] + 0.30 * srcImg.data[index + 2];

			dstImg.data[index + 0] = gray;
			dstImg.data[index + 1] = gray;
			dstImg.data[index + 2] = gray;
			dstImg.data[index + 3] = srcImg.data[index + 3];
		}
	}

	return dstImg;
}

//Convolve ảnh bằng một kernel Gaussian [1, 4, 6, 4, 1]
function blurImage(srcImg, context)
{
    if (srcImg === null || context === null) {
        return null;
    }

    var width  = srcImg.width;
    var height = srcImg.height;
    var dstImg = context.createImageData(srcImg);
    var tmpImg = context.createImageData(dstImg);
    
    var kernel = [1, 4, 6, 4, 1]

    //Convolve theo chiều ngang
    for (var h = 0; h < height; h++) {
        for (var w = 0; w < width; w++) {
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
            var index = (4 * h) * width + (4 * w);
            tmpImg.data[index + 0] = r;
            tmpImg.data[index + 1] = g;
            tmpImg.data[index + 2] = b;
            tmpImg.data[index + 3] = 255;
        }
    }
    
    //Convolve theo chiều dọc
    for (var h = 0; h < height; h++) {
        for (var w = 0; w < width; w++) {
            var r = 0; 
            var g = 0; 
            var b = 0;
            var weight = 0;

            for (var i = 0; i < 5; i++) 
            {
                var k = h + i - 2;
                if (k >= 0 && k < height) {
                    var index = (4 * k) * width + (4 * w);

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
            var index = (4 * h) * width + (4 * w);
            dstImg.data[index + 0] = r;
            dstImg.data[index + 1] = g;
            dstImg.data[index + 2] = b;
            dstImg.data[index + 3] = 255;
        }
    }

    return dstImg;
}
