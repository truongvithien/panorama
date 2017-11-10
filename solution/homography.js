function matMult3(A, B)
{
  var C = new Array(9);
  C[0] = A[0]*B[0]+A[1]*B[3]+A[2]*B[6]; C[1] = A[0]*B[1]+A[1]*B[4]+A[2]*B[7]; C[2] = A[0]*B[2]+A[1]*B[5]+A[2]*B[8];
  C[3] = A[3]*B[0]+A[4]*B[3]+A[5]*B[6]; C[4] = A[3]*B[1]+A[4]*B[4]+A[5]*B[7]; C[5] = A[3]*B[2]+A[4]*B[5]+A[5]*B[8];
  C[6] = A[6]*B[0]+A[7]*B[3]+A[8]*B[6]; C[7] = A[6]*B[1]+A[7]*B[4]+A[8]*B[7]; C[8] = A[6]*B[2]+A[7]*B[5]+A[8]*B[8];
  return C;
}

function matVecMult3(A, v)
{
  var u = [ A[0]*v[0]+A[1]*v[1]+A[2]*v[2],
            A[3]*v[0]+A[4]*v[1]+A[5]*v[2],
            A[6]*v[0]+A[7]*v[1]+A[8]*v[2] ];
  return u;
}

// finds a homography between 2 quads
// x1 = H*x2
// x1 = [src.x;src.y;1] 
// x2 = [dst.x;dst.y;1] 
//
// src: vector with 4 2D points
// dst: vector with 4 2D points
function findHomography3(src, dst)
{
  //find a homography from unit square to dst;
  var Hunit_dst = solveHomographyUnitSquare(dst);
  //find a homography from dst to unit square
  var Hdst_unit = invertHomography3(Hunit_dst);
  //find a homography from unit square to src;
  var Hunit_src = solveHomographyUnitSquare(src);
  
  if (Hunit_dst[8]===0.0 || Hdst_unit===0 || Hunit_src[8]===0.0)
  { //invalid
    var H = [0,0,0,0,0,0,0,0,0];
    return H;
  }
    
  //compose and normalize
  var H = matMult3(Hunit_src,Hdst_unit);
  H[0] /= H[8]; H[1] /= H[8]; H[2] /= H[8]; 
  H[3] /= H[8]; H[4] /= H[8]; H[5] /= H[8]; 
  H[6] /= H[8]; H[7] /= H[8]; H[8] /= H[8]; 

  return H;
}
  
//finds an homography between a unit square and the 4 given points
function solveHomographyUnitSquare(pts)
{
  var N = pts.length/2;
  if (N!==4) 
  {
    return null;
  }

  var x0 = pts[0], y0 = pts[1];
  var x1 = pts[2], y1 = pts[3];
  var x2 = pts[4], y2 = pts[5];
  var x3 = pts[6], y3 = pts[7];

  var dx1 = x1-x2, dy1 = y1-y2;
  var dx2 = x3-x2, dy2 = y3-y2;
  var Sx = x0-x1+x2-x3, Sy = y0-y1+y2-y3;

  var a,b,c,d,e,f,g,h;
  if (Sx===0.0 && Sy===0.0) 
  { //affine
    a = x1-x0; d = y1-y0;
    b = x2-x1; e = y2-y1;
    c = x0; f = y0;
    g = 0; h = 0;
  }
  else 
  { //projective
    var det = dx1*dy2-dx2*dy1;
    if (det!==0.0) 
    {
      g = (Sx*dy2-Sy*dx2)/det;
      h = (dx1*Sy-dy1*Sx)/det;
      a = x1-x0+g*x1; d = y1-y0+g*y1;
      b = x3-x0+h*x3; e = y3-y0+h*y3;
      c = x0; f = y0;
    }
    else 
    {
      var H = [0,0,0,0,0,0,0,0,0];
      return H;
    }
  }
  var H = [a,b,c,d,e,f,g,h,1];
  return H;
}
  
// Inverts a 3x3 homography
function invertHomography3(H)
{
  if (H.length!==9)
  {
    return null;
  }

  var a,b,c,d,e,f,g,h,i;
  a = H[0]; b = H[1]; c = H[2];
  d = H[3]; e = H[4]; f = H[5];
  g = H[6]; h = H[7]; i = H[8]; 
      
  var s = a*e-b*d;
  if (s===0.0) 
  {
    s = 1.0;
  }
  
  var Hinv = [ (e*i-f*h)/s, (c*h-b*i)/s, (b*f-c*e)/s,
               (f*g-d*i)/s, (a*i-c*g)/s, (c*d-a*f)/s,
               (d*h-e*g)/s, (b*g-a*h)/s, (a*e-b*d)/s ];
  return Hinv;
}

// Compute a homography from the matches using RanSaC
function computeTransformation(keyPts1, keyPts2, matches, iterations)
{
  if (keyPts1===null || keyPts2===null || matches===null || iterations<=0)
  {
    return null;
  }

  var result = {};
  result.transform = [0,0,0,0,0,0,0,0,0];
  result.outliers = matches.length;
  result.inliers = 0;

  var N = matches.length/2;
  if (N<4)
  { //not enough matches
    return result;
  }

  if (N===4)
  { //do not iterate
    
    //compute homography
    var src = [], dst = [];
    for (var j=0; j<4; j++) 
    {
      var kp0 = keyPts1[matches[2*j]];
      src.push(kp0.x);
      src.push(kp0.y);
          
      var kp1 = keyPts2[matches[2*j+1]];
      dst.push(kp1.x);
      dst.push(kp1.y);
    }

    result.transform = findHomography3(src, dst);
    result.outliers = 0;
    result.inliers = matches.length - result.outliers;
    return result;
  }

  var m = [];

  for (var i=0; i<iterations; i++) 
  {
    //select 4 points
    for (var j=0; j<4; j++) 
    {
      m[j] = Math.floor(Math.random() * N);
      for (var k=0; k<j; k++) 
      {
        if (m[j]===m[k]) 
        {
          j--;
          break;
        }
      }
    }
     
    //compute homography
    var src = [], dst = [];
    for (var j=0; j<4; j++) 
    {
      var p0 =  matches[2*m[j]];
      var kp0 = keyPts1[p0];
      src.push(kp0.x);
      src.push(kp0.y);
          
      var p1 = matches[2*m[j]+1];
      var kp1 = keyPts2[p1];
      dst.push(kp1.x);
      dst.push(kp1.y);
    }
    var H = findHomography3(src, dst);
    if (H[8]===0.0)
    { //invalid
      continue;
    }
        
    //count outliers
    var outliers = 0;
    for (var j=0; j<N; j++) 
    {
      var p0 = matches[2*j];
      var kp0 = keyPts1[p0];
          
      var p1 = matches[2*j+1];
      var kp1 = keyPts2[p1];

      var p =[kp1.x, kp1.y, 1];
      var q = matVecMult3(H,p);
      q[0] /= q[2];
      q[1] /= q[2];
          
      var err = (q[0]-kp0.x)*(q[0]-kp0.x) + (q[1]-kp0.y)*(q[1]-kp0.y);
      if (err>1.0) 
      {
        outliers++;
      }
    }
    if (outliers>0) //TODO: I don't trust zero outliers!
    if (outliers<result.outliers) 
    {
      result.transform = H;
      result.outliers = outliers;
      result.inliers = matches.length - result.outliers;
    }
  }

  console.log(" outliers "+result.outliers+" inliers "+result.inliers);
  return result;
}
  

  