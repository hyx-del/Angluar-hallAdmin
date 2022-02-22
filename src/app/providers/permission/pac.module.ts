import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgZorroAntdModule } from 'ng-zorro-antd';

import { PacInputDirective } from './pac.input.directive';
import { PacGroupDirective } from './pac.group.directive';
import { PacTemplateDirective } from './pac.template.directive';


@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        NgZorroAntdModule
    ],
    declarations: [
        PacInputDirective,
        PacGroupDirective,
        PacTemplateDirective,
    ],
    providers: [
    ],
    exports: [
        PacInputDirective,
        PacGroupDirective,
        PacTemplateDirective,
    ]
})
export class PacModule {

}
