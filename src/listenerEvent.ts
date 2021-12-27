import { PageStop } from "./classes/page_stop";
import { listenerClickEvent } from "./events/click"
import { listenerInputEvent } from "./events/input";
import { listenerPopstate } from "./events/popstate";
import { listenerSwitchWindow } from "./events/switch_window";

export const addEventsListener = () => {

    const pageStopObject = new PageStop();

    listenerClickEvent();
    listenerInputEvent();
    listenerPopstate(pageStopObject);
    listenerSwitchWindow(pageStopObject);

    // 加载时
    window.addEventListener("load", () => {
        pageStopObject.init(window.location);
    })
} 