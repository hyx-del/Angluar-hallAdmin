import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-specs-category',
    templateUrl: './specs-category.html',
    host: {
        'style': 'display: flex;flex-direction: column;height: 100%;',
    },
})
export class CourseCardSpecsCategory implements OnInit {
    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];

    collection: any = {};

    isVisible: boolean = false;
    params: any = {};

    form: nyForm;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {

    }
    setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    showModal() {
        this.isVisible = true;
        this.params = {};
    }

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.form.body = { ...data };
        this.isVisible = true;
    }

    onFormInit(form: any) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
    }

    confirm() {
        if (this.params.id) {
            this.form.action = "hall/course/admin/course-card/spec-category/update";
        } else {
            this.form.action = "hall/course/admin/course-card/spec-category/create";
        }
        this.form.submit().then(() => {
            this.isVisible = false;
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.params = {};
            this.form.body = {};
            this.collection.load();
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定删除这个规格类别",
            nzOnOk: () => {
                this.http.post("hall/course/admin/course-card/spec-category/delete", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    handleCancel() {
        this.isVisible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }
}
