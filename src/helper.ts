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

export default {
    throttle
};