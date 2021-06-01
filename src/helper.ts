// https://developer.mozilla.org/zh-CN/docs/Web/API/Window/resize_event
let throttle: Function = function (type: string, name: string, obj: HTMLElement | Window) {
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
const rgb2hex: Function = function (r: any, g: any, b: any) {
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

const hex2rgb: Function = function (hex: string) {
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
const rgb2yuv: Function = function (r: number, g: number, b: number) {
    let y = ((66 * r + 129 * g + 25 * b + 128) >> 8) + 16;
    let u = ((-38 * r - 74 * g + 128 * b + 128) >> 8) + 128;
    let v = ((112 * r - 94 * g - 18 * b + 128) >> 8) + 128;

    return [y, u, v];
};

const yuv2rgb: Function = function (y: number, u: number, v: number) {
    
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

const clamp: Function = function (current: number, min: number, max: number) {
    return Math.min(Math.max(current, min), max);
};

export default {
    throttle,
    rgb2hex,
    hex2rgb,
    rgb2yuv,
    yuv2rgb
};