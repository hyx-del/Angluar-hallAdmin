import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

@Component({
    selector: 'app-recharge-specs',
    templateUrl: './recharge-specs.html',
    styleUrls: ['./recharge-specs.scss']
})
export class MemberRechargeSpecsComponent implements OnInit {
    visible: boolean = false;
    params: any = {};

    collection: any = {};
    public buttons: any[] = [
        { name: 'create', label: "添加充值规格", click: () => this.showModal() },
    ];

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
            this.collection.getHeader('amount').click = (item) => this.edit(item);
        }
    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) body.id = this.params.id;
        }
    }

    showModal() {
        this.visible = true;
        this.form.body = {};
    }

    save() {
        let url = this.params.id ? "hall/admin/charge-spec/update" : "hall/admin/charge-spec/create";
        this.form.action = url;

        this.form.submit().then(() => {
            this.notification.success("提示信息", (this.params.id ? "修改" : "新增") + "充值规格成功");
            this.visible = false;
            this.collection.load();
            this.params = {};
        })
    }

    edit(item: any) {
        this.params = Object.assign({}, item);
        this.form.body = { ...item };
        this.visible = true;
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确认删除这个充值规格？",
            nzOnOk: () => {
                this.http.post("hall/admin/charge-spec/delete", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    cancel() {
        this.visible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }
}
