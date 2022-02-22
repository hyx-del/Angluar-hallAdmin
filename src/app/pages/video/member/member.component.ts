import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { FileService } from '@/providers/services/file-service';
import { Config } from '@/config';


@Component({
    selector: 'app-member',
    templateUrl: './member.component.html',
    styleUrls: ['./member.component.scss']
})
export class VideoMemberComponent implements OnInit {

    collection: any = {};
    detail: any = {};

    isVisible: Boolean = false;
    rechargeVisible: Boolean = false;
    rechargeSpecsList: any[] = [];
    rechargeParams: any = {};

    ossPath: string = "";
    paymentOptions: any[] = [];

    public recharge = {
        type: 1
    }

    public isCustomized = false;

    public form:nyForm;

    constructor(
        private http: Http,
        private fileService: FileService,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.getDetail(item);
        }
    }

    getDetail(data: any) {
        this.http.get("mix/video/admin/member/detail", { member_id: data.id }).then(ret => {
            this.detail = { ...ret };
            this.isVisible = true;
        })
    }

    getMemberPaymentList() {
        this.http.get("hall/admin/payment-mode/enable-list").then(data => {
            this.paymentOptions = data || [];
        })
    }

    disabledMember(data) {
        this.modalService.confirm({
            nzTitle: "暂停后会员账户无法使用，确认暂停？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/member/disable", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "暂停成功");
                    this.collection.load();
                })
            }
        })
    }

    enableMember(data) {
        this.modalService.confirm({
            nzTitle: "确认恢复启用？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/member/enable", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }

    rechargeCollection: any = {};
    setRechargeCollection(collection) {
        this.rechargeCollection = collection;
    }

    pointsCollection: any = {};
    setPointsCollection(collection) {
        this.pointsCollection = collection;
    }

    daysCollection: any = {};
    setDaysCollection(collection) {
        this.daysCollection = collection;
    }

    showRechargeModal() {
        this.rechargeVisible = true;
        if (!this.paymentOptions.length) {
            this.getMemberPaymentList();
        }
        if (!this.rechargeSpecsList.length) {
            this.getRechargeSpecs();
        }
    }

    adjustVisible: boolean = false;
    adjustParams: any = {};
    adjustType: "plus" | "minus" = "plus";
    showAdjustModal() {
        this.adjustParams = {
            type: 1,
        }
        this.adjustType = "plus";
        this.adjustVisible = true;
    }

    adjustDays() {
        let params = Object.assign({ member_id: this.detail.id }, this.adjustParams);
        if (!params.amount) {
            this.notificationService.info("提示信息", "请输入调整数量");
            return ;
        }
        if (this.adjustType == "minus") {
            params.amount = -params.amount;
        }

        this.http.post("mix/video/admin/member/account-adjust", params).then(() => {
            this.notificationService.success("提示信息", "调整成功");
            this.getDetail({ id: this.detail.id });
            if (typeof this.daysCollection.load !== "undefined") {
                this.daysCollection.load();
            }

            this.cancelAdjust();
        })
    }
    adjustTypeChange() {
        if (!this.adjustParams.amount) return ;
        if (this.adjustType != "minus") return ;
        if (this.adjustParams.type == 1 ) { // 天数
            if (this.adjustParams.amount > parseInt(this.detail.days_remaining)) {
                this.adjustParams.amount = parseInt(this.detail.days_remaining) || 0;
            }
        } else if (this.adjustParams.type == 2 ) { // 点数
            if (this.adjustParams.amount > parseInt(this.detail.account.points)) {
                this.adjustParams.amount = parseInt(this.detail.account.points) || 0;
            }
        }
    }
    adjustMinAmount() {
        let num = 0;
        if (this.adjustParams.type == 1) { // 天数
            num = this.detail.days_remaining || 0
        } else {
            num = this.detail.account.points || 0;
        }
        return num;
    }

    adjustAfter() {
        let num = 0;
        if (this.adjustParams.type == 1) { // 天数
            if (this.adjustType == "plus") {
                num = (this.detail.days_remaining || 0) + (this.adjustParams.amount || 0)
            } else {
                num = (this.detail.days_remaining || 0) - (this.adjustParams.amount || 0)
            }
        } else { // 点数
            if (this.adjustType == "plus") {
                num = (this.detail.account.points || 0) +  (this.adjustParams.amount || 0)
            } else {
                num = (this.detail.account.points || 0) -  (this.adjustParams.amount || 0)
            }
        }
        return num;
    }

    cancelAdjust() {
        this.adjustVisible = false;
        this.adjustParams = {};
    }

    getRechargeSpecs() {
        this.http.get("mix/video/admin/member/get-recharge-specs").then(data => {
            (data || []).forEach(item => {
                item.name = item.name + "/" + item.price + "元";
            });
            this.rechargeSpecsList = data || [];
            this.rechargeSpecsList.push({ name: "自定义", id: -1 });
        })
    }

    confirmRecharge() {
        let params: any = {
            member_id: this.detail.id,
            // recharge_specs_id: this.rechargeParams.specs_id,
            // remark: this.rechargeParams.remark,
        }
        Object.assign(params, this.rechargeParams);
        if (!params.recharge_specs_id) {
            this.notificationService.info("提示信息", "请选择充值规格");
            return ;
        }
        if (!params.payment_mode) {
            this.notificationService.info("提示信息", "请选择支付方式");
            return ;
        }
        if (params.recharge_specs_id == -1){
            delete params.recharge_specs_id;
            params.type = this.recharge.type;
        }
        this.http.post("mix/video/admin/member/recharge", params).then(() => {
            this.notificationService.success("提示信息", "充值成功");
            this.getDetail({ id: this.detail.id });
            this.rechargeCollection.load();
            this.pointsCollection.load();
            this.handleCancel();
        }).catch(error=>{
            this.form.setError(error.error.data)
        })
    }

    handleCancel() {
        this.rechargeVisible = false;
        this.rechargeParams = {};
        this.isCustomized = false;
        this.recharge.type = 1;
    }

    

    closeModal() {
        this.isVisible = false;
    }

    specificationCharge() {
        if (this.rechargeParams.recharge_specs_id == -1) {
           return this.isCustomized = true;
        }

        this.isCustomized = false;
    }
}
