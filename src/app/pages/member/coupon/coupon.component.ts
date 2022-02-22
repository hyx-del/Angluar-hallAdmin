import { Component, OnInit } from '@angular/core';
import { Form } from '@/providers/form';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-coupon',
    templateUrl: './coupon.component.html',
    styleUrls: ['./coupon.component.scss']
})
export class MemberCouponComponent implements OnInit {
    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];
    collection: any;
    public form: nyForm;

    visible: boolean = false;
    isCreate: boolean = false;
    couponTypes: any[] = [
        { label: "代金券", value: 1 },
    ]
    channels: any[] = [
        { label: "注册", value: 1 },
        { label: "邀请用户", value: 2 },
        { label: "兑换", value: 3 },
        { label: "预售定金支付", value: 4 },
        { label: "购买", value: 6 },
        { label: "红促宝(天九集团旗下电子商务)", value: 8 },
        // { label: "每日打卡", value: 4 },
        // { label: "上课分享", value: 5 },
    ]

    useLimitOptions = [
        { label: "约团课", value: 1, checked: false },
        { label: "约私教课", value: 2, checked: false },
        { label: "购卡", value: 3, checked: false },
        { label: "教培学费", value: 4, checked: false },
        { label: "购买商品", value: 5, checked: false },
    ]
    useLimit = [];

    currentCoupon: any = {};
    isBuy:boolean = false;
    buyTime:any[] = [new Date(),new Date()];

    constructor(
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private http: Http,
    ) { }

    ngOnInit() {
        
    }

    setCollection(collection) {
        this.collection = collection;
        
        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.getCouponDetail(item);
        }
    }

    showModal() {
        this.currentCoupon = {};
        this.useLimitOptions.forEach(item => {
            item.checked = false;
        })
        this.isCreate = this.visible = true;
        this.form.body = { type: 1 };
    }

    public formInit(form) {
        // this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (!this.isCreate) {
                body.id = this.currentCoupon.id;
            }
            if(this.isBuy && this.buyTime.length){
                body.sell_start_at = dayjs(this.buyTime[0]).format("YYYY-MM-DD HH:mm:ss");
                body.sell_end_at = dayjs(this.buyTime[1]).format("YYYY-MM-DD HH:mm:ss");
            }
            if (!body.effective_days) {
                delete body.effective_days;
            }
            if (body.effective_time) {
                body.effective_time = dayjs(body.effective_time).format("YYYY-MM-DD HH:mm:ss");
            }
            if (body.expiration_time) {
                body.expiration_time = dayjs(body.expiration_time).format("YYYY-MM-DD HH:mm:ss");
            }

            body.use_limit = this.useLimitOptions.filter(item => item.checked).map(item => item.value);
        }
    }

    getCouponDetail(coupon: any) {
        this.isCreate = false;
        this.http.get("member/admin/coupon/detail", { id: coupon.id }).then(data => {
            this.currentCoupon = data;
            this.form.body = { ...data };
            this.redeemCodeList = [];
            let useLimit = data.use_limit || [];
            this.useLimitOptions.forEach(item => {
                if (useLimit.indexOf(item.value) >= 0) {
                    item.checked = true;
                } else {
                    item.checked = false;
                }
            })
            
            if(data.access_channel == 6){
                this.isBuy = true;
            }else{
                this.isBuy = false
            }

            if(data.sell_start_at){
                this.buyTime[0] = data.sell_start_at
            }

            if(data.sell_end_at){
                this.buyTime[1] = data.sell_end_at;
            }
            
            this.visible = true;
            if (this.currentCoupon.access_channel == 3) { // 兑换
                this.getRedeemCodeList();
                this.getPasscodeCodeList();
            }
        })
    }

    submit() {
        if (this.isCreate) {
            this.form.action = "member/admin/coupon/create";
        } else {
            this.form.action = "member/admin/coupon/update";
        }
        this.form.submit().then((ret) => {
            this.form.clearError();
            this.visible = false;
            this.isBuy = false;
            this.notification.success("提示信息", this.isCreate ? "创建成功" : "修改成功");
            this.collection.load();
        })
    }

    changeStatus(coupon: any) {
        if (coupon.status) { // 当前是在线 需要下线
            this.modalService.confirm({
                nzTitle: "确认提示",
                nzContent: `确认下线名称为”${coupon.name}“的优惠券`,
                nzOnOk: () => {
                    this.http.post("member/admin/coupon/offline", { id: coupon.id, status: 0 }).then(ret => {
                        if (ret && ret.member_coupon) {
                            this.modalService.confirm({
                                nzTitle: "确认提示",
                                nzContent: "用户还有优惠券是否强制下线?",
                                nzCancelText: "取消",
                                nzOkText: "强制下线",
                                nzOnOk: () => {
                                    this.http.post("member/admin/coupon/offline", { id: coupon.id, status: 0, offline_confirm: true }).then(() => {
                                        this.notification.success("提示信息", "强制下线成功");
                                        this.collection.load();
                                    })
                                }
                            })
                        } else {
                            this.notification.success("提示信息", "下线成功");
                            this.collection.load();
                        }
                    })
                }
            })
        } else {
            this.modalService.confirm({
                nzTitle: "确认提示",
                nzContent: `确认上线名称为”${coupon.name}“的优惠券`,
                nzOnOk: () => {
                    this.http.post("member/admin/coupon/online", { id: coupon.id, status: 1 }).then(ret => {
                        this.notification.success("提示信息", "上线成功");
                        this.collection.load();
                    })
                }
            })
        }
    }

    deleteCoupon(coupon: any) {
        this.modalService.confirm({
            nzTitle: "确认提示",
            nzContent: `确认删除名称为”${coupon.name}“的优惠券`,
            nzOnOk: () => {
                this.http.delete("member/admin/coupon/delete", { id: coupon.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    generateVisible: boolean = false;
    generateParams: any = {};
    redeemCodeList: any[] = [];
    codeCollection: any = {};
    codeDetailVisible: boolean = false;
    currentRedeemCode: any = {};

    // 口令码
    generatePasscodeVisible: boolean = false;
    passcodeList: any[] = [];

    setCodeCollection(collection) {
        this.codeCollection = collection;
        this.codeCollection.onInit = () =>{
            // this.codeCollection.addWhere('batch_number', this.currentRedeemCode.batch_number);
            // this.codeCollection.addWhere('status', 4);
        }
    }

    showGenerateModal() {
        this.generateParams = {};
        this.generateVisible = true;
    }

    showPasscodeModal() {
        this.generateParams = {};
        this.generatePasscodeVisible = true;
    }

    cancelGenerate() {
        this.generateVisible = false;
        this.generatePasscodeVisible = false;
    }


    isInTheGenerate: boolean = false;
    // type 1 -> 兑换码 2 -> 口令码
    // TODO  java 调试转换
    confirmGenerate(type: 1 | 2 = 1) {
        if (this.isInTheGenerate) return ;
        if (type == 2) {
            if (!this.generateParams.passcode) {
                this.notification.info("提示信息", "请输入口令码");
                return ;
            } else if (!this.generateParams.code_exchangeable_amount) {
                this.notification.info("提示信息", "请输入兑换数量");
                return ;
            }
        }
        this.isInTheGenerate = true;
        let params = Object.assign({ coupon_id: this.currentCoupon.id, type: type }, this.generateParams);

        this.http.post("member/admin/coupon/redeem-code/create", params).then(ret => {
            this.notification.success("提示信息", "生成成功");
            this.generateParams = {};
            this.generateVisible = false;
            this.generatePasscodeVisible = false;
            if (type == 1) {
                this.getRedeemCodeList();
            } else {
                this.getPasscodeCodeList();
            }
            this.isInTheGenerate = false;
        }).catch(error => this.isInTheGenerate = false);
    }

    // 兑换码列表
    getRedeemCodeList() {
        this.http.get("member/admin/coupon/redeem-code/batch-list", { coupon_id: this.currentCoupon.id }).then(data => {
            this.redeemCodeList = data || [];
        })
    }

    // 口令码列表
    getPasscodeCodeList() {
        this.http.get("member/admin/coupon/passcode/list", { coupon_id: this.currentCoupon.id }).then(data => {
            this.passcodeList = data || [];
        })
    }

    redeemCodeDetail(data) {
        this.currentRedeemCode = Object.assign({}, data);
        this.codeDetailVisible = true;
    }

    closeCodeDetail() {
        this.codeDetailVisible = false;
    }

    cancel() {
        this.visible = false;
        this.isBuy = false;
        this.useLimitOptions.forEach(item => {
            item.checked = false;
        })
        // setTimeout(() => {
            this.form.clearError();
        // }, 300)
    }

    // 添加渠道为购买
    channelChange(data){
        if(data.name == "access_channel"){
            if(data.value == 6){
                this.isBuy = true;
            }else{
                this.isBuy = false
            }
        } else if (data.name == "effective_days" && data.value) {
            this.form.setValue("effective_time", "");
            this.form.setValue("expiration_time", "");
        } else if ((data.name == "effective_time" || data.name == "expiration_time") && data.value) {
            this.form.setValue("effective_days", "");
        }
    }
}
