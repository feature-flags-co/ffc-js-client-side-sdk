import { eventHub } from "./events";

export class Queue<T> {
    private queue: T[];
    // flushLimit === 0 means no limit
    // and 
    constructor(private flushLimit: number = 0, private arriveflushLimitTopic: string = '') {
        this.queue = [];
    }

    add(element: T): void {
        this.queue.push(element);
        if (this.flushLimit > 0 && this.queue.length >= this.flushLimit) {
            eventHub.emit(this.arriveflushLimitTopic, {});
        }
    }

    flush(): T[] {
        const allElements = [...this.queue];
        this.queue = [];
        return allElements;
    }
}