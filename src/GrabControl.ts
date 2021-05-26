import eventBus from "./eventBus";

/*------------------------------------------------------------------------*\

  # classes

\*------------------------------------------------------------------------*/

class GrabControl {
    
    private x: number = 0;
    private y: number = 0;
    private eventBus: any;
    private grabMode: string = "off";
    private isGrabbing: boolean = false;
    private boundMousedownHandler: EventListener;
    private boundMouseupHandler: EventListener;
    private boundMousemoveHandler: EventListener;

    public constructor () {
        this.eventBus = eventBus;
        this.boundMousedownHandler = (e: MouseEvent) => this.mousedownHandler(e);
        this.boundMouseupHandler = (e: MouseEvent) => this.mouseupHandler(e);
        this.boundMousemoveHandler = (e: MouseEvent) => this.mousemoveHandler(e);
    }

    public bindEvents () {
        document.addEventListener("keydown", (e: KeyboardEvent) => {

            // key "space"
            if (e.code === "Space") {
                e.preventDefault();
                this.toggleGrabMode("on");
            }
        }, false);
        document.addEventListener("keyup", (e: KeyboardEvent) => {

            if (e.code === "Space") {
                e.preventDefault();
                this.toggleGrabMode("off");
            }
        }, false);
    }

    private mousedownHandler (e: MouseEvent) {
        this.x = e.clientX;
        this.y = e.clientY;
        this.isGrabbing = true;
    }

    private mouseupHandler (e: MouseEvent) {
        this.x = 0;
        this.y = 0;
        this.isGrabbing = false;
    }

    private mousemoveHandler (e: MouseEvent) {

        if (this.isGrabbing) {
            let dx = e.clientX - this.x;
            let dy = e.clientY - this.y;

            this.eventBus.$emit("painting:move", {
                dx, dy
            });

            this.x = e.clientX;
            this.y = e.clientY;
        }
    }

    private toggleGrabMode (nextMode: string): void {

        if (nextMode !== this.grabMode) {
            this.grabMode = nextMode;
            this.eventBus.$emit("painting:grab", nextMode);

            switch (nextMode) {
                case "on": {
                    document.addEventListener("mousedown", this.boundMousedownHandler, false);
                    document.addEventListener("mouseup", this.boundMouseupHandler, false);
                    document.addEventListener("mousemove", this.boundMousemoveHandler, false);
                    break;
                }
            
                case "off":
                default: {
                    document.removeEventListener("mousedown", this.boundMousedownHandler, false);
                    document.removeEventListener("mouseup", this.boundMouseupHandler, false);
                    document.removeEventListener("mousemove", this.boundMousemoveHandler, false);
                }
            }
        }
    }

}

/*------------------------------------------------------------------------*\

  # export

\*------------------------------------------------------------------------*/

export default GrabControl;