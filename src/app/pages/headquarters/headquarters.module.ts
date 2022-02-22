import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WorkersHomeComponent } from './home/home.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { SharedModule } from '../shared/shared.module';

import { CourseManageComponent } from './course/manage/course-manage';
import { CourseCardComponent } from './course/card/course-card';
import { CoursePayRulesComponent } from './course/pay-rules/pay-rules';
import { ScheduleComponent } from './course/schedule/schedule.component';

import { CoachGroupComponent } from './auxiliary/coach-group/coach-group';
import { BodyIndicatorComponent } from './auxiliary/body/body.component';
import { CourseCardDetailComponent } from './course/card-detail/card-detail';
import { PaymentModeComponent } from './auxiliary/payment-mode/payment-mode';
import { BusunessStatisticsComponent } from './busuness-statistics/busuness-statistics';
import { CourseTagsComponent } from './course/tags/tags.component';
import { BusinessAnalysisComponent } from './business-analysis/business-analysis';
import { CommentTagsComponent } from './auxiliary/comment-tags/comment-tags.component';
import { CoachManageComponent } from './coach/coach-manage/coach-manage';
import { Routes } from "../../app.router.module";
import { CourseCardSpecsCategory } from './auxiliary/specs-category/specs-category';
import { CoachLimitComponent } from './coach/coach-limit/coach-limit';
import { BusinessOrderComponent } from './business-order/business-order';

const routes: Routes = [
    { path: 'business-statistics', name: 'hall.business-statistical', component: BusunessStatisticsComponent },
    { path: 'business-analysis', name: 'hall.business-analysis', component: BusinessAnalysisComponent },
    { path: 'venue-home', name: 'hall.hall.list', component: WorkersHomeComponent },

    { path: 'course/course-manage', name: 'course.course.list', component: CourseManageComponent },
    { path: 'course/course-card', name: 'course.course-card.list', component: CourseCardComponent },
    // { path: 'course/pay-rules', component: CoursePayRulesComponent },
    { path: 'course/schedule', name: 'course.course-plan.list', component: ScheduleComponent },
    { path: 'course/tags', name: 'course.label.list', component: CourseTagsComponent },

    { path: 'coach/coach-manage', name: 'course.coach.list', component: CoachManageComponent },
    { path: 'coach/coach-limit', name: 'course.coach.set-class-time-limit', component: CoachLimitComponent },

    { path: 'auxiliary/coach-group', name: 'course.groups.list', component: CoachGroupComponent },
    { path: 'auxiliary/body', name: 'member.body-indicator-template.list', component: BodyIndicatorComponent },
    { path: 'auxiliary/payment-mode', name: 'hall.payment-mode.list', component: PaymentModeComponent },
    { path: 'auxiliary/comment-tags', name: 'hall.comment-tag.list', component: CommentTagsComponent },
    { path: 'auxiliary/specs-category', name: 'course.course-card.spec-category.list', component: CourseCardSpecsCategory },
    { path: 'business-order', name: 'hall.business-order', component: BusinessOrderComponent },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgZorroAntdModule,
        SharedModule,
        RouterModule.forChild(routes)
    ],
    providers: [],
    declarations: [
        WorkersHomeComponent,
        CourseManageComponent,
        CourseCardComponent,
        CoursePayRulesComponent,
        CourseCardDetailComponent,

        CoachManageComponent,

        ScheduleComponent,

        CoachGroupComponent,

        BodyIndicatorComponent,
        PaymentModeComponent,
        BusunessStatisticsComponent,
        CourseTagsComponent,
        BusinessAnalysisComponent,
        CommentTagsComponent,
        CourseCardSpecsCategory,
        CoachLimitComponent,
        BusinessOrderComponent,
    ],
    exports: [
        WorkersHomeComponent,
    ]
})
export class HeadquartersModule {

}
