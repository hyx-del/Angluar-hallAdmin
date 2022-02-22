import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-member-source',
    templateUrl: './member-source.html',
    styleUrls: ['./member-source.scss']
})
export class MemberSourceComponent implements OnInit {

    isVisible: boolean = false;
    params: any = {};

    collection: any = {};
    public buttons: any[] = [
        { name: 'create', label: "添加来源", click: () => this.showModal() },
    ];

    form: nyForm;
    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService
    ) {

    }

    ngOnInit() {

    }


    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.edit(item);
        
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    showModal() {
        this.params = {};
        this.isVisible = true;
        this.form.body = {};
        this.form.clearError();
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
    }

    edit(item) {
        this.params = Object.assign({}, item);
        this.isVisible = true;
        this.form.body = { ...item };
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个来源",
            nzOnOk: () => {
                this.http.post("hall/member/admin/source/delete", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    saveSource() {
        let url: string = "";
        if (this.params.id) {
            url = "hall/member/admin/source/update"
        } else {
            url = "hall/member/admin/source/create";
        }
        this.form.action = url;
        this.form.submit().then(ret => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.params = {};
            this.collection.load();
            this.closeModal();
        })
    }

    closeModal() {
        this.isVisible = false;
        this.form.clearError();
    }
}
