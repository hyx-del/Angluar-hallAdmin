import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { SharedModule } from '../shared/shared.module';

import { SharedComponentModule, RoleManageComponent, StaffManageComponent } from '../shared-component'
import { Routes } from "../../app.router.module";

const routes: Routes = [
    { path: 'staff-manage', name: 'staff.manage.list', group: '', component: StaffManageComponent },
    { path: 'role-manage', name: 'staff.role.list', group: '', component: RoleManageComponent },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        SharedModule,
        RouterModule.forChild(routes),
        SharedComponentModule
    ],
    providers: [],
    declarations: [],
    exports: []
})
export class WorkersModule {

}
