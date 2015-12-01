
var canvas;
var gl;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var theta = [ 0, 0, 0 ];
var thetaLoc;

var size = 0.5;

var NumTimesToSubdivide = 0;
var invert = false;



function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	document.getElementById("sliderX").onmousemove = function(){
		theta[xAxis] = event.srcElement.value;
	};
	document.getElementById("sliderY").onmousemove = function(){
		theta[yAxis] = event.srcElement.value;
	};
	document.getElementById("sliderZ").onmousemove = function(){
		theta[zAxis] = event.srcElement.value;
	};
	document.getElementById("sliderSubs").onchange = function() {
		NumTimesToSubdivide = event.srcElement.value;
		points = []; colors = [];//delete the old points
		init();
	};
	document.getElementById( "InverseSponge" ).onclick = function () {
		if (invert === true){ invert = false; }
		else { invert = true; }
		points = []; colors = [];//delete the old points
		init();
	};
	
    //initilize vertices
    var vertices = [
        vec4(  size,  size,  size, 1.0  ),//0 front top right
        vec4( -size,  size,  size, 1.0  ),//1 front top left
        vec4( -size, -size,  size, 1.0  ),//2 front bottom left
        vec4(  size, -size,  size, 1.0  ),//3 front bottom right
        vec4(  size,  size, -size, 1.0  ),//4 back top right
        vec4( -size,  size, -size, 1.0  ),//5 back top left
        vec4( -size, -size, -size, 1.0  ),//6 back bottom left
        vec4(  size, -size, -size, 1.0  )//7 back bottom right
    ];
    
    divideCube( vertices[0], vertices[1], vertices[2], vertices[3],
                vertices[4], vertices[5], vertices[6], vertices[7],
                 NumTimesToSubdivide, size*2, invert, false);
	

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    // enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");
	
    render();
};

//Purpose: divides the cube into smaller cubes, uses recursion
//Parameters: the 8 corners of the cube, the number of times to divide, which step is this,
//			  if the shape is to be inversed, and if the block should be skipped
function divideCube(a, b, c, d, e, f, g, h, count, stepSize, inverse, skipThisBlock){
	//if this is the last step/ or this block should be skipped
 	if ((count <= 0)||(skipThisBlock === true)){
		cube(a, b, c, d,  e, f, g, h, inverse, skipThisBlock, count);
	}
	else { 
		var stepSize = stepSize/3;//each new cube should be 1/3 smaller
		var z = 0, y = 0, x = 0;//start on the right top front cube
		var skipCounter = 0;

		z = a[2];
		for(var i = 0; i < 3; i++){ //for each z
			y = a[1];
			for(var j = 0; j < 3; j++){ //for each y
				x = a[0];
				for(var v = 0; v < 3; v++){ //for each x
					skipCounter++;
					//pass false/true with the function and check later
					divideCube( 
					vec4(x           , y            , z           , 1.0), 
					vec4(x - stepSize, y            , z           , 1.0), 
					vec4(x - stepSize, y  - stepSize, z           , 1.0),
					vec4(x           , y  - stepSize, z           , 1.0),
					vec4(x           , y            , z - stepSize, 1.0),
					vec4(x - stepSize, y            , z - stepSize, 1.0), 
					vec4(x - stepSize, y  - stepSize, z - stepSize, 1.0),
					vec4(x           , y  - stepSize, z - stepSize, 1.0),
					count-1, stepSize, inverse, skipThis(skipCounter, inverse))
					x = x - stepSize;
				}
				y = y - stepSize;
			}
			z = z - stepSize;
		}
	}
}

//Purpose: checks if this block should be skipped
//Parameters: the number of the block, if this is the inverse or not
//Returns: true if the block should be skipped, else false
function skipThis(number, inverse){
	
	var nonInverseVector = [5, 11, 13, 14, 15, 17, 23];
	for(var i = 0; i < nonInverseVector.length; i++){
		if (number === nonInverseVector[i]){
			return true;
		}
	}
	return false;
}

//Purpose: colors each side of the cube
//Parameters: all 8 sides of the cube, the cube should be inversed, 
//            if the block should be skipped, the level of recursion
function cube( a, b, c, d, e, f, g, h, inverse, skipThisBlock, count )
{
	// if this is to be inverted, color the block
    if ( (inverse === true) && (skipThisBlock === true) ){
    	square( a, b, c, d, 1 );//front
		square( e, a, d, h, 2 );//right
		square( b, f, g, c, 3 );//left
    	square( f, e, h, g, 4 );//back
		square( e, f, b, a, 5 );//top
		square( d, c, g, h, 0 );//bottom
    }
    //if this is the last level of recursion and we are not inverting
    else if ((count <= 0) && (skipThisBlock === false) && (inverse === false)){
    	
		square( a, b, c, d, 1 );//front
		square( e, a, d, h, 2 );//right
		square( b, f, g, c, 3 );//left
    	square( f, e, h, g, 4 );//back
		square( e, f, b, a, 5 );//top
		square( d, c, g, h, 0 );//bottom
    }
}

//Purpose: Used to color a square
//Parameters: the four points of the square and the color
function square( a, b, c, d, color )
{

    // add colors and vertices for one triangle
	
    var baseColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  //0 black
        [ 1.0, 0.0, 0.0, 1.0 ],  //1 red
        [ 1.0, 1.0, 0.0, 1.0 ],  //2 yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  //3 green
        [ 0.0, 0.0, 1.0, 1.0 ],  //4 blue
        [ 1.0, 0.0, 1.0, 1.0 ],  //5 magenta
    ];
    
	var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( indices[i] );
        colors.push(baseColors[color]);
    }
}

window.onload = init;

//Purpose: Renders the image
function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays( gl.TRIANGLES, 0, points.length);
    requestAnimationFrame(render);
}


//Purpose: Resizes the canvas when the window grows and shrinks
window.onresize = function() {
   var min = innerWidth;
   if (innerHeight < min) {
     min = innerHeight;
   }
   //if the window has been made smaller
   if (min < canvas.width || min < canvas.height) {
      canvas.width = min;            
      canvas.height = min;               
      gl.viewport(0, 0, min, min);   
   }
   //if the window has been made larger
   else if (min > canvas.width || min > canvas.height) {
      canvas.width = min;            
      canvas.height = min;               
      gl.viewport(0, 0, min, min);   
   }
};






