import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { HallService, MemberService } from '@/providers/index';
import * as dayjs from 'dayjs';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

@Component({
    selector: 'h-member-course-card-detail',
    templateUrl: './card-detail.html',
    styleUrls: ['./card-detail.scss']
})

export class MemberCourseCardDetailComponent implements OnInit, OnChanges {
    @Input("visible") cardVisible: boolean;
    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    @Input("member") detail: any = { courseCard: {} };
    leaveVisible: boolean = false;
    paymentMethod: 'one' | 'multiple' = "one";
    paymentOptions: Array<any> = [];
    memberList: Array<any> = [];
    memberBindList: Array<any> = [];

    cardInfo: any = {};
    handleLog: any = {
        leave: [],
        adjust: [],
        stop: [],
        transform: [],
        validateAdjusts: [],
    }

    tType: any = {
        hall: false,
        member: false,
        card: false,
    }
    // 1 -> 次卡 2 -> 期限卡
    courseCardType: number;

    memberMaxBind: number = 0;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
        private hallService: HallService,
        private memberService: MemberService,
    ) { }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getMemberList(value, true);
        })
    }
     // 转会记录操作
     TansferCollection: any = {};

     setTansferCollection(collection) {
         this.TansferCollection = collection;
     }
     
    ngOnChanges(val: SimpleChanges) {
        if (val.detail && val.detail.currentValue.id) {
            this.detail.courseCard = {};
            this.getCardInfo(this.detail.id);
            this.getMemberBindList();
        }
    }

    getCardInfo(id) {
        this.http.get("hall/member/admin/member-course-card/detail", { id: id }).then(ret => {
            this.detail = ret;
            this.memberMaxBind = ret.courseCard.max_bind;
            this.courseCardType = ret.courseCard.type;
            if (ret.coupon_id) { // 有设置优惠券
                this.getCouponDetail();
                this.getRedeemCodeList();
            }
            this.getPerationsList();
        })
    }

    getMemberBindList() {
        this.http.get("hall/member/admin/member-course-card/member-binding/list", { id: this.detail.id }).then(data=> {
            this.memberBindList = data;
        })
    }

    // 操作记录
    getPerationsList() {
        this.http.get("hall/member/admin/member-course-card/operations", { id: this.detail.id }).then(ret => {
            this.handleLog = ret;
        }).catch(err => {
            console.log("操作记录err", err);
        })
    }

    useLogsCollection: any = {};
    setUseLogsCollection(collection) {
        this.useLogsCollection = collection;

        this.useLogsCollection.onSetHeader = () => {
            collection.getHeader('course_name').click = (item) => this.getLogDetail(item);
        }

        this.useLogsCollection.onLoaded = () => {
            this.useLogsCollection.data.forEach(item => {
                if (parseFloat(item.amount) > 0) {
                    item.amount = "+" + item.amount;
                }
            })
        }
    }

    logCourseVisible: boolean = false;
    logDetail: any = {detail: {}};
    getLogDetail(item: any) {
        this.logDetail = {detail: {}};
        this.http.get("hall/member/admin/member-course-card/employ-detail", { id: item.id }).then(data => {
            this.logDetail = data;
            this.logCourseVisible = true;
        })
    }

    closeLogModal() {
        this.logCourseVisible = false;
    }
    
    cancelCard() {
        // this.cardVisible = false;
        this.visibleChange.emit(false);
        this.memberBindList = [];
        this.redeemCodeList = [];
        this.couponDetail = {};
    }

    showLeaveModal() {
        this.leaveParams = {};
        this.leaveVisible = true;
    }
    leaveParams: any = {};
    bindVisible: boolean = false;
    memberCollection: any = { data: [] };

    setMemberCollection(collection) {
        this.memberCollection = collection;
    }

    // confirmLeave() {
    //     let params: any = {
    //         member_id: this.detail.id,
    //         member_course_card_id: this.detail.id,
    //         postponed: 2, // 1->是 2->否
    //         ...this.leaveParams,
    //     }
    //     if (params.start_date) {
    //         params.start_date = dayjs(params.start_date).format("YYYY-MM-DD");
    //     }
    //     if (params.end_date) {
    //         params.end_date = dayjs(params.end_date).format("YYYY-MM-DD");
    //     }
    //     this.http.post("hall/member/admin-hall/member-course-card/leave", params).then(() => {
    //         this.leaveVisible = false;
    //         this.notification.success("提示信息", "请假成功");
    //         this.getPerationsList();
    //     })
    // }

    cancelLeave(item: any) {
        this.modalService.confirm({
            nzTitle: "确定销假？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-hall/member-course-card/leave-cancel", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "销假成功");
                    this.getPerationsList();
                })
            }
        })
    }

    useLimitOptions = [
        { label: "约团课", value: 1, checked: false },
        { label: "约私教课", value: 2, checked: false },
        // { label: "购卡", value: 3, checked: false },
    ]
    channels: any[] = [
        { label: "兑换", value: 3 },
    ]
    useLimit = [];
    couponVisible: boolean = false;
    couponForm: nyForm;
    
    redeemCodeList: any[] = [];

    codeCollection: any = {};
    currentRedeemCode: any = {};
    codeDetailVisible: boolean = false;
    couponDetail: any = {};

    setCodeCollection(collection) {
        this.codeCollection = collection;
    }

    getCouponDetail () {
        this.http.get("member/admin/coupon/detail", { id: this.detail.coupon_id }).then(data => {
            if (Array.isArray(data.use_limit)) {
                data.use_limit = data.use_limit[0];
            }
            this.couponDetail = Object.assign({}, data);
        })
    }

    showCouponDetail() {
        this.couponForm.body = { ...this.couponDetail };
        this.couponVisible = true;
        this.getRedeemCodeList();
    }

    cancelCreateCoupon() {
        this.couponVisible = false;
        this.couponForm.clearError();
    }

    couponFormInit(form) {

    }
        
    /**
     * 获取兑换码
     */
    getRedeemCodeList() {
        this.http.get("member/admin/coupon/redeem-code/batch-list", { coupon_id: this.detail.coupon_id }).then(data => {
            this.redeemCodeList = data || [];
        })
    }

    redeemCodeDetail(data) {
        this.currentRedeemCode = Object.assign({}, data);
        this.codeDetailVisible = true;
    }

    closeCodeDetail() {
        this.codeDetailVisible = false;
    }


    // 转卡
    params: any = {};
    transformParams: any = {};
    payInfo: any[] = [{}];
    transformVisible: boolean = false;
    hallList: any[] = [];
    courseCardList: any[] = [];
    courseCardSpecsList: any[] = [];

    keyword: string = '';
    pageIndex: number = 1;
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;

    getHallList() {
        this.hallList = this.hallService.getHalls();
    }
    
    getMemberList(name: string = '', isSearch: boolean = false) {
        let params: any = {
            action: "query",
            fields: ["hall_id", "name", "gender", "contact", "source_id", "status"],
            page: this.pageIndex,
            params: [],
            size: 50,
        }
        if (name) {
            params.params.push(["name", "like", name]);
        }
        this.http.post("hall/member/admin-hall/member/list", params).then(ret => {
            if (isSearch) {
                this.memberList = ret.data || [];
            } else {
                this.memberList = this.memberList.concat(ret.data || []);
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

    getMemberPaymentList(isRefresh: boolean = false) {
        if (!isRefresh && this.paymentOptions.length) {
            return ;
        }
        this.memberService.getMemberPaymentList().then(ret => {
            this.paymentOptions = ret.data || [];
        })
    }

    getCourseCardList(isReset = false) {
        let params: any = {
            action: "query",
            fields: ["name", "type", "max_bind", "weight", "course_type", "status"],
            page: 1,
            params: [["status", "=", 1]],
            size: 200,
        }
        let url = "hall/course/admin-hall/course-card/list";
        if (this.transformParams.to_hall_id) {
            url = url + "?hal_id=" + this.transformParams.to_hall_id;
        }
        this.http.post(url, params).then(ret => {
            if (isReset) {
                this.courseCardList = ret.data || [];
            } else {
                this.courseCardList = this.courseCardList.concat(ret.data);
            }
        })
    }

    getCourseCardSpecsList() {
        let params: any = {
            action: "query",
            fields: ["amount", "price", "valid_days", "operator_id", "created_at"],
            page: 1,
            params: [],
            size: 200,
        }
        let currentHall = this.hallService.getCurrentHall();
        let url: string = "hall/course/admin/course-card/specs/list?course_card_id=" + this.transformParams.to_course_card_id;
        url = url + ("&hall_id=" + currentHall.id);
        
        this.http.post(url, params).then((ret) => {
            (ret.data || []).forEach(item => {
                item.label = item.amount + "次/" + parseFloat(item.price) + "元";
            });
            this.courseCardSpecsList = ret.data;
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
        this.getMemberList(this.keyword);
    }

    hallChange() {
        // this.getCourseCardList(true);
        this.calcPrice();
    }

    courseCardChange() {
        this.transformParams.to_course_card_spec_id = null;
        this.transformParams.actual_price = null;
        this.transformParams.pay_money = null;
        this.getCourseCardSpecsList();
    }

    specsChange() {
        this.courseCardSpecsList.forEach(specs => {
            if (specs.id == this.transformParams.to_course_card_spec_id) {
                this.transformParams.actual_price = specs.price;
            }
        })
        this.transformParams.pay_money = this.transformParams.actual_price - parseFloat(this.detail.surplus_value);
    }

    // showTransformModal() {
    //     this.transformVisible = true;
    //     this.tType = { hall: true, member: false, card: false };
    //     this.courseCardList = [];
    //     this.getHallList();
    //     this.getMemberPaymentList();
    //     this.getCourseCardList(true);
    //     if (!this.memberList.length) {
    //         this.getMemberList();
    //     }
    // }

    editTransform(data: any) {
        console.log("data", data);
        this.transformParams = Object.assign({}, data);
        if (data.is_transform_card) {
            this.tType.card = true;
        }
        if (data.is_transform_hall) {
            this.tType.hall = true;
        }
        if (data.is_transform_member) {
            this.tType.member = true;
        }
        this.transformVisible = true;
        this.courseCardList = [];
        this.getHallList();
        this.getMemberPaymentList();
        this.getCourseCardList(true);
        if (!this.memberList.length) {
            this.getMemberList();
        }
        this.getCourseCardSpecsList();
    }

    addPayInfo() {
        this.payInfo.push({});
    }

    removePayInfo(index: number) {
        this.payInfo.splice(index, 1);
    }

    calcPrice() {
        let params: any = {
            member_course_card_id: this.detail.id,
        };
        if (!this.tType.hall) return ;

        if (this.tType.hall) {
            ["to_hall_id"].forEach(key => {
                if (this.transformParams[key]) params[key] = this.transformParams[key];
            })
        }
        if (this.tType.member) {
            ["to_member_id"].forEach(key => {
                if (this.transformParams[key]) params[key] = this.transformParams[key];
            })
        }

        this.http.get("hall/member/admin-hall/member-course-card/transform/pay-money-compute", params).then(ret => {
            if (ret) {
                this.transformParams.pay_money = ret.pay_money;
                this.transformParams.actual_price = ret.price;
            } else {
                this.transformParams.pay_money = 0;
                this.transformParams.actual_price = 0;
            }
        })
    }

    transformCard() {
        if (!this.tType.hall && !this.tType.member && !this.tType.card) {
            this.notification.info("提示信息", "请选择转卡类型");
            return ;
        }
        let params: any = {
            member_course_card_id: this.detail.id,
        };
        let valueKey = ["actual_price", "pay_money", "remark"];
        if (this.tType.hall) {
            params.is_transform_hall = 1;
            valueKey.push("to_hall_id");
        }
        if (this.tType.member) {
            params.is_transform_member = 1;
            valueKey.push("to_member_id");
        }
        if (this.tType.card) {
            params.is_transform_card = 1;
            valueKey.push("to_course_card_id");
            valueKey.push("to_course_card_spec_id");
        }
        valueKey.forEach(key => {
            if (this.transformParams[key]) params[key] = this.transformParams[key];
        })
        this.http.post("hall/member/admin-hall/member-course-card/transform/apply", params).then(() => {
            this.notification.success("提示信息", "转卡申请成功");
            this.transformVisible = false;
            this.transformParams = {};
            this.getPerationsList();
        })
    }

    transformCardPayment() {
        let params: any = {
            id: this.transformParams.id,
            payments: [],
        }
        if (this.paymentMethod == 'one') {
            if (!this.params.payment_id) {
                this.notification.info("提示信息", "请选择支付方式");
                return ;
            }
            params.payments.push({ 
                mode: this.params.payment_id, 
                amount: this.transformParams.pay_money, 
                trade_no: this.params.payment_no 
            })
        } else {
            let payments = this.payInfo.filter(item => item.mode && item.amount);
            let payAmount = payments.reduce((prev, curr) => {
                return prev.amount + curr.amount;
            });
            let needPayAmount = parseInt(this.transformParams.pay_money);
            if (needPayAmount > payAmount || needPayAmount < payAmount) {
                this.notification.info("提示信息", "支付金额填写错误");
                return ;
            }
            params.payments = payments;
        }
        console.log("params", params);
        this.http.post("hall/member/admin-hall/member-course-card/transform/payment", params).then(ret => {
            this.notification.success("提示信息", "转卡成功");
            this.transformVisible = false;
            this.getPerationsList();
            this.params = {};
            this.payInfo = [{}];
            this.transformParams = {};
        })
    }

    cancelTransformCard() {
        this.transformVisible = false;
        this.transformParams = {};
        this.params = {};
        this.payInfo = [{}];
        this.paymentMethod = 'one';
    }

    //  有效期调整

    validVisible: boolean = false;
    validParams: any = {};
    validStartTime: any = '';
    validEndTime: any = '';

    // validDateRange = [];
    effectiveDays: number = 0;
    afterEffectiveDays: number = 0;

    showValidModal() {
    this.effectiveDays = this.detail.balance || 0;
    this.validVisible = true;
    }
 
    validDateChange() {
        let afterEffectiveDays = 0;
      
        let params = {
            member_course_card_id: this.detail.id,
            start_date: dayjs(this.validStartTime).format("YYYY-MM-DD"),
        }
        this.http.post("hall/member/admin/member-course-card/get-card-end-date", params).then(ret => {
            if (ret) {
                this.validEndTime = ret;
                if (differenceInCalendarDays(this.validStartTime, new Date()) < 0) {
                    afterEffectiveDays = differenceInCalendarDays(this.validEndTime, new Date()) + 1;
                } else {
                    afterEffectiveDays = differenceInCalendarDays(this.validEndTime, this.validStartTime) + 1;
                }
                this.afterEffectiveDays = afterEffectiveDays;
            }
        })

    }
 
    saveValid() {
        let params = Object.assign({ member_course_card_id: this.detail.id }, this.validParams);
        if (this.validStartTime) {
            params.start_date_after = dayjs(this.validStartTime).format("YYYY-MM-DD");
        }
        if (this.validEndTime) {
            params.end_date_after = dayjs(this.validEndTime).format("YYYY-MM-DD");
        }

        this.http.post("hall/member/admin/member-course-card/validate-adjust", params).then(() => {
            this.closeValidModal();
            this.notification.success("提示信息", "调整成功");
            this.getCardInfo(this.detail.id);
        })
    }

    closeValidModal() {
        this.validVisible = false;
        this.validParams = {};
        this.validStartTime = '';
        this.validEndTime = '';
    }

}
