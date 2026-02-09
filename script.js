customElements.define("tag-canvas-particule", class extends HTMLElement{});

let _tagCanvas = null;
let _webGL = null;
let _orientationScreen = 1;
let _rxAccelerometer = 0;
let _ryAccelerometer = 0;
let _rzAccelerometer = 0;

function randomBinary(a, b)
{
    return Math.random() < 0.5 ? a : b;
}

function randomInteger(min, max)
{
    return min + Math.floor(Math.random() * ((max - min) + 1));
}

function randomFloat(min, max)
{
    return min + (Math.random() * (max - min));
}

function clamp(value, min, max)
{
    let valueClamp = value;
    
    if (valueClamp < min)
    {
        valueClamp = min;
    }
    else if (valueClamp > max)
    {
        valueClamp = max;
    }
    
    return valueClamp;
}

function clampPositiveSymmetricalMinMax(value, minMax)
{
    let valueClamp = value / minMax;
    
    if (value < 0)
    {
        valueClamp *= -1;
    }
    
    if (value > minMax)
    {
        valueClamp = 1;
    }
    
    return valueClamp;
}

function imu()
{
    let alphaAccelerometer = 0;
    let betaAccelerometer = 0;
    let gammaAccelerometer = 0;
    const SMOOTH_R = 0.001;
    const TRAVEL_RXY = 2500;
    const TRAVEL_RZ = 500;
    
    function imuRead(event)
    {
        const SMOOTH_TIME_R = 1 - Math.exp(-event.interval * SMOOTH_R);
        
        alphaAccelerometer += (event.rotationRate.alpha - alphaAccelerometer) * SMOOTH_TIME_R;
        betaAccelerometer += (event.rotationRate.beta - betaAccelerometer) * SMOOTH_TIME_R;
        gammaAccelerometer += (event.rotationRate.gamma - gammaAccelerometer) * SMOOTH_TIME_R;
    }
    
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function")
    {
        DeviceMotionEvent.requestPermission().then(response =>
        {
            if (response === "granted")
            {
                window.addEventListener("devicemotion", imuRead);
            }
        });
    }
    else
    {
        window.addEventListener("devicemotion", imuRead);
    }
    
    function updateAccelerometer()
    {
        if (_orientationScreen === 1)
        {
            _rxAccelerometer = Math.tanh(betaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
            _ryAccelerometer = -Math.tanh(alphaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
        }
        else if (_orientationScreen === 2)
        {
            _rxAccelerometer = -Math.tanh(betaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
            _ryAccelerometer = Math.tanh(alphaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
        }
        else if (_orientationScreen === 3)
        {
            _rxAccelerometer = Math.tanh(alphaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
            _ryAccelerometer = Math.tanh(betaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
        }
        else if (_orientationScreen === 4)
        {
            _rxAccelerometer = -Math.tanh(alphaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
            _ryAccelerometer = -Math.tanh(betaAccelerometer * SMOOTH_R) * TRAVEL_RXY;
        }
        
        _rzAccelerometer = ((-Math.tanh(gammaAccelerometer * SMOOTH_R) * TRAVEL_RZ) * Math.PI) / 180;
        
        requestAnimationFrame(updateAccelerometer);
    }
    
    requestAnimationFrame(updateAccelerometer);
}

function particuleAnimation()
{
    let program = null;
    let vsSource = null;
    let fsSource = null;
    let bufferPosition = null;
    let bufferDiameterGradient = null;
    let bufferColorAlpha = null;
    let timePrevious = 0;
    let indexParticule = 0;
    let index2 = 0;
    let index4 = 0;
    let indexParticuleX = 0;
    let indexParticuleY = 0;
    let indexRed = 0;
    let indexGreen = 0;
    let indexBlue = 0;
    let indexAlpha = 0;
    let mass = null;
    let proximity = null;
    let velocity = null;
    let position = null;
    let positionRender = null;
    let diameterGradient = null;
    let diameterStart = null;
    let gradientStart = null;
    let colorAlpha = null;
    let alphaStart = null;
    let xAttractor = 0;
    let yAttractor = 0;
    let xAttractorRandom = 0;
    let yAttractorRandom = 0;
    let directionAttractorRandom = false;
    let shapeAttractor1 = null;
    //let numberAttractor = 1;
    //let stateAttractor = 1;
    //let timeState = 0;
    //let newRandomizeAttractor = 0;
    let directionSpinShape = randomBinary(-1, 1);
    let angleSpinShapeStartShape = Math.PI * randomFloat(-1, 1);
    let radiusSpinShape = 0;
    let angleSpinShape = 0;
    let weightSpinShape = 0;
    let xTouch = 0;
    let yTouch = 0;
    let xSmoothTouch = 0;
    let ySmoothTouch = 0;
    let xSmoothJitterTouch = 0;
    let ySmoothJitterTouch = 0;
    let activeTouchA = false;
    let activeTouchB = false;
    let timeTouch1 = 0;
    let timeTouch2 = 0;
    let timeAttractorRandom1 = 0;
    let timeAttractorRandom2 = 0;
    
    //EN COURS DE TRI
    let xJitterTouch = 0;
    let yJitterTouch = 0;
    let widthRingTouch = 1;
    let heightRingTouch = 1;
    let widthSmoothRingTouch = 1;
    let heightSmoothRingTouch = 1;
    let xSmoothTouchPrevious = 0;
    let ySmoothTouchPrevious = 0;
    let smoothVelocityTouch = 0;
    let vxSmooth = 0;
    let vySmooth = 0;
    let magnitudeSmooth = 0;
    let magnitudeSmoothScale = 0;
    let forceMassTime = 0;
    let vx = 0;
    let vy = 0;
    let px = 0;
    let py = 0;
    let dx = 0;
    let dy = 0;
    let magnitude = 0;
    let magnitudeScale = 0;
    let force = 0;
    let smoothTouch = 0;
    let smoothJitterTouch = 0;
    let smoothRingTouch = 0;
    let damping = 0;
    let xBlur = 0;
    let yBlur = 0;
    let xParallax = 0;
    let yParallax = 0;
    let cosParallax = 0;
    let sinParallax = 0;
    let hTeleport = 0;
    let vTeleport = 0;
    let fadeIn = 0;
    
    const LOGO = document.createElement("canvas");
    let ctxLogo = null;
    let measureLogo = null;
    let widthLogo = 0;
    let heightLogo = 0;
    let dataLogo = null;
    let xLogo = 0;
    let yLogo = 0;
    let xPixelLogo = [];
    let yPixelLogo = [];
    let lenghtPixel = 0;
    let randomLogo = 0;
    
    //EN COURS DE TRI
    const SAFE_SQRT = 0.000001;
    
    //const TEXT_LOGO = String.fromCodePoint(0x88fd);//FABRICATION
    //const TEXT_LOGO = String.fromCodePoint(0x85dd);//ARTISANAT
    const TEXT_LOGO = "S";
    const FONT_LOGO = "fontC";
    const SIZE_LOGO = 700;
    const WEIGHT_LOGO = 500;
    
    const COUNT_PARTICLE = 10000;
    const COUNT_PARTICLE_SHAPE = 7500;
    const SIZE_X_SPIN_SHAPE = 1000;
    const SIZE_Y_SPIN_SHAPE = 500;
    const COUNT_SPIN_SHAPE = 4;
    const BULB1_SPIN_SHAPE = 1;
    const BULB2_SPIN_SHAPE = 200;
    const FORCE_ATTRACTOR = 100;
    const FORCE_ATTRACTOR_RANDOM = 50;
    const FORCE_TOUCH = 2;
    const RADIUS_TOUCH = 15;
    const SMOOTH_TOUCH = 0.0001;
    const SMOOTH_JITTER_TOUCH = 0.001;
    const SMOOTH_RING_TOUCH = 0.0001;
    const SMOOTH_VELOCITY_TOUCH = 0.1;
    const CLAMP_MAGNITUDE = 250;
    const CLAMP_FORCE = 500;
    const DAMPING = 0.4;
    const VELOCITY_MIN = 10;
    const WIDTH_BLUR = 5000;
    const HEIGHT_BLUR = 500;
    const Y_OFFSET_BLUR = 190;
    const DIAMETER_BLUR = 10;
    
    //console.log(window.innerHeight);
    
    _tagCanvas = document.getElementById("tag-canvas-particule");
    
    _tagCanvas.addEventListener("touchstart", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        const LENGTH_TOUCH = event.touches.length;
        
        if (LENGTH_TOUCH === 1)
        {
            xTouch = (((event.touches[0].clientX - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
            yTouch = -(((event.touches[0].clientY - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        }
        else if (LENGTH_TOUCH === 2)
        {
            xTouch = (((((event.touches[0].clientX + event.touches[1].clientX) * 0.5) - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
            yTouch = -(((((event.touches[0].clientY + event.touches[1].clientY) * 0.5) - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        }
        
        xSmoothTouch = xTouch;
        ySmoothTouch = yTouch;
        xSmoothTouchPrevious = xTouch;
        ySmoothTouchPrevious = yTouch;
        
        activeTouchA = true;
        activeTouchB = true;
        
        event.preventDefault();
    },
    {
        passive: false
    });
    
    _tagCanvas.addEventListener("touchmove", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        const LENGTH_TOUCH = event.touches.length;
        
        if (LENGTH_TOUCH === 1)
        {
            xTouch = (((event.touches[0].clientX - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
            yTouch = -(((event.touches[0].clientY - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        }
        else if (LENGTH_TOUCH === 2)
        {
            xTouch = (((((event.touches[0].clientX + event.touches[1].clientX) * 0.5) - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
            yTouch = -(((((event.touches[0].clientY + event.touches[1].clientY) * 0.5) - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        }
        
        activeTouchA = true;
        activeTouchB = true;
        
        event.preventDefault();
    },
    {
        passive: false
    });
    
    _tagCanvas.addEventListener("touchend", () =>
    {
        activeTouchA = false;
        activeTouchB = false;
    });
    
    _tagCanvas.addEventListener("touchcancel", () =>
    {
        activeTouchA = false;
        activeTouchB = false;
    });
    
    _tagCanvas.addEventListener("pointerenter", () =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        
        xTouch = (((event.clientX - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
        yTouch = -(((event.clientY - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        
        xSmoothTouch = xTouch;
        ySmoothTouch = yTouch;
        xSmoothTouchPrevious = xTouch;
        ySmoothTouchPrevious = yTouch;
        
        activeTouchA = true;
        
        if (event.buttons & 1 === 1)
        {
            activeTouchB = true;
        }
    });
    
    _tagCanvas.addEventListener("pointerdown", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        
        xTouch = (((event.clientX - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
        yTouch = -(((event.clientY - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        
        xSmoothTouch = xTouch;
        ySmoothTouch = yTouch;
        xSmoothTouchPrevious = xTouch;
        ySmoothTouchPrevious = yTouch;
        
        activeTouchA = true;
        activeTouchB = true;
    });
    
    _tagCanvas.addEventListener("pointermove", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        
        xTouch = (((event.clientX - RECTANGLE.left) / RECTANGLE.width) - 0.5) * H_WINDOW;
        yTouch = -(((event.clientY - RECTANGLE.top) / RECTANGLE.height) - 0.5) * V_WINDOW;
        
        activeTouchA = true;
        
        if (event.buttons & 1 === 1)
        {
            activeTouchB = true;
        }
    });
    
    _tagCanvas.addEventListener("pointerup", () =>
    {
        activeTouchB = false;
    });
    
    _tagCanvas.addEventListener("pointerleave", () =>
    {
        activeTouchA = false;
        activeTouchB = false;
    });
    
    _tagCanvas.addEventListener("pointercancel", () =>
    {
        activeTouchA = false;
        activeTouchB = false;
    });
    
    function setupWebGL()
    {
        _webGL = _tagCanvas.getContext("webgl");
        _webGL.clearColor(0.05, 0.05, 0.05, 1);
        _webGL.enable(_webGL.BLEND);
        _webGL.blendFunc(_webGL.SRC_ALPHA, _webGL.ONE_MINUS_SRC_ALPHA);
        //_webGL.enable(_webGL.PROGRAM_POINT_SIZE);
        
        vsSource = `
        precision mediump float;
        
        attribute vec2 positionBuffer;
        attribute vec2 diameterGradientBuffer;
        attribute vec4 colorAlphaBuffer;
        
        varying float gradientCommon;
        varying vec3 colorCommon;
        varying float alphaCommon;
        
        void main()
        {
            gl_Position = vec4(positionBuffer, 0.0, 1.0);
            gl_PointSize = diameterGradientBuffer.x;
            gradientCommon = diameterGradientBuffer.y;
            colorCommon = colorAlphaBuffer.rgb;
            alphaCommon = colorAlphaBuffer.a;
        }`;
        
        fsSource = `
        precision mediump float;
        
        varying float gradientCommon;
        varying vec3 colorCommon;
        varying float alphaCommon;
        
        void main()
        {
            if (alphaCommon > 0.001)
            {
                vec2 point = gl_PointCoord - 0.5;
                float length = length(point);
                float alphaGradient = alphaCommon * smoothstep(0.5, gradientCommon, length);
                gl_FragColor = vec4(colorCommon, alphaGradient);
            }
        }`;
    }
    
    function startProgram(vsSource, fsSource)
    {
        const PROGRAM =
        _webGL.createProgram();
        _webGL.attachShader(PROGRAM, loadShader(_webGL.VERTEX_SHADER, vsSource));
        _webGL.attachShader(PROGRAM, loadShader(_webGL.FRAGMENT_SHADER, fsSource));
        _webGL.linkProgram(PROGRAM);
        _webGL.useProgram(PROGRAM);
        
        if (_webGL.getProgramParameter(PROGRAM, _webGL.LINK_STATUS) === false)
        {
            alert("webGL ERROR");
        }
        
        return PROGRAM;
    }
    
    function loadShader(type, source)
    {
        const SHADER = _webGL.createShader(type);
        
        _webGL.shaderSource(SHADER, source);
        _webGL.compileShader(SHADER);
        
        if (_webGL.getShaderParameter(SHADER, _webGL.COMPILE_STATUS) === false)
        {
            alert("webGL ERROR");
            _webGL.deleteShader(SHADER);
        }
        
        return SHADER;
    }
    
    function startBufferPosition()
    {
        const LOCATION = _webGL.getAttribLocation(program, "positionBuffer");
        
        bufferPosition = _webGL.createBuffer();
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferPosition);
        _webGL.bufferData(_webGL.ARRAY_BUFFER, position, _webGL.DYNAMIC_DRAW);
        
        _webGL.enableVertexAttribArray(LOCATION);
        _webGL.vertexAttribPointer(LOCATION, 2, _webGL.FLOAT, false, 0, 0);
    }
    
    function startBufferDiameterGradient()
    {
        const LOCATION = _webGL.getAttribLocation(program, "diameterGradientBuffer");
        
        bufferDiameterGradient = _webGL.createBuffer();
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferDiameterGradient);
        _webGL.bufferData(_webGL.ARRAY_BUFFER, diameterGradient, _webGL.DYNAMIC_DRAW);
        
        _webGL.enableVertexAttribArray(LOCATION);
        _webGL.vertexAttribPointer(LOCATION, 2, _webGL.FLOAT, false, 0, 0);
    }
    
    function startBufferColorAlpha()
    {
        const LOCATION = _webGL.getAttribLocation(program, "colorAlphaBuffer");
        
        bufferColorAlpha = _webGL.createBuffer();
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferColorAlpha);
        _webGL.bufferData(_webGL.ARRAY_BUFFER, colorAlpha, _webGL.DYNAMIC_DRAW);
        
        _webGL.enableVertexAttribArray(LOCATION);
        _webGL.vertexAttribPointer(LOCATION, 4, _webGL.FLOAT, false, 0, 0);
    }
    
    //INDEX
    index2 = COUNT_PARTICLE * 2;
    index4 = COUNT_PARTICLE * 4;
    
    diameterGradient = new Float32Array(index2);
    diameterStart = new Float32Array(COUNT_PARTICLE);
    gradientStart = new Float32Array(COUNT_PARTICLE);
    colorAlpha = new Float32Array(index4);
    alphaStart = new Float32Array(COUNT_PARTICLE);
    mass = new Float32Array(COUNT_PARTICLE);
    proximity = new Float32Array(COUNT_PARTICLE);
    velocity = new Float32Array(index2);
    position = new Float32Array(index2);
    positionRender = new Float32Array(index2);
    shapeAttractor1 = new Float32Array(index2);
    
    //CANVAS TEXTE EC
    
    ctxLogo = LOGO.getContext("2d");
    ctxLogo.font = WEIGHT_LOGO + " " + SIZE_LOGO + "px " + FONT_LOGO;
    
    measureLogo = ctxLogo.measureText(TEXT_LOGO);
    
    widthLogo = Math.ceil(measureLogo.width);
    heightLogo = Math.ceil(measureLogo.actualBoundingBoxAscent + measureLogo.actualBoundingBoxDescent);
    
    LOGO.width = widthLogo;
    LOGO.height = heightLogo;
    
    ctxLogo.font = WEIGHT_LOGO + " " + SIZE_LOGO + "px " + FONT_LOGO;
    ctxLogo.fillText(TEXT_LOGO, 0, measureLogo.actualBoundingBoxAscent);
    
    dataLogo = ctxLogo.getImageData(0, 0, widthLogo, heightLogo).data;
    
    for (yLogo = 0; yLogo < heightLogo; yLogo++)
    {
        for (xLogo = 0; xLogo < widthLogo; xLogo++)
        {
            if (dataLogo[((yLogo * widthLogo + xLogo) * 4) + 3] > 0)
            {
                xPixelLogo.push(xLogo);
                yPixelLogo.push(yLogo);
            }
        }
    }
    
    lenghtPixel = xPixelLogo.length;
    //CANVAS TEXTE EC
    
    for (indexParticule = 0; indexParticule < COUNT_PARTICLE; indexParticule++)
    {
        //INDEX
        index2 = indexParticule * 2;
        index4 = indexParticule * 4;
        
        indexParticuleX = index2;
        indexParticuleY = index2 + 1;
        indexDiameter = index2;
        indexGradient = index2 + 1;
        indexRed = index4;
        indexGreen = index4 + 1;
        indexBlue = index4 + 2;
        indexAlpha = index4 + 3;
        
        //CANVAS TEXTE EC
        randomLogo = randomInteger(0, lenghtPixel);
        //CANVAS TEXTE EC
        
        if (indexParticule < COUNT_PARTICLE_SHAPE && randomInteger(1, 100) === 1)
        {
            diameterStart[indexParticule] = randomFloat(2, 3);
            gradientStart[indexParticule] = 0.49;
            alphaStart[indexParticule] = 0.08;
            mass[indexParticule] = randomFloat(1, 1.1);
            proximity[indexParticule] = randomFloat(1, 1);
            shapeAttractor1[indexParticuleX] = xPixelLogo[randomLogo] - (widthLogo * 0.5);
            shapeAttractor1[indexParticuleY] = (heightLogo * 0.5) - yPixelLogo[randomLogo];
        }
        else if (indexParticule >= COUNT_PARTICLE_SHAPE && randomInteger(1, 10) === 1)
        {
            diameterStart[indexParticule] = randomFloat(2, 3);
            gradientStart[indexParticule] = 0.25;
            alphaStart[indexParticule] = 0.08;
            mass[indexParticule] = randomFloat(1, 1.1);
            proximity[indexParticule] = randomFloat(1, 1.3);
        }
        else if (randomInteger(1, 5) === 1)
        {
            diameterStart[indexParticule] = randomFloat(5, 6);
            gradientStart[indexParticule] = 0.49;
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                alphaStart[indexParticule] = 0.06;
            }
            else
            {
                alphaStart[indexParticule] = 0.04;
            }
            
            mass[indexParticule] = randomFloat(1, 1.1);
            proximity[indexParticule] = randomFloat(1, 0.9);
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                shapeAttractor1[indexParticuleX] = xPixelLogo[randomLogo] - (widthLogo * 0.5);
                shapeAttractor1[indexParticuleY] = (heightLogo * 0.5) - yPixelLogo[randomLogo];
            }
        }
        else if (randomInteger(1, 10) !== 1)
        {
            diameterStart[indexParticule] = randomFloat(15, 20);
            gradientStart[indexParticule] = 0;
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                alphaStart[indexParticule] = 0.008;
            }
            else
            {
                alphaStart[indexParticule] = 0.006;
            }
            
            mass[indexParticule] = randomFloat(1.1, 2);
            proximity[indexParticule] = randomFloat(1, 0.25);
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                shapeAttractor1[indexParticuleX] = (xPixelLogo[randomLogo] - (widthLogo * 0.5)) * 0.95;
                shapeAttractor1[indexParticuleY] = (heightLogo * 0.5) - yPixelLogo[randomLogo];
            }
        }
        else
        {
            diameterStart[indexParticule] = randomFloat(30, 50);
            gradientStart[indexParticule] = 0;
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                alphaStart[indexParticule] = 0.008;
            }
            else
            {
                alphaStart[indexParticule] = 0.006;
            }
            
            mass[indexParticule] = randomFloat(2, 3);
            proximity[indexParticule] = randomFloat(1, 0.25);
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                shapeAttractor1[indexParticuleX] = (xPixelLogo[randomLogo] - (widthLogo * 0.5)) * 0.95;
                shapeAttractor1[indexParticuleY] = (heightLogo * 0.5) - yPixelLogo[randomLogo];
            }
        }
        
        colorAlpha[indexRed] = 1;
        colorAlpha[indexGreen] = 1;
        colorAlpha[indexBlue] = 1;
        
        if (indexParticule >= COUNT_PARTICLE_SHAPE)
        {
            radiusSpinShape = (indexParticule - COUNT_PARTICLE_SHAPE) / (COUNT_PARTICLE - COUNT_PARTICLE_SHAPE);
            angleSpinShape = angleSpinShapeStartShape + directionSpinShape * radiusSpinShape * COUNT_SPIN_SHAPE * Math.PI * 2;
            weightSpinShape = (1 / Math.exp(radiusSpinShape * BULB1_SPIN_SHAPE)) * BULB2_SPIN_SHAPE;
            
            shapeAttractor1[indexParticuleX] = (Math.cos(angleSpinShape) * radiusSpinShape * SIZE_X_SPIN_SHAPE) + randomFloat(-weightSpinShape, weightSpinShape);
            shapeAttractor1[indexParticuleY] = (Math.sin(angleSpinShape) * radiusSpinShape * SIZE_Y_SPIN_SHAPE) + randomFloat(-weightSpinShape, weightSpinShape);
        }
    }
    
    for (indexParticule = 0; indexParticule < COUNT_PARTICLE; indexParticule++)
    {
        //INDEX
        index2 = indexParticule * 2;
        index4 = indexParticule * 4;
        
        indexParticuleX = index2;
        indexParticuleY = index2 + 1;
        indexDiameter = index2;
        indexGradient = index2 + 1;
        indexRed = index4;
        indexGreen = index4 + 1;
        indexBlue = index4 + 2;
        indexAlpha = index4 + 3;
        
        velocity[indexParticuleX] = VELOCITY_MIN * randomBinary(-1, 1);
        velocity[indexParticuleY] = VELOCITY_MIN * randomBinary(-1, 1);
        
        xAttractor = shapeAttractor1[indexParticuleX];
        yAttractor = shapeAttractor1[indexParticuleY];
        
        position[indexParticuleX] = xAttractor + randomFloat(-5, 5);
        position[indexParticuleY] = yAttractor + randomFloat(-5, 5);
    }
    
    /*function state()
    {
        if (stateAttractor === 1)
        {
            timeState = performance.now() + 500;
            numberAttractor = 1;
            newRandomizeAttractor = 1;
            
            stateAttractor = 1;
        }
    }*/
    
    function touch1()
    {
        xJitterTouch = randomFloat(-30, 30);
        widthRingTouch = randomFloat(0.5, 2);
        
        timeTouch1 = performance.now() + randomInteger(50, 250);
    }
    
    function touch2()
    {
        yJitterTouch = randomFloat(-30, 30);
        heightRingTouch = randomFloat(0.5, 2);
        
        timeTouch2 = performance.now() + randomInteger(50, 250);
    }
    
    function attractorRandom1()
    {
        const H_SCALE = window.innerWidth * 0.5;
        const V_SCALE = window.innerHeight * 0.5;
        
        xAttractorRandom = randomFloat(-H_SCALE, H_SCALE);
        yAttractorRandom = randomFloat(-V_SCALE, V_SCALE);
        
        timeAttractorRandom1 = performance.now() + randomInteger(100, 2000);
    }
    
    function attractorRandom2()
    {
        if (randomInteger(1, 3) === 1)
        {
            directionAttractorRandom = false;
        }
        else
        {
            directionAttractorRandom = true;
        }
        
        //directionAttractorRandom = randomBinary(false, true);
        timeAttractorRandom2 = performance.now() + randomInteger(100, 2000);
    }
    
    timePrevious = performance.now();
    
    function updateAnimation(time)
    {
        const H_SCALE = window.innerWidth * 0.5;
        const V_SCALE = window.innerHeight * 0.5;
        const DPR = window.devicePixelRatio || 1;
        const TIME_DELTA = Math.min((time - timePrevious) * 0.001, 0.04);
        
        timePrevious = time;
        
        //STATE
        /*if (performance.now() > timeState)
        {
            state();
        }*/
        
        //TOUCH
        if (performance.now() > timeTouch1)
        {
            touch1();
        }
        
        if (performance.now() > timeTouch2)
        {
            touch2();
        }
        
        //ATTRACTOR
        if (performance.now() > timeAttractorRandom1)
        {
            attractorRandom1();
        }
        
        if (performance.now() > timeAttractorRandom2)
        {
            attractorRandom2();
        }
        
        smoothTouch = 1 - Math.pow(SMOOTH_TOUCH, TIME_DELTA);
        xSmoothTouch += (xTouch - xSmoothTouch) * smoothTouch;
        ySmoothTouch += (yTouch - ySmoothTouch) * smoothTouch;
        
        smoothJitterTouch = 1 - Math.pow(SMOOTH_JITTER_TOUCH, TIME_DELTA);
        xSmoothJitterTouch += (xJitterTouch - xSmoothJitterTouch) * smoothJitterTouch;
        ySmoothJitterTouch += (yJitterTouch - ySmoothJitterTouch) * smoothJitterTouch;
        
        smoothRingTouch = 1 - Math.pow(SMOOTH_RING_TOUCH, TIME_DELTA);
        widthSmoothRingTouch += (widthRingTouch - widthSmoothRingTouch) * smoothRingTouch;
        heightSmoothRingTouch += (heightRingTouch - heightSmoothRingTouch) * smoothRingTouch;
        
        vx = (xSmoothTouch - xSmoothTouchPrevious);
        vy = (ySmoothTouch - ySmoothTouchPrevious);
        
        xSmoothTouchPrevious = xSmoothTouch;
        ySmoothTouchPrevious = ySmoothTouch;
        
        smoothVelocityTouch = 1 - Math.pow(SMOOTH_VELOCITY_TOUCH, TIME_DELTA);
        vxSmooth += (vx - vxSmooth) * smoothVelocityTouch;
        vySmooth += (vy - vySmooth) * smoothVelocityTouch;
        
        magnitude = SAFE_SQRT + Math.sqrt((vx * vx) + (vy * vy));
        
        magnitudeSmooth += (magnitude - magnitudeSmooth) * smoothVelocityTouch;
        
        cosParallax = Math.cos(_rzAccelerometer);
        sinParallax = Math.sin(_rzAccelerometer);
        
        /*if (newRandomizeAttractor === 1)
        {
            angleSpinShapeStartShape -= 0.05 * directionSpinShape;
            newRandomizeAttractor = 2;
        }*/
        
        //ANIMATION
        for (indexParticule = 0; indexParticule < COUNT_PARTICLE; indexParticule++)
        {
            //INDEX
            indexParticuleX = indexParticule * 2;
            indexParticuleY = (indexParticule * 2) + 1;
            indexDiameter = indexParticule * 2;
            indexGradient = (indexParticule * 2) + 1;
            indexRed = indexParticule * 4;
            indexGreen = (indexParticule * 4) + 1;
            indexBlue = (indexParticule * 4) + 2;
            indexAlpha = (indexParticule * 4) + 3;
            
            //POSITION
            px = position[indexParticuleX];
            py = position[indexParticuleY];
            
            //ATTRACTOR
            /*if (newRandomizeAttractor === 2)
            {
                if (numberAttractor === 1)
                {
                    //radiusSpinShape = indexParticule / COUNT_PARTICLE;
                    //angleSpinShape = angleSpinShapeStartShape + directionSpinShape * radiusSpinShape * COUNT_SPIN_SHAPE * Math.PI * 2;
                    //weightSpinShape = (1 / Math.exp(radiusSpinShape * BULB1_SPIN_SHAPE)) * BULB2_SPIN_SHAPE;
                    
                    //shapeAttractor1[indexParticuleX] = (Math.cos(angleSpinShape) * radiusSpinShape * SIZE_X_SPIN_SHAPE) + randomFloat(-weightSpinShape, weightSpinShape);
                    //shapeAttractor1[indexParticuleY] = (Math.sin(angleSpinShape) * radiusSpinShape * SIZE_Y_SPIN_SHAPE) + randomFloat(-weightSpinShape, weightSpinShape);
                }
                else if (numberAttractor === 2)
                {
                    //shapeAttractor1[indexParticuleX] = randomFloat(-0.25, 0.25) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
                    //shapeAttractor1[indexParticuleY] = randomFloat(-0.25, 0.25) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
                }
                else if (numberAttractor === 3)
                {
                }
            }*/
            
            if (indexParticule < COUNT_PARTICLE_SHAPE)
            {
                /*if (numberAttractor === 1)
                {*/
                    xAttractor = shapeAttractor1[indexParticuleX];
                    yAttractor = shapeAttractor1[indexParticuleY];
                /*}
                else if (numberAttractor === 2)
                {
                    xAttractor = shapeAttractor2[indexParticuleX];
                    yAttractor = shapeAttractor2[indexParticuleY];
                }
                else if (numberAttractor === 3)
                {
                    xAttractor = shapeAttractor3[indexParticuleX];
                    yAttractor = shapeAttractor3[indexParticuleY];
                }*/
                
                dx = (xAttractor - px);
                dy = (yAttractor - py);
                
                magnitude = SAFE_SQRT + Math.sqrt((dx * dx) + (dy * dy));
                
                dx /= magnitude;
                dy /= magnitude;
                
                forceMassTime = (FORCE_ATTRACTOR / mass[indexParticule]) * TIME_DELTA;
                
                velocity[indexParticuleX] += dx * forceMassTime;
                velocity[indexParticuleY] += dy * forceMassTime;
            }
            else
            {
                xAttractor = xAttractorRandom;
                yAttractor = yAttractorRandom;
                
                dx = xAttractor - px;
                dy = yAttractor - py;
                
                magnitude = SAFE_SQRT + Math.sqrt((dx * dx) + (dy * dy));
                
                if (directionAttractorRandom === false)
                {
                    magnitudeScale = magnitude * 0.004;
                }
                else
                {
                    magnitudeScale = magnitude * 0.006;
                }
                
                if (magnitudeScale < 1.5)
                {
                    dx /= magnitude;
                    dy /= magnitude;
                    
                    force = FORCE_ATTRACTOR_RANDOM * (1.5 - magnitudeScale);
                    
                    forceMassTime = (force / mass[indexParticule]) * TIME_DELTA;
                    
                    if (directionAttractorRandom === false)
                    {
                        velocity[indexParticuleX] += dx * forceMassTime;
                        velocity[indexParticuleY] += dy * forceMassTime;
                    }
                    else
                    {
                        velocity[indexParticuleX] -= dx * forceMassTime;
                        velocity[indexParticuleY] -= dy * forceMassTime;
                    }
                }
            }
            
            //TOUCH
            if (activeTouchA === true && magnitudeSmooth > 0.1)
            {
                xAttractor = xSmoothTouch + xSmoothJitterTouch - _rxAccelerometer;
                yAttractor = ySmoothTouch + ySmoothJitterTouch - _ryAccelerometer;
                
                dx = (xAttractor - px) * widthSmoothRingTouch;
                dy = (yAttractor - py) * heightSmoothRingTouch;
                
                magnitude = SAFE_SQRT + Math.sqrt((dx * dx) + (dy * dy));
                
                magnitudeSmoothScale = magnitudeSmooth * RADIUS_TOUCH;
                
                if (magnitudeSmoothScale > CLAMP_MAGNITUDE)
                {
                    magnitudeSmoothScale = CLAMP_MAGNITUDE;
                }
                
                if (magnitude < magnitudeSmoothScale)
                {
                    dx /= magnitude;
                    dy /= magnitude;
                    
                    force = magnitudeSmooth * ((magnitudeSmoothScale * FORCE_TOUCH) - magnitude);
                    //force = magnitudeSmooth * (200 - magnitude);
                    
                    if (force > CLAMP_FORCE)
                    {
                        force = CLAMP_FORCE;
                    }
                    
                    force *= ((dx * vxSmooth) + (dy * vySmooth)) * -1;
                    
                    forceMassTime = (force / mass[indexParticule]) * TIME_DELTA;
                    
                    velocity[indexParticuleX] -= dx * forceMassTime;
                    velocity[indexParticuleY] -= dy * forceMassTime;
                }
            }
            
            //DAMPING
            vx = velocity[indexParticuleX];
            vy = velocity[indexParticuleY];
            
            magnitude = SAFE_SQRT + Math.sqrt((vx * vx) + (vy * vy));
            
            if (magnitude > VELOCITY_MIN)
            {
                damping = magnitude * Math.pow(DAMPING, TIME_DELTA);
                
                if (damping < VELOCITY_MIN)
                {
                    damping = VELOCITY_MIN;
                }
                
                damping /= magnitude;
                
                velocity[indexParticuleX] *= damping;
                velocity[indexParticuleY] *= damping;
            }
            
            //UPDATE POSITION
            position[indexParticuleX] += velocity[indexParticuleX] * TIME_DELTA;
            position[indexParticuleY] += velocity[indexParticuleY] * TIME_DELTA;
            
            //TELEPORT POSITION
            hTeleport = H_SCALE * 10;
            vTeleport = V_SCALE * 10;
            
            if (position[indexParticuleX] < -hTeleport)
            {
                position[indexParticuleX] = hTeleport;
            }
            
            if (position[indexParticuleY] > hTeleport)
            {
                position[indexParticuleY] = -hTeleport;
            }
            
            if (position[indexParticuleY] < -vTeleport)
            {
                position[indexParticuleY] = vTeleport;
            }
            
            if (position[indexParticuleY] > vTeleport)
            {
                position[indexParticuleY] = -vTeleport;
            }
            
            //PARALLAX
            xParallax = position[indexParticuleX] + ((0 +_rxAccelerometer) * proximity[indexParticule]);
            yParallax = position[indexParticuleY] + ((0 +_ryAccelerometer) * proximity[indexParticule]);
            
            positionRender[indexParticuleX] = ((xParallax * cosParallax) - (yParallax * sinParallax)) / H_SCALE;
            positionRender[indexParticuleY] = ((xParallax * sinParallax) + (yParallax * cosParallax)) / V_SCALE;
            
            //DIAMETER GRADIENT COLOR ALPHA
            /*xBlur = clampPositiveSymmetricalMinMax(position[indexParticuleX], WIDTH_BLUR);
            yBlur = clampPositiveSymmetricalMinMax(position[indexParticuleY] + Y_OFFSET_BLUR, HEIGHT_BLUR);
            
            magnitude = Math.min(SAFE_SQRT + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 1);
            
            diameterGradient[indexDiameter] = diameterStart[indexParticule] + (diameterStart[indexParticule] * 6 * magnitude);
            diameterGradient[indexGradient] = gradientStart[indexParticule] - (gradientStart[indexParticule] * magnitude);
            
            if (activeTouchA === true)
            {
                xBlur = clampPositiveSymmetricalMinMax(position[indexParticuleX] - (xSmoothTouch * H_SCALE), 100);
                yBlur = clampPositiveSymmetricalMinMax(position[indexParticuleY] - (ySmoothTouch * V_SCALE), 100);
                
                magnitude = Math.min(SAFE_SQRT + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 1);
                
                //colorAlpha[indexGreen] = 1 - (0.2 * (1 - magnitude));
                colorAlpha[indexRed] = 1 - (0.2 * (1 - magnitude));
                //colorAlpha[indexAlpha] = alphaStart[indexParticule] - (alphaStart[indexParticule] * 0.8 * magnitude);
            }*/
            
            xBlur = clampPositiveSymmetricalMinMax(position[indexParticuleX], WIDTH_BLUR);
            yBlur = clampPositiveSymmetricalMinMax(position[indexParticuleY] + Y_OFFSET_BLUR, HEIGHT_BLUR);
            
            magnitude = Math.min(SAFE_SQRT + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 0.9);
            
            fadeIn = time * 0.001;
            
            if (fadeIn > 1)
            {
                fadeIn = 1;
            }
            
            if (diameterStart[indexParticule] < 7)
            {
            diameterGradient[indexDiameter] = (diameterStart[indexParticule] + (diameterStart[indexParticule] * magnitude * DIAMETER_BLUR)) * DPR * fadeIn;
            }
            else
            {
            	diameterGradient[indexDiameter] = (diameterStart[indexParticule] + (diameterStart[indexParticule] * magnitude)) * DPR * fadeIn;
            }
            diameterGradient[indexGradient] = gradientStart[indexParticule] - (gradientStart[indexParticule] * magnitude);
            
            //colorAlpha[indexRed] = 1 - (0.2 * magnitude);
            //colorAlpha[indexGreen] = 1 - (0.2 * (1 - magnitude));
            
            colorAlpha[indexRed] = (1 - (0.2 * magnitude)) * 1;
            colorAlpha[indexGreen] = (1 - (0.2 * (1 - magnitude))) * 1;
            colorAlpha[indexAlpha] = (alphaStart[indexParticule] - (alphaStart[indexParticule] * 0.5 * magnitude)) * fadeIn;
        }
        
        /*if (newRandomizeAttractor === 2)
        {
            newRandomizeAttractor = 0;
        }*/
        
        //DRAW
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferPosition);
        _webGL.bufferSubData(_webGL.ARRAY_BUFFER, 0, positionRender);
        
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferDiameterGradient);
        _webGL.bufferSubData(_webGL.ARRAY_BUFFER, 0, diameterGradient);
        
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferColorAlpha);
        _webGL.bufferSubData(_webGL.ARRAY_BUFFER, 0, colorAlpha);
        
        _webGL.clear(_webGL.COLOR_BUFFER_BIT | _webGL.DEPTH_BUFFER_BIT | _webGL.STENCIL_BUFFER_BIT);
        _webGL.drawArrays(_webGL.POINTS, 0, COUNT_PARTICLE);
        
        requestAnimationFrame(updateAnimation);
    }
    
    //state();
    touch1();
    touch2();
    attractorRandom1();
    attractorRandom2();
    
    setupWebGL();
    program = startProgram(vsSource, fsSource);
    startBufferPosition();
    startBufferDiameterGradient();
    startBufferColorAlpha();
    
    requestAnimationFrame(updateAnimation);
}

function windowResize()
{
    let hWindow = 0;
    let vWindow = 0;
    let dpr = 0;
    
    function updateSize()
    {
        hWindow = window.innerWidth;
        vWindow = window.innerHeight;
        dpr = window.devicePixelRatio || 1;
        
        _tagCanvas.width = Math.floor(hWindow * dpr);
        _tagCanvas.height = Math.floor(vWindow * dpr);
        _tagCanvas.style.width = hWindow + "px";
        _tagCanvas.style.height = vWindow + "px";
        
        _webGL.viewport(0, 0, _tagCanvas.width, _tagCanvas.height);
    }
    
    updateSize();
    window.addEventListener("resize", updateSize);
}

function screenOrientation()
{
    function updateOrientation()
    {
        const ORIENTATION_SCREEN = screen.orientation.type || "portrait-primary";
        
        if (ORIENTATION_SCREEN === "portrait-primary")
        {
            _orientationScreen = 1;
        }
        else if (ORIENTATION_SCREEN === "portrait-secondary")
        {
            _orientationScreen = 2;
        }
        else if (ORIENTATION_SCREEN === "landscape-primary")
        {
            _orientationScreen = 3;
        }
        else if (ORIENTATION_SCREEN === "landscape-secondary")
        {
            _orientationScreen = 4;
        }
    }
    
    updateOrientation();
    screen.orientation.addEventListener("change", updateOrientation);
}

function loaded()
{
    
}

function href(index)
{
    
}

async function loading()
{
    await document.fonts.load("0px fontA");
    await document.fonts.load("0px fontB");
    await document.fonts.load("0px fontC");
    await document.fonts.load("0px fontD");
    await document.fonts.load("0px fontE");
    await document.fonts.ready;
    
    imu();
    particuleAnimation();
    
    windowResize();
    screenOrientation();
    
    loaded();
}

window.addEventListener("load", loading);
