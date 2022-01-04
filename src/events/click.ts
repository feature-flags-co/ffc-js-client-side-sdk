import { ClickEvent } from "../classes/interfaces";
import { eventsListener } from "../listenerEvent";
import { getElementSelector } from "../utils/handleSelector";
import { locationSortout } from "../utils/locationSortout";

export const listenerClickEvent = (that: eventsListener) => {

    window.addEventListener("click", (event: MouseEvent) => {
        const targetElement = event.target;

        if(targetElement) {
            const nodeName = targetElement['nodeName'];

            switch(nodeName) {
                case "A":
                case "BUTTON":
                    that.requestData({
                        clickEvent: sortoutParams(targetElement, nodeName.toLowerCase())
                    });
                    break;
                case "INPUT":
                    /**
                     * 监听除 input[type="text"] 之外 input 的点击事件
                     */
                    const elementType = targetElement['type'];

                    if(elementType === "radio" || elementType === "checkbox") {
                        const name = targetElement['name'];
                        const value = targetElement['value'];

                        that.requestData({
                            clickEvent: sortoutParams(targetElement, elementType, name, value)
                        });
                    }
                    break;
            }
        }
    })
}

const sortoutParams = (element: any, elementType: string, name: string | null = null, value: string | null = null): ClickEvent => {
    const selectors = getElementSelector(element);
    const text = element['innerText'];
    const location = locationSortout();

    let param: ClickEvent = {
        ...location,
        clickType: '',
        innerText: text || "",
        cssSelector: selectors,
        elementType,
        extra: null
    }

    if(name && value) {
        param.extra = `${name}:${value}`;
    }

    return param;
}