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

// https://en.wikipedia.org/wiki/YUV#Conversion_to.2Ffrom_RGB
// Y [0, 1]
// U [-0.436, 0.436]
// V [-0.615, 0.615]
const rgb2yuv: Function = function (r: number, g: number, b: number) {
    
    // normalized within [0, 1]   eg. 102 → 0.4 (102/255)
    r = r / 255;
    g = g / 255;
    b = b / 255;

    let y = 0.299 * r + 0.587 * g + 0.114 * b;
    let u = -0.14713 * r - 0.28886 * g + 0.436 * b;
    let v = 0.615 * r - 0.51499 * g - 0.10001 * b;

    return [y, u, v];
};

const yuv2rgb: Function = function (y: number, u: number, v: number) {
    
    if (u > 0.436) {
        u = 0.436;
    } else if (u < -0.436) {
        u = -0.436;
    }

    if (v > 0.615) {
        v = 0.615;
    } else if (v < -0.615) {
        v = -0.615;
    }

    let r = y + 1.13983 * v;
    let g = y - 0.39465 * u - 0.58060 * v;
    let b = y + 2.03211 * u;

    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);

    return [r, g, b];
};

export default {
    throttle,
    rgb2hex,
    hex2rgb,
    rgb2yuv,
    yuv2rgb
};