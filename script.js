customElements.define("tag-canvas", class extends HTMLElement{});

let _tagCanvas = null;
let _webGL = null;
let _rxAccelerometerRaw = 0;
let _ryAccelerometerRaw = 0;

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

function background()
{
    let alphaAccelerometer = 0;
    let betaAccelerometer = 0;
    let gammaAccelerometer = 0;
    let zAccelerometer = 0;
    const SMOOTH_R = 0.001;
    const SMOOTH_T = 0.008;
    
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
    
    function imuRead(event)
    {
        const SMOOTH_TIME_R = 1 - Math.exp(-event.interval * SMOOTH_R);
        const SMOOTH_TIME_T = 1 - Math.exp(-event.interval * SMOOTH_T);
        
        alphaAccelerometer += (event.rotationRate.alpha - alphaAccelerometer) * SMOOTH_TIME_R;
        betaAccelerometer += (event.rotationRate.beta - betaAccelerometer) * SMOOTH_TIME_R;
        gammaAccelerometer += (event.rotationRate.gamma - gammaAccelerometer) * SMOOTH_TIME_R;
        zAccelerometer += (event.acceleration.z - zAccelerometer) * SMOOTH_TIME_T;
    }
    
    function transformUpdate()
    {
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        const SMOOTH = 0.004;
        let rxAccelerometer = 0;
        let ryAccelerometer = 0;
        let rzAccelerometer = 0;
        let tzAccelerometer = 0;
        
        if (H_WINDOW < V_WINDOW)
        {
            rxAccelerometer = Math.tanh(betaAccelerometer * SMOOTH) * 0.6;
            ryAccelerometer = Math.tanh(alphaAccelerometer * SMOOTH) * 0.6;
        }
        else
        {
            rxAccelerometer = -Math.tanh(alphaAccelerometer * SMOOTH) * 0.6;
            ryAccelerometer = Math.tanh(betaAccelerometer * SMOOTH) * 0.6;
        }
        
        _rxAccelerometerRaw = rxAccelerometer;
        _ryAccelerometerRaw = ryAccelerometer;
        
        if (H_WINDOW < V_WINDOW)
        {
            rxAccelerometer *= H_WINDOW;
            ryAccelerometer *= H_WINDOW;
        }
        else
        {
            rxAccelerometer *= V_WINDOW;
            ryAccelerometer *= V_WINDOW;
        }
        
        rzAccelerometer = Math.tanh(gammaAccelerometer * SMOOTH) * 125;
        tzAccelerometer = 2 - Math.tanh(zAccelerometer * SMOOTH) * 15;
        
        if (tzAccelerometer < 1)
        {
            tzAccelerometer = 1;
        }
        else if (tzAccelerometer > 4)
        {
            tzAccelerometer = 4;
        }
        
        _tagCanvas.style.transform = "translate(" + rxAccelerometer + "px, " + ryAccelerometer + "px) rotate(" + rzAccelerometer + "deg) scale(" + tzAccelerometer + ")";
        
        requestAnimationFrame(transformUpdate);
    }
    
    requestAnimationFrame(transformUpdate);
}

function particule()
{
    let program = null;
    let vsSource = null;
    let fsSource = null;
    let bufferPosition = null;
    let bufferDiameter = null;
    let bufferLuminosity = null;
    let timeLast = 0;
    let hWindow = window.innerWidth;
    let vWindow = window.innerHeight;
    let scaleAlpha = 1;
    let scaleBeta = 1;
    let mass = null;
    let proximity = null;
    let velocity = null;
    let wall = null;
    let bounce = null;
    let position = null;
    let positionRender = null;
    let diameter = null;
    let luminosity = null;
    let shapeAttractor1 = null;
    let shapeAttractor2 = null;
    let shapeAttractor3 = null;
    let numberAttractor = 0;
    let stateAttractor = 1;
    let timeState = 0;
    let newRandomizeAttractor = 0;
    let directionSpin = randomBinary(-1, 1);
    let angleSpinStart = Math.PI * randomFloat(-1, 1);
    let radiusSpin = 0;
    let angleSpin = 0;
    let weightSpin = 0;
    let xAttractor = 0;
    let yAttractor = 0;
    //let timeAttractor2 = 0;
    //let directionAttractor = false;
    let xTouch = 0;
    let yTouch = 0;
    let activeTouchA = false;
    let activeTouchB = false;
    let xOffsetAttractorTouch = 0;
    let yOffsetAttractorTouch = 0;
    let xOffsetRingTouch = 1;
    let yOffsetRingTouch = 1;
    let xSmoothTouch = 1;
    let ySmoothTouch = 1;
    let timeTouch1 = 0;
    let timeTouch2 = 0;
    let/*const*/ COUNT_PARTICLE = /*50*/0;
    const SIZE_X_SPIN = 1;
    const SIZE_Y_SPIN = 0.7;
    const COUNT_SPIN = 4;
    const BULB1_SPIN_SHAPE1 = 2;
    const BULB2_SPIN_SHAPE1 = 0.2;
    const BULB1_SPIN_SHAPE2 = 5;
    const BULB2_SPIN_SHAPE2 = 0.5;
    const FORCE_ATTRACTOR = 0.5/*0.000002*/;
    const FORCE_TOUCH = 50/*0.002*/;
    const RADIUS_TOUCH = 0.04/*0.04*/;
    const RING_TOUCH = 0.9/*0.9*/;
    const SMOOTH_TOUCH = 0.85/*0.001*/;
    const DAMPING = 0.5/*0.99*/;
    const CLAMP = 0.5/*0.004*/;
    const BOUNCE = 0.05/*0.0005*/;
    const VELOCITY_MIN = 0.05/*0.0001*/;
    const WIDTH_BLUR = 1;
    const HEIGHT_BLUR = 0.6;
    const Y_OFFSET_BLUR = 0.2;
    
    _tagCanvas = document.getElementById("tag-canvas");
    
    _tagCanvas.addEventListener("touchstart", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        
        xTouch = (((event.touches[0].clientX - RECTANGLE.left) / RECTANGLE.width) * 2) - 1;
        yTouch = -((((event.touches[0].clientY - RECTANGLE.top) / RECTANGLE.height) * 2) - 1);
        
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
        
        xTouch = (((event.touches[0].clientX - RECTANGLE.left) / RECTANGLE.width) * 2) - 1;
        yTouch = -((((event.touches[0].clientY - RECTANGLE.top) / RECTANGLE.height) * 2) - 1);
        
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
    
    _tagCanvas.addEventListener("pointerdown", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        
        xTouch = (((event.clientX - RECTANGLE.left) / RECTANGLE.width) * 2) - 1;
        yTouch = -((((event.clientY - RECTANGLE.top) / RECTANGLE.height) * 2) - 1);
        
        activeTouchA = true;
        activeTouchB = true;
    });
    
    _tagCanvas.addEventListener("pointermove", event =>
    {
        const RECTANGLE = _tagCanvas.getBoundingClientRect();
        
        xTouch = (((event.clientX - RECTANGLE.left) / RECTANGLE.width) * 2) - 1;
        yTouch = -((((event.clientY - RECTANGLE.top) / RECTANGLE.height) * 2) - 1);
        
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
     //   _webGL.blendFunc(_webGL.SRC_ALPHA, _webGL.ONE);
        _webGL.blendFunc(_webGL.SRC_ALPHA, _webGL.ONE_MINUS_SRC_ALPHA);
        _webGL.enable(_webGL.PROGRAM_POINT_SIZE);
        
        vsSource = `
        attribute vec2 positionBuffer;
        attribute float pointSizeBuffer;
        attribute float luminosityBuffer;
        
        varying float luminosityCommon;
        
        void main()
        {
            gl_Position = vec4(positionBuffer, 0.0, 1.0);
            gl_PointSize = pointSizeBuffer;
            luminosityCommon = luminosityBuffer;
        }`;
        
        fsSource = `
        precision mediump float;
        varying float luminosityCommon;
        
        void main()
        {
            vec2 point = gl_PointCoord - 0.5;
            float length = length(point);
            float alpha = smoothstep(0.5, 0.0, length) * exp(-length * length * 5.0) * luminosityCommon;
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
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
    
    if (hWindow < vWindow)
    {
        scaleAlpha = hWindow / vWindow;
    }
    else
    {
        scaleBeta = vWindow / hWindow;
    }
    
    let density = 30;
    let scale = 10;
    let width = 3;
    let height = 7;
    let h = 0;
    let v = 0;
    
    let count = ((width * density) + 1) * ((height * density) + 1);
    //COUNT_PARTICLE = count * 2;
    COUNT_PARTICLE = count;
    let COUNT_PARTICLE_TYPE2 = count;
    //let COUNT_PARTICLE_TYPE3 = count * 3;
    
    diameter = new Float32Array(COUNT_PARTICLE);
    luminosity = new Float32Array(COUNT_PARTICLE);
    mass = new Float32Array(COUNT_PARTICLE);
    proximity = new Float32Array(COUNT_PARTICLE);
    velocity = new Float32Array(COUNT_PARTICLE * 2);
    wall = new Float32Array(COUNT_PARTICLE * 2);
    bounce = new Float32Array(COUNT_PARTICLE);
    
    position = new Float32Array(COUNT_PARTICLE * 2);
    positionRender = new Float32Array(COUNT_PARTICLE * 2);
    
    shapeAttractor1 = new Float32Array(COUNT_PARTICLE * 2);
    shapeAttractor2 = new Float32Array(COUNT_PARTICLE * 2);
    shapeAttractor3 = new Float32Array(COUNT_PARTICLE * 2);
    
    let diameterStart = new Float32Array(COUNT_PARTICLE);
    let luminosityStart = new Float32Array(COUNT_PARTICLE);
    
    //SPECIFY
    for (indexParticule = 0; indexParticule < COUNT_PARTICLE_TYPE2; indexParticule++)
    {
        let ratio = indexParticule / (COUNT_PARTICLE_TYPE2 - 1);
        let ratioSquare = ratio * ratio;
        //console.log("ratio = " + ratio);
        
        mass[indexParticule] = 1 + (1 * ratioSquare) + randomFloat(0, 0.5);
        proximity[indexParticule] = randomFloat(1, 2);
        //diameter[indexParticule] = 7 + (30 * ratioSquare);
        diameter[indexParticule] = 7;//ESSAI
        //luminosity[indexParticule] = 0.1 - (0.09 * ratioSquare);
        luminosity[indexParticule] = 0.1;//ESSAI
        
        shapeAttractor1[indexParticule * 2] = -(width / (scale * 2)) + (h * (1 / (density * scale))) + randomFloat(-0.01, 0.01);
        shapeAttractor1[(indexParticule * 2) + 1] = -(height / (scale * 2)) + (v * (1 / (density * scale))) + randomFloat(-0.01, 0.01);
        
        if (h < width * density)
        {
            h++;
        }
        else if (v < height * density)
        {
            h = 0;
            v++;
        }
    }
        
        
        
        
        /*diameter[indexParticule] = randomFloat(3, 5);
        mass[indexParticule] = randomFloat(1, 1.1);
        proximity[indexParticule] = randomFloat(1, 2);
        
        shapeAttractor1[indexParticule * 2] = -(width / (scale * 2)) + (h * (1 / (density * scale))) + randomFloat(-0.01, 0.01);
        shapeAttractor1[(indexParticule * 2) + 1] = -(height / (scale * 2)) + (v * (1 / (density * scale))) + randomFloat(-0.01, 0.01);
        
        if (h < width * density)
        {
            h++;
        }
        else if (v < height * density)
        {
            h = 0;
            v++;
        }*/
        
        
        
    
    /*h = 0;
    v = 0;
    
    for (indexParticule = COUNT_PARTICLE_TYPE2; indexParticule < COUNT_PARTICLE; indexParticule++)
    {
        let ratio = ((1 / (COUNT_PARTICLE_TYPE2 / indexParticule)) - 1);
        
        diameter[indexParticule] = 7 + (10 * ratio);
        mass[indexParticule] = randomFloat(1.1, 1.2);
        proximity[indexParticule] = randomFloat(1, 2);
        
        shapeAttractor1[indexParticule * 2] = -(width / (scale * 2)) + (h * (1 / (density * scale))) + randomFloat(-0.005, 0.005);
        shapeAttractor1[(indexParticule * 2) + 1] = -(height / (scale * 2)) + (v * (1 / (density * scale))) + randomFloat(-0.005, 0.005);
        
        if (h < width * density)
        {
            h++;
        }
        else if (v < height * density)
        {
            h = 0;
            v++;
        }
    }*/
    
    /*for (indexParticule = COUNT_PARTICLE; indexParticule < COUNT_PARTICLE; indexParticule++)
    {
        if (randomInteger(1, 5000000) !== 1)
        {
            diameter[indexParticule] = randomFloat(3, 4);
            mass[indexParticule] = randomFloat(1, 1.1);
            proximity[indexParticule] = randomFloat(1, 2);
        }
        else if (randomInteger(1, 10) !== 1)
        {
            diameter[indexParticule] = randomFloat(7, 10);
            mass[indexParticule] = randomFloat(1.1, 1.2);
            proximity[indexParticule] = randomFloat(1, 2);
        }
        else if (randomInteger(1, 5) !== 1)
        {
            diameter[indexParticule] = randomFloat(20, 100);
            mass[indexParticule] = randomFloat(1.2, 1.5);
            proximity[indexParticule] = randomFloat(1.5, 3);
        }
        else
        {
            diameter[indexParticule] = randomFloat(100, 300);
            mass[indexParticule] = randomFloat(1.5, 5);
            proximity[indexParticule] = randomFloat(2, 3.5);
        }
        
        
        
        //shapeAttractor1[indexParticule * 2] = randomFloat(-0.15, 0.15) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
        //shapeAttractor1[(indexParticule * 2) + 1] = randomFloat(-0.35, 0.35) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
        
        //radiusSpin = indexParticule / COUNT_PARTICLE;
        //angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
        //weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE1)) * BULB2_SPIN_SHAPE1;
        
        //shapeAttractor2[indexParticule * 2] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
        //shapeAttractor2[(indexParticule * 2) + 1] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
        
        //weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE2)) * BULB2_SPIN_SHAPE2;
        
        //shapeAttractor3[indexParticule * 2] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
        //shapeAttractor3[(indexParticule * 2) + 1] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
        
        position[indexParticule * 2] = (shapeAttractor1[indexParticule * 2] + randomFloat(-0.005, 0.005)) * scaleBeta;
        position[(indexParticule * 2) + 1] = (shapeAttractor1[(indexParticule * 2) + 1] + randomFloat(-0.005, 0.005)) * scaleAlpha;
        
        velocity[indexParticule * 2] = VELOCITY_MIN * randomBinary(-1, 1) * scaleBeta;
        velocity[(indexParticule * 2) + 1] = VELOCITY_MIN * randomBinary(-1, 1) * scaleAlpha;
        
        wall[indexParticule * 2] = randomFloat(1, 1.2);
        wall[(indexParticule * 2) + 1] = randomFloat(1, 1.2);
        
        bounce[indexParticule] = randomFloat(BOUNCE, BOUNCE * 2);
    }*/
    
    //COMMUN
    for (indexParticule = 0; indexParticule < COUNT_PARTICLE; indexParticule++)
    {
        diameterStart[indexParticule] = diameter[indexParticule];//ESSAI
        luminosityStart[indexParticule] = luminosity[indexParticule];//ESSAI
        
        velocity[indexParticule * 2] = VELOCITY_MIN * randomBinary(-1, 1) * scaleBeta;
        velocity[(indexParticule * 2) + 1] = VELOCITY_MIN * randomBinary(-1, 1) * scaleAlpha;
        
        wall[indexParticule * 2] = randomFloat(1, 1.2);
        wall[(indexParticule * 2) + 1] = randomFloat(1, 1.2);
        
        bounce[indexParticule] = randomFloat(BOUNCE, BOUNCE * 2);
        
        position[indexParticule * 2] = (shapeAttractor1[indexParticule * 2] + randomFloat(-0.005, 0.005)) * scaleBeta;
        position[(indexParticule * 2) + 1] = (shapeAttractor1[(indexParticule * 2) + 1] + randomFloat(-0.005, 0.005)) * scaleAlpha;
    }
    
    function startBufferPosition()
    {
        //const BUFFER = _webGL.createBuffer();
        const LOCATION = _webGL.getAttribLocation(program, "positionBuffer");
        
        bufferPosition = _webGL.createBuffer();//ESSAI
        //_webGL.bindBuffer(_webGL.ARRAY_BUFFER, BUFFER);
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferPosition);//ESSAI
        _webGL.bufferData(_webGL.ARRAY_BUFFER, position, _webGL.DYNAMIC_DRAW);
        
        _webGL.enableVertexAttribArray(LOCATION);
        _webGL.vertexAttribPointer(LOCATION, 2, _webGL.FLOAT, false, 0, 0);
    }
    
    function startBufferDiameter()
    {
        //const BUFFER = _webGL.createBuffer();
        const LOCATION = _webGL.getAttribLocation(program, "pointSizeBuffer");
        
        bufferDiameter = _webGL.createBuffer();//ESSAI
        //_webGL.bindBuffer(_webGL.ARRAY_BUFFER, BUFFER);
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferDiameter);//ESSAI
        //_webGL.bufferData(_webGL.ARRAY_BUFFER, diameter, _webGL.STATIC_DRAW);
        _webGL.bufferData(_webGL.ARRAY_BUFFER, diameter, _webGL.DYNAMIC_DRAW);//ESSAI
        
        _webGL.enableVertexAttribArray(LOCATION);
        _webGL.vertexAttribPointer(LOCATION, 1, _webGL.FLOAT, false, 0, 0);
    }
    
    function startBufferLuminosity()
    {
        //const BUFFER = _webGL.createBuffer();
        const LOCATION = _webGL.getAttribLocation(program, "luminosityBuffer");
        
        bufferLuminosity = _webGL.createBuffer();//ESSAI
        //_webGL.bindBuffer(_webGL.ARRAY_BUFFER, BUFFER);
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferLuminosity);//ESSAI
        //_webGL.bufferData(_webGL.ARRAY_BUFFER, luminosity, _webGL.STATIC_DRAW);
        _webGL.bufferData(_webGL.ARRAY_BUFFER, luminosity, _webGL.DYNAMIC_DRAW);//ESSAI
        
        _webGL.enableVertexAttribArray(LOCATION);
        _webGL.vertexAttribPointer(LOCATION, 1, _webGL.FLOAT, false, 0, 0);
    }
    
    function state()
    {
        //numberAttractor = randomInteger(1, 2);
        if (stateAttractor === 1)
        {
            timeState = performance.now() + 10000;
            numberAttractor = 3;
            newRandomizeAttractor = 1;
            
            stateAttractor = 2;
        }
        /*else if (stateAttractor === 2)
        {
            timeState = performance.now() + 1000000;
            numberAttractor = 2;
            newRandomizeAttractor = 1;
            
            stateAttractor = 2;
        }*/
        /*else if (stateAttractor === 2)
        {
            timeState = performance.now() + 10000;
            numberAttractor = 3;
            newRandomizeAttractor = 1;
            
            stateAttractor = 2;
        }*/
        /*
        else if (numberAttractor < 3)
        {
            timeAttractor = performance.now() + 15000;
            numberAttractor++;
            newRandomizeAttractor = 1;
        }
        else
        {
            timeAttractor = performance.now() + 15000;
            numberAttractor = 2;
            newRandomizeAttractor = 1;
        }*/
    }
    
    state();
    
    /*function attractor2()
    {
        if (randomInteger(1, 2) !== 1)
        {
            directionAttractor = false;
            timeAttractor2 = performance.now() + randomInteger(500, 4000);
        }
        else
        {
            //directionAttractor = true;
            timeAttractor2 = performance.now() + randomInteger(250, 800);
        }
    }
    
    timeAttractor2 = performance.now() + randomInteger(500, 4000);*/
    
    function touch1()
    {
        xOffsetAttractorTouch = randomFloat(-0.1, 0.1);
        xOffsetRingTouch = randomFloat(0.75, 1.5);
        timeTouch1 = performance.now() + randomInteger(250, 2000);
    }
    
    touch1();
    
    function touch2()
    {
        yOffsetAttractorTouch = randomFloat(-0.1, 0.1);
        yOffsetRingTouch = randomFloat(0.75, 1.5);
        timeTouch2 = performance.now() + randomInteger(250, 2000);
    }
    
    touch2();
    
    timeLast = performance.now();
    
    function drawBuffer(time)
    {
        const TIME_DELTA = Math.min((time - timeLast) * 0.001, 0.05);
        let px = 0;
        let py = 0;
        let dx = 0;
        let dy = 0;
        let sx = 0;
        let sy = 0;
        let magnitude = 0;
        let strength = 0;
        let smoothTouch = 1;
        
        timeLast = time;
        
        hWindow = window.innerWidth;
        vWindow = window.innerHeight;
        
        if (hWindow < vWindow)
        {
            scaleAlpha = hWindow / vWindow;
            scaleBeta = 1;
        }
        else
        {
            scaleAlpha = 1;
            scaleBeta = vWindow / hWindow;
        }
        
        //ATTRACTOR
        if (performance.now() > timeState)
        {
            state();
        }
        
        /*if (performance.now() > timeAttractor2)
        {
            attractor2();
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
        
        smoothTouch = 1 - Math.pow(SMOOTH_TOUCH, TIME_DELTA);
        xSmoothTouch += (xOffsetRingTouch - xSmoothTouch) * smoothTouch;
        ySmoothTouch += (yOffsetRingTouch - ySmoothTouch) * smoothTouch;
        
        if (newRandomizeAttractor === 1)
        {
            if (numberAttractor === 2 || numberAttractor === 3)
            {
                //directionSpin = randomBinary(-1, 1);
                //angleSpinStart = Math.PI * randomFloat(-1, 1);
            }
            /*if (angleSpinStart + 0.3 < Math.PI)
            {
                angleSpinStart += 0.3;
            }
            else
            {
                angleSpinStart += -Math.PI;
            }*/
            
            newRandomizeAttractor = 2;
        }
        
        //ANIMATION
        for (indexParticule = 0; indexParticule < COUNT_PARTICLE; indexParticule++)
        {
            //POSITION
            px = position[indexParticule * 2];
            py = position[(indexParticule * 2) + 1];
            
            //ATTRACTOR
            if (newRandomizeAttractor === 2)
            {
                if (numberAttractor === 1)
                {
                    shapeAttractor1[indexParticule * 2] = randomFloat(-0.15, 0.15) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
                    shapeAttractor1[(indexParticule * 2) + 1] = randomFloat(-0.35, 0.35) + (randomFloat(0, 0.01) * randomBinary(-1, 1));
                }
                else if (numberAttractor === 2)
                {
                    radiusSpin = indexParticule / COUNT_PARTICLE;
                    angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
                    weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE1)) * BULB2_SPIN_SHAPE1;
                    
                    shapeAttractor2[indexParticule * 2] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
                    shapeAttractor2[(indexParticule * 2) + 1] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
                }
                else if (numberAttractor === 3)
                {
                    radiusSpin = indexParticule / COUNT_PARTICLE;
                    angleSpin = angleSpinStart + directionSpin * radiusSpin * COUNT_SPIN * Math.PI * 2;
                    weightSpin = (1 / Math.exp(radiusSpin * BULB1_SPIN_SHAPE2)) * BULB2_SPIN_SHAPE2;
                    
                    shapeAttractor3[indexParticule * 2] = (Math.cos(angleSpin) * radiusSpin * SIZE_X_SPIN) + randomFloat(-weightSpin, weightSpin);
                    shapeAttractor3[(indexParticule * 2) + 1] = (Math.sin(angleSpin) * radiusSpin * SIZE_Y_SPIN) + randomFloat(-weightSpin, weightSpin);
                }
            }
            
            if (activeTouchA === true && activeTouchB === true)
            {
                xAttractor = xTouch + (xOffsetAttractorTouch * scaleBeta);
                yAttractor = yTouch + (yOffsetAttractorTouch * scaleAlpha);
            }
            else
            {
                if (numberAttractor === 1)
                {
                    xAttractor = shapeAttractor1[indexParticule * 2] * scaleBeta;
                    yAttractor = shapeAttractor1[(indexParticule * 2) + 1] * scaleAlpha;
                }
                else if (numberAttractor === 2)
                {
                    xAttractor = shapeAttractor2[indexParticule * 2] * scaleBeta;
                    yAttractor = shapeAttractor2[(indexParticule * 2) + 1] * scaleAlpha;
                }
                else if (numberAttractor === 3)
                {
                    xAttractor = shapeAttractor3[indexParticule * 2] * scaleBeta;
                    yAttractor = shapeAttractor3[(indexParticule * 2) + 1] * scaleAlpha;
                }
            }
            
            
            //if (directionAttractor === false)
            //{
                dx = xAttractor - px;
                dy = yAttractor - py;
            //}
            //else
            //{
                //dx = xAttractor + px;
                //dy = yAttractor + py;
            //}
            
            magnitude = 0.000001 + Math.sqrt((dx * dx) + (dy * dy));
            
            dx /= magnitude * scaleAlpha;
            dy /= magnitude * scaleBeta;
            
            velocity[indexParticule * 2] += dx * (FORCE_ATTRACTOR / mass[indexParticule]) * TIME_DELTA;
            velocity[(indexParticule * 2) + 1] += dy * (FORCE_ATTRACTOR / mass[indexParticule]) * TIME_DELTA;
            
            //TOUCH
            if (activeTouchA === true)
            {
                dx = (xTouch - px) * xSmoothTouch * scaleAlpha;
                dy = (yTouch - py) * ySmoothTouch * scaleBeta;
                
                magnitude = 0.000001 + Math.sqrt((dx * dx) + (dy * dy));
                
                if (magnitude < RADIUS_TOUCH)
                {
                    strength = (RING_TOUCH - (magnitude / RADIUS_TOUCH));
                    
                    velocity[indexParticule * 2] -= (dx / magnitude) * strength * FORCE_TOUCH * TIME_DELTA;
                    velocity[(indexParticule * 2) + 1] -= (dy / magnitude) * strength * FORCE_TOUCH * TIME_DELTA;
                }
            }
            
            //DAMPING
            sx = velocity[indexParticule * 2];
            sy = velocity[(indexParticule * 2) + 1];
            
            let damping = Math.pow(DAMPING, TIME_DELTA);
            
            if (sx < -VELOCITY_MIN * scaleBeta)
            {
                velocity[indexParticule * 2] *= damping;
            }
            else if (sx > VELOCITY_MIN * scaleBeta)
            {
                velocity[indexParticule * 2] *= damping;
            }
            
            if (sy < -VELOCITY_MIN * scaleAlpha)
            {
                velocity[(indexParticule * 2) + 1] *= damping;
            }
            else if (sy > VELOCITY_MIN * scaleAlpha)
            {
                velocity[(indexParticule * 2) + 1] *= damping;
            }
            
            //CLAMP
            sx = velocity[indexParticule * 2] / scaleBeta;
            sy = velocity[(indexParticule * 2) + 1] / scaleAlpha;
            
            magnitude = 0.000001 + Math.sqrt((sx * sx) + (sy * sy));
            
            if (magnitude > CLAMP)
            {
                strength = CLAMP / magnitude;
                
                velocity[indexParticule * 2] = sx * strength * scaleBeta;
                velocity[(indexParticule * 2) + 1] = sy * strength * scaleAlpha;
            }
            
            //BOUNCE
            if (px < -wall[indexParticule * 2])
            {
                velocity[indexParticule * 2] = bounce[indexParticule];
            }
            else if (px > wall[indexParticule * 2])
            {
                velocity[indexParticule * 2] = -bounce[indexParticule];
            }
            
            if (py < -wall[(indexParticule * 2) + 1])
            {
                velocity[(indexParticule * 2) + 1] = bounce[indexParticule];
            }
            else if (py > wall[(indexParticule * 2) + 1])
            {
                velocity[(indexParticule * 2) + 1] = -bounce[indexParticule];
            }
            
            //UPDATE
            position[indexParticule * 2] += velocity[indexParticule * 2] * TIME_DELTA;
            position[(indexParticule * 2) + 1] += velocity[(indexParticule * 2) + 1] * TIME_DELTA;
            positionRender[indexParticule * 2] = position[indexParticule * 2] + _rxAccelerometerRaw * proximity[indexParticule];
            positionRender[(indexParticule * 2) + 1] = position[(indexParticule * 2) + 1] - _ryAccelerometerRaw * proximity[indexParticule];
            
            //DIAMETER LUMINOSITY
            let xBlur = clampPositiveSymmetricalMinMax(positionRender[indexParticule * 2] * scaleAlpha, WIDTH_BLUR);
            let yBlur = clampPositiveSymmetricalMinMax(positionRender[(indexParticule * 2) + 1] + Y_OFFSET_BLUR * scaleBeta, HEIGHT_BLUR);
            magnitude = Math.min(0.000001 + Math.sqrt((xBlur * xBlur) + (yBlur * yBlur)), 1);
            //console.log(xBlur);
            let d = diameterStart[indexParticule];
            let l = luminosityStart[indexParticule];
            diameter[indexParticule] = d + (d * 4 * magnitude);//ESSAI
            luminosity[indexParticule] = l - (0.095 * magnitude);//ESSAI
        }
        
        if (newRandomizeAttractor === 2)
        {
            newRandomizeAttractor = 0;
        }
        
        //DRAW
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferPosition);//ESSAI
        _webGL.bufferSubData(_webGL.ARRAY_BUFFER, 0, positionRender);
        
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferDiameter);//ESSAI
        _webGL.bufferSubData(_webGL.ARRAY_BUFFER, 0, diameter);//ESSAI
        
        _webGL.bindBuffer(_webGL.ARRAY_BUFFER, bufferLuminosity);//ESSAI
        _webGL.bufferSubData(_webGL.ARRAY_BUFFER, 0, luminosity);//ESSAI
        
        _webGL.clear(_webGL.COLOR_BUFFER_BIT | _webGL.DEPTH_BUFFER_BIT | _webGL.STENCIL_BUFFER_BIT);
        _webGL.drawArrays(_webGL.POINTS, 0, COUNT_PARTICLE);
        
        requestAnimationFrame(drawBuffer);
    }
    
    setupWebGL();
    program = startProgram(vsSource, fsSource);
    startBufferPosition();
    startBufferDiameter();
    startBufferLuminosity();
    requestAnimationFrame(drawBuffer);
}

function resizing()
{
    function updateSize()
    {
        const H_WINDOW = window.innerWidth;
        const V_WINDOW = window.innerHeight;
        
        _tagCanvas.width = Math.floor(H_WINDOW * 2);
        _tagCanvas.height = Math.floor(V_WINDOW * 2);
        _tagCanvas.style.width = H_WINDOW + "px";
        _tagCanvas.style.height = V_WINDOW + "px";
        
        _webGL.viewport(0, 0, _tagCanvas.width, _tagCanvas.height);
    }
    
    updateSize();
    window.addEventListener("resize", updateSize);
}

function loaded()
{
    
}

function href(index)
{
    
}

function loading()
{
    background();
    particule();
    resizing();
    loaded();
}

window.addEventListener("load", loading);
