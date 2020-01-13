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
        this.boundMouseupHandler = (e: MouseEvent) => this.mouseupHandler(e);
    }

    public bindEvents () {
        document.addEventListener("mousemove", this.boundMousemoveHandler, false);
        document.addEventListener("mouseup", this.boundMouseupHandler, false);
    }

    private mousemoveHandler (e: MouseEvent) {
        this.eventBus.$emit("picker:move", {
          clientX: e.clientX,
          clientY: e.clientY
        });
    }

    private mouseupHandler (e: MouseEvent) {
        this.eventBus.$emit("picker:drop", {
          clientX: e.clientX,
          clientY: e.clientY
        });
  }
}

/*------------------------------------------------------------------------*\

  # export

\*------------------------------------------------------------------------*/

export default PickerControl;