import { getElementSelector } from "../utils/handleSelector";
import { locationSortout } from "../utils/locationSortout";

// 当前需要记录的点击元素
const NODES = ["A", "BUTTON"];

export const listenerClickEvent = () => {

    window.addEventListener("click", (event: MouseEvent) => {
        const targetElement = event.target;

        if(targetElement) {
            const nodeName = targetElement['nodeName'];
            
            if(NODES.includes(nodeName)) {
                const selectors = getElementSelector(event.target);
                const text = targetElement['innerText'];
                const location = locationSortout();
                console.log(text);
                console.log(selectors);
                console.log(location);
            }
        }
    })
}
