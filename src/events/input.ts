import { getElementSelector } from "../utils/handleSelector";
import { locationSortout } from "../utils/locationSortout";

export const listenerInputEvent = () => {

    window.addEventListener("input", (event: Event | InputEvent) => {
        const targetElement = event.target;

        if(targetElement) {

            /**
             * nodeName
             *      INPUT | SELECT
             */
            const nodeName = targetElement['nodeName'];
            const selectors = getElementSelector(event.target);
            const location = locationSortout();

            let inputType = null;

            if(nodeName === "INPUT") {
                inputType = targetElement['type'];
            }
            
            console.log(nodeName, inputType);
            console.log(selectors);
            console.log(location);
        }
    })
}
