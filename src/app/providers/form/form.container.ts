import { FormControl } from './form.control';
import { WatchObject, isWatchObject, newWatchObject, unwatch, watchable } from "./watch.object";

export class FormContainer extends FormControl {

    public type: 'object' | 'array' = 'object';

    protected _value: Object;

    protected _proxyValue: WatchObject;

    protected readonly _mapping: Map<PropertyKey, FormContainer | FormControl> = new Map();

    public constructor(name?: string, viewComponent?: any, container?: FormContainer) {
        super(name, viewComponent, container);
    }

    public getControl(path: PropertyKey | Array<PropertyKey>, exists: boolean = false): FormContainer | FormControl {
        if (typeof path === 'string') {
            path = path.split('.');
        } else if (!Array.isArray(path)) {
            return this._mapping.get(path) || (exists && this);
        }
        let container: any = this;
        for (let part of path) {
            if (container instanceof FormContainer === false) {
                return null;
            }
            let control = container._mapping.get(part);
            if (!control && exists) {
                return container;
            }
            container = control;
        }
        return container;
    }

    public hasControl(name: PropertyKey) {
        return this._mapping.has(name);
    }

    public append(control: FormControl | FormContainer) {
        if (this.hasControl(control.name)) {
            return this._mapping.get(control.name);
        }
        this._mapping.set(control.name, control);
        control.root = this.root || this;
        control.container = this;
        if (typeof control.name === 'number' || /^\d+$/.test(<string>control.name)) {
            this.type = 'array';
        }
        return control;
    }

    public remove(control: FormControl | FormContainer) {
        this._mapping.delete(control.name);
        if (this._mapping.size === 0) {
            this.container && this.container.remove(this);
        }
    }

    public each(callback: (control: FormControl | FormContainer, key: string) => void) {
        this._mapping.forEach(callback);
    }

    public writeValue() {
        this._mapping.forEach((control, key) => {
            control.value = this._value[key];
            control.writeValue();
        })
    }

    public toObject(filter?: Function) {
        let object = this.type === 'object' ? {} : [];
        this._mapping.forEach((control, name) => {
            if (!filter || filter(control)) {
                object[name] = control instanceof FormContainer ? control.toObject(filter) : control.value;
            }
        });
        return object;
    }

    public getValue(path?: PropertyKey | PropertyKey[]) {
        if (!path) {
            return this.value;
        }
        let control = this.getControl(path);
        return control ? control.value : null;
    }

    public getDirty() {
        if (!this.hasChange()) {
            return null;
        }
        let object = this.type === 'object' ? {} : [];
        this._mapping.forEach((control, name) => {
            if (control.hasChange()) {
                object[name] = control instanceof FormContainer ? control.getDirty() : control.value;
            }
        });
        return object;
    }

    public getDefaultValue() {
        return this.type === 'object' ? {} : [];
    }

    public set value(value) {
        value = this.format(value);
        if (this._value === value) {
            return;
        }
        this._value = value;

        this._proxyValue = newWatchObject((path, value) => this.setValue(path, value), value, 1);

        if (this.container) {
            this.container.bindValue(this)
        }
        this.writeValue();
    }

    public get value() {
        return this._proxyValue;
    }

    public bindValue(control: FormControl | FormContainer) {
        if (!this._value) {
            this.value = this.getDefaultValue();
        }
        this._value[control.name] = control.value;
        return this;
    }

    public setValue(path: any, value?: any) {
        if (value === undefined) {
            this.value = path;
        } else {
            let control = this.getControl(path);
            if (control) {
                control.value = value;
            }
        }
    }

    protected format(value) {
        if (isWatchObject(value)) {
            return unwatch(value)
        } else if (!watchable(value)) {
            return this.getDefaultValue();
        }
        return value;
    }
}
