/*
 * @Author: jiu yin
 * @Date: 2021-09-15 22:13:47
 * @LastEditTime: 2021-12-01 14:06:59
 * @LastEditors: jiu yin zhen jing
 * @Description: 666
 * @FilePath: \admin\src\app\pages\member\member.module.ts
 * jiu
 */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { SharedModule } from '../shared/shared.module';

import { MemberManageComponent } from './member-manage/member-manage';
import { MemberDetailComponent } from './member-detail/member-detail';
import { MemberSourceComponent } from './member-source/member-source';
import { MemberCourseCardComponent } from './course-card/course-card';
import { MemberRechargeSpecsComponent } from './recharge-specs/recharge-specs';
import { MemberCourseCardDetailComponent } from './course-card/card-detail/card-detail';
import { MemberCouponComponent } from './coupon/coupon.component';
import { MemberCouponComponentList } from './member-coupon/member-coupon';
import { AllMemberManageComponent } from './all-member/all-member.component';
import { Routes } from "../../app.router.module";
import { PriceAdjustComponent } from './price-adjust/price-adjust.component';
import { DianPingComponent } from './dian-ping/dian-ping';
import { HeadquartersServiceComponent } from './headquarters-service/headquarters-service';
import { ShortMessageLogComponent } from './short-message-log/short-message-log';
import { MemberPromotionComponent } from './member-promotion/member-promotion';

const routes: Routes = [
    { path: 'member-manage', name: 'member.basic.list', component: MemberManageComponent },
    { path: 'member-source', name: 'member.source.list', component: MemberSourceComponent },
    { path: 'course-card', name: 'member.member-course-card.list', component: MemberCourseCardComponent },
    { path: 'recharge-specs', name: 'hall.charge-spec.list', component: MemberRechargeSpecsComponent },
    { path: 'coupon', name: 'coupon.coupon.list', component: MemberCouponComponent },
    { path: 'member-coupon', name: 'coupon.member-coupon.list', component: MemberCouponComponentList },
    { path: 'all-member-manage', name: 'member.member.list', component: AllMemberManageComponent },
    // { path: 'member-promotion', name: 'member.promotion.list', component: MemberPromotionComponent },
    { path: 'price-adjust', name: 'member.member-course-card.unit-price-change.list', component: PriceAdjustComponent},
    { path: 'dianPing', name: 'member.query-source.DP-list', component: DianPingComponent },
    { path: 'headquarters-service', name: 'member.query-source.HQDP-list', component: HeadquartersServiceComponent },
    { path: 'short-message-log', name: 'member.sms.send-detail', component: ShortMessageLogComponent}
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgZorroAntdModule,
        SharedModule,
        RouterModule.forChild(routes)
    ],
    providers: [],
    declarations: [
        MemberManageComponent,
        MemberDetailComponent,
        MemberSourceComponent,
        MemberCourseCardComponent,
        MemberRechargeSpecsComponent,
        MemberCourseCardDetailComponent,
        MemberCouponComponent,
        MemberCouponComponentList,
        AllMemberManageComponent,
        PriceAdjustComponent,
        DianPingComponent,
        HeadquartersServiceComponent,
        ShortMessageLogComponent,
        MemberPromotionComponent,
    ],
    exports: []
})
export class MemberModule {

}
