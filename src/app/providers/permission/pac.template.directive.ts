import {
    Directive,
    Input,
    OnInit,
    OnDestroy,
    TemplateRef,
    ViewContainerRef,
    Optional,
    SkipSelf
} from '@angular/core';
import { PacService, PacController, PacName } from './pac.service';
import { PacGroupDirective } from './pac.group.directive';

export class PacTplContext {
    public $implicit: any = null;
}

@Directive({
    selector: '[pact]',
})
export class PacTemplateDirective extends PacName implements OnInit, OnDestroy, PacController {

    @Input('pact') set name(name: string) {
        this.setName(name);
    };

    @Input('group') set group(name: string) {
        this.setGroup(name);
    }

    private readonly context: PacTplContext;

    private _hidden: boolean = true;

    public constructor(@Optional() @SkipSelf() parent: PacGroupDirective,
                       private pacService: PacService,
                       private templateRef: TemplateRef<PacTplContext>,
                       private viewContainer: ViewContainerRef) {
        super(parent);

        this.context = new PacTplContext();
        this.context.$implicit = this;
    }

    public ngOnInit(): void {
        this.pacService.registerControl(this);
    }

    public ngOnDestroy(): void {
        this.pacService.destroyControl(this);
    }

    public hide() {
        if (!this._hidden) {
            this._hidden = false;
            this.viewContainer.clear();
        }
    }

    public show() {
        if (this._hidden) {
            this._hidden = false;
            this.viewContainer.createEmbeddedView(this.templateRef, this.context);
        }
    }
}
