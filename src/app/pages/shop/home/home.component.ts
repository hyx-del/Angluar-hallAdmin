import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-member-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class classroomManageComponent implements OnInit {

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];
    collection: any = {};
    isVisible: boolean = false;
    params: any = {
        max_number: 1,
        support_group: 1,
        support_private: 1,
    };

    hallList: any[] = [];

    form: nyForm;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
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

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
    }

    showModal() {
        this.restoreDefaultData();
        this.isVisible = true;
    }

    edit(item) {
        this.params = Object.assign({}, item);
        this.form.clearError();
        this.form.body = { ...item };
        this.isVisible = true;
    }

    save() {
        if (this.params.id) {
            this.form.action = "hall/admin-hall/classroom/update";
        } else {
            this.form.action = "hall/admin-hall/classroom/create";
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.params = {};
            this.isVisible = false;
            this.collection.load();
        })
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个教室",
            nzOnOk: () => {
                this.http.post("hall/admin-hall/classroom/delete", { hall_id: item.hall_id, id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }
    // 启用
    enable(item) {
        this.modalService.confirm({
            nzTitle: "确定启用这个教室",
            nzOnOk: () => {
                this.http.post("hall/admin-hall/classroom/enable", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }
    // 禁用
    disabled(item) {
        this.modalService.confirm({
            nzTitle: "确定禁用这个教室",
            nzOnOk: () => {
                this.http.post("hall/admin-hall/classroom/disable", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }

    cancel() {
        this.isVisible = false;
    }

    restoreDefaultData() {
        this.params = {
            max_number: 1,
            support_group: 1,
            support_private: 1,
        }
        this.form.body = { ...this.params };
        this.form.clearError();
    }
}
