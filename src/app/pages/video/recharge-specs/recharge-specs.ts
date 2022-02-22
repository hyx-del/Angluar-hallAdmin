import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

@Component({
  selector: 'app-video-recharge-specs',
  templateUrl: './recharge-specs.html',
  styleUrls: ['./recharge-specs.scss']
})
export class VideoRechargeSpecsComponent implements OnInit {
    visible: boolean = false;
    params: any = {};

    collection: any = {};
    public buttons: any[] = [
        { name: 'create', label: "添加充值规格", click: () => this.showModal() },
    ];

    sysTypes = [
        { label: "PC", value: 1, checked: false },
        { label: "手机", value: 2, checked: false  },
        { label: "后台", value: 3, checked: false  },
    ]

    rechargeTypes = [
        { label: "周期", value: 1 },
        { label: "点数", value: 2 },
    ]

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

        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) body.id = this.params.id;
            body.sys_type = this.sysTypes.filter(item => item.checked).map(item => item.value);
        }
    }

    showModal() {
        this.visible = true;
        this.form.body = {
            sys_type: [],
            type: 1,
            gift_amount: 0,
        };
        this.params = { type: 1 }
    }

    save() {
        let url = this.params.id ? "mix/video/admin/recharge-specs/update" : "mix/video/admin/recharge-specs/create";
        this.form.action = url;

        this.form.submit().then(() => {
            this.notification.success("提示信息", (this.params.id ? "修改" : "新增") + "充值规格成功");
            this.visible = false;
            this.collection.load();
            this.params = {};
        })
    }

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.form.body = { ...data };
        if (data.sys_type && data.sys_type.length) {
            this.sysTypes.forEach(item => {
                if (data.sys_type.indexOf(item.value) >= 0) {
                    item.checked = true;
                }
            })
        }
        this.visible = true;
    }

    enable(data: any) {
        this.modalService.confirm({
            nzTitle: "确认启用这个充值规格？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/recharge-specs/enable", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }

    disabled(data: any) {
        this.modalService.confirm({
            nzTitle: "确认禁用这个充值规格？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/recharge-specs/unable", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确认删除这个充值规格？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/recharge-specs/delete", { id: item.id }).then(() => {
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
        this.sysTypes.forEach(item => {
            item.checked = false;
        })
    }
}
