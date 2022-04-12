"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

// RGBA colors
var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(1.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];


// Parameters controlling the size of the Robot's arm

var HEAD_HEIGHT = 1.5;
var HEAD_WIDTH = 1.5;
var BASE_HEIGHT = 4.0;
var BASE_WIDTH = 3.0;
var LOWER_ARM_HEIGHT = 2.0;
var LOWER_ARM_WIDTH = 0.5;
var UPPER_ARM_HEIGHT = 2.0;
var UPPER_ARM_WIDTH = 0.5;
var UPPER_LEG_HEIGHT = 2.0;
var UPPER_LEG_WIDTH = .5;
var LOWER_LEG_HEIGHT = 2.0;
var LOWER_LEG_WIDTH = .5;


// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var LowerLeg = 3;
var UpperLeg = 4;



var theta = [0, -60, 30, 180, -20];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

//----------------------------------------------------------------------------

function quad(color, a, b, c, d) {
    colors.push(vertexColors[color]);
    points.push(vertices[a]);
    colors.push(vertexColors[color]);
    points.push(vertices[b]);
    colors.push(vertexColors[color]);
    points.push(vertices[c]);
    colors.push(vertexColors[color]);
    points.push(vertices[a]);
    colors.push(vertexColors[color]);
    points.push(vertices[c]);
    colors.push(vertexColors[color]);
    points.push(vertices[d]);
}


function colorCube(a, b, c, d, e, f) {
    colors = [];
    points = [];
    quad(a, 1, 0, 3, 2);
    quad(b, 2, 3, 7, 6);
    quad(c, 3, 0, 4, 7);
    quad(d, 6, 5, 1, 2);
    quad(e, 4, 5, 6, 7);
    quad(f, 5, 4, 0, 1);
    console.log("coloring cube");

}

//__________________________________________

function wave(i) {

    setTimeout(function () {
        console.log('next wave step, i = ');
        console.log(i);
        theta[2] = i;
        if (i < 180) {
            wave(i + 15);
        }
    }, 100)
    if (i >= 180) {
        waveBack(i);
    }
}

function waveBack(i) {

    setTimeout(function () {
        console.log('next wave step, i = ');
        console.log(i);
        theta[2] = i;
        if (i > 15) {
            waveBack(i - 15);
        }
    }, 100)
}



//___________________________________________

function jump(i) {
    setTimeout(function () {
        console.log('next jump step, i = ');
        console.log(i);
        projectionMatrix = ortho(-10, 10, i, 10, -10, 10);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
        i = i - 2;
        if (i >= -30) {
            jump(i);
        }
    }, 100)
    if (i <= -30) {
        fallDown(i);
    }
}

function fallDown(i) {
    setTimeout(function () {
        console.log('next fall step');
        projectionMatrix = ortho(-10, 10, i, 10, -10, 10);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
        i = i + 2;
        if (i <= -10) {
            fallDown(i);
        }
    }, 100)
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

//---------------------------------------

function turn(i, j) {
    console.log('next turn step j = ');
    console.log(j);
    console.log('i =');
    console.log(i);
    setTimeout(function () {
        i += 15;
        theta[0] = i;
        if (j < 12) {
            turn(parseFloat(theta[0]), j + 1);
        }
    }, 100)
}


//--------------------------------------------------

function KeyDown(event) {

    console.log(event);

    if (event.key === "c") {                                            //Lower case c for color scheme 2
        colorCube(2, 3, 4, 5, 1, 7);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    }
    if (event.key === "C") {                                            //Capital C for color scheme 1
        colorCube(1, 2, 3, 6, 4, 5);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    }

    if (event.key === "t" | event.key === "T") {
        turn(parseFloat(theta[0]), 1);
    };

    if (event.key === "j" | event.key === "J") {                     //jump up and down
        jump(-10);
    }

    if (event.key === "w" | event.key === "W") {
        wave(45);
    }

}

//_____________________________________________

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    window.addEventListener("keydown", KeyDown, false);

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    colorCube(1, 2, 3, 6, 4, 5);

    // Load shaders and use the resulting shader program

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    document.getElementById("slider1").onchange = function (event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onchange = function (event) {
        theta[1] = event.target.value;
    };
    document.getElementById("slider3").onchange = function (event) {
        theta[2] = event.target.value;
    };
    document.getElementById("slider4").onchange = function (event) {
        theta[3] = event.target.value - 180;
    };
    document.getElementById("slider5").onchange = function (event) {
        theta[4] = event.target.value;
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    render();
}

//---------------------------------------------------------------------------

function head() {
    var s = scale4(HEAD_WIDTH, HEAD_HEIGHT, HEAD_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * HEAD_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}


//----------------------------------------------------------------------------


function base() {
    var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------


function lowerArm() {
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function upperLeg() {
    var s = scale4(UPPER_LEG_WIDTH, UPPER_LEG_HEIGHT, UPPER_LEG_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_LEG_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function lowerLeg() {
    var s = scale4(LOWER_LEG_WIDTH, LOWER_LEG_HEIGHT, LOWER_LEG_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_LEG_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

var render = function () {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelViewMatrix = rotate(theta[Base], 0, 1, 0);
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    head();
    ///////////////////////////////////////////////////////
    modelViewMatrix = rotate(theta[Base], 0, 1, 0);

    modelViewMatrix = mult(modelViewMatrix, translate(BASE_WIDTH / 2, BASE_HEIGHT / 2, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], 0, 0, 1));
    lowerArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], 0, 0, 1));
    upperArm();
    /////////////////////////////////////////////////////////
    modelViewMatrix = rotate(theta[Base], 0, 1, 0);

    modelViewMatrix = mult(modelViewMatrix, translate(-BASE_WIDTH / 2, BASE_HEIGHT / 2, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm] - 180, 0, 0, 1));
    lowerArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm] - 180, 0, 0, 1));
    upperArm();
    /////////////////////////////////////////////////////////
    modelViewMatrix = rotate(theta[Base], 0, 1, 0);

    modelViewMatrix = mult(modelViewMatrix, translate(BASE_WIDTH / 2, 0.0, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerLeg], 0, 0, 1));
    lowerLeg();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_LEG_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperLeg], 0, 0, 1));
    upperLeg();
    /////////////////////////////////////////////////////////
    modelViewMatrix = rotate(theta[Base], 0, 1, 0);

    modelViewMatrix = mult(modelViewMatrix, translate(-BASE_WIDTH / 2, 0.0, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerLeg], 0, 0, 1));
    lowerLeg();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_LEG_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperLeg], 0, 0, 1));
    upperLeg();

    requestAnimFrame(render);
}
