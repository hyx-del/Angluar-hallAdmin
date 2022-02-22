import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { NzNotificationService, NzTabChangeEvent } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService, CoachService, MemberService, HallService } from '@/providers/index';
import { Router } from '@angular/router';

import { Config } from '@/config';
import * as dayjs from 'dayjs';

import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'shop-member-detail',
    templateUrl: './member-detail.html',
    styleUrls: ['./member-detail.scss']
})
export class MemberDetailComponent implements OnInit, OnChanges {
    @Input() visible: boolean;
    @Input() id: number;
    @Input("member") detail: any = {};

    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    ossPath: string = "";

    params: any = {
        type: 10,
    };
    list: any[] = [];
    memberSourceList: any[] = [];
    coachList: any[] = [];
    salesmanList: any[] = [];
    // 推荐人
    referrerMember: any[] = [];

    cardVisible: boolean = false;
    detailForm: nyForm;

    keyword: string = "";
    pageIndex: number = 1;
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;

    isDisabled: boolean = true;

    // 出行习惯
    tripMode: any[] = [];
    // 课程需求
    requirements: any[] = [];

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private coachService: CoachService,
        private memberService: MemberService,
        private hallService: HallService,
        private router: Router,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
        
        this.tripMode = this.memberService.tripMode;
        this.requirements = this.memberService.requirements;
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getAllMember(value, true);
        })
        this.getMemberSourceList();
        this.getCoachList();
        this.getSalesmanList();
        this.getAllMember();
    }

    ngOnChanges(val: SimpleChanges) {
        if (val.id && val.id.currentValue) {
            this.getDetail();
        }
    }

    saveMember() {
        this.detailForm.submit().then(() => {
            this.notification.success("提示信息", "修改成功");
            this.detail.avatar = this.params.avatar;
            // this.collection.load();
        })
    }

    getDetail() {
        this.http.post("hall/member/admin-hall/member/detail", { id: this.id }).then(ret => {
            this.detail = ret;
            ret.receive_sms = ret.receive_sms == 1 ? true : false;
            this.params = Object.assign({}, ret);
            this.detailForm.body = { ...this.params };
            this.account = {};
            this.getMemberAccountInfo();
        })
    }

    onDetailFormInit() {
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.action = "hall/member/admin/update";
        this.detailForm.body = { ...this.params };
        this.detailForm.names = ["id"];
        this.detailForm.onSubmit = (body) => {
            if (body.birthday) {
                body.birthday = dayjs(body.birthday).format("YYYY-MM-DD");
            }
            if (this.params.avatar) {
                body.avatar = this.params.avatar;
            }
            if (!body.coach_ids) {
                body.coach_ids = [];
            }
            body.type = this.params.type || 1; // 个人会员
            body.id = this.params.id;
        }
    }

    getMemberSourceList() {
        this.memberService.getMemberSourceList().then(data => {
            this.memberSourceList = data || [];
        })
    }

    getCoachList() {
        this.coachService.getHallCoachList().then(data => {
            this.coachList = data || [];
        })
    }

    getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            this.salesmanList = data;
        })
    }

    getAllMember(keyword: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
        };
        if (keyword) {
            params.keyword = keyword;
        }
        // if (this.id) {
        //     params.value = this.id;
        // }
        
        this.http.post("hall/member/common/member/list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
            if (isSearch) {
                this.referrerMember = ret.data || [];
            } else {
                this.referrerMember = this.referrerMember.concat(ret.data || []);
            }

            if (ret.last_page > ret.current_page) {
                this.haveMoreMember = true;
            } else {
                this.haveMoreMember = false;
            }
            this.isLoading = false;
            this.pageIndex = ret.current_page;
        })
    }

    onSearch(value: string): void {
        this.isLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return ;
        }
        this.pageIndex += 1;
        this.isLoading = true;
        this.getAllMember(this.keyword);
    }

    tabsInit: any = {};

    tabChange(event: NzTabChangeEvent) {
        if (!this.tabsInit[event.index]) {
            this.tabsInit[event.index] = true;
        }
    }

    saveMemberName() {
        let params = {
            id: this.params.id,
            name: this.detailForm.getValue("name"),
        }
        this.http.post("hall/member/admin-hall/member/update-name", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        }).catch(error => {
            if (error.error) {
                this.detailForm.setError(error.error.data);
            }
        })
    }

    isSaveGender: boolean = false;
    // 1 -> 保存性别 2 -> 是否接收短信
    saveMemberGender(type: number = 1) {
        if (this.isSaveGender) return ;
        this.isSaveGender = true;
        let params: any = {
            id: this.params.id,
        }
        if (type == 1) {
            params.gender = this.detailForm.getValue("gender");
        } else {
            params.receive_sms = this.params.receive_sms ? 1 : -1;
        }
        this.http.post("hall/member/admin-hall/member/update", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
            this.isSaveGender = false;
        }).catch(() => this.isSaveGender = false);
    }

    saveMemberMobile() {
        let params = {
            id: this.detail.id,
            contact: this.detailForm.getValue("contact"),
        }

        this.http.post("hall/member/admin-hall/member/update-contact", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        })
    }

    // 
    accountLogCollection: any = { data: [] };
    account: any = {};
    
    adjustVisible: boolean = false;
    adjustParams: any = {};
    adjustType: "plus" | "minus" = "plus";
    paymentChannel: any[] = [
        { label: "现金", value: 10 },
        { label: "微信", value: 20 },
        { label: "支付宝", value: 30 },
    ];
    accountDetail: any = {};
    accountVisible: boolean = false;
    courseTypes: any = {
        1: '团课',
        2: '私教课',
    }

    setAccountCollection(collection) {
        this.accountLogCollection = collection;
        this.accountLogCollection.onSetHeader = () => {
            this.accountLogCollection.getHeader('course_name').click = (item) => this.getAccountInfo(item);
        }
        // 
        this.accountLogCollection.onLoaded = () => {
            this.accountLogCollection.data.forEach(item => {
                if (parseFloat(item.amount) > 0) {
                    item.amount = "+" + item.amount;
                }
            })
        }
    }

    getAccountInfo(item) {
        let params = {
            id: item.relation_id,
        }
        this.http.get("hall/member/admin-hall/member/account/log/course-detail", params).then(data => {
            this.accountDetail = data || {};
            this.accountVisible = true;
        })
    }

    closeAccountDetail() {
        this.accountVisible = false;
    }

    getMemberAccountInfo() {
        this.http.post("member/account/detail", { member_id: this.detail.id  }).then(ret => {
            if (ret.discount_rate) {
                ret.discount_rate = parseFloat(ret.discount_rate);
            }
            this.account = ret;
        })
    }

    showAdjustModal() {
        this.adjustParams = {};
        this.adjustType = "plus";
        this.adjustVisible = true;
        if (!this.rechargeMethods.length) {
            this.getPaymentMode();
        }
    }

    adjustTypeChange() {
        if (!this.adjustParams.amount) return ;
        if (this.adjustType != "minus") return ;
        let balance = parseFloat(this.account.balance) || 0;
        if (this.adjustParams.amount > balance) {
            this.adjustParams.amount = balance;
        }
    }

    adjustAfter() {
        let num = 0;
        let balance = parseFloat(this.account.balance) || 0;
        if (this.adjustType == "plus") {
            num = balance + (this.adjustParams.amount || 0)
        } else {
            num = balance - (this.adjustParams.amount || 0)
        }
        return num;
    }
    
    adjustMaxAmount() {
        let balance = parseFloat(this.account.balance) || 0;
        return balance;
    }

    confirmAdjust() {
        let params = Object.assign({ member_id: this.detail.id }, this.adjustParams);
        if (!params.amount) {
            this.notification.info("提示信息", "请输入调整数量");
            return ;
        } else if (!params.channel) {
            this.notification.info("提示信息", "请选择支付方式");
            return ;
        }
        if (this.adjustType == "minus") {
            params.amount = -params.amount;
        }

        this.http.post("hall/member/admin-hall/member/account/balance-adjust", params).then(() => {
            this.notification.success("提示信息", "调整成功");
            this.getDetail();
            if (typeof this.accountLogCollection.load === "function") {
                this.accountLogCollection.load();
            }

            this.cancelAdjust();
        })
    }

    cancelAdjust() {
        this.adjustVisible = false;
        this.adjustParams = {};
    }

    /**
     * 体测数据
     */
    public buttons: any[] = [
        { name: 'create', label: "添加体测数据", click: () => this.showBodyModal() },
    ];
    bodyCollection: any = {};
    bodyVisible: boolean = false;
    bodyList: any[] = [];
    bodyListCopy: any[] = [];

    bodyParams: any = {};

    setBodyCollection(collection) {
        this.bodyCollection = collection;
        this.bodyCollection.onDblClick = (item) => this.editBodyData(item);
        this.getBodyProject();
    }

    showBodyModal() {
        this.bodyParams = {};
        if (this.bodyListCopy.length) {
            this.bodyList = JSON.parse(JSON.stringify(this.bodyListCopy));
        }
        this.bodyVisible = true;
    }

    saveBodyData() {
        if (!this.bodyParams.indicator_date) {
            this.notification.info("提示信息", "请填写体测时间");
            return;
        }
        let params: any = {
            member_id: this.detail.id,
            ...this.bodyParams,
        }
        if (this.bodyParams.indicator_date) {
            params.indicator_date = dayjs(this.bodyParams.indicator_date).format("YYYY-MM-DD HH:mm:ss");
        }
        params.indicator_data = this.bodyList.map(item => {
            return { name: item.name, name_en: item.name_en, unit: item.unit, value: item.value, id: item.id };
        })
        let url = "";
        if (this.bodyParams.id) {
            params.id = this.bodyParams.id;
            url = "hall/member/admin-hall/member/body-indicator/update";
        } else {
            url = "hall/member/admin-hall/member/body-indicator/create";
        }

        this.http.post(url, params).then(ret => {
            this.notification.success("提示信息", "保存成功");
            this.bodyCollection.load();
            this.cancelEditBody();
        })
    }

    editBodyData(item) {
        this.http.post("hall/member/admin-hall/member/body-indicator/detail", { member_id: this.detail.id, id: item.id }).then(ret => {
            this.bodyParams = { ...ret };
            // this.bodyList = ret.indicator_data;
            this.bodyList = JSON.parse(JSON.stringify(this.bodyListCopy));
            this.bodyList.forEach(item => {
                ret.indicator_data.forEach(data => {
                    if (data.id == item.id) item.value = data.value;
                });
            });
            this.bodyVisible = true;
        })
    }

    getBodyProject() {
        if (this.bodyListCopy.length) {
            return;
        }
        let params: any = {
            action: "query",
            fields: ["name", "name_en", "unit", "status", "created_by", "updated_by"],
            page: 1,
            params: [["status", "=", 1]],
            size: 200,
        }
        this.http.post("hall/member/common/body-indicator/list", params).then(ret => {
            this.bodyList = ret.data;
            this.bodyListCopy = JSON.parse(JSON.stringify(ret.data));
        })
    }

    cancelEditBody() {
        this.bodyVisible = false;
        this.bodyParams = {};
        if (this.bodyListCopy.length) {
            setTimeout(() => {
                this.bodyList = JSON.parse(JSON.stringify(this.bodyListCopy));
            }, 300);
        }
    }

    /** 
     * 会员跟进日志
     * */

    followContent: string = "";
    logVisible: boolean = false;
    followButtons: any = [
        { name: 'create', click: () => this.showFollowLog() },
    ]
    followCollection: any = {};

    setFollowCollection(collection) {
        this.followCollection = collection;
    }

    createFollowLog() {
        if (!this.followContent) {
            this.notification.error("提示信息", "请填写内容");
            return;
        }
        let params: any = {
            member_id: this.detail.id,
            log: this.followContent
        }
        this.http.post("hall/member/admin-hall/member/follow/create", params).then(() => {
            this.followContent = "";
            this.notification.success("提示信息", "创建成功");
            this.logVisible = false;
            this.followCollection.load();
        })
    }
    showFollowLog() {
        this.logVisible = true;
    }
    cancelLog() {
        this.logVisible = false;
        this.visitVisible = false;
    }
    /**
     * 到访日志
     */
    visitVisible: boolean;
    visitParams: any = {};

    visitButtons: any = [
        { name: 'create', click: () => this.visitVisible = true },
    ]
    visitCollection: any = {};
    setVisitCollection(collection) {
        this.visitCollection = collection;
    }
    visitDate: any;

    createVisitLog() {
        let params = Object.assign({ member_id: this.detail.id }, this.visitParams);
        if (!params.log || !params.appoint_date) {
            this.notification.error("提示信息", "请填写完整");
            return;
        }
        if (params.appoint_date) {
            params.appoint_date = dayjs(params.appoint_date).format("YYYY-MM-DD");
        }
        this.http.post("hall/member/admin-hall/member/visit/create", params).then(() => {
            this.visitParams = {};
            this.notification.success("提示信息", "创建成功");
            this.visitVisible = false;
            this.visitCollection.load();
        })
    }

    changeVisitStatus(log: any) {
        console.log("log===>", log);
        this.http.post("hall/member/admin-hall/member/visit/update", { id: log.id, status: 1, appoint_date: log.appoint_date }).then(ret => {
            this.notification.success("提示信息", "修改成功");
            this.visitCollection.load();
        })
    }

    courseCardCollection: any = {
        data: [],
    };
    setCourseCardCollection(collection) {
        this.courseCardCollection = collection;
    }

    memberCourseCardDetail(data) {
        this.router.navigate(['/shop/member/course-card'], { queryParams: { id: data.id } })
    }

    attendClassCollection: any = {};
    setattendClass(collection) {
        this.attendClassCollection = collection;
    }


    close() {
        this.visibleChange.emit(false);
        this.params = {};
        this.detailForm.clearError();
    }

    showMemberCard() {
        this.cardVisible = true;
    }

    rechargeVisible: boolean = false;
    rechargeParams: any = {};
    rechargeSpecs: any[] = [];

    rechargeMethods: any[] = [];
    
    showRechargeModal() {
        this.rechargeParams = {};
        this.rechargeVisible = true;
        this.getRechargeSpecs();
        if (!this.rechargeMethods.length) {
            this.getPaymentMode();
        }
    }

    cancelRecharge() {
        this.rechargeVisible = false;
    }

    getRechargeSpecs() {
        this.http.get("hall/admin-hall/charge-spec/list").then(data => {
            this.rechargeSpecs = data || [];
            this.rechargeSpecs.forEach(item => {
                item.label = "充值" + item.amount + "元";
            })
        })
    }

    getPaymentMode() {
        this.memberService.getMemberPaymentList().then(ret => {
            this.rechargeMethods = ret.data || [];
        })
    }

    confirmRecharge() {
        // if (!this.rechargeParams.amount) {
        //     this.notification.info("提示信息", "请输入充值金额");
        //     return ;
        // }
        if (!this.rechargeParams.id) {
            this.notification.info("提示信息", "请选择充值规格");
            return ;
        } else if (!this.rechargeParams.channel) {
            this.notification.info("提示信息", "请选择充值方式");
            return ;
        }
        let params = {
            member_id: this.detail.id,
            channel: this.rechargeParams.channel,
            charge_spec_id: this.rechargeParams.id,
        }
        this.http.post("hall/member/admin-hall/member/account/charge", params).then(ret => {
            this.notification.success("提示信息", "充值成功");
            this.rechargeVisible = false;
            this.getMemberAccountInfo();
            this.accountLogCollection.load();
        })
    }

    salesmanVisable: boolean = false;
    transformType: string = "1";
    transformParams: any = {};
    hallList: any[] = [];

    transformCollection: any = {};

    showSalesnamModal() {
        this.transformType = "1";
        this.salesmanVisable = true;
        if (!this.hallList.length) {
            this.getHallList();
        }
    }

    setTransformCollection(collection) {
        this.transformCollection = collection;
    }

    getHallList() {
        let currentHall = this.hallService.getCurrentHall();

        let params = {
            action: "query",
            fields: ["name", "phone", "full_address", "email", "status"],
            // page: 1,
            params: [],
            // size: 200,
        }
        this.http.post("hall/admin-hall/list", params).then(data => {
            // this.hallList = (ret.data || []).filter(item=> item.id != currentHall.id);
            this.hallList = data || [];
        })
    }

    confirmTransform() {
        let params: any = {
            member_id: this.detail.id,
        }
        if (this.transformType == "1") {
            if (!this.transformParams.hall_id) {
                return ;
            }
            if (this.detail.hall_id && this.transformParams.hall_id == this.detail.hall_id) {
                this.notification.info("提示信息", "会员所属门店已经是本场馆，无需再次更换");
                return ;
            }
            params.new_hall_id = this.transformParams.hall_id
        } else {
            if (!this.transformParams.salesman_id) {
                return ;
            }
            params.new_salesman_id = this.transformParams.salesman_id
        }
        if (this.transformParams.remark) {
            params.remark = this.transformParams.remark;
        }

        this.http.post("hall/member/admin-hall/member/member-salesman-change/create", params).then(ret => {
            this.notification.success("提示信息", "会籍更换成功");
            this.salesmanVisable = false;
            this.transformParams = {};
            this.getDetail();
            if (typeof this.transformCollection.load == "function") {
                this.transformCollection.load();
            }
        })
    }

    cancelTransform() {
        this.salesmanVisable = false;
        this.transformParams = {};
    }


    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            this.params.avatar = urls[0];
        }).catch(() => { });
    };
}
