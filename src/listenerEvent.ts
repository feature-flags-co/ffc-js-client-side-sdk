import { listenerClickEvent } from "./events/click"

export const addEventsListener = () => {
    window.addEventListener("click", listenerClickEvent);
    window.addEventListener("change", function(event) {
        console.log("change", event)
    })

    window.addEventListener("input", function(event) {
        console.log("input", event);
    })

    window.addEventListener("visibilitychange", function(event) {
        // console.log(document.visibilityState);
        console.log("切换窗口", event)
    })

    // 切换窗口
    window.addEventListener("locationchange", function(event) {
        console.log("locationchange", event)
    })

    // 当窗口的历史记录发生改变时触发
    window.addEventListener("popstate", function(event) {
        console.log(event);
        console.log(window['Router']['currentUrl']);
    })

    // 加载时
    window.addEventListener("load", function(event) {
        console.log("加载时", event);
    })

    // 卸载之前
    window.addEventListener("beforeunload", function(event) {
        console.log("卸载前", event)
    })
} 