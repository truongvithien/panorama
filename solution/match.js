//Match features
function matchFeatures(features1, features2, minDist)
{
  if (features1 === null || features2 === null || minDist <= 0.0) {
    return null;
  }

  var matches = [];
  
  var matches12 = matchFeaturesSimple(features1, features2, minDist);
  var matches21 = matchFeaturesSimple(features2, features1, minDist);
  
  if (matches12 === null || matches21 === null) {
    return null;
  }

  //Kiểm tra chéo
  for(var m1 in matches12) {
    var m2 = matches12[m1];

    if (matches21[m2] == m1) { //match
      matches.push(m1);
      matches.push(m2);
    }
  }

  return matches;
}

//Square Euclidean distance
function compareDescriptor(f1, f2)
{
  var d = 0.0;
  
  for (var i = 0; i < f1.length && i < f2.length; i++) {
    var dif = (f1[i] - f2[i]) / 255.0;
    d += dif * dif;
  }

  return d;
}

function matchFeaturesSimple(features1, features2, minDist)
{
  if (features1 === null || features2 === null || minDist <= 0.0) {
    return null;
  }

  var matches = {};

  //brute force
  var N1 = features1.length;
  var N2 = features2.length;

  if (N1 === 0 || N2 === 0) {
    return null;
  }

  var d1, d2, m1, m2;
  for (var i = 0; i < N1; i++) {
    var d = compareDescriptor(features1[i], features2[0]);

    d1 = d; m1 = 0;
    d2 = d; m2 = 0;

    for (var j = 1; j < N2; j++) {
      d = compareDescriptor(features1[i], features2[j]);

      if (d < d1) {
        d2 = d1;
        m2 = m1;
        d1 = d;
        m1 = j;
      } else if (d < d2) {
        d2 = d;
        m2 = j;
      }
    }

    if (d1 < minDist && d1 < 0.65 * d2) { //matched
      matches[i] = m1;
    }
  }

  return matches;
}