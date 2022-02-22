import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-course-card',
    templateUrl: './course-card.html',
    styleUrls: ['./course-card.scss']
})
export class CourseCardComponent implements OnInit {
    public buttons: any[] = [
        { name: 'create', label: "新增课程卡", click: () => this.showModal() },
    ];

    params: any = {
        type: 1,
        course_type: 1,
        is_experience_card: false,
    };
    editorVisible: boolean = false;
    detailVisible: boolean = false;

    form: nyForm;

    classLimit: any = {
        cycle_type: 'day'
    };
    timeLimit: any = {
        type: 'day',
    };

    monthDays: Array<any> = [];
    weeks: Array<any> = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

    limitChecked: any = {
        max_companion: false,
        max_order: false,
        class_limit: false,
        max_purchase: false,
        time_limit: false,
    }
    collection: any = {};
    urls: any = {
        list: "hall/course/admin/course-card/list",
        create: "hall/course/admin/course-card/create",
        detail: "hall/course/admin/course-card/detail",
        update: "hall/course/admin/course-card/update",
        delete: "hall/course/admin/course-card/delete",
        unable: "hall/course/admin/course-card/unable",
        enable: "hall/course/admin/course-card/enable",
    }

    cardUseType: Array<any> = [
        { label: "全国通", value: 1 },
        { label: "城市通", value: 2 },
        { label: "单店", value: 3 },
        { label: "通店", value: 4 },
    ]

    templateList: any[] = [];
    contractTemplate: any = {
        electronic_id: '',
        paper_id: '',
    };

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
    ) {
        for (let index = 1; index <= 31; index++) {
            this.monthDays.push({ name: index + "号", value: index })
        }
    }

    ngOnInit() {
        this.getTemplate();
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.edit(item);
        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    getTemplate() {
        this.http.get("hall/admin/contract/contract-template-list").then(ret => {
            this.templateList = ret || [];
        })
    }

    showModal() {
        this.editorVisible = true;
        this.restoreDefaultData();
        Object.keys(this.limitChecked).forEach(key => {
            this.limitChecked[key] = false;
        })
        this.form.body = {
            type: 1,
            course_type: 1,
            is_experience_card: false,
        };
    }

    onFormInit(form) {

        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            if (this.params.picture) {
                body.picture = this.params.picture;
            }
        }

    }

    saveCard() {
        // this.form.
        let params: any = Object.assign({}, this.params);
        let timeLimit = Object.assign({}, this.timeLimit);
        timeLimit.cycle_type = timeLimit.type;
        delete timeLimit.type;

        if (timeLimit.start_time) timeLimit.start_time = dayjs(timeLimit.start_time).format("HH:mm");
        if (timeLimit.end_time) timeLimit.end_time = dayjs(timeLimit.end_time).format("HH:mm");
        if (!this.limitChecked.max_companion) delete params.max_companion;
        if (!this.limitChecked.max_order) delete params.max_order;
        if (!this.limitChecked.max_purchase) delete params.max_purchase;
        if (this.limitChecked.time_limit) {
            console.log("time_limit");
            params.time_limit = timeLimit;
            params.time_limit.cycle_type = timeLimit.cycle_type;
            if (timeLimit.cycle_type == "week") {
                params.time_limit.week_day = timeLimit.week_day;
            }

        }

        if (this.limitChecked.class_limit) {
            params.class_limit = this.classLimit;
        }

        if (this.contractTemplate.electronic_id || this.contractTemplate.paper_id) {
            params.contract_template_id = {};
            if (this.contractTemplate.electronic_id) {
                params.contract_template_id.electronic_id = this.contractTemplate.electronic_id;
            }
            if (this.contractTemplate.paper_id) {
                params.contract_template_id.paper_id = this.contractTemplate.paper_id;
            }
        }

        console.log("timeLimit", timeLimit);
        // hall/card/admin/update
        this.http.post(this.urls.create, params).then(ret => {
            this.notification.success("提示信息", "创建课程卡成功");
            this.restoreDefaultData();
            this.editorVisible = false;
            this.collection.load();
        }).catch(error => {
            if (error.error) {
                this.form.setError(error.error.data);
            }
        })
    }

    restoreDefaultData() {
        this.params = {
            type: 1,
            course_type: 1,
            is_experience_card: false,
        };
        this.classLimit = {
            cycle_type: 'day'
        };
        this.timeLimit = {
            type: 'day',
        };
    }

    detail: any = {};
    edit(item) {
        // this.http.get(this.urls.detail, { id: item.id }).then(ret => {
        //     this.detail = ret;
        //     this.detailVisible = true;
        // })
        this.detail = item;
        this.detailVisible = true;
    }

    cancel() {
        this.editorVisible = false;
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个课程卡",
            nzOnOk: () => {
                this.http.post(this.urls.delete, { id: item.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    changeStatus(item: any) {
        this.modalService.confirm({
            nzTitle: `确定${item.status == 1 ? '禁用' : '启用'}该课程卡？`,
            nzOnOk: () => {
                const url = item.status == 1 ? this.urls.unable : this.urls.enable
                this.http.post(url, { id: item.id }).then(ret => {
                    this.notification.success("提示信息", `${item.status == 1 ? '禁用' : '启用'}成功`);
                    this.collection.load();
                })
            }
        })
        
    }



}
