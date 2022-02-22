import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/index';

@Component({
    selector: 'app-coach-group',
    templateUrl: './coach-group.html',
    styleUrls: ['./coach-group.scss']
})

export class CityCoachGroupComponent implements OnInit {

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];
    collection: any = {};
    isVisible: boolean = false;
    form: any = {};

    params: any = {};

    urls: any = {
        list: "hall/course/admin-city/coach/group-list",
        create: "hall/course/admin/groups/create",
        update: "hall/course/admin/groups/update",
        delete: "hall/course/admin/groups/delete",
    }

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private modalService: NzModalService,
    ) {

    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ['id'];
        this.form.onSubmit = (body) => {

        }

    }

    showModal() {
        this.isVisible = true;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }

    edit(item) {
        this.params = Object.assign({}, item);
        this.form.body = { ...item };
        this.isVisible = true;
    }

    save() {
        this.form.action = this.params.id ? this.urls.update : this.urls.create;
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.collection.load();
            this.isVisible = false;
            this.params = {};
        })
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个分组",
            nzOnOk: () => {
                this.http.post(this.urls.delete, { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    cancel() {
        this.isVisible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }
}
