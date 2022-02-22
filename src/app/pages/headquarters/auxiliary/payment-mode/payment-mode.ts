import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/index';

@Component({
    selector: 'app-payment-mode',
    templateUrl: './payment-mode.html',
    styleUrls: ['./payment-mode.scss'],
})

export class PaymentModeComponent implements OnInit {

    urls: any = {
        list: "hall/admin/payment-mode/list",
        create: "hall/admin/payment-mode/create",
        disable: "hall/admin/payment-mode/unable",
        enable: "hall/admin/payment-mode/enable",
        delete: "hall/admin/payment-mode/delete",
    }

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];

    visible: boolean = false;
    collection: any = {};
    params: any = {};
    form: nyForm;

    currentHall: any = {};

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
        private hallService: HallService,
    ) { }

    ngOnInit() {
        // this.currentHall = this.hallService.getCurrentHall();
    }

    setCollection(collection) {
        this.collection = collection;
    }

    onFormInit(form: any) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {
            // body.hall_id = this.currentHall.id;
        }
    }

    showModal() {
        this.params = {};
        this.form.clearError();
        this.form.body = {};
        this.visible = true;
    }

    handleCancel() {
        this.visible = false;
    }

    confirm() {
        if (this.params.id) {
            this.form.action = this.urls.update;
        } else {
            this.form.action = this.urls.create;
        }
        this.form.submit().then(() => {
            this.visible = false;
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.params = {};
            this.collection.load();
        })
    }

    changeStatus(item: any) {
        this.modalService.confirm({
            nzTitle: `确定${item.status == 1 ? '禁用' : '启用'}该支付方式？`,
            nzOnOk: () => {
                const url = item.status == 1 ? this.urls.disable : this.urls.enable;
                console.log(url) 
                this.http.post(url, { id: item.id }).then(ret => {
                    this.notification.success("提示信息", `${item.status == 1 ? '禁用' : '启用'}成功`);
                    this.collection.load();
                })
            }
        })
        
    }

    remove(item: any) {
        this.modalService.confirm({
            nzTitle: "确定删除这个支付方式？",
            nzOnOk: () => {
                this.http.post(this.urls.delete, { id: item.id, hall_id: this.currentHall.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }
}
