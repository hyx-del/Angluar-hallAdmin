import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { NyModule } from '@yilu-tech/ny';

import { NcContentHeader } from './search/nc.content.header';
import { QuillEditorComponent } from './quill-editor/quill-editor';
import { PacModule } from '@/providers/permission/pac.module';
import { FormModel } from '@/providers/form/form.module';
import { UEditorComponent } from './ueditor/ueditor.component';
import { CropImageComponent } from './crop-image/crop-image';
import { PaymentDialogComponent } from '../payment/payment-dialog/payment-dialog';
import { PaymentUpdateLogComponent } from '../payment/payment-update-log/payment-update-log';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        NyModule,
        PacModule,
        FormModel
    ],
    declarations: [
        NcContentHeader,
        QuillEditorComponent,
        UEditorComponent,
        CropImageComponent,
        PaymentDialogComponent,
        PaymentUpdateLogComponent,
    ],
    exports: [
        NyModule,
        NcContentHeader,
        QuillEditorComponent,
        PacModule,
        FormModel,
        UEditorComponent,
        CropImageComponent,
        PaymentDialogComponent,
        PaymentUpdateLogComponent,
    ]
})
export class SharedModule {

}
