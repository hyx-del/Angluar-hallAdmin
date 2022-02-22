export function date(format?: string, date?: any): string {
    format = format || 'Y-m-d H:i:s';

    date = date || (typeof date === 'number' ? new Date(date) : new Date());

    return format.replace(/[YmdHisu]/g, function (string) {
        switch (string) {
            case 'Y':
                return date.getFullYear().toString();
            case 'm':
                return (date.getMonth() + 1).toString().padStart(2, '0');
            case 'd':
                return date.getDate().toString().padStart(2, '0');
            case 'H':
                return date.getHours().toString().padStart(2, '0');
            case 'i':
                return date.getMinutes().toString().padStart(2, '0');
            case 's':
                return date.getSeconds().toString().padStart(2, '0');
            case 'u':
                return date.getMilliseconds().toString().padStart(3, '0');
            default:
                return string;
        }
    });
}

export function strtodate(date: string, format?: string): Date {
    format = format || 'Y-m-d H:i:s';

    let x = 0, z = 0, y = 0, m = 0, d = 0, h = 0, i = 0, s = 0, u = 0;

    format.replace(/[YmdHisu]/g, function (string, index) {
        index += x - z;
        switch (string) {
            case 'Y':
                y = parseInt(date.slice(index, index + 4));
                x += 4;
                z += 1;
                break;
            case 'm':
                m = Math.max(parseInt(date.slice(index, index + 2)) - 1, 0);
                x += 2;
                z += 1;
                break;
            case 'd':
                d = parseInt(date.slice(index, index + 2));
                x += 2;
                z += 1;
                break;
            case 'H':
                h = parseInt(date.slice(index, index + 2));
                x += 2;
                z += 1;
                break;
            case 'i':
                i = parseInt(date.slice(index, index + 2));
                x += 2;
                z += 1;
                break;
            case 's':
                s = parseInt(date.slice(index, index + 2));
                x += 2;
                z += 1;
                break;
            case 'u':
                u = parseInt(date.slice(index, index + 3));
                x += 3;
                z += 1;
                break;
            default:
                break;
        }
        return string;
    });

    return new Date(y, m, d, h, i, s, u);
}

export function number(_: any, format: string): string {
    _ = (typeof _ !== 'number' ? parseFloat(_) : _) || 0;

    let decimal = Number(format.match(/\d+$/g)[0]) || 0;

    return _.toFixed(decimal);
}

export function parseKey(key: PropertyKey | PropertyKey[]): PropertyKey[] {
    if (Array.isArray(key)) {
        return key;
    }
    if (typeof key === 'string') {
        return key.split('.')
    }
    return [key]
}

export function objectGet(target: any, key: string) {
    if (target === null) {
        return null;
    }
    if (key in target) {
        return target[key];
    }
    if (key.indexOf('.') < 0) {
        if (key === '*') {
            return Array.isArray(target) ? target : null;
        }
        return target[key] || null;
    }
    return key.split('.').reduce((target, key) => {
        target = objectGet(target, key);
        if (key === '*' && Array.isArray(target)) {
            return target.map((v) => objectGet(v, key));
        }
        return target;
    }, target);
}

export function objectMerge(target, object) {
    if (target === null || typeof target !== 'object') {
        return object;
    }
    for (let attr of object) {
        if (attr in target) {
            target[attr] = objectMerge(target[attr], object[attr]);
        } else {
            target[attr] = object[attr];
        }
    }
    return target;
}

export function objectSet(target: any, key: PropertyKey | PropertyKey[], value: any) {
    if (!target || typeof target !== 'object') {
        return;
    }
    let keys = parseKey(key);
    key = keys.pop();

    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        if (k === '*' && Array.isArray(target)) {
            keys = keys.slice(i + 1);
            keys.push(key);
            return target.forEach((item) => objectSet(item, keys, value));
        }
        if (!target[k]) {
            target[k] = /^\d+$/.test(<string>k) ? [] : {};
        }
        target = target[k];
    }

    target[key] = value;
}
