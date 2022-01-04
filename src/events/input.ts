import { eventsListener } from "../listenerEvent";
import { getElementSelector } from "../utils/handleSelector";
import { locationSortout } from "../utils/locationSortout";

export const listenerInputEvent = (that: eventsListener) => {

    const nodes = document.querySelectorAll("input[type=text]");

    nodes.forEach(node => {
        node.addEventListener("blur", (event) => {

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

                    const selectors = getElementSelector(targetElement);
                    const location = locationSortout();
                    const value = targetElement["value"];

                    console.log(nodeName);
                    console.log(selectors);
                    console.log(location);
                    console.log(value);
                }
            }
        })
    })
}
