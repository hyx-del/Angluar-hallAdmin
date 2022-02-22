import { Directive, Input, Optional, SkipSelf } from '@angular/core';
import { PacName } from './pac.service'

@Directive({
    selector: '[pacp]',
})
export class PacGroupDirective extends PacName {

    @Input('pacp') set name(name: string) {
        this.setName(name);
    }

    @Input('group') set group(name: string) {
        this.setGroup(name);
    }

    public constructor(@Optional() @SkipSelf() parent: PacGroupDirective) {
        super(parent);
    }
}
