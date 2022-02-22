import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';

import { SharedModule } from '../shared/shared.module'

import { RoleManageComponent } from "./role-manage/role.manage";
import { StaffManageComponent } from "./staff-manage/staff-manage";
import { RoleSelectionComponent } from "./role-selection/role.selection";

import { RoleService } from './role.service'

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        SharedModule,
    ],
    declarations: [
        RoleManageComponent,
        StaffManageComponent,
        RoleSelectionComponent
    ],
    providers: [
        RoleService,
    ],
    exports: [
        RoleManageComponent,
        StaffManageComponent,
    ]
})
export class SharedComponentModule {

}
