import "./index.scss";

import Vue from "vue";
import {hex as contrastHex} from "wcag-contrast";
import eventBus from "./eventBus";
import helper from "./helper";
import GrabControl from "./GrabControl";
import PickerControl from "./PickerControl";

// base config for this application
const baseConfig = {
    edgeReserve: 100,

    // pixel scale of the magnifier
    magnifierPixelScale: 8,
    magnifierCanvasSize: 120,

    indicatorColor1: "#1ee",
    indicatorColor2: "#f00",
    cardNoteColor1: "#333",
    cardNoteColor2: "#fff"
};

let paintingCtx: CanvasRenderingContext2D;
let magnifierCtx: CanvasRenderingContext2D;
let grabControl: GrabControl;
let pickerControl: PickerControl;

let totalVm: any = new Vue({
    el: "[data-total-container]",
    data: {
        // imageReady: true,
        imageReady: false,
        toastTop: {
            classObject: {
                "-space-in": false,
                "-space-out": false
            },
            timeFlag: null,
            visible: false,
            text: "Copied."
        },
        dropBoxClass: {
            "-active": false
        },
        advisorOptions: {
            pointCount: 10,
            rangePercent: 20
        },
        canvasContainerStyle: {},
        canvasClientRect: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },
        painting: {
            classObject: {
                "-centered": true,
                "-grab": false
            },
            mode: "normal"
        },
        lumaAdjust: false,
        pickerColor: "#ffffff",
        pickerIndicatorInverted: false,
        magnifierRightBottom: false,
        targetMarkStyle: {},
        targetColor: "",
        targetNoteInverted: false,
        targetRecommendColorList: []
    },
    mounted () {
        paintingCtx = this.$refs.imageCanvas.getContext("2d");
        magnifierCtx = this.$refs.magnifierCanvas.getContext("2d");

        bindEvents("init");
        eventBus.$on("painting:grab", (mode: string) => {
            this.changeGrabMode(mode);
        });
        eventBus.$on("painting:move", (e: any) => {
            this.movePainting(e.dx, e.dy);
        });
        eventBus.$on("picker:move", (e: any) => {
            this.movePicker(e.clientX, e.clientY);
        });
        eventBus.$on("picker:drop", (e: any) => {
            this.dropPicker(e.clientX, e.clientY);
        });
    },
    computed: {
        isPickerMarkShow () {
            return Object.keys(this.targetMarkStyle).length > 0 && !this.lumaAdjust;
        },
        isMagnifierShow () {
            return !this.lumaAdjust;
        },
        colorBoxStyle () {
            return {
                backgroundColor: this.pickerColor
            };
        },
        targetCardStyle () {
            if (this.targetColor) {
                return {
                    backgroundColor: this.targetColor
                };
            } else {
                return {};
            }
        }
    },
    methods: {
        handleMagnifierEnter (e: MouseEvent) {
            // this.magnifierRightBottom = !this.magnifierRightBottom;
        },
        showToastTop (message: string) {
            let toastTop = this.toastTop;
            let toastTopEl = this.$refs.toastTopEl;
            clearTimeout(toastTop.timeFlag);
            toastTop.visible = true;
            toastTop.animeClass = "-space-in";
            toastTop.text = message;
            // console.log("[showToastTop]", "1");

            toastTop.timeFlag = setTimeout(() => {
                toastTop.animeClass = "-space-out";
                toastTopEl.addEventListener("animationend", () => {
                    if (toastTop.animeClass === "-space-out") {
                        toastTop.visible = false;
                    };
                }, {
                    once: true
                });
            }, 2000);
        },
        copyToClipboard(color: string) {
            console.log("[copyToClipboard] color = ", color);

            if (color) {
                navigator.permissions.query({ name: "clipboard-write" }).then(result => {
                    if (result.state == "granted" || result.state == "prompt") {
                        navigator.clipboard.writeText(color).then(() => {
                            this.showToastTop("Copied.");
                        }, () => {
                            this.showToastTop("Copy failed.")
                        });
                    }
                });
            }
        },
        generateAdvisor () {
            let targetColorRGB: number[] = helper.hex2rgb(this.targetColor);
            
            const [targetColorY, targetColorU, targetColorV]: number[] = helper.rgb2yuv(...targetColorRGB);

            const pointCount: number = this.advisorOptions.pointCount;
            const rangePercent = this.advisorOptions.rangePercent;
            let colorUArray: number[];
            let colorVArray: number[];
            let advisorColorArray: string[] = [];

            console.log("[generateAdvisor] targetColorRGB = ", targetColorRGB);
            console.log("[generateAdvisor] targetColorY = ", targetColorY);
            console.log("[generateAdvisor] targetColorU = ", targetColorU);
            console.log("[generateAdvisor] targetColorV = ", targetColorV);

            // part "U"
            let max = 255;
            let min = 0;
            let step = 1;
            let pointArray = [];
            let sideFlag = "";
            let targetPoint = targetColorU;
            let currentPoint = targetColorU;
            let deltaLeft = 0;
            let deltaRight = 0;

            for (let i = 1; i <= pointCount; i++) {
                let deltaFlag = "";

                if (sideFlag === "left") {
                    deltaLeft = deltaLeft + 1;
                    deltaFlag = "left";
                } else if (sideFlag === "right") {
                    deltaRight = deltaRight + 1;
                    deltaFlag = "right";
                } else {
                    if (i % 2 === 0) {
                        deltaLeft = deltaLeft + 1;
                        deltaFlag = "left";
                    } else {
                        deltaRight = deltaRight + 1;
                        deltaFlag = "right";
                    }
                }

                if (deltaFlag === "right") {
                    currentPoint = targetPoint + deltaRight * step;
                } else if (deltaFlag === "left") {
                    currentPoint = targetPoint - deltaLeft * step;
                }

                if (sideFlag === "") {
                    if (currentPoint > max) {
                        sideFlag = "left";
                        deltaLeft = deltaLeft + 1;
                        currentPoint = targetPoint - deltaLeft * step;
                    } else if (currentPoint < min) {
                        sideFlag = "right";
                        deltaRight = deltaRight + 1;
                        currentPoint = targetPoint + deltaRight * step;
                    }
                }

                pointArray.push(currentPoint);
            }

            colorUArray = pointArray;

            // part "V"
            pointArray = [];
            sideFlag = "";
            targetPoint = targetColorV;
            currentPoint = targetColorV;
            deltaLeft = 0;
            deltaRight = 0;

            for (let i = 1; i <= pointCount; i++) {
                let deltaFlag = "";

                if (sideFlag === "left") {
                    deltaLeft = deltaLeft + 1;
                    deltaFlag = "left";
                } else if (sideFlag === "right") {
                    deltaRight = deltaRight + 1;
                    deltaFlag = "right";
                } else {
                    if (i % 2 === 0) {
                        deltaLeft = deltaLeft + 1;
                        deltaFlag = "left";
                    } else {
                        deltaRight = deltaRight + 1;
                        deltaFlag = "right";
                    }
                }

                if (deltaFlag === "right") {
                    currentPoint = targetPoint + deltaRight * step;
                } else if (deltaFlag === "left") {
                    currentPoint = targetPoint - deltaLeft * step;
                }

                if (sideFlag === "") {
                    if (currentPoint > max) {
                        sideFlag = "left";
                        deltaLeft = deltaLeft + 1;
                        currentPoint = targetPoint - deltaLeft * step;
                    } else if (currentPoint < min) {
                        sideFlag = "right";
                        deltaRight = deltaRight + 1;
                        currentPoint = targetPoint + deltaRight * step;
                    }
                }

                pointArray.push(currentPoint);
            }

            colorVArray = pointArray;

            for (let i = 0; i < pointCount; i++) {
                let colorY = targetColorY;
                let colorU = colorUArray[i];
                let colorV = colorVArray[i];
                console.log("[last for] i = ", i);
                console.log("[last for] colorY = ", colorY);
                console.log("[last for] colorU = ", colorU);
                console.log("[last for] colorV = ", colorV);

                let colorRGB = helper.yuv2rgb(colorY, colorU, colorV);
                console.log("[last for] colorRGB = ", colorRGB);
                let colorHEX = helper.rgb2hex(...colorRGB);

                advisorColorArray.push(colorHEX);
            }

    
            console.log("[generateAdvisor] advisorColorArray = ", advisorColorArray);

            this.targetRecommendColorList = advisorColorArray.filter((item) => {
                return /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(item);
            });
        },
        calcNoteInverted (color: string) {
            let contrastNumber: Number = contrastHex(color, baseConfig.cardNoteColor1);
            return contrastNumber < 4.5;
        },
        switchDisplay (type: string) {
            switch (type) {
                case "luma":
                default:
                    this.lumaAdjust = !this.lumaAdjust;
            }
        },
        calcPickerPos (clientX: number, clientY: number) {
            let relativeX: number = clientX + this.$refs.paintingContainer.scrollLeft - this.canvasClientRect.x;
            let relativeY: number = clientY + this.$refs.paintingContainer.scrollTop - this.canvasClientRect.y;

            // edge check
            if (relativeX < 0) {
                relativeX = 0;
            } else if (relativeX >= this.canvasClientRect.width) {
                relativeX = this.canvasClientRect.width - 1;
            }

            if (relativeY < 0) {
                relativeY = 0;
            } else if (relativeY >= this.canvasClientRect.height) {
                relativeY = this.canvasClientRect.height - 1;
            }

            return {
                x: relativeX,
                y: relativeY
            };
        },
        dropPicker (clientX: number, clientY: number) {   

            // skip when using other modes like "grab"
            if (this.painting.mode !== "normal" || this.lumaAdjust) {
                return;
            }

            let pickerPos = this.calcPickerPos(clientX, clientY);
            this.targetMarkStyle = {
                left: `${pickerPos.x}px`,
                top: `${pickerPos.y}px`
            };
            this.targetColor = this.pickerColor;
            this.targetNoteInverted = this.calcNoteInverted(this.targetColor);
            this.generateAdvisor();
        },
        refreshPickerStatus (relativeX: number, relativeY: number) {

            let pixelData: Uint8ClampedArray;
            let pixelSize = baseConfig.magnifierCanvasSize / baseConfig.magnifierPixelScale;
            let pixelAmplitude: number = Math.floor((pixelSize - 1) / 2);
            let startX: number = relativeX - pixelAmplitude;
            let startY: number = relativeY - pixelAmplitude;

            pixelData = paintingCtx.getImageData(relativeX, relativeY, 1, 1).data;
            this.pickerColor = helper.rgb2hex(pixelData[0], pixelData[1], pixelData[2]);

            // update indicator color for proper contrast (below "AA")
            let contrastNumber: number = contrastHex(this.pickerColor, baseConfig.indicatorColor1);
            this.pickerIndicatorInverted = contrastNumber < 4.5;

            // disable smooth for pixel scale
            magnifierCtx.imageSmoothingEnabled = false;
            // magnifierCtx.mozImageSmoothingEnabled  = false;
            // magnifierCtx.webkitImageSmoothingEnabled  = false;
            // magnifierCtx.msImageSmoothingEnabled  = false;

            magnifierCtx.clearRect(0, 0, baseConfig.magnifierCanvasSize, baseConfig.magnifierCanvasSize);
            magnifierCtx.drawImage(this.$refs.imageCanvas, startX, startY, pixelSize, pixelSize, 
                0, 0, baseConfig.magnifierCanvasSize, baseConfig.magnifierCanvasSize);
        },
        movePicker (clientX: number, clientY: number) {
            let pickerPos = this.calcPickerPos(clientX, clientY);

            if (!this.lumaAdjust) {
                this.refreshPickerStatus(pickerPos.x, pickerPos.y);
            }
        },
        movePainting (dx: number, dy: number) {
            this.$refs.paintingContainer.scrollLeft -= dx;
            this.$refs.paintingContainer.scrollTop -= dy;
        },
        changeGrabMode (mode: string) {
            switch (mode) {
                case "on": 
                    this.painting.classObject["-grab"] = true;
                    this.painting.mode = "grab";
                    break;
                
                case "off":
                default: 
                    this.painting.classObject["-grab"] = false;
                    this.painting.mode = "normal";
            }
        },
        handleDragEnter () {
            this.dropBoxClass["-active"] = true;
        },
        handleDragLeave () {
            this.dropBoxClass["-active"] = false;
        },
        handleDrop (e: DragEvent) {
            e.preventDefault();
            e.stopPropagation();
            
            let dt = e.dataTransfer;
            let files = dt.files;

            console.log("[handleDrop] dt = ", dt);
            console.log("[handleDrop] files = ", files);
     
            this.dropBoxClass["-active"] = false;
        }
    }
});

function bindEvents (flag: string): void {
    
    switch (flag) {

        // when the image has been loaded to canvas
        case "imageReady": {
            helper.throttle("resize", "optimizedResize", window);

            window.addEventListener("optimizedResize", () => {
                adjustPaintingArea();
            }, false);

            grabControl = new GrabControl();
            grabControl.bindEvents();
            
            pickerControl = new PickerControl();
            pickerControl.bindEvents();

            break;
        }

        case "init":
        default: {
            document.addEventListener("paste", function pasteEventHandler (e: ClipboardEvent) {
                e.preventDefault();
                let clipboardData: DataTransfer = e.clipboardData;
            
                if (clipboardData) {
                    let items: DataTransferItemList = clipboardData.items;
            
                    if (items && items.length > 0) {
                        
                        for (let i = 0; i < items.length; i++) {
                            let item: DataTransferItem = items[i];
            
                            if (item.type.includes("image")) {
                                let blob: Blob = item.getAsFile();

                                // remove event listener of "paste" after finding a image
                                document.removeEventListener("paste", pasteEventHandler, false);
                                return loadImageBlobToCanvas(blob);
                            }
                        }
                    }
                }
            }, false);
        }
    }
}

function loadImageBlobToCanvas (imageBlob: Blob): void {

    if (imageBlob) {
        let image: HTMLImageElement = new Image();
        let url: string = window.URL.createObjectURL(imageBlob);
        
        image.onload = function () {
            totalVm.$refs.imageCanvas.width = image.width;
            totalVm.$refs.imageCanvas.height = image.height;
            totalVm.imageReady = true;
            paintingCtx.drawImage(image, 0, 0);
            totalVm.$refs.magnifierCanvas.width = baseConfig.magnifierCanvasSize;
            totalVm.$refs.magnifierCanvas.height = baseConfig.magnifierCanvasSize;
            bindEvents("imageReady");
            adjustPaintingArea();
        };

        image.src = url;
    }
}

function adjustPaintingArea (): void {
    let canvas: HTMLCanvasElement = totalVm.$refs.imageCanvas;
    let canvasWidth: number = canvas.width;
    let canvasHeight: number = canvas.height;
    let viewportWidth: number = window.innerWidth;
    let viewportHeight: number = window.innerHeight;

    // if larger than viewport
    if (canvasWidth > viewportWidth || canvasHeight > viewportHeight) {
        totalVm.painting.classObject["-centered"] = false;

        let properContainerWidth: number = 2 * (viewportWidth - baseConfig.edgeReserve) + canvasWidth;
        let properContainerHeight: number =  2 * (viewportHeight - baseConfig.edgeReserve) + canvasHeight;
        totalVm.canvasContainerStyle = {
            width: `${properContainerWidth}px`,
            height: `${properContainerHeight}px`
        };
        totalVm.canvasClientRect = {
            width: canvasWidth, 
            height: canvasHeight,
            x: (properContainerWidth - canvasWidth) / 2,
            y: (properContainerHeight - canvasHeight) / 2
        };

        totalVm.$nextTick(function () {
            this.$refs.paintingContainer.scrollLeft = (properContainerWidth - viewportWidth) / 2;
            this.$refs.paintingContainer.scrollTop = (properContainerHeight - viewportHeight) / 2;
        });

    } else {
        totalVm.painting.classObject["-centered"] = true;
        totalVm.canvasContainerStyle = {};
        totalVm.canvasClientRect = {
            width: canvasWidth, 
            height: canvasHeight,
            x: Math.floor((viewportWidth - canvasWidth) / 2),
            y: Math.floor((viewportHeight - canvasHeight) / 2)
        };
    }
}
