import "./index.scss";

import Vue from "vue";

let totalVm: any = new Vue({
    el: "[data-total-container]",
    data: {
        imageSrc: "",
        dropBoxClass: {
            "-active": false
        }
    },
    methods: {
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

document.addEventListener("paste", (e: ClipboardEvent) => {
    e.preventDefault();
    let clipboardData: DataTransfer = e.clipboardData;

    if (clipboardData) {
        let items: DataTransferItemList = clipboardData.items;

        if (items && items.length > 0) {
            
            for (let i = 0; i < items.length; i++) {
                let item: DataTransferItem = items[i];

                if (item.type.includes("image")) {
                    let blob: Blob = item.getAsFile();
                    return loadImageBlobToCanvas(blob);
                }
            }
        }
    }
}, false);


function loadImageBlobToCanvas (imageBlob: Blob) {

    if (imageBlob) {
        let url: String = URL.createObjectURL(imageBlob);
        totalVm.imageSrc = url;
    }

}