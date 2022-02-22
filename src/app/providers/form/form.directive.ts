import { Directive, Input, SimpleChanges, Output, EventEmitter, ViewContainerRef, OnChanges } from '@angular/core';
import { Form } from './form';

@Directive({
    selector: '[ndForm]'
})
export class FormDirective implements OnChanges {
    @Input('ndForm') name: string;
    @Output() onInit: EventEmitter<any> = new EventEmitter<any>();
    @Output() onChange: EventEmitter<any> = new EventEmitter<any>();
    // @Output() onError: EventEmitter<any> = new EventEmitter<any>();

    private _form: Form;
    private _viewComponent;

    constructor(private viewContainerRef: ViewContainerRef) {
        this._viewComponent = this.viewContainerRef['_view'].component;
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ('name' in changes && !this._form) {
            this._form = new Form(this._viewComponent[this.name]);
            this._form.onChange = (simpleChange) => {
                this.onChange.emit(simpleChange);
            };
            this._viewComponent[this.name] = this._form.value;
            this.onInit.emit(this._form);
        }
    }

    public getContainer() {
        return this._form;
    }
}
