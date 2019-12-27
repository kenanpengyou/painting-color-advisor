import eventBus from "./eventBus";

/*------------------------------------------------------------------------*\

  # classes

\*------------------------------------------------------------------------*/

class PickerControl {
    
    private eventBus: any;
    private boundMousemoveHandler: EventListener;

    public constructor () {
        this.eventBus = eventBus;
        this.boundMousemoveHandler = (e: MouseEvent) => this.mousemoveHandler(e);
    }

    public bindEvents () {
        document.addEventListener("mousemove", this.boundMousemoveHandler, false);
    }

    private mousemoveHandler (e: MouseEvent) {
        this.eventBus.$emit("picker:move", {
          clientX: e.clientX,
          clientY: e.clientY
        });
    }
}

/*------------------------------------------------------------------------*\

  # export

\*------------------------------------------------------------------------*/

export default PickerControl;