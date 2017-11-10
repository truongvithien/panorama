function side_information(info_att,info_value, id){ //showInfo
	if (id!==undefined){
		var att_table = document.getElementById("table_"+id);
		if (att_table!==null){
			att_table.innerHTML += 
			"<tr>" + 
			"	<td>" + info_att + "</td>" +
			"	<td>" + info_value + "</td>" + 
			"</tr>";
		}
	}
}

function addImageSection(id){
	//bigDIV
	var div = document.createElement("div");
	div.id = "attributes_"+id;
	div.className = "row";
	//imgDIV (inner bigDIV)
	var divImg = document.createElement("div");
	divImg.id = "img_"+id;
	divImg.className = "col-lg-6";
	div.appendChild(divImg);
	//canvas (inner imgDIV)
	var canvas = document.createElement("canvas");
	canvas.id = "canvas_"+id;
	canvas.setAttribute("style","max-width: 100%;");
	divImg.appendChild(canvas);
	//infoDIV (inner bigDIV)
	var divInfo = document.createElement("div");
	divInfo.id = "att_"+id;
	divInfo.className = "col-lg-6";
	div.appendChild(divInfo);
	//table (inner infoDIV)
	var table = document.createElement("table");
	table.id = "table_"+id;
	table.className = "table table-responsive";
	divInfo.appendChild(table);
	document.getElementById("extraction").appendChild(div);
	return canvas;
}

function processingImage(img) {
	var id = images.length;
	images.push(new objImage());

	var canvas = addImageSection(id);
	side_information("Image id",id,id);

	//draw image (canvas), get pixel data 
	canvas.width = img.width; 
	canvas.height = img.height;
	var context = canvas.getContext('2d');
	context.drawImage(img, 0,0, img.width, img.height);
	var srcImg = context.getImageData(0,0,img.width,img.height);
	images[id].img = srcImg;

	//make pyramid
	images[id].pyramid = makePyramid(images[id].img, context, pyramidLevels);
	logs("make pyramid id " + id);

	//Detect keypoint (interest point)
	images[id].keyPts = detectPyrKeypoints(images[id].pyramid, context, detectorThreshold, subpixel);
	side_information("Keypoint detected",images[id].keyPts.length, id);
  	logs("detect keypoint " + id);

	//ANMS
	images[id].keyPts = nonMaxSuppression(images[id].keyPts, keyPointCount);
	side_information("Keypoint detected <br/> (Adaptive Mon-Maximal Suppression)",images[id].keyPts.length, id);
	logs("detect keypoint (anms) " + id);

 	//Hiển thị các keypoint lên ảnh
  	var dstImg = drawKeypoints(srcImg, context, images[id].keyPts, 255, 0, 0);
  	context.putImageData(dstImg, 0, 0);
	logs("draw keypoint into image id " + id);   

  	//Rút trích descritors từ các keypoint
  	images[id].features = extractPyrDescriptors(images[id].pyramid, context, images[id].keyPts);
  	side_information("Descriptors extracted", images[id].features.length, id);
 	logs("extract descriptor " + id);
 
  	//Match với những ảnh đã thêm trước đó
  	for (var i = 0; i < id; i++) {
    	images[id].matches[i] = matchFeatures(images[id].features, images[i].features, matchMinDist);
    	side_information("Match (ID " + id + ";" + i + ")", images[id].matches[i].length, id);
     	logs("matching " + id +" and " + i);
	
		images[id].matchResult[i] = computeTransformation(images[id].keyPts, images[i].keyPts, images[id].matches[i], ransacIterations);
		side_information("Ransac outliers (ID " + id + ";" + i + ")", images[id].matchResult[i].outliers, id);
     	logs("ransac outlier " + id +" and " + i);

		if (images[id].matchResult[i].inliers >= minInliers
		    && images[id].matchResult[i].outliers < inlierRatio * images[id].matchResult[i].inliers) {
		  images[id].matchedImages.push(i);
		  images[i].matchedImages.push(id);
		}
	}
      
  //Tìm các cặp ảnh match
  matchImages();
  logs("matching all");
  
  //Stitch với những ảnh trước
  makePanorama();
  logs("make panorama");
}


function getMatchResult(j, i)
{
  if (j < i) {
    return images[i].matchResult[j];
  }

  return images[j].matchResult[i];
}


function getTransform(j, i)
{
  if (j < i) {
    return images[i].matchResult[j].transform;
  }

  return invertHomography3(images[j].matchResult[i].transform);
}

function matchImages()
{
  //reset các biến đổi trên ảnh
  for (var i = 0; i < images.length; i++) {
    images[i].matchId = -1;
    images[i].transform = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
  }

  //Tìm ảnh có nhiều matche hơn
  var roots = [0];
  for (var i = 1; i < images.length; i++) {
    if (images[i].matchedImages.length > images[roots[0]].matchedImages.length) {
      roots = [i];
    } else if (images[i].matchedImages.length === images[roots[0]].matchedImages.length) {
      roots.push(i);
    }
  }

  var root = roots[Math.floor((roots.length - 1) / 2)];

  if (images[root].matchedImages.length < 1) {
    return;
  }

  //add images one-by-one
  var matched = [];
  var finish = false;
  images[root].matchId = root;
  matched.push(root);

  while (!finish) {
    finish = true;
    var id1 = -1;
    var matchId1 = -1;
    for (var i = 0; i < images.length; i++) {
      if (matched.indexOf(i) >= 0) {
        continue; //Bỏ qua ảnh đã match trước đó
      }
      
      var matchId2 = -1;
      
      for (var j = 0; j < matched.length; j++) {
        var result2 = getMatchResult(matched[j], i);
        if (result2.inliers >= minInliers
            && result2.outliers < inlierRatio * result2.inliers) { //candidate
          if (matchId2 < 0 || result2.inliers > getMatchResult(matchId2, i).inliers) {
            matchId2 = matched[j];
          }
        }
      }

      if (matchId2 >= 0) { //candidate
        var result2 = getMatchResult(matchId2, i);
        if (id1 < 0 || result2.inliers > getMatchResult(id1, i).inliers) {
          id1 = i;
          matchId1 = matchId2;
        }
      }
    }

    if (id1 >= 0) {
      images[id1].matchId = matchId1;
      matched.push(id1);
      finish = false;
      side_information("Matching image", images[id1].matchId + " (root=" + root + ")", id1);
    }
  }

  //Cập nhật các phép biến đổi transform
  for (var i = 0; i < images.length; i++) {
    images[i].transform = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
    var id = i;
    while (images[id].matchId >= 0 && id !== root) {
      images[i].transform = matMult3(images[i].transform, getTransform(images[id].matchId, id));
      id = images[id].matchId;
    }
  }
}

/** makePanorama()
 * Tạo và vẽ ảnh panorama lên canvas
 */
function makePanorama()
{
  var root = -1;

  for (var i = 0; i < images.length; i++) {
    if (images[i].matchId === i) {
      root = i;
      break;
    }
  }

  if (root < 0) { //Không tìm thấy hình ảnh nào để match
    return;
  }
  
  var canvas = document.getElementById("canvasPanorama"); //Canvas dùng để hiển thị ảnh panorama.

  if (canvas === null) { //Tạo phần tử canvas
    canvas = document.createElement("canvas");
    canvas.id = "canvasPanorama";
    canvas.setAttribute("style","max-width: 100%");
    document.getElementById("result").appendChild(canvas);
  }

  var context = canvas.getContext('2d');
  var dstImg = stitchImages(images, context, invertHomography3(images[root].transform));
  
  //Vẽ ảnh panorama trên canvas id="canvasPanorama" đã tạo
  canvas.width = dstImg.width;
  canvas.height = dstImg.height;
  context.putImageData(dstImg, 0, 0);
}