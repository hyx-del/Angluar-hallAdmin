import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { classroomManageComponent } from './home/home.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';

import { SharedModule } from '../shared/shared.module';
import { HallInfoComponent } from './info/info.component';

import { CourseManageComponent } from './course/course-manage/course-manage';
import { CoursePlanComponent } from './course/course-plan/course-plan';
import { CourseCardComponent } from './course/course-card/course-card';
import { CourseCardDetailComponent } from './course/card-detail/card-detail';

import { CoachManageComponent } from './coach/coach-manage/coach-manage';
import { ShopDashboardComponent } from './dashboard/dashboard.component';
import { SignComponent } from './sign/sign.component';

import { SharedComponentModule, RoleManageComponent, StaffManageComponent } from '../shared-component'
import { Http } from '@yilu-tech/ny';
import { HallResolve, CoachService } from "@/providers/index";
import { HallBusunessStatisticsComponent } from './busuness-statistics/busuness-statistics';
import { PresellActivityComponent } from './presell/presell-activity/presell-activity';

import { HallBusinessAnalysisComponent } from './business-analysis/business-analysis';
import { SuggestComponent } from './suggest/suggest.component'
import { HallCourseCommentsComponent } from './course-comments/course-comments';

import { MemberManageComponent } from './member/member-manage/member-manage';
import { MemberDetailComponent } from './member/member-detail/member-detail';
import { MemberCourseCardDetailComponent } from './member/card-detail/card-detail';
import { MemberOpenCardOrderComponent } from './member/open-card-order/open-card-order';
import { MemberCourseCardComponent } from './member/course-card/course-card';

import { Routes } from '../../app.router.module';
import { PresellOrderComponent } from './presell/order/order.component';
import { FullCalendarModule } from '@fullcalendar/angular'; // for FullCalendar!
import { MemberConsumeStatisticsComponent } from './member/consume-statistics/consume-statistics';
import { SalesPerformanceStatisticsComponent } from './sales-performance-statistics/sales-performance-statistics';
import { ShopManageComponent } from './shop-manage/shop-manage';
import { ShopCommissionStatisticsComponent } from './shop-commission-statistice/shop-commission-statistice';
import { StaffFileComponent } from './staff-file/staff-file.component';
import { SalarySheetComponent } from './salary-sheet/salary-sheet.component';
import { QRCodeModule } from 'angularx-qrcode';
import { BusinessOrderComponent } from './business-order/business-order';
import { TurnCardComponent } from './member/turn-card/turn-card.component';
import { DataUploadComponent } from './data-upload/data-upload.component';

const routes: Routes = [
    { path: 'business-statistics', name: 'hall.business-statistical', component: HallBusunessStatisticsComponent },
    { path: 'business-analysis', name: 'hall.business-analysis', component: HallBusinessAnalysisComponent },
    { path: 'dashboard', name: 'course.workbench.course-plan', component: ShopDashboardComponent },
    { path: 'hall/classroom-home', name: 'hall.classroom.list', component: classroomManageComponent },
    { path: 'hall/info', name: 'hall.hall.detail', component: HallInfoComponent },
    { path: 'course/course-manage', name: 'course.course.list', component: CourseManageComponent },
    { path: 'course/course-plan', name: 'course.course-plan.list', component: CoursePlanComponent },
    { path: 'course/course-card', name: 'course.course-card.list', component: CourseCardComponent },
    { path: 'coach/coach-manage', name: 'course.coach.list', component: CoachManageComponent },
    { path: 'hall/role-manage', name: 'staff.manage.list', component: RoleManageComponent, data: { group: 'hall' } },
    { path: 'hall/staff-manage', name: 'staff.role.list', component: StaffManageComponent, data: { group: 'hall' } },
    // { path: 'member', loadChildren: './member/member.module#MemberModule' },
    { path: "suggest", name: 'hall.suggestion.suggestions', component: SuggestComponent },
    { path: "course-comments", name: 'hall.comment.comments', component: HallCourseCommentsComponent },

    // { path: "presell/project", name: 'presell.project.list', component: PresellProjectComponent },
    { path: "presell/activity", name: 'presell.activity.list', component: PresellActivityComponent },
    { path: "presell/order", name: 'presell.order.list', component: PresellOrderComponent },

    
    { path: 'member/member-manage', name: 'member.basic.list', component: MemberManageComponent },
    { path: 'member/course-card', name: 'member.member-course-card.list', component: MemberCourseCardComponent },
    { path: 'member/open-card-order', name: 'member.member-course-card-purchase.list', component: MemberOpenCardOrderComponent },
    { path: 'member/consume-statistics', component: MemberConsumeStatisticsComponent },
    { path: 'sales-performance-staistics', name: 'hall.sales-performance-statistics', component: SalesPerformanceStatisticsComponent },
    { path: 'hall-manage', name: 'staff.manage.getManagerList', component: ShopManageComponent },
    { path: 'hall-commission-statistics', name: 'hall.sales-performance-statistics.manager-statistics', component: ShopCommissionStatisticsComponent },

    { path: 'staff-file', name: '', component: StaffFileComponent},
    { path: 'salary-sheet', name: '', component: SalarySheetComponent},
    { path: 'business-order', name: 'hall.business-order', component: BusinessOrderComponent},
    { path: 'data-upload', name: 'hall.failed-push-list', component: DataUploadComponent},
    
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        SharedModule,
        RouterModule.forChild(routes),
        SharedComponentModule,
        FullCalendarModule,
        QRCodeModule,
    ],
    providers: [
        Http.middleware(HallResolve),
        CoachService
    ],
    declarations: [
        classroomManageComponent,
        HallInfoComponent,
        CourseManageComponent,
        CoachManageComponent,
        CoursePlanComponent,
        CourseCardComponent,
        CourseCardDetailComponent,
        ShopDashboardComponent,
        SignComponent,
        HallBusunessStatisticsComponent,
        PresellActivityComponent,
        HallBusinessAnalysisComponent,
        SuggestComponent,
        HallCourseCommentsComponent,

        MemberManageComponent,
        MemberCourseCardDetailComponent,
        MemberDetailComponent,
        MemberOpenCardOrderComponent,
        MemberCourseCardComponent,
        PresellOrderComponent,
        MemberConsumeStatisticsComponent,
        SalesPerformanceStatisticsComponent,
        ShopManageComponent,
        ShopCommissionStatisticsComponent,
        StaffFileComponent,
        SalarySheetComponent,
        BusinessOrderComponent,
        TurnCardComponent,
        DataUploadComponent,
    ],
    exports: [
        classroomManageComponent,
    ]
})
export class ShopModule {

}
