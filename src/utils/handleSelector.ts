// 读取元素的 selector
export const getElementSelector = (element: any): string => {

    let selectors = "";
    let currentElement = element;

    while(currentElement.localName !== "body") {

        const localName = currentElement.localName;
        const className = currentElement.className;
        
        selectors = ` > ${localName}${onSplicingClassNames(className)}${selectors}`;

        currentElement = currentElement.parentNode;
    }

    // 拼接 body
    selectors = `body${onSplicingClassNames(currentElement.className)}${selectors}`;

    return selectors;
}

// 拼接类名
const onSplicingClassNames = (className: string): string => {
    let result = "";

    if(className.length) {
        const classNames = className.split(" ");
        classNames.length && classNames.forEach((name: string) => result += `.${name}`);
    }

    return result;
}