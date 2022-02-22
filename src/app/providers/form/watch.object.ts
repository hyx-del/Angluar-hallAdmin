export class WatchObject {

}

export function isWatchObject(object): boolean {
    return typeof object === 'object' && object !== null && Object.getPrototypeOf(object) === WatchObject;
}

export function watchable(object): boolean {
    return typeof object === 'object' && object !== null && (Object.getPrototypeOf(object) === Object.prototype || Object.getPrototypeOf(object) === Array.prototype);
}

export function unwatch(target) {
    if (!isWatchObject(target)) {
        return target;
    }
    target = Object.getOwnPropertyDescriptor(target, '[[target]]').value;
    for (let propertyKey in target) {
        target[propertyKey] = unwatch(target[propertyKey]);
    }
    return target;
}

export const newWatchObject = (callback: (path: PropertyKey[], value: any, previousValue: any) => void, target = {}, depth: number = 512, path: PropertyKey[] = []) => {
    if (depth < 1 || !watchable(target)) {
        return target;
    }

    depth--;

    for (let propertyKey in target) {
        target[propertyKey] = newWatchObject(callback, target[propertyKey], depth, [...path, propertyKey]);
    }

    return new Proxy(target, new WatchProxyHandler(callback, depth, path));
};

export class WatchProxyHandler {

    public path: PropertyKey[];

    public depth: number;

    public callback: (path: PropertyKey[], value: any, previousValue: any) => void;

    constructor(callback, depth: number = 512, path: PropertyKey[] = []) {
        this.callback = callback;
        this.depth = depth;
        this.path = path;
    }

    getPrototypeOf(target: Object): object | null {
        return WatchObject;
    }

    get(target: Object, propertyKey: PropertyKey, receiver: any): any {
        return Reflect.get(target, propertyKey, receiver);
    }

    set(target: Object, propertyKey: PropertyKey, value: any, receiver: any): boolean {
        let old = this.get(target, propertyKey, value);

        if (isWatchObject(value)) {
            const descriptor = Object.getOwnPropertyDescriptor(value, '[[handler]]');
            descriptor.value.propertyKeys.pop();
            descriptor.value.propertyKeys.push(propertyKey);
        } else if (watchable(value) && this.depth > 0) {
            value = newWatchObject(this.callback, value, this.depth - 1, [...this.path, propertyKey]);
        }

        Reflect.set(target, propertyKey, value, receiver);

        if (this.callback && old !== value) {
            this.callback([...this.path, propertyKey], value, old);
        }
        return true;
    }

    getOwnPropertyDescriptor(target: Object, propertyKey: PropertyKey,) {
        if (propertyKey === '[[handler]]') {
            return { configurable: true, enumerable: false, value: this };
        }
        if (propertyKey === '[[target]]') {
            return { configurable: true, enumerable: false, value: target };
        }
        return Reflect.getOwnPropertyDescriptor(target, propertyKey);
    }
}
