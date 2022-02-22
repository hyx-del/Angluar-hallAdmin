import {
    Directive,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    OnDestroy,
    Optional,
    Host,
    Self,
    Inject,
    SimpleChanges,
    Renderer2,
    ElementRef,
    SkipSelf,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DefaultValueAccessor, selectValueAccessor } from './default_value_accessor';
import { FormDirective } from './form.directive';
import { FormControl } from './form.control';
import { FormGroupDirective } from './form.group.directive';
import { FormContainer } from './form.container';

const resolvePromise = Promise.resolve(null);

@Directive({
    selector: '[ndName]',
})
export class FormControlDirective implements OnChanges, OnDestroy {
    @Input('ndName') public name: string | number;
    @Input() public format: string;
    @Input() public replace: string | Function;
    @Input() public disabled: boolean;
    @Input() public errorStyle: string;
    @Input() public autoDestroy: boolean = true;
    @Output() public onError: EventEmitter<any> = new EventEmitter<any>();
    @Output() public onChange: EventEmitter<any> = new EventEmitter<any>();

    public set value(data) {
        this._value = data;
        if (this._formControl) {
            this._formControl.value = data;
        }
    }

    public get value() {
        return this._formControl ? this._formControl.value : this._value;
    };

    private _registered: boolean;
    private _inputting: boolean;

    private _value: any;
    private _errorEl: any;

    private _formControl: FormControl;
    private _containerComponent: FormGroupDirective | FormDirective;
    private _valueAccessor: ControlValueAccessor;

    constructor(@Optional() @Host() form: FormDirective,
                @Optional() @Host() group: FormGroupDirective,
                @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[],
                public _el: ElementRef, public _renderer: Renderer2) {

        this._valueAccessor = selectValueAccessor(valueAccessors);
        this._containerComponent = group || form;
    }

    public ngOnChanges(changes: SimpleChanges) {
        if (!this._registered) {
            this._setUpControl();
        }

        let writeable = false;

        if ('name' in changes) {
            this._registerControl();
            writeable = true;
        }

        if ('format' in changes) {
            if (this._formControl) {
                this._formControl.formatter = this.format;
            }
            writeable = true;
        }

        if ('disabled' in changes) {
            this._setDisabled(changes.disabled.currentValue);
        }

        if ('replace' in changes) {
            if (this._formControl) {
                this._formControl.unLink();
                if (typeof this.replace === 'string' && this.replace[0] === '$') {
                    let name = this.replace.substring(1);
                    resolvePromise.then(() => this._formControl.link(name));
                }
            }
            writeable = true;
        }
        writeable && this.writeValue();
    }

    public ngOnDestroy() {
        this._formControl && this._formControl.container.remove(this._formControl);
    }

    public writeValue() {
        if (this._inputting || !this._valueAccessor) {
            return;
        }
        resolvePromise.then(() => {
            let value = this.value;
            if (this.replace) {
                if (typeof this.replace === 'function') {
                    value = this.replace(this._formControl || value);
                } else if (this._formControl && this._formControl.isLink()) {
                    value = this._formControl.value;
                } else {
                    value = this.replace;
                }
            }
            this._valueAccessor.writeValue(value);
        });
    }

    private _registerControl() {
        if (!this._containerComponent) {
            return;
        }
        if (typeof this.name !== 'string') {
            this._formControl = new FormControl(<any>this.name, this);
        } else {
            let path = this.name.split('.');
            this._formControl = new FormControl(path.pop(), this);
            path.reduce((container, name) => {
                return <FormContainer>container.append(new FormContainer(name, null, container))
            }, this._containerComponent.getContainer()).append(this._formControl);
        }
        this._formControl.onChange = (simpleChange) => this.onChange.emit(simpleChange);
    }

    private _setUpControl(): void {
        if (!this._valueAccessor) {
            throw new Error('No value accessor for form control with');
        }

        let onChange = this._valueAccessor['_onChange'] || this._valueAccessor['onChange'];
        this._valueAccessor.registerOnChange((value) => {
            this._inputting = true;
            if (onChange) {
                onChange(value);
            }

            this.value = value;

            if (!(this._valueAccessor instanceof DefaultValueAccessor)) {
                this._inputting = false;
                this.writeValue();
            }
        });

        let onTouched = this._valueAccessor['_onTouched'] || this._valueAccessor['onTouched'];
        this._valueAccessor.registerOnTouched(() => {
            this._inputting = false;
            if (onTouched) {
                onTouched();
            }
            this.writeValue();
        });
        this._registered = true;
    }

    private _setDisabled(isDisabled: boolean) {
        this._valueAccessor && this._valueAccessor.setDisabledState(isDisabled);
        this._formControl && (this._formControl.disabled = isDisabled);
    }

    public addErrorNotice(messages: string[]) {
        this.onError.emit(messages);
        let parentNode = this._el.nativeElement.parentNode;
        if (!this._errorEl) {
            this._renderer.addClass(parentNode, 'has-error');
            this._errorEl = document.createElement('div');
            this._renderer.addClass(this._errorEl, 'error-message');

            const next = this._el.nativeElement.nextSibling;
            if (next) {
                parentNode.insertBefore(this._errorEl, next);
            } else {
                parentNode.appendChild(this._errorEl);
            }
            if (this.errorStyle === 'float') {
                this._addFloatStyle(this._errorEl);
            }
        }
        this._errorEl.innerHTML = messages.map((msg) => '<span style="display: block">' + msg + '</span>').join('');
    }

    public removeErrorNotice() {
        if (!this._errorEl) {
            return;
        }
        let parentElement = this._el.nativeElement.parentElement;
        this._renderer.removeClass(parentElement, 'has-error');
        this._renderer.removeChild(parentElement, this._errorEl);
        if (this.errorStyle === 'float') {
            parentElement.onmouseover = parentElement.onmouseout = null;
        }
        this._errorEl = null;
    }

    private _addFloatStyle(errorEl: HTMLElement) {
        this._renderer.setStyle(errorEl, 'display', 'none');
        this._renderer.setStyle(errorEl, 'position', 'fixed');
        this._renderer.setStyle(errorEl, 'z-index', '2048');
        errorEl.parentElement.onmouseover = () => {
            const rect = this._el.nativeElement.getBoundingClientRect();
            this._renderer.setStyle(errorEl, 'left', rect.left + 'px');
            this._renderer.setStyle(errorEl, 'top', rect.top + rect.height + 'px');
            this._renderer.setStyle(errorEl, 'display', 'block');
        };
        errorEl.parentElement.onmouseout = () => {
            this._renderer.setStyle(errorEl, 'display', 'none');
        };
    }
}

@Directive({
    selector: '[ndDeepName]'
})
export class FormDeepControlDirective extends FormControlDirective {
    @Input('ndDeepName') public name;

    constructor(@Optional() @SkipSelf() form: FormDirective,
                @Optional() @SkipSelf() group: FormGroupDirective,
                @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[],
                public _el: ElementRef, public _renderer: Renderer2) {
        super(form, group, valueAccessors, _el, _renderer);
    }
}
