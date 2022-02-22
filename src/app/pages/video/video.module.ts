import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { NyModule } from '@yilu-tech/ny';

import { VideoManageComponent } from './manage/video.component';
import { VideoCategoryComponent } from './category/category.component';
import { VideoSchoolComponent } from './school/school.component';
import { VideoPositionComponent } from './position/position.component';
import { VideoRechargeSpecsComponent } from './recharge-specs/recharge-specs';
import { VideoShowSettingComponent } from './settings/show/show.component';
import { VideoCommentComponent } from './comment/comment.component';
import { VideoCoachComponent } from './coach/coach.component';
import { VideoMemberComponent } from './member/member.component';
import { VideoOrderComponent } from './order/order.component';
import { Routes } from "../../app.router.module";
import { VideoLibraryComponent } from './library/library.component';
import { VideoBusunessStatisticsComponent } from './busuness-statistics/busuness-statistics';
import { VideoConsumptionLogComponent } from './consumption/consumption.component';
import { AdjustLogComponent } from './adjust-log/adjust-log.component';
import { AudioCategoryComponent, AudioManageComponent, AudioLibraryComponent } from './audio/index';

export const routes: Routes = [
    { path: 'video-manage', name: 'video.video.list', component: VideoManageComponent },
    { path: 'category', name: 'video.category.list', component: VideoCategoryComponent },
    { path: 'school', name: 'video.genre.list', component: VideoSchoolComponent },
    { path: 'position', name: 'video.position.list', component: VideoPositionComponent },
    { path: 'recharge-specs', name: 'video.recharge-specs.list', component: VideoRechargeSpecsComponent },
    { path: 'show-setting', name: 'video.about.article.list', component: VideoShowSettingComponent },
    { path: 'comment', name: 'video.comment.list', component: VideoCommentComponent },
    { path: 'coach-manage', name: 'video.coach.list', component: VideoCoachComponent },
    { path: 'member', name: 'video.member.list', component: VideoMemberComponent },
    { path: 'order', name: 'video.member.recharge.orders', component: VideoOrderComponent },
    { path: 'library', name: 'video.data.list', component: VideoLibraryComponent },
    { path: 'business-statistics', name: 'video.member.business-statistical', component: VideoBusunessStatisticsComponent },
    { path: 'consumption', name: 'video.member.expenses-record', component: VideoConsumptionLogComponent },
    { path: 'adjust-log',name:'video.member.adjust-log',component: AdjustLogComponent},

    { path: 'audio-manage', component: AudioManageComponent },
    { path: 'audio-category', component: AudioCategoryComponent },
    { path: 'audio-library', component: AudioLibraryComponent },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        NyModule,
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        VideoManageComponent,
        VideoCategoryComponent,
        VideoSchoolComponent,
        VideoPositionComponent,
        VideoRechargeSpecsComponent,
        VideoShowSettingComponent,
        VideoCommentComponent,
        VideoCoachComponent,
        VideoMemberComponent,
        VideoOrderComponent,
        VideoLibraryComponent,
        VideoBusunessStatisticsComponent,
        VideoConsumptionLogComponent,
        AdjustLogComponent,

        AudioManageComponent,
        AudioCategoryComponent,
        AudioLibraryComponent,
    ]
})
export class VideoModule {
}
