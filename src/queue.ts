import { eventHub } from "./events";

export class Queue<T> {
    private queue: T[];
    constructor(private flushLimit: number, private arriveflushLimitTopic: string) {
        this.queue = [];
    }

    add(element: T): void {
        this.queue.push(element);
        if (this.queue.length >= this.flushLimit) {
            eventHub.emit(this.arriveflushLimitTopic, {});
        }
    }

    removeAll(): T[] {
        const allElements = [...this.queue];
        this.queue = [];
        return allElements;
    }
}