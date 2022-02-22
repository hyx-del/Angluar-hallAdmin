import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/index';

import * as dayjs from 'dayjs';

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
    isVisible: boolean = false;
    form: nyForm;
    params: any = {};
    classroomList: any[] = [];
    courseList: any[] = [];
    coachList: any[] = [];

    collection: any = {};
    buttons: any[] = [
        // { name: 'checkbox' },
        { label: '批量审核', display: true, click: () => this.multipleCheck() },
    ]

    constructor(
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private http: Http,
        private hallService: HallService,
    ) {

    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.showCheckbox = true;
        this.collection.onInit = () => {
            let start_date = dayjs().startOf("month").format("YYYY-MM-DD");
            let end_date = dayjs().endOf("month").format("YYYY-MM-DD");
            this.collection.addWhere('start_at', [start_date, end_date], '=');
        }
    }

    check(item: any) {
        let ids = [item.id];
        this.modalService.confirm({
            nzTitle: "确定通过审核？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-city/course-plan/check", { id: ids }).then(() => {
                    this.notification.success("提示信息", "审核成功");
                    this.collection.load();
                })
            }
        })
    }

    multipleCheck() {
        if (!this.collection.checkedItems.length) {
            this.notification.info("提示信息", "请选择需要审核的数据");
            return ;
        }
        let needCheck = this.collection.checkedItems.filter(item => !item.status);
        let ids = needCheck.map(item => item.id);
        if (!ids.length) {
            this.notification.info("提示信息", "没有需要审核的数据");
            return ;
        }
        this.http.post("hall/course/admin-city/course-plan/check", { id: ids }).then(() => {
            this.notification.success("提示信息", "批量审核成功");
            this.collection.load();
        })
    }

    cancel(item: any) {
        let ids = [item.id];
        this.modalService.confirm({
            nzTitle: "确定取消排课",
            nzOnOk: () => {
                this.http.post("hall/course/admin-city/course-plan/cancel", { id: ids }).then(() => {
                    this.notification.success("提示信息", "取消成功");
                    this.collection.load();
                })
            }
        })
    }
}
