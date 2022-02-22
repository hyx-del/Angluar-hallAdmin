import { Directive, Input, OnInit, OnDestroy, Optional, SkipSelf, HostBinding } from '@angular/core';
import { PacService, PacController, PacName } from './pac.service';
import { PacGroupDirective } from './pac.group.directive';

@Directive({
    selector: '[paci]',
})
export class PacInputDirective extends PacName implements OnInit, OnDestroy, PacController {

    @Input('paci') set name(name) {
        this.setName(name);
    };

    @Input('group') set group(name: string) {
        this.setGroup(name);
    }

    @HostBinding('disabled') private _hidden: boolean = true;

    public constructor(private pacService: PacService, @Optional() @SkipSelf() parent: PacGroupDirective) {
        super(parent);
    }

    public ngOnInit(): void {
        this.pacService.registerControl(this);
    }

    public ngOnDestroy(): void {
        this.pacService.destroyControl(this);
    }

    public hide() {
        this._hidden = true;
    }

    public show() {
        this._hidden = false;
    }
}
