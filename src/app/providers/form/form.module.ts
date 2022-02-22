import { NgModule } from '@angular/core';
import { FormDirective, FormGroupDirective, FormControlDirective, FormDeepControlDirective, DefaultValueAccessor } from './public_api';

@NgModule({
    declarations: [FormDirective, FormGroupDirective, FormControlDirective, FormDeepControlDirective, DefaultValueAccessor],
    exports: [FormDirective, FormGroupDirective, FormControlDirective, FormDeepControlDirective, DefaultValueAccessor]
})
export class FormModel {
}
