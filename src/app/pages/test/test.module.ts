import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { NyModule } from '@yilu-tech/ny';

import { TestNySearchInputComponent } from './test-ny-search-input/test-ny-search-input.component';

export const TestModuleRoutes: Routes = [
    { path: 'ny-search-input', component: TestNySearchInputComponent }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        NyModule,
        SharedModule,
        RouterModule.forChild(TestModuleRoutes)
    ],
    declarations: [
        TestNySearchInputComponent,
    ]
})
export class TestModule { }
