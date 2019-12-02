import "./index.scss";

import Vue from "vue";
import helper from "./helper";
import GrabControl from "./GrabControl";

// base config for this application
const baseConfig = {
    edgeReserve: 100
};

let paintingCtx: CanvasRenderingContext2D;
let grabControl: GrabControl;

let totalVm: any = new Vue({
    el: "[data-total-container]",
    data: {
        imageReady: false,
        painting: {
            classObject: {
                "-centered": true,
                "-grab": false
            },
            mode: "normal"
        },
        colorOfCursor: "#ffffff",
        lumaAdjust: false,
        canvasContainerStyle: {},
        dropBoxClass: {
            "-active": false
        }
    },
    mounted () {
        paintingCtx = this.$refs.imageCanvas.getContext("2d");
        bindEvents("init");
    },
    computed: {
        colorBoxStyle () {
            return {
                backgroundColor: this.colorOfCursor
            };
        }
    },
    methods: {
        switchDisplay (type: string) {
            switch (type) {
                case "luma":
                default:
                    this.lumaAdjust = !this.lumaAdjust;
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

            grabControl = new GrabControl(totalVm);
            grabControl.bindEvents();

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

        totalVm.$nextTick(function () {
            this.$refs.paintingContainer.scrollLeft = (properContainerWidth - viewportWidth) / 2;
            this.$refs.paintingContainer.scrollTop = (properContainerHeight - viewportHeight) / 2;
        });

    } else {
        totalVm.painting.classObject["-centered"] = true;
        totalVm.canvasContainerStyle = {};
    }
}
