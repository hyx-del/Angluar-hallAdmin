import { FormContainer } from './form.container';
import { date, number } from './utils';

export class FormControl {

    public name: PropertyKey;

    public root: FormContainer;

    public disabled: boolean;

    public formatter: string | Function;

    public container: FormContainer;

    public set onChange(callback: Function) {
        this._changeEventListener.push(callback);
    }

    protected _value: any;

    protected _initialValue: any;

    protected _errorMessages: string[];

    protected _link: FormControl;

    protected _links: Array<FormControl> = [];

    protected _changed: boolean;

    protected _changeEventListener: Function[] = [];

    protected _viewComponent: any;

    public constructor(name: string, viewComponent?: any, container?: FormContainer) {
        this.name = name;
        this._viewComponent = viewComponent;

        this.container = container;
        if (container) {
            this.root = container.root;
        }
    }

    public path() {
        return this.container ? [...this.container.path(), this.name] : [];
    }

    public setView(viewComponent) {
        this._viewComponent = viewComponent;
        return this;
    }

    public set value(value) {
        if (this.disabled) {
            return;
        }
        if (this._value === value) {
            return;
        }
        let prevValue = this._value;

        this._value = value;
        this.container && this.container.bindValue(this);

        this.writeValue();

        this.emitChange(this.getSimpleChange(prevValue));
    }

    public get value() {
        if (this._link) {
            return this._link.value;
        }
        return this.format(this._value);
    }

    public getOriginal() {
        if (this._link) {
            return this._link.getOriginal;
        }
        return this._value;
    }

    public initValue(value: any) {
        this._value = this._initialValue = value;
        this._changed = false;
        return this;
    }

    public writeValue() {
        this._viewComponent && this._viewComponent.writeValue();
        this._links.forEach((control) => control.writeValue());
    }

    public hasChange() {
        return this._changed;
    }

    protected getSimpleChange(previousValue) {
        return {
            firstChange: !this._changed,
            previousValue,
            currentValue: this._value,
            initialValue: this._initialValue,
            path: this.path(),
            control: this
        };
    }

    protected emitChange(simpleChange) {
        if (!this._changed) {
            this._initialValue = simpleChange.previousValue;
            this._changed = true;
        }
        for (let callback of this._changeEventListener) {
            callback(simpleChange);
        }
        if (this.container) {
            this.container.emitChange(simpleChange)
        }
    }

    protected format(value ?: any) {
        if (!this.formatter) {
            return value;
        }
        if (typeof this.formatter === 'function') {
            return this.formatter(this);
        }
        if (/^n\d+$/.test(this.formatter) && value !== '' && value !== null) {
            return number(value, this.formatter);
        }
        if (value instanceof Date) {
            return date(this.formatter, value);
        }
        return value;
    }

    public getError() {
        return this._errorMessages;
    }

    public setError(messages: string[]) {
        if (this._viewComponent) {
            if (this._errorMessages) {
                this._viewComponent.removeErrorNotice();
            }
            if (messages) {
                this._viewComponent.addErrorNotice(messages);
            }
        }
        this._errorMessages = messages;
    }

    public isLink() {
        return !!this._link;
    }

    public getLink() {
        return this._link;
    }

    public link(name: string) {
        if (!this.container) {
            return false;
        }
        let control = null;
        if (name[0] === '&') {
            control = this.container.getControl(name.substring(1));
        } else {
            let path = this.path();
            control = this.root.getControl(name.split('.').map((k, i) => k === '*' ? path[i] : k));
        }
        if (!control) {
            return false;
        }
        this._link = control;
        this._link.addLink(this);
        return true;
    }

    public unLink() {
        if (this._link) {
            this._link.removeLink(this);
            this._link = null;
        }
        return this;
    }

    public addLink(control: FormControl) {
        if (this._links.indexOf(control) < 0) {
            this._links.push(control);
        }
        return this;
    }

    public removeLink(control: FormControl) {
        let index = this._links.indexOf(control);
        if (index >= 0) {
            this._links.splice(index, 1);
        }
        return this;
    }
}
