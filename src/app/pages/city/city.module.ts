import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { SharedModule } from '../shared/shared.module';
import { SharedComponentModule, RoleManageComponent, StaffManageComponent } from '../shared-component';
import { ScheduleComponent } from './schedule/schedule.component';
import { CityCoachGroupComponent } from './coach/coach-group/coach-group';
import { CityCoachManageComponent } from './coach/coach-manage/coach-manage';
import { SettlementSettingComponent } from './settlement-setting/settlement-setting';
import { TransformApplyComponent } from './transform-apply/transform-apply';
import { Http } from '@yilu-tech/ny';
import { CityResolve } from "@/providers/resolve/city.resolve";
import { CourseFeeStatisticsComponent } from './course-fee/course-fee.component';
import { CityBusunessStatisticsComponent } from './busuness-statistics/busuness-statistics';
import { CityBusinessAnalysisComponent } from './business-analysis/business-analysis';
import { CourseCardApplyOrderComponent } from './apply-order/apply-order';

import { Routes } from '../../app.router.module';
import { CourseCommentsComponent } from './course-comments/course-comments';
import { ScoreStatisticeComponent } from './score-statistice/score-statistice.component';
import { SalesCommissionRuleComponent } from './sales-commission-rule/sales-commission-rule';
import { SalesShopCommissionComponent } from './shop-commission/shop-commission';
import { CaochPayrollComponent } from './caoch-payroll/caoch-payroll';
import { RecedeApplyComponent } from './recede-apply/recede-apply.component'
import { StaffFileComponent } from './staff-file/staff-file.component';
import { SalarySheetComponent } from './salary-sheet/salary-sheet.component';
import { SurplusValueApplyComponent } from './surplus-value-apply/surplus-value-apply.component';


const routes: Routes = [
    { path: 'schedule', name: 'course.course-plan.list', component: ScheduleComponent },
    { path: 'business-statistics', name: 'hall.business-statistical', component: CityBusunessStatisticsComponent },
    { path: 'business-analysis', name: 'hall.business-analysis', component: CityBusinessAnalysisComponent },

    { path: 'coach/coach-manage', name: 'course.coach.list', component: CityCoachManageComponent, },
    { path: "settlement-setting", name: 'course.coach.group-list', component: SettlementSettingComponent },
    // { path: 'coach/group', name: 'course.coach.group-list', component: CityCoachGroupComponent },
    { path: 'transform-apply', name: 'member.member-course-card-transform-apply.list', component: TransformApplyComponent },
    { path: 'course-feee-statistics', name: 'course.course-fee-statistics', component: CourseFeeStatisticsComponent },
    { path: 'hall/role-manage', name: 'staff.manage.list', component: RoleManageComponent, data: { group: 'city' } },
    { path: 'hall/staff-manage', name: 'staff.role.list', component: StaffManageComponent, data: { group: 'city' } },

    { path: 'apply-order', name: 'member.member-course-card-purchase.list', component: CourseCardApplyOrderComponent },
    { path: 'course-comments', name: 'hall.comment.reply', component: CourseCommentsComponent },
    { path: 'score-statistice', name: 'hall.coach.score-statistics', component: ScoreStatisticeComponent },
    { path: 'sales-commission-rule', name: 'hall.coach.score-statistics', component: SalesCommissionRuleComponent },
    { path: 'shop-commission', name: 'hall.sales-commission-rule.detail', component: SalesShopCommissionComponent },
    { path: 'coach-payroll', name: 'course.coach-salary.statistics', component: CaochPayrollComponent },
    { path: 'recede-apply', name: 'member.member-course-card.refund.order-list', component: RecedeApplyComponent },
    { path: 'surplus-value-apply', name: 'member.member-course-card.surplus-value-adjust.apply-list', component: SurplusValueApplyComponent },
    

    { path: 'staff-file', name: 'salary.staff-profile.list', component: StaffFileComponent , data: { group: 'city' }},
    { path: 'salary-sheet', name: 'salary.staff-payroll.list', component: SalarySheetComponent, data: { group: 'city' }},
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
    providers: [
        Http.middleware(CityResolve)
    ],
    declarations: [
        ScheduleComponent,
        CityCoachGroupComponent,
        CityCoachManageComponent,
        SettlementSettingComponent,
        TransformApplyComponent,
        CourseFeeStatisticsComponent,
        CityBusunessStatisticsComponent,
        CityBusinessAnalysisComponent,
        CourseCardApplyOrderComponent,
        CourseCommentsComponent,
        ScoreStatisticeComponent,
        SalesCommissionRuleComponent,
        SalesShopCommissionComponent,
        CaochPayrollComponent,
        RecedeApplyComponent,
        StaffFileComponent,
        SalarySheetComponent,
        SurplusValueApplyComponent,
    ],
    exports: []
})
export class CityModule {

}
