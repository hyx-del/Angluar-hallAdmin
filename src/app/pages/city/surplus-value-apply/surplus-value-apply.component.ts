import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-surplus-value-apply',
    templateUrl: './surplus-value-apply.component.html',
    styleUrls: ['./surplus-value-apply.component.scss']
})
export class SurplusValueApplyComponent implements OnInit {
    public collection: any = {};
    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {

    }

    setCollection(collection: object) {
        this.collection = collection;
    }

    agreed(item: any) {
        this.modalService.confirm({
            nzTitle: "确定通过审核？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card/surplus-value-adjust/agree", { change_log_id: item.id }).then(() => {
                    this.notification.success("提示信息", "操作成功");
                    this.collection.load();
                })
            }
        })
    }

    reject(item: any) {
        this.modalService.confirm({
            nzTitle: "确定不通过审核？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card/surplus-value-adjust/reject", { change_log_id: item.id }).then(() => {
                    this.notification.success("提示信息", "操作成功");
                    this.collection.load();
                })
            }
        })
    }

}
