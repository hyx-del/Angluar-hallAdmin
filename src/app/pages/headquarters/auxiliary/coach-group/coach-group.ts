import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-coach-group',
    templateUrl: './coach-group.html',
    styleUrls: ['./coach-group.scss']
})

export class CoachGroupComponent implements OnInit {

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];
    collection: any = {};
    isVisible: boolean = false;
    form: any = {};

    params: any = {};

    urls: any = {
        list: "hall/course/admin/groups/list",
        create: "hall/course/admin/groups/create",
        update: "hall/course/admin/groups/update",
        delete: "hall/course/admin/groups/delete",
    }

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
    ) {

    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.edit(item);

        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ['id'];
        this.form.onSubmit = () => {

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
