import { eventsListener } from "../listenerEvent";
import { getElementSelector } from "../utils/handleSelector";
import { locationSortout } from "../utils/locationSortout";

export const listenerInputEvent = (that: eventsListener) => {

    window.addEventListener("input", (event: Event | InputEvent) => {
        const targetElement = event.target;

        if(targetElement) {

            /**
             * nodeName
             *      INPUT | SELECT
             *      目前只监听 INPUT 的 type="text" 的情况
             *      type="radio" 和 type="checkbox" 监听 click 事件
             */
            const nodeName = targetElement['nodeName'];
            
            if(nodeName === "INPUT" && targetElement['type'] === "text") {
                const selectors = getElementSelector(event.target);
                const location = locationSortout();

                console.log(nodeName);
                console.log(selectors);
                console.log(location);
            }
        }
    })
}
