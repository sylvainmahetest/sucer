customElements.define("tag-canvas", class extends HTMLElement{});

let _tagCanvas = null;
let _webGL = null;
let _orientationScreen = 1;
let _rxAccelerometer = 0;
let _ryAccelerometer = 0;
let _rzAccelerometer = 0;
let _tzAccelerometer = 0;

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

function backgroundAnimation()
{
    let alphaAccelerometer = 0;
    let betaAccelerometer = 0;
    let gammaAccelerometer = 0;
    let zAccelerometer = 0;
    const SMOOTH_R = 0.001/*0.001*/;
    const SMOOTH_T = 0.008/*0.008*/;
    const SMOOTH_RT = 0.001/*0.004*/;
    const TRAVEL_RXY = 2500/*300*/;
    const TRAVEL_RZ = 500/*100*/;
    const TRAVEL_TZ = 15/*15*/;
    
    function imuRead(event)
    {
        const SMOOTH_TIME_R = 1 - Math.exp(-event.interval * SMOOTH_R);
        const SMOOTH_TIME_T = 1 - Math.exp(-event.interval * SMOOTH_T);
        
        alphaAccelerometer += (event.rotationRate.alpha - alphaAccelerometer) * SMOOTH_TIME_R;
        betaAccelerometer += (event.rotationRate.beta - betaAccelerometer) * SMOOTH_TIME_R;
        gammaAccelerometer += (event.rotationRate.gamma - gammaAccelerometer) * SMOOTH_TIME_R;
        zAccelerometer += (event.acceleration.z - zAccelerometer) * SMOOTH_TIME_T;
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
            _rxAccelerometer = Math.tanh(betaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
            _ryAccelerometer = -Math.tanh(alphaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
        }
        else if (_orientationScreen === 2)
        {
            _rxAccelerometer = -Math.tanh(betaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
            _ryAccelerometer = Math.tanh(alphaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
        }
        else if (_orientationScreen === 3)
        {
            _rxAccelerometer = Math.tanh(alphaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
            _ryAccelerometer = Math.tanh(betaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
        }
        else if (_orientationScreen === 4)
        {
            _rxAccelerometer = -Math.tanh(alphaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
            _ryAccelerometer = -Math.tanh(betaAccelerometer * SMOOTH_RT) * TRAVEL_RXY;
        }
        
        _rzAccelerometer = -Math.tanh(gammaAccelerometer * SMOOTH_RT) * TRAVEL_RZ;
        //_tzAccelerometer = Math.tanh(zAccelerometer * SMOOTH_RT) * TRAVEL_TZ;
        
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
    let timeLast = 0;
    let indexParticule = 0;
    let indexParticuleX = 0;
    let indexParticuleY = 0;
    let indexRed = 0;
    let indexGreen = 0;
    let indexBlue = 0;
    let indexAlpha = 0;
    let scaleAlpha = 1;
    let scaleBeta = 1;
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
    let numberAttractor = 1;
    let stateAttractor = 1;
    let timeState = 0;
    let newRandomizeAttractor = 0;
    let directionSpin = randomBinary(-1, 1);
    let angleSpinStart = Math.PI * randomFloat(-1, 1);
    let radiusSpin = 0;
    let angleSpin = 0;
    let weightSpin = 0;
    let xTouch = 0;
    let yTouch = 0;
    let xSmoothTouch = 0;
    let ySmoothTouch = 0;
    let xsmoothJitterTouch = 0;
    let ysmoothJitterTouch = 0;
    let activeTouchA = false;
    let activeTouchB = false;
    //let xOffsetAttractorTouch = 0;
    //let yOffsetAttractorTouch = 0;
    //let xSmoothAttractorTouch = 0;
    //let ySmoothAttractorTouch = 0;
    //let xOffsetRingTouch = 1;
    //let yOffsetRingTouch = 1;
    //let xSmoothRingTouch = 1;
    //let ySmoothRingTouch = 1;
    let timeTouch1 = 0;
    let timeTouch2 = 0;
    let timeAttractorRandom1 = 0;
    let timeAttractorRandom2 = 0;
    const COUNT_PARTICLE = 10000;
    const COUNT_PARTICLE_SHAPE = 7500;
    const SIZE_X_SPIN = 1500;
    const SIZE_Y_SPIN = 500;
    const COUNT_SPIN = 4;
    const BULB1_SPIN_SHAPE = 1;
    const BULB2_SPIN_SHAPE = 100;
    const FORCE_ATTRACTOR = 50;
    const FORCE_ATTRACTOR_TOUCH = 200;
    const FORCE_ATTRACTOR_RANDOM = 30;
    const FORCE_TOUCH = 200;
    const RADIUS_TOUCH = 15;
    const RING_TOUCH = 10;
    const SMOOTH_TOUCH = 0.0001;
    const SMOOTH_JITTER_TOUCH = 0.001;
    const SMOOTH_RING_TOUCH = 0.0001;
    const DAMPING = 0.5;
    const VELOCITY_MIN = 10;
    const WIDTH_BLUR = 600;
    const HEIGHT_BLUR = 800;
    const Y_OFFSET_BLUR = 150;
    
    _tagCanvas = document.getElementById("tag-canvas");
    
    _tagCanvas.addEventListener("touchstart", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        const H_SCALE = window.innerWidth * 0.5;
        const V_SCALE = window.innerHeight * 0.5;
        
        xTouch = ((((event.touches[0].clientX - RECTANGLE.left) / RECTANGLE.width) * 2) - 1) * H_SCALE;
        yTouch = -((((event.touches[0].clientY - RECTANGLE.top) / RECTANGLE.height) * 2) - 1) * V_SCALE;
        xSmoothTouch = xTouch;
        ySmoothTouch = yTouch;
         
        previous1 = xTouch;
        previous2 = yTouch;
        
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
        const H_SCALE = window.innerWidth * 0.5;
        const V_SCALE = window.innerHeight * 0.5;
        
        xTouch = ((((event.touches[0].clientX - RECTANGLE.left) / RECTANGLE.width) * 2) - 1) * H_SCALE;
        yTouch = -((((event.touches[0].clientY - RECTANGLE.top) / RECTANGLE.height) * 2) - 1) * V_SCALE;
        
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
    
   
    
    function setupWebGL()
    {
        _webGL = _tagCanvas.getContext("webgl");
        _webGL.clearColor(0.05, 0.05, 0.05, 1);
        _webGL.enable(_webGL.BLEND);
        _webGL.blendFunc(_webGL.SRC_ALPHA, _webGL.ONE_MINUS_SRC_ALPHA);
        _webGL.enable(_webGL.PROGRAM_POINT_SIZE);
        
        vsSource = `
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
            vec2 point = gl_PointCoord - 0.5;
            float length = length(point);
            float alphaGradient = alphaCommon * smoothstep(0.5, gradientCommon, length);
            gl_FragColor = vec4(colorCommon, alphaGradient);
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
    
    diameterGradient = new Float32Array(COUNT_PARTICLE * 2);
    diameterStart = new Float32Array(COUNT_PARTICLE);
    gradientStart = new Float32Array(COUNT_PARTICLE);
    colorAlpha = new Float32Array(COUNT_PARTICLE * 4);
    alphaStart = new Float32Array(COUNT_PARTICLE);
    mass = new Float32Array(COUNT_PARTICLE);
    proximity = new Float32Array(COUNT_PARTICLE);
    velocity = new Float32Array(COUNT_PARTICLE * 2);
    position = new Float32Array(COUNT_PARTICLE * 2);
    positionRender = new Float32Array(COUNT_PARTICLE * 2);
    shapeAttractor1 = new Float32Array(COUNT_PARTICLE * 2);
    
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
        
        colorAlpha[indexRed] = 1;
        colorAlpha[indexGreen] = 1;
        colorAlpha[indexBlue] = 1;
        
        if (randomInteger(1, 50) === 1)
        {
            diameterGradient[indexDiameter] = randomFloat(2, 3);
            diameterGradient[indexGradient] = 0.25;
            colorAlpha[indexAlpha] = 0.075;
            mass[indexParticule] = randomFloat(1, 1.1);
            proximity[indexParticule] = randomFloat(1, 1.5);
        }
        else if (randomInteger(1, 10) === 1)
        {
            diameterGradient[indexDiameter] = randomFloat(5, 8);
            diameterGradient[indexGradient] = 0.15;
            colorAlpha[indexAlpha] = 0.05;
            mass[indexParticule] = randomFloat(1, 1.1);
            proximity[indexParticule] = randomFloat(1, 1.5);
        }
        else if (randomInteger(1, 20) !== 1)
        {
            diameterGradient[indexDiameter] = randomFloat(15, 20);
            diameterGradient[indexGradient] = 0;
            colorAlpha[indexAlpha] = 0.005;
            mass[indexParticule] = randomFloat(1.1, 2);
            proximity[indexParticule] = randomFloat(1.5, 2);
        }
        else
        {
            diameterGradient[indexDiameter] = randomFloat(40, 70);
            diameterGradient[indexGradient] = 0;
            colorAlpha[indexAlpha] = 0.005;
            mass[indexParticule] = randomFloat(2, 3);
            proximity[indexParticule] = randomFloat(2, 3);
        }
        
        if (indexParticule < COUNT_PARTICLE_SHAPE)
        {
            shapeAttractor1[indexParticuleX] = randomFloat(-150, 150);
            shapeAttractor1[indexParticuleY] = randomFloat(-150, 150);
        }
        else
        {
            radiusSpin = (indexParticule - COUNT_PARTICLE_SHAPE) / (COUNT_PARTICLE - COUNT_PARTICLE_SHAPE);
            angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
            weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE)) * BULB2_SPIN_SHAPE;
            
            shapeAttractor1[indexParticuleX] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
            shapeAttractor1[indexParticuleY] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
        }
        /*
        radiusSpin = indexParticule / COUNT_PARTICLE;
        angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
        weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE)) * BULB2_SPIN_SHAPE;
        
        shapeAttractor1[indexParticuleX] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
        shapeAttractor1[indexParticuleY] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
        */
        
        //radiusSpin = indexParticule / COUNT_PARTICLE;
        //angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
        //weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE)) * BULB2_SPIN_SHAPE;
        
        //shapeAttractor1[indexParticuleX] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
        //shapeAttractor1[indexParticuleY] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
    }
    
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
        
        diameterStart[indexParticule] = diameterGradient[indexDiameter];
        gradientStart[indexParticule] = diameterGradient[indexGradient];
        alphaStart[indexParticule] = colorAlpha[indexAlpha];
        
        velocity[indexParticuleX] = VELOCITY_MIN * randomBinary(-1, 1);
        velocity[indexParticuleY] = VELOCITY_MIN * randomBinary(-1, 1);
        
        xAttractor = shapeAttractor1[indexParticuleX];
        yAttractor = shapeAttractor1[indexParticuleY];
        
        position[indexParticuleX] = xAttractor + randomFloat(-5, 5);
        position[indexParticuleY] = yAttractor + randomFloat(-5, 5);
    }
    
    function state()
    {
        /*if (stateAttractor === 1)
        {
            timeState = performance.now() + 500;
            numberAttractor = 1;
            newRandomizeAttractor = 1;
            
            stateAttractor = 1;
        }*/
    }
    
    function touch1()
    {
        xJitterTouch = randomFloat(-30, 30);
        widthSmoothRingTouch = randomFloat(0.25, 4);
        
        timeTouch1 = performance.now() + randomInteger(50, 250);
    }
    
    function touch2()
    {
        yJitterTouch = randomFloat(-30, 30);
        heightSmoothRingTouch = randomFloat(0.25, 4);
        
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
        directionAttractorRandom = randomBinary(false, true);
        timeAttractorRandom2 = performance.now() + randomInteger(100, 2000);
    }
    
    timeLast = performance.now();
    
    //EN COURS !!!
    let xJitterTouch = 0;
    let yJitterTouch = 0;
    let widthRingTouch = 1;
    let heightRingTouch = 1;
    let widthSmoothRingTouch = 1;
    let heightSmoothRingTouch = 1;
    let previous1 = 0;
    let previous2 = 0;
    let smoothVelocityTouch = 0;
    let vxSmooth = 0;
    let vySmooth = 0;
    let vsqrt = 0;
    let vsqrtSmooth = 0;
    //EN COURS !!!
    
    function updateAnimation(time)
    {
        const TIME_DELTA = Math.min((time - timeLast) * 0.001, 0.04);
        const H_SCALE = window.innerWidth * 0.5;
        const V_SCALE = window.innerHeight * 0.5;
        const DPR = window.devicePixelRatio || 1;
        let px = 0;
        let py = 0;
        let dx = 0;
        let dy = 0;
        let d = 0;
        let sx = 0;
        let sy = 0;
        let magnitude = 0;
        let forceAttractorDistance = 0;
        let strength = 0;
        let smoothTouch = 0;
        let smoothJitterTouch = 0;
        let smoothRingTouch = 0;
        let damping = 0;
        let xBlur = 0;
        let yBlur = 0;
        
        timeLast = time;
        
        //STATE
        if (performance.now() > timeState)
        {
            state();
        }
        
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
        xsmoothJitterTouch += (xJitterTouch - xsmoothJitterTouch) * smoothJitterTouch;
        ysmoothJitterTouch += (yJitterTouch - ysmoothJitterTouch) * smoothJitterTouch;
        
        smoothRingTouch = 1 - Math.pow(SMOOTH_RING_TOUCH, TIME_DELTA);
        widthSmoothRingTouch += (widthRingTouch - widthSmoothRingTouch) * smoothRingTouch;
        heightSmoothRingTouch += (heightRingTouch - heightSmoothRingTouch) * smoothRingTouch;
        
        //EN COURS !!!
        let vx = (xSmoothTouch - previous1);
        previous1 = xSmoothTouch;
        let vy = (ySmoothTouch - previous2);
        previous2 = ySmoothTouch;
        smoothVelocityTouch = 1 - Math.pow(0.1, TIME_DELTA);
        vxSmooth += (vx - vxSmooth) * smoothVelocityTouch;
        vySmooth += (vy - vySmooth) * smoothVelocityTouch;
        //console.log("vxSmooth = " + vxSmooth);
        let vsqrt = 0.000001 + Math.sqrt((vx * vx) + (vy * vy));
        smoothSqrt = 1 - Math.pow(0.5, TIME_DELTA);
        vsqrtSmooth += (vsqrt - vsqrtSmooth) * smoothSqrt;
        console.log("vsqrtSmooth = " + vsqrtSmooth);
        //EN COURS !!!
        
        if (newRandomizeAttractor === 1)
        {
            angleSpinStart -= 0.05 * directionSpin;
            newRandomizeAttractor = 2;
        }
        
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
            if (newRandomizeAttractor === 2)
            {
                /*if (numberAttractor === 1)
                {*/
                    //radiusSpin = indexParticule / COUNT_PARTICLE;
                    //angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
                    //weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE)) * BULB2_SPIN_SHAPE;
                    
                    //shapeAttractor1[indexParticuleX] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
                    //shapeAttractor1[indexParticuleY] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
                /*}
                else if (numberAttractor === 2)
                {*/
                    //shapeAttractor1[indexParticuleX] = randomFloat(-0.25, 0.25) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
                    //shapeAttractor1[indexParticuleY] = randomFloat(-0.25, 0.25) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
                /*}
                else if (numberAttractor === 3)
                {
                }*/
            }
            
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
                
                magnitude = 0.000001 + Math.sqrt((dx * dx) + (dy * dy));
                
                dx /= magnitude;
                dy /= magnitude;
                
                velocity[indexParticuleX] += dx * (FORCE_ATTRACTOR / mass[indexParticule]) * TIME_DELTA;
                velocity[indexParticuleY] += dy * (FORCE_ATTRACTOR / mass[indexParticule]) * TIME_DELTA;
            }
            else
            {
                xAttractor = xAttractorRandom;
                yAttractor = yAttractorRandom;
                
                dx = xAttractor - px;
                dy = yAttractor - py;
                
                magnitude = 0.000001 + Math.sqrt((dx * dx) + (dy * dy));
                
                if (directionAttractorRandom === false)
                {
                    d = magnitude * 0.004;
                }
                else
                {
                    d = magnitude * 0.005;
                }
                
                if (d < 2.2)
                {
                    dx /= magnitude;
                    dy /= magnitude;
                    
                    forceAttractorDistance = 50/*FORCE_ATTRACTOR_RANDOM*/ * (2 - d);
                    
                    if (directionAttractorRandom === false)
                    {
                        velocity[indexParticuleX] += dx * (forceAttractorDistance / mass[indexParticule]) * TIME_DELTA;
                        velocity[indexParticuleY] += dy * (forceAttractorDistance / mass[indexParticule]) * TIME_DELTA;
                    }
                    else
                    {
                        velocity[indexParticuleX] -= dx * (forceAttractorDistance / mass[indexParticule]) * TIME_DELTA;
                        velocity[indexParticuleY] -= dy * (forceAttractorDistance / mass[indexParticule]) * TIME_DELTA;
                    }
                }
            }
            
            //TOUCH
            if (activeTouchA === true && vsqrtSmooth > 0.1)
            {
                xAttractor = xSmoothTouch + xsmoothJitterTouch - _rxAccelerometer;
                yAttractor = ySmoothTouch + ysmoothJitterTouch - _ryAccelerometer;
                
                dx = (xAttractor - px) * widthSmoothRingTouch;
                dy = (yAttractor - py) * heightSmoothRingTouch;
                
                magnitude = 0.000001 + Math.sqrt((dx * dx) + (dy * dy));
                
                let v1 = vsqrtSmooth * 20;
                if (v1 > 250)
                {
                    v1 = 250;
                }
                if (magnitude < v1)
                {
                    dx /= magnitude;
                    dy /= magnitude;
                    
                    //EN COURS !!!
                    //let dot = ((dx * vxSmooth) + (dy * vySmooth)) * -500;
                    let dot = ((dx * vxSmooth) + (dy * vySmooth)) * -1;
                    
                    forceAttractorDistance = vsqrtSmooth * ((v1 * 2) - magnitude);
                    if (forceAttractorDistance > 500)
                    {
                        forceAttractorDistance = 500;
                    }
                    
                    //velocity[indexParticuleX] -= dx * /*(forceAttractorDistance / mass[indexParticule]) * */(dot / mass[indexParticule]) * TIME_DELTA;
                    //velocity[indexParticuleY] -= dy * /*(forceAttractorDistance / mass[indexParticule]) * */(dot / mass[indexParticule]) * TIME_DELTA;
                    
                    velocity[indexParticuleX] -= dx * ((forceAttractorDistance * dot) / mass[indexParticule]) * TIME_DELTA;
                    velocity[indexParticuleY] -= dy * ((forceAttractorDistance * dot) / mass[indexParticule]) * TIME_DELTA;
                    
                    //velocity[indexParticuleX] -= dx * (dot / mass[indexParticule]) * TIME_DELTA;
                    //velocity[indexParticuleY] -= dy * (dot / mass[indexParticule]) * TIME_DELTA;
                }
            }
            
            //TOUCH
            /*if (activeTouchA === true)
            {
                dx = xSmoothTouch - px;
                dy = ySmoothTouch - py;
                
                magnitude = 0.000001 + Math.sqrt((dx * dx) + (dy * dy));
                
                if (magnitude < RADIUS_TOUCH)
                {
                    strength = (RING_TOUCH - (magnitude / RADIUS_TOUCH)) * FORCE_TOUCH * TIME_DELTA;
                    
                    velocity[indexParticuleX] -= (dx / magnitude) * strength;
                    velocity[indexParticuleY] -= (dy / magnitude) * strength;
                }
            }*/
            
            //DAMPING
            sx = velocity[indexParticuleX];
            sy = velocity[indexParticuleY];
            
            damping = Math.pow(DAMPING, TIME_DELTA);
            
            if (sx < -VELOCITY_MIN)
            {
                velocity[indexParticuleX] *= damping;
            }
            else if (sx > VELOCITY_MIN)
            {
                velocity[indexParticuleX] *= damping;
            }
            
            if (sy < -VELOCITY_MIN)
            {
                velocity[indexParticuleY] *= damping;
            }
            else if (sy > VELOCITY_MIN)
            {
                velocity[indexParticuleY] *= damping;
            }
            
            //UPDATE
            position[indexParticuleX] += velocity[indexParticuleX] * TIME_DELTA;
            position[indexParticuleY] += velocity[indexParticuleY] * TIME_DELTA;
            
            
            //RX RY RZ
            const x = position[indexParticuleX] + (_rxAccelerometer * proximity[indexParticule]);
            const y = position[indexParticuleY] + (_ryAccelerometer * proximity[indexParticule]);
            const rzAccelerometerRad = (_rzAccelerometer * Math.PI) / 180;//_rzAccelerometer
            const cosZ = Math.cos(rzAccelerometerRad);
            const sinZ = Math.sin(rzAccelerometerRad);
            
            //positionRender[indexParticuleX] = (position[indexParticuleX] / H_SCALE) + (_rxAccelerometer * proximity[indexParticule]);
            //positionRender[indexParticuleY] = (position[indexParticuleY] / V_SCALE) - (_ryAccelerometer * proximity[indexParticule]);
            positionRender[indexParticuleX] = ((x * cosZ) - (y * sinZ)) / H_SCALE;
            positionRender[indexParticuleY] = ((x * sinZ) + (y * cosZ)) / V_SCALE;
            
            //DIAMETER GRADIENT COLOR ALPHA
            /*xBlur = clampPositiveSymmetricalMinMax(position[indexParticuleX], WIDTH_BLUR);
            yBlur = clampPositiveSymmetricalMinMax(position[indexParticuleY] + Y_OFFSET_BLUR, HEIGHT_BLUR);
            
            magnitude = Math.min(0.000001 + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 1);
            
            diameterGradient[indexDiameter] = diameterStart[indexParticule] + (diameterStart[indexParticule] * 6 * magnitude);
            diameterGradient[indexGradient] = gradientStart[indexParticule] - (gradientStart[indexParticule] * magnitude);
            
            if (activeTouchA === true)
            {
                xBlur = clampPositiveSymmetricalMinMax(position[indexParticuleX] - (xSmoothTouch * H_SCALE), 100);
                yBlur = clampPositiveSymmetricalMinMax(position[indexParticuleY] - (ySmoothTouch * V_SCALE), 100);
                
                magnitude = Math.min(0.000001 + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 1);
                
                //colorAlpha[indexGreen] = 1 - (0.2 * (1 - magnitude));
                colorAlpha[indexRed] = 1 - (0.2 * (1 - magnitude));
                //colorAlpha[indexAlpha] = alphaStart[indexParticule] - (alphaStart[indexParticule] * 0.8 * magnitude);
            }*/
            
            xBlur = clampPositiveSymmetricalMinMax(position[indexParticuleX], WIDTH_BLUR);
            yBlur = clampPositiveSymmetricalMinMax(position[indexParticuleY] + Y_OFFSET_BLUR, HEIGHT_BLUR);
            
            magnitude = Math.min(0.000001 + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 1);
            
            diameterGradient[indexDiameter] = (diameterStart[indexParticule] + (diameterStart[indexParticule] * 6 * magnitude)) * DPR;
            diameterGradient[indexGradient] = gradientStart[indexParticule] - (gradientStart[indexParticule] * magnitude);
            
            //colorAlpha[indexRed] = 1 - (0.2 * magnitude);
            //colorAlpha[indexGreen] = 1 - (0.1 * (1 - magnitude));
            colorAlpha[indexAlpha] = alphaStart[indexParticule] - (alphaStart[indexParticule] * 0.5 * magnitude);
        }
        
        if (newRandomizeAttractor === 2)
        {
            newRandomizeAttractor = 0;
        }
        
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
    
    state();
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
    function updateSize()
    {
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        const DPR = window.devicePixelRatio || 1;
        //console.log("H_WINDOW = " + H_WINDOW);
        //console.log("DPR = " + DPR);
        _tagCanvas.width = Math.floor(H_WINDOW * DPR);
        _tagCanvas.height = Math.floor(V_WINDOW * DPR);
        _tagCanvas.style.width = H_WINDOW + "px";
        _tagCanvas.style.height = V_WINDOW + "px";
        
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

function loading()
{
    backgroundAnimation();
    particuleAnimation();
    
    windowResize();
    screenOrientation();
    
    loaded();
}

window.addEventListener("load", loading);
