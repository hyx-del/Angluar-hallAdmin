import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-body',
    templateUrl: './body.component.html',
    styleUrls: ['./body.component.scss']
})
export class BodyIndicatorComponent implements OnInit {
    public buttons: any[] = [
        { name: 'create', label: "添加体测项目", click: () => this.showModal() },
    ];

    collection: any = {};
    isVisible: boolean = false;
    form: nyForm;
    params: any = {};

    urls: any = {
        list: "hall/member/admin/body-indicator/list",
        create: "hall/member/admin/body-indicator/create",
        delete: "hall/member/admin/body-indicator/delete",
        update: "hall/member/admin/body-indicator/update",
    }

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.edit(item);

        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    onFormInit(form: nyForm) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);

        this.form.onSubmit = (body) => {
            if (this.params.id) body.id = this.params.id;
        }

    }

    showModal() {
        this.form.body = {};
        this.params = {};
        this.isVisible = true;
    }

    cancel() {
        this.isVisible = false;
        this.form.clearError();
    }

    save() {
        if (this.params.id) {
            this.form.action = this.urls.update;
        } else {
            this.form.action = this.urls.create;
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.isVisible = false;
            this.collection.load();
            this.form.body = {};
            this.params = {};
        })
    }

    edit(item: any) {
        this.form.body = { ...item };
        this.params = Object.assign({}, item);
        this.isVisible = true;
    }

    changeStatus(item: any) {
        let params: any = {
            id: item.id,
            status: item.status ? 0 : 1,
            name: item.name,
            name_en: item.name_en,
            unit: item.unit,
        }
        this.modalService.confirm({
            nzTitle: `确定${params.status ? "启用" : "禁用"}该体测项目？`,
            nzOnOk: () => {
                this.http.post(this.urls.update, params).then(ret => {
                    this.notification.success("提示信息", params.status ? "启用成功" : "禁用成功");
                    this.collection.load();
                })
            }
        })
    }

    remove(item: any) {
        this.modalService.confirm({
            nzTitle: "确定删除这个体测项目",
            nzOnOk: () => {
                this.http.post(this.urls.delete, { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }
}
