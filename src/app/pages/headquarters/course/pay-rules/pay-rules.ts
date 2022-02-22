import { Component, OnInit } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-pay-rules',
    templateUrl: './pay-rules.html',
    styleUrls: ['./pay-rules.scss']
})
export class CoursePayRulesComponent implements OnInit {
    isVisible: boolean = false;
    params: any = {};
    coachGroup: any[] = [];

    public buttons: any[] = [
        { name: 'create', label: "添加结算规则", click: () => this.showModal() },
    ];

    collection: any = {};

    constructor(
        private notification: NzNotificationService,
        private http: Http,
    ) { }

    ngOnInit() {
        this.getCoachGroupList();
    }

    getCoachGroupList() {
        let parmas: any = { "action": "query", "params": [], "fields": ["id", "name", "grade"], "size": 50, "page": 1 };
        this.http.post("hall/course/admin/groups/list", parmas).then(ret => {
            this.coachGroup = ret.data || [];
        });
    }

    setCollection(collection) {
        this.collection = collection;
    }

    showModal() {
        this.isVisible = true;
    }

    coachGroupChange() {

    }

    saveRules() {
        let params: any = Object.assign({ cards: [] }, this.params);
        this.http.post("hall/course/admin/card-pay-rules/setting", params).then(ret => {
            this.notification.success("提示信息", "设置成功");
        })
    }

    cancel() {
        this.isVisible = false;
    }
}
