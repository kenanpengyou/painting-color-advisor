// https://developer.mozilla.org/zh-CN/docs/Web/API/Window/resize_event
let throttle: Function = function (type: string, name: string, obj: HTMLElement | Window): void {
    obj = obj || window;
    let running: boolean = false;
    let func: EventListener = function () {
        if (running) {
            return;
        }
        running = true;
        requestAnimationFrame(function () {
            obj.dispatchEvent(new CustomEvent(name));
            running = false;
        });
    };
    obj.addEventListener(type, func);
};

// r, g, b should be "int"
const rgb2hex: Function = function (r: any, g: any, b: any): string {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
};

const hex2rgb: Function = function (hex: string): number[] {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let [r, g, b] = [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];

    return [r, g, b];
};

// https://en.wikipedia.org/wiki/YUV
// use YUV444 and RGB888
const rgb2yuv: Function = function (r: number, g: number, b: number): number[] {
    let y = ((66 * r + 129 * g + 25 * b + 128) >> 8) + 16;
    let u = ((-38 * r - 74 * g + 128 * b + 128) >> 8) + 128;
    let v = ((112 * r - 94 * g - 18 * b + 128) >> 8) + 128;

    return [y, u, v];
};

const yuv2rgb: Function = function (y: number, u: number, v: number): number[] {
    
    let c = y - 16;
    let d = u - 128;
    let e = v - 128;

    let r = (298 * c + 409 * e + 128) >> 8;
    let g = (298 * c - 100 * d - 208 * e + 128) >> 8;
    let b = (298 * c + 516 * d + 128) >> 8;

    r = clamp(r, 0, 255);
    g = clamp(g, 0, 255);
    b = clamp(b, 0, 255);

    return [r, g, b];
};

const clamp: Function = function (current: number, min: number, max: number): number {
    return Math.min(Math.max(current, min), max);
};

const generateHuePackage: Function = function (y: number, u: number, v: number): {
    closest: number,
    dataArray: {
        u: number,
        v: number
    }[]
} {
    let hueArray: {
        u: number,
        v: number
    }[] = new Array(360);

    // scatter point count = Math.ceil(255 / 4) = Math.ceil(63.7564) = 64
    // total iteration count = 64 * 64 = 4096
    let step: number = 4;
    let min: number = 0;
    let max: number = 255;
    let currentU: number = min;
    let currentV: number = min;
    let closestDistance: number = Math.pow(max - min, 2) + Math.pow(max - min, 2);
    let closestHue: number = 0;

    while (currentU <= max) {
        currentV = min;
        while (currentV <= max) {
            let colorRGB: number[] = yuv2rgb(y, currentU, currentV);
            let colorHue: number = calcHueOfRGB(...colorRGB);

            if (!hueArray[colorHue]) {
                hueArray[colorHue] = {
                    u: currentU,
                    v: currentV
                }
            }

            let distance: number = Math.pow(currentU - u, 2) + Math.pow(currentV - v, 2);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestHue = colorHue;
            }
            currentV = currentV + step;
        }
        currentU = currentU + step;
    }

    return {
        closest: closestHue,
        dataArray: hueArray
    }
};

const calcHueOfRGB: Function = function (r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0;

    if (delta == 0)
        h = 0;
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    else if (cmax == g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    return h;
};

export default {
    throttle,
    rgb2hex,
    hex2rgb,
    rgb2yuv,
    yuv2rgb,
    generateHuePackage
};