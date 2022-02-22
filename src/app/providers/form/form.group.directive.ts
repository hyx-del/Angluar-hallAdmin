import { Directive, Input, OnChanges, OnDestroy, Optional, SimpleChanges, SkipSelf, EventEmitter, Output } from '@angular/core';
import { FormDirective } from './form.directive';
import { FormContainer } from './form.container';

@Directive({
    selector: '[ndGroup]',
})
export class FormGroupDirective implements OnChanges, OnDestroy {
    @Input('ndGroup') name: string | number;
    @Input() action: string;
    @Input() method: string = 'post';

    @Output() onChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() onError: EventEmitter<any> = new EventEmitter<any>();

    private _formContainer: FormContainer;
    private _containerComponent: FormGroupDirective | FormDirective;

    constructor(@Optional() @SkipSelf() public group: FormGroupDirective,
                @Optional() @SkipSelf() public form: FormDirective) {
        this._containerComponent = group || form;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ('name' in changes && this._containerComponent) {
            this._registerControl();
        }
    }

    ngOnDestroy(): void {
        this._formContainer && this._formContainer.container.remove(this._formContainer);
    }

    public getContainer() {
        return this._formContainer;
    }

    private _registerControl() {
        let container = this._containerComponent.getContainer();
        if (typeof this.name !== 'string') {
            this._formContainer = new FormContainer(<any>this.name, null, container);
        } else {
            this._formContainer = this.name.split('.').reduce((container, name) => {
                return <FormContainer>container.append(new FormContainer(name, null, container))
            }, container);
        }
        this._formContainer.setView(this);
        this._formContainer.onChange = (simpleChange) => this.onChange.emit(simpleChange);
    }
}
