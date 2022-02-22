import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { HallService, MemberService, FileService } from '@/providers/index';
import * as dayjs from 'dayjs';
import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { Config } from '@/config';
import { Console } from 'console';
import { async } from '@angular/core/testing';
import { TurnCardComponent } from '../turn-card/turn-card.component';

@Component({
    selector: 'member-course-card-detail',
    templateUrl: './card-detail.html',
    styleUrls: ['./card-detail.scss']
})

export class MemberCourseCardDetailComponent implements OnInit, OnChanges {
    @Input("visible") cardVisible: boolean;
    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    @Input("member") detail: any = {};
    
    @ViewChild('turnCard') turnCard: TurnCardComponent;
    leaveVisible: boolean = false;
    earlierEmployLogVisible: boolean = false;
    earlierEmployLogData = [];
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
        refund: [],
        surplusValueAdjust: [],
    }

    tType: any = {
        hall: false,
        member: false,
        card: false,
    }
    // 1 -> 次卡 2 -> 期限卡
    courseCardType: number;

    memberMaxBind: number = 0;
    ossPath: string = "";
    // 解绑，与设置为主卡人
    setIsVisible = false;
    unbindIsVisible = false
    unbindParams = {};
    setCareParams = {
        id: '',
        member_id: '',
    };
    setCardDate = {
        member_course_card_id: '',
    };
    memberNum: number = null;


    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private hallService: HallService,
        private memberService: MemberService,
        private fileService: FileService,
        private modalService: NzModalService,
        private cd: ChangeDetectorRef
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    /****************** 详情 ************************/
    public priceModifyModalVisible = false;
    public priceAdjust: any = {};
    public priceForm: nyForm;
    public lookOverIsVisible = false;
    public LookOverDetailsImg = '';

    // 附件上传
    public detailUploadImg = (item) => {
        const formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        };

        this.isUploadLoading = true;
        return new Observable((observer) => {
            this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
                if (!this.detail.appendixes) {
                    this.detail.appendixes = [];
                }
                this.detail.appendixes.push(urls[0]);
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    }

    public removEappendixes(index) {
        this.detail.appendixes.splice(index, 1);
    }

    public lookOver(index) {
        this.lookOverIsVisible = true;
        this.LookOverDetailsImg = this.detail.appendixes[index];
        console.log(this.LookOverDetailsImg);
    }

    public cancelLookOverDetailsModal() {
        this.lookOverIsVisible = false;
    }

    public async fileUpload() {
        const params = {
            id: this.detail.id,
            appendixes: this.detail.appendixes,
        }
        const data = await this.http.post('hall/member/admin-hall/member-course-card/upload-appendixes', params);
        if (data) {
            this.getCardInfo(this.detail.id, true);
            this.notification.success('提示信息', '附件上传成功');
        }
    }

    public pricemodify() {
        this.priceModifyModalVisible = true;
        this.priceForm.body = Object.assign({}, this.detail);
        this.priceForm.body.surplus_price = (this.priceForm.body.unit_price * this.priceForm.body.balance).toFixed(3);
    }

    public priceModifyModalOK() {
        this.priceForm.action = 'hall/member/admin-hall/member-course-card/unit-price-change/apply';
        this.priceForm.submit().then(res => {
            this.notification.success('提示信息', '修改请求提交成功，请等待审核！');
            this.cancelPriceModifyModal();
        })
    }

    public cancelPriceModifyModal() {
        this.priceModifyModalVisible = false;
        this.priceForm.body = {};
    }

    public priceFormInt() {
        this.priceForm.request = this.http.request.bind(this.http);
        this.priceForm.onSubmit = body => {
            body.member_course_card_id = this.detail.id;
        }
    }

    public priceModifyCount(event) {
        if (event.name == 'surplus_price') {
            this.priceForm.body.unit_price = (event.value / this.priceForm.body.balance).toFixed(3);
        } else if (event.name == 'unit_price') {
            this.priceForm.body.surplus_price = (event.value * this.priceForm.body.balance).toFixed(3);
        }
    }

    public setPriceAdjustCollection(collection) {
        this.priceAdjust = collection;
    }

    public cancelPriceAdjust(item) {
        this.modalService.confirm({
            nzTitle: '确定取消调整?',
            nzOnOk: async () => {
                try {
                    await this.http.post('hall/member/admin-hall/member-course-card/unit-price-change/cancel', { change_log_id: item.id });
                    this.notification.success('提示信息', '取消成功');
                    this.priceAdjust.load();
                } catch (error) { }
            }
        })
    }


    /*****************************退卡功能***************************************/
    // 退卡
    retreatCardVisible = false;
    retreatCardParams: any = {
        date: new Date(),
        commission: null,
    };
    form: nyForm;
    disabledVisible = false;

    // 退卡对话框
    retreatCard() {
        this.hasRefundMoney = true;
        this.params = {};
        this.imageList = [];
        this.retreatCardParams = {
            date: new Date(),
            rate: 0.05,
            refund_price: null
        }
        this.form.body = { ...this.retreatCardParams };
        this.retreatCardVisible = true;
        this.isShowDetail = false;
        this.surplusValue();
        this.getMemberPaymentList();
        this.retreatCardRateChange();
        this.commisSionBlur();

    }

    //关闭退卡对话框
    cancelRetreatCard() {
        this.retreatCardVisible = false;
    }

    // 退卡申请
    async retreatCardPly() {
        let params = {
            appendixes: this.imageList,
            ...this.retreatCardParams,
            member_course_card_id: this.detail.id
        }
        params.date = dayjs(params.date).format("YYYY-MM-DD");

        this.http.post('hall/member/admin-hall/member-course-card/refund/apply', params).then(ret => {
            this.notification.success("提示信息", "退卡申请成功");
            this.retreatCardVisible = false;
            this.imageList = [];
            this.retreatCardParams = {
                date: new Date(),
            }

            this.getPerationsList();
            this.refreshCardInfo(this.detail.id);
        }).catch(error => {
            this.form.setError(error.error.data)
        });
    }

    // 退卡申请，详情
    editretreatCard(data) {
        if (data.appendixes && data.appendixes.length) {
            this.imageList = data.appendixes || [];
        }
        this.retreatCardParams = {}
        this.retreatCardParams = Object.assign({}, data);

        this.retreatCardVisible = true
    }

    // 计算总价格
    commisSionBlur() {
        if (this.retreatCardParams.commission) {
            this.retreatCardParams.pay_money = (parseFloat(this.retreatCardParams.refund_price) - this.retreatCardParams.commission).toFixed(2);
        } else {
            this.retreatCardParams.pay_money = this.retreatCardParams.refund_price
        }
    }

    //计算价格
    surplusValue() {
        if (this.retreatCardParams.refund_price) {
            this.retreatCardParams.refund_price = this.retreatCardParams.refund_price
        } else {
            this.retreatCardParams.refund_price = this.detail.surplus_value
        }
    }

    // 价格改变
    retreatCardPriceChange() {
        let commission = this.retreatCardParams.rate * parseFloat(this.retreatCardParams.refund_price);
        this.retreatCardParams.commission = commission.toFixed(2);
        this.retreatCardParams.pay_money = (parseFloat(this.retreatCardParams.refund_price) - this.retreatCardParams.commission).toFixed(2);
    }

    // 费率改变
    retreatCardRateChange() {
        if (this.retreatCardParams.rate) {
            let commission = this.retreatCardParams.rate * parseFloat(this.retreatCardParams.refund_price);
            this.retreatCardParams.commission = commission.toFixed(2);
        } else {
            this.retreatCardParams.commission = 0
        }
        this.retreatCardParams.pay_money = (parseFloat(this.retreatCardParams.refund_price) - this.retreatCardParams.commission).toFixed(2);
    }

    // 手续费改变
    retreatCardCommissionChange() {
        let price = this.retreatCardParams.refund_price;
        if (!price) {
            this.retreatCardParams.rate = 0;
        } else {
            if (this.retreatCardParams.commission) {
                let rate = this.retreatCardParams.commission / price;
                this.retreatCardParams.rate = rate.toFixed(4)
            } else {
                this.retreatCardParams.rate = 0;
            }
        }
        this.retreatCardParams.pay_money = (parseFloat(this.retreatCardParams.refund_price) - this.retreatCardParams.commission).toFixed(2);
    }
    // 日期选择
    onChangeDate(ev) {
        this.retreatCardParams.date = ev
    }

    // 刷新卡的信息
    refreshCardInfo(id) {
        this.http.get("hall/member/admin-hall/member-course-card/detail", { id: id }).then(ret => {
            this.detail = ret;
            console.log(this.detail.status)
            this.disabledVisible = false;
            if (this.detail.status !== 10) {
                this.disabledVisible = true;
                return;
            } else {
                this.disabledVisible = false;
            }

        })
    }

    /******************************************设为主卡人***************************************************** */
    // 设置为主卡人
    setMaster(data) {
        this.setCardDate.member_course_card_id = data.member_course_card_id;
        this.setIsVisible = true;
        this.setCareParams.id = data.member_course_card_id,
            this.setCareParams.member_id = data.member_id

    }

    // 关闭对话框
    unbindHandleCancel() {
        this.unbindIsVisible = false
    }

    // 解绑对话框
    unbindAndleOk() {
        this.http.post("hall/member/admin-hall/member-course-card/member-binding/unbound", this.unbindParams).then((res) => {
            this.notification.success("提示信息", "解绑成功");
            this.getMemberBindList();
            this.unbindIsVisible = false;
        })
    }
    // 关闭设为主卡人对话框
    setHandleCancel() {
        this.setIsVisible = false;
    }
    setAndleOk() {
        console.log(this.setCareParams, this.setCardDate.member_course_card_id);
        this.http.post("hall/member/admin-hall/member-course-card/set-master", this.setCareParams).then((res) => {
            console.log(res);

            // 刷新列表
            this.getMemberBindList();
            // 刷新全局数据
            this.getCardInfo(this.setCardDate.member_course_card_id);
            this.setIsVisible = false;
            this.notification.success("提示信息", "主卡人设置成功");
        })
    }


    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getMemberList(value, true);
        });
    }
    /******************************************************修改会籍*****************************************************************/
    // 修改会籍操作
    amendIsVisible = false;
    salesmanList: any[] = [];
    selectDate = null;

    amendeMbership() {
        this.amendIsVisible = true;
    }

    amendHandleCancel() {
        this.amendIsVisible = false;
        this.selectDate = null
    }

    // 确认对话框
    amendAndleOk() {
        console.log(this.detail.member_id, this.selectDate);
        let params: any = {
            id: this.detail.id,
            salesman_id: this.selectDate
        }
        this.http.post('hall/member/admin-hall/member-course-card/update-salesman', params).then(res => {
            if (res === "success") {
                this.notification.success("提示信息", "更改会籍成功");
                this.TansferCollection.load();
                this.getCardInfo(this.detail.id)
                this.amendIsVisible = false;
                this.selectDate = null
            }
        })
    }

    // 获取下拉的选框数据转会
    getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            this.salesmanList = data;
        })
    }

    // 获取转会记录
    TansferCollection: any = {};

    setTansferCollection(collection) {
        this.TansferCollection = collection;
    }

    ngOnChanges(val: SimpleChanges) {
        if (val.detail && val.detail.currentValue.id) {
            this.detail.courseCard = {};
            this.getCardInfo(this.detail.id);
            this.getMemberBindList();

            this.getSalesmanList();
        }

    }

    getCardInfo(id, isUploadImg?) {
        this.http.get("hall/member/admin-hall/member-course-card/detail", { id: id }).then(ret => {
            this.detail = ret;
            this.memberMaxBind = ret.courseCard.max_bind || 0;
            this.courseCardType = ret.courseCard.type;
            if (ret.coupon_id) { // 有设置优惠券
                this.getCouponDetail();
                this.getRedeemCodeList();
            }
            if (!isUploadImg) {
                this.getPerationsList();
            }

            this.disabledVisible = false;
            if (this.detail.status !== 10) {
                this.disabledVisible = true;
                return;
            } else {
                this.disabledVisible = false;
            }
        })
    }

    getMemberBindList() {
        this.http.get("hall/member/admin-hall/member-course-card/member-binding/list", { id: this.detail.id }).then(data => {
            this.memberBindList = data;
            // 过滤掉已绑卡操作
            let newArr = data.filter(item => {
                return item.deleted_at == null
            })
            this.memberNum = newArr.length
        })
    }

    // 操作记录
    getPerationsList() {
        this.http.get("hall/member/admin-hall/member-course-card/operations", { id: this.detail.id }).then(ret => {
            this.handleLog = ret;
        }).catch(err => {
            console.log("操作记录err", err);
        });
        //this.getCardInfo(this.detail.id)
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
    logDetail: any = { detail: {} };
    getLogDetail(item: any) {
        this.logDetail = { detail: {} };
        this.http.get("hall/member/admin-hall/member-course-card/employ-detail", { id: item.id }).then(data => {
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
    memberPageIndex: number = 1;
    memberTotal: number = 0;
    memberKeyword: string = '';
    allMemberList: any[] = [];
    isMemberLoading: boolean = false;

    showBindModal() {
        this.memberPageIndex = 1;
        this.memberTotal = 0;
        this.bindVisible = true;
        this.getAllMemberList();
    }
    getAllMemberList() {
        this.isMemberLoading = true;
        let params: any = {
            page: this.memberPageIndex,
            size: 10,
        };
        if (this.memberKeyword) {
            params.keyword = this.memberKeyword;
        }

        this.http.post("hall/member/common/member/list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
            this.allMemberList = ret.data || [];
            this.memberTotal = ret.total;
            this.isMemberLoading = false;
            this.memberPageIndex = ret.current_page;
        })
    }

    searchMemberByAll() {
        this.memberPageIndex = 1;
        this.getAllMemberList();
    }

    memberPageIndexChange() {
        this.getAllMemberList();
    }

    bindMember(member: any) {
        let params: any = {
            id: this.detail.id,
            member_id: member.id,
        }
        this.http.post("hall/member/admin-hall/member-course-card/member-binding", params).then(() => {
            this.notification.success("提示信息", "绑定成功");
            this.getMemberBindList();
        })
    }


    // 设置次数
    setNumberVisible: boolean = false;
    setNumberValue: any = 0;
    setMemberId: any;
    showSetNumberModal(data) {
        this.setNumberVisible = true;
        this.setMemberId = data.member_id;
        this.setNumberValue = data.allocations_times || 0;
    }

    closeSetNumber() {
        this.setNumberVisible = false;
        this.setNumberValue = 0;
        this.setMemberId = null;
    }

    confirmSetNumber() {
        let params = {
            member_course_card_id: this.detail.id,
            member_id: this.setMemberId,
            allocations_times: this.setNumberValue,  //分配的次数
        }
        this.http.post("hall/member/admin-hall/member-course-card/set-member-allocations-times", params).then(ret => {
            this.notification.success("提示信息", "分配成功");
            this.closeSetNumber();
            this.getMemberBindList();
        }).catch(error => {

        })
    }

    unBindMember(data) {
        this.unbindParams = {
            id: data.member_course_card_id,
            member_id: data.member_id,
        }
        this.unbindIsVisible = true;
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
    generateParams: any = {};
    generateVisible: boolean = false;

    codeCollection: any = {};
    currentRedeemCode: any = {};
    codeDetailVisible: boolean = false;
    couponDetail: any = {};

    showCreateCouponModal() {
        this.couponVisible = true;
        this.useLimitOptions.forEach(item => {
            item.checked = false;
        })
        this.couponForm.body = {};
    }

    setCodeCollection(collection) {
        this.codeCollection = collection;
    }

    getCouponDetail() {
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

    couponFormInit(form) {
        this.couponForm.request = this.http.request.bind(this.http);
        this.couponForm.onSubmit = (body) => {
            body.member_course_card_id = this.detail.id;
            // if (!this.detail.coupon_id) {
            //     body.member_course_card_id = this.detail.id;
            // } else {
            //     body.id = this.couponDetail.id;
            // }
            if (body.use_limit) {
                body.use_limit = [body.use_limit];
            }
            // body.use_limit = this.useLimitOptions.filter(item => item.checked).map(item => item.value);
        }
    }

    saveCoupon() {
        if (this.detail.coupon_id) {
            this.couponForm.action = "hall/member/admin-hall/member-course-card/coupon-update";
        } else {
            this.couponForm.action = "hall/member/admin-hall/member-course-card/coupon-create";
        }
        this.couponForm.submit().then((ret) => {
            this.couponVisible = false;
            if (ret.coupon_id) {
                this.detail.coupon_id = ret.coupon_id;
            }
            if (this.detail.coupon_id) {
                this.getCouponDetail();
            }
            this.notification.success("提示信息", this.detail.coupon_id ? '修改成功' : "创建成功");
        })
    }

    cancelCreateCoupon() {
        this.couponVisible = false;
        // this.useLimitOptions.forEach(item => {
        //     item.checked = false;
        // })
        this.couponForm.clearError();
    }

    showGenerateModal() {
        this.generateParams = {};
        this.generateVisible = true;
    }

    cancelGenerate() {
        this.generateVisible = false;
    }

    isInTheGenerate: boolean = false;
    confirmGenerate() {
        if (this.isInTheGenerate) return ;
        this.isInTheGenerate = true;
        let params = Object.assign({ coupon_id: this.detail.coupon_id }, this.generateParams);

        this.http.post("member/admin/coupon/redeem-code/create", params).then(ret => {
            this.notification.success("提示信息", "生成成功");
            this.generateParams = {};
            this.generateVisible = false;
            this.getRedeemCodeList();
            this.isInTheGenerate = false;
        }).catch(error => this.isInTheGenerate = false);
    }

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


    confirmLeave() {
        let params: any = {
            member_id: this.detail.id,
            member_course_card_id: this.detail.id,
            postponed: 2, // 1->是 2->否
            ...this.leaveParams,
        }
        if (params.start_date) {
            params.start_date = dayjs(params.start_date).format("YYYY-MM-DD");
        }
        if (params.end_date) {
            params.end_date = dayjs(params.end_date).format("YYYY-MM-DD");
        }
        this.http.post("hall/member/admin-hall/member-course-card/leave", params).then(() => {
            this.leaveVisible = false;
            this.notification.success("提示信息", "请假成功");
            this.getPerationsList();
        })
    }

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
    /*******************=*************转卡*************************/
    refreshCarInfo() {
        this.getPerationsList(); 
        this.refreshCardInfo(this.detail.id);
    }
    // 转卡
    params: any = {};
    transformParams: any = {};
    payInfo: any[] = [{}];
    pageIndex: number = 1;
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;

    imageList: any[] = [];

    isShowDetail: boolean = false;

    getMemberList(name: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
        };
        if (name) {
            params.keyword = name;
        }
        this.http.post("hall/member/common/member/list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
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
            return;
        }
        this.memberService.getMemberPaymentList().then(ret => {
            this.paymentOptions = ret.data || [];
        })
    }

    removeFile(index) {
        this.imageList.splice(index, 1)
    }

    isUploadLoading: boolean = false;

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isUploadLoading = true;

        return new Observable((observer) => {
            this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
                this.imageList.push(urls[0]);
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    };

    // 转卡对话框
    showTransformModal() {
        this.turnCard.showTransformModal();
    }

    hasRefundMoney: boolean = true;

    transformDetail(data, isDetail = false, type?: string) {

        if (this.paymentOptions.length == 0) {
            this.getMemberPaymentList()
        }
        this.isShowDetail = isDetail;

        // 退卡申请详情
        if (type == 'retreatCard') {
            this.http.get("hall/member/admin-hall/member-course-card/refund/detail", { order_id: data.id }).then(res => {
                this.params = {}
                this.editretreatCard(res);
                this.hasRefundMoney = !!parseFloat(res.pay_money);
                if (isDetail && res.payments && res.payments.length) {
                    if (res.payments.length == 1) {
                        this.paymentMethod = "one";
                        this.params.trade_no = res.payments[0].trade_no;
                        this.params.payment_id = res.payments[0].channel;
                    } else {
                        this.paymentMethod = "multiple";
                        this.payInfo = res.payments.map(item => {
                            return { mode: item.channel, amount: item.amount, trade_no: item.trade_no };
                        })
                    }
                }
            })
            return;
        }else { 
            // 转卡申请详情
            this.turnCard.transformDetail(data, isDetail)
        }
    }

    cancelTransform(data, type?: string) { // 取消转卡
        this.modalService.confirm({
            nzTitle: `确认取消${type == 'retreatCard' ? '退卡' : '转卡'}？`,
            nzOnOk: () => {
                if (type == 'retreatCard') {
                    this.http.post("hall/member/admin-hall/member-course-card/refund/cancel", { order_id: data.id }).then((res) => {
                        if (res == 'success') {
                            this.notification.success("提示信息", "取消成功");
                            this.getPerationsList();
                            this.refreshCardInfo(this.detail.id);
                        }
                    })
                } else {
                    this.http.post("hall/member/admin-hall/member-course-card/transform/cancel", { id: data.id }).then(() => {
                        this.notification.success("提示信息", "取消成功");
                        this.getPerationsList();
                        this.refreshCardInfo(this.detail.id);
                    })
                }
            }
        })


    }

    addPayInfo() {
        this.payInfo.push({});
    }

    removePayInfo(index: number) {
        this.payInfo.splice(index, 1);
    }

    //支付方式
    transformCardPayment() {
        let params: any;
        params = {
            order_id: this.retreatCardParams.id,
        }

        if (this.hasRefundMoney) { // 没有退卡金额不传 支付信息
            params.payments = [];
            if (this.paymentMethod == 'one') {
                if (!this.params.payment_id) {
                    this.notification.info("提示信息", "请选择支付方式");
                    return;
                }
            
                params.payments.push({
                    mode: this.params.payment_id,
                    amount: parseFloat(this.retreatCardParams.pay_money),
                    trade_no: this.params.trade_no
                })

            } else {
                let payments = this.payInfo.filter(item => item.mode && item.amount);
                let payAmount = 0;
                if (payments.length >= 2) {
                    payAmount = payments.reduce((prev, curr) => {
                        return prev.amount + curr.amount;
                    });
                } else if (payments.length) {
                    payAmount = payments[0].amount || 0;
                }
                let needPayAmount = parseFloat(this.transformParams.pay_money);
                if (needPayAmount > payAmount || needPayAmount < payAmount) {
                    this.notification.info("提示信息", "支付金额填写错误");
                    return;
                }
                params.payments = payments;
            }
        }
      
        this.http.post("hall/member/admin-hall/member-course-card/refund/payment", params).then(ret => {
            this.notification.success("提示信息", "退卡成功");
            this.retreatCardVisible = false;
            this.getPerationsList();
            this.params = {};
            this.payInfo = [{}];
            this.retreatCardParams = {
                date: new Date(),
            }
            this.refreshCardInfo(this.detail.id);
        })

    }

    disabledPaymentDate = (endValue: Date): boolean => {
        return differenceInCalendarDays(endValue, new Date()) > 0;
    };

    // 权益调整
    adjustType: number = 1;
    adjustParams: any = {};
    adjustVisible: boolean = false;
    paymentMode: 'one' | 'multiple' = 'one';
    multiplePaymentMode: any[] = [{}];
    adjustPayment: any = {};

    showAdjustModal() {
        this.adjustParams = {};
        this.adjustVisible = true;
        this.paymentMode = 'one';
        this.multiplePaymentMode = [{}];
        this.adjustPayment = {};
        this.adjustType = 1;
        this.getMemberPaymentList();
    }

    closeAdjustModal() {
        this.adjustVisible = false;
        this.adjustType = 1;
    }

    adjustDetailModal(data: any) {
        this.getMemberPaymentList();
        this.adjustParams = Object.assign({}, data);

        this.setAdjustPayments(data);

        this.adjustVisible = true;
    }

    setAdjustPayments(data: any = {}) {
        if (data.payments.length > 1) {
            this.paymentMode = 'multiple';
            this.multiplePaymentMode = data.payments.map(item => {
                return {
                    mode: item.channel, trade_no: item.trade_no, amount: item.amount
                };
            })
        } else if (data.payments.length > 0) {
            this.paymentMode = 'one';
            let payment = data.payments[0];
            this.adjustPayment = { mode: payment.channel, trade_no: payment.trade_no, amount: payment.amount };
        }
    }

    refreshAdjustDetail(data) {
        console.log("refreshAdjustDetail", data);
        if (data && data.payments) {
            this.setAdjustPayments(data);
        }
    }

    addPaymentMode() {
        this.multiplePaymentMode.push({});
    }

    removePaymentMode(index: number) {
        this.multiplePaymentMode.splice(index, 1);
    }

    adjust(continueSubmit = false) {
        let params: any = Object.assign({ member_course_card_id: this.detail.id, }, this.adjustParams);
        if (params.pay_money && !this.adjustType) {

        }
        if (!this.adjustType) {
            params.amount = -params.amount;
        }

        if (this.paymentMode == 'one') {
            if (!this.adjustPayment.mode) {
                this.notification.info("提示信息", "请选择支付方式");
                return;
            }
            params.payments = [{
                mode: this.adjustPayment.mode,
                amount: params.pay_money,
                trade_no: this.adjustPayment.trade_no
            }]
        } else {
            let payments = this.multiplePaymentMode.filter(item => item.mode && item.amount);
            params.payments = payments;
        }
        if (continueSubmit) {
            params.is_submit = true;
        }

        this.http.post("hall/member/admin-hall/member-course-card/adjust", params).then(ret => {
            if (ret.balance_insufficient) {
                this.showConfirmSubmit();
            } else {
                this.closeAdjustModal();
                this.notification.success("提示信息", "调整成功");
                this.detail.balance = parseFloat(this.detail.balance) + params.amount;
                // this.detail.surplus_value = parseFloat(this.detail.surplus_value) + params.pay_money;
                this.getPerationsList();
                this.refreshCardInfo(this.detail.id);
                if (params.is_submit) {
                    this.getMemberBindList();
                }
            }
        })
    }

    showConfirmSubmit() {
        this.modalService.confirm({
            nzTitle: "提示信息",
            nzContent: "当前余额少于会员已分配次数，继续调整将清除分配次数，是否继续?",
            nzMask: false,
            nzOnOk: () => {
                this.adjust(true);
            }
        });
    }

    adjustTypeChange() {
        this.asjustAmountChange();
    }

    asjustAmountChange() {
        if (!this.adjustParams.amount) {
            // || !this.detail.surplus_value
            this.adjustParams.pay_money = 0;
            return;
        }
        // let money = parseFloat(this.detail.surplus_value)/parseFloat(this.detail.balance) * this.adjustParams.amount;
        // this.adjustParams.pay_money = money.toFixed(2);
        let params = {
            member_course_card_id: this.detail.id,
            amount: this.adjustParams.amount,
        }
        this.http.get("hall/member/admin-hall/member-course-card/adjust-pay-money-compute", params).then(data => {
            if (this.adjustType) {
                this.adjustParams.pay_money = data;
            } else {
                this.adjustParams.pay_money = -data;
            }
        })
    }

    //  有效期调整

    validVisible: boolean = false;
    validParams: any = {};
    validDateRange = [];
    effectiveDays: number = 0;
    afterEffectiveDays: number = 0;

    showValidModal() {
        if (this.courseCardType == 1) { // 次卡计算有效期
            let effectiveDays = differenceInCalendarDays(this.detail.end_date, new Date());
            if (effectiveDays < 0) {
                this.effectiveDays = 0;
            } else {
                this.effectiveDays = effectiveDays + 1;
            }
        } else {
            this.effectiveDays = this.detail.balance || 0;
        }
        this.validVisible = true;
    }

    validDateChange() {
        let afterEffectiveDays = 0;
        if (differenceInCalendarDays(this.validDateRange[0], new Date()) < 0) { // 开始日期是今天以前
            afterEffectiveDays = differenceInCalendarDays(this.validDateRange[1], new Date()) + 1;
        } else {
            afterEffectiveDays = differenceInCalendarDays(this.validDateRange[1], this.validDateRange[0]) + 1;
        }

        this.afterEffectiveDays = afterEffectiveDays;
    }

    saveValid() {
        let params = Object.assign({ member_course_card_id: this.detail.id }, this.validParams);
        if (this.validDateRange.length) {
            params.start_date_after = dayjs(this.validDateRange[0]).format("YYYY-MM-DD");
            params.end_date_after = dayjs(this.validDateRange[1]).format("YYYY-MM-DD");
        }
        this.http.post("hall/member/admin-hall/member-course-card/validate-adjust", params).then(() => {
            this.closeValidModal();
            this.notification.success("提示信息", "调整成功");
            this.getCardInfo(this.detail.id);
        })
    }

    closeValidModal() {
        this.validVisible = false;
        this.validParams = {};
        this.validDateRange = [];
    }

    // 停卡
    stopCardVisible: boolean = false;
    stopCardRemark: string = "";
    recoverForm: nyForm;

    // 恢复

    adjustdateData: any = {
        adjust_date: false,
        to_end_date: null
    };
    isShowReminder: boolean = false;

    DateonChange(ev) {
        this.adjustdateData.to_end_date = ev;
    }
    async showStopCartModal() {
        this.recoverForm.body.to_end_date = new Date();
        this.stopCardVisible = true;

        if (this.detail.status == -10) {
            let params = {
                hall_id: this.detail.hall_id,
                member_course_card_id: this.detail.id,
            }
            const data = await this.http.get('hall/member/admin-hall/member-course-card/get-recovery-end-date', params);
            if (data.to_end_date) {
                this.recoverForm.body.to_end_date = data.to_end_date;
                this.isShowReminder = false;
            } else {
                this.isShowReminder = true;
            }
            // this.recoverForm.body.to_end_date = data.to_end_date;
            console.log(data);
        }
    }

    onFormInit(form) {

        this.recoverForm.request = this.http.request.bind(this.http);
        this.recoverForm.onSubmit = (body) => {
            body.member_course_card_id = this.detail.id;

            if (this.stopCardRemark) {
                body.remark = this.stopCardRemark;
            }

            if (body.to_end_date) {
                body.to_end_date = dayjs(body.to_end_date).format("YYYY-MM-DD");
            }
        }
    }

    changeCardStatus() {
        if (this.detail.status == -10) {
            this.recoverForm.action = "hall/member/admin-hall/member-course-card/recovery";
        } else {
            this.recoverForm.action = "hall/member/admin-hall/member-course-card/stop";
        }

        this.recoverForm.submit().then(res => {
            if (this.detail.status == -10) { // 当前是停卡状态
                this.notification.success("提示信息", "恢复成功");
            } else {
                this.notification.success("提示信息", "停卡成功");
            }
            this.cancelStopCart();
            this.getPerationsList();
            this.refreshCardInfo(this.detail.id);
        })
    }

    cancelStopCart() {
        this.stopCardVisible = false;
        this.stopCardRemark = "";
        this.transformParams = {};
        this.isShowReminder = false;
    }

    showEarlierEmployLog(data) {
        this.earlierEmployLogVisible = true;
        this.http.post("hall/member/admin-hall/member-course-card/earlier-employ-log", {
            'id': data.member_course_card_id,
            'created_at': data.created_at,
        }).then(ret => {
            this.earlierEmployLogData = ret;

        }).catch(() => {
            this.earlierEmployLogVisible = false;
        });
    }

    closeEarlierLog() {
        this.earlierEmployLogVisible = false;
        this.earlierEmployLogData = [];
    }

    // 合同
    public contract: any;


    // 剩余价值调整
    surplusVisible: boolean = false;
    surplusParams: any = {};

    showSurplusModal() {
        this.surplusParams = {};
        this.surplusVisible = true;
    }

    confirmAdjustSurplus() {
        let params = Object.assign({
            member_course_card_id: this.detail.id,
        }, this.surplusParams);

        this.http.post("hall/member/admin-hall/member-course-card/surplus-value-adjust/apply", params).then(ret => {
            this.notification.success("提示信息", "调整成功");
            this.getPerationsList();
            this.refreshCardInfo(this.detail.id);

            this.surplusVisible = false; 
            this.surplusParams = {};
        })
    }

    cancelSurplusAdjust(data: any) {
        this.modalService.confirm({
            nzTitle: `确认取消剩余价值调整？`,
            nzOnOk: () => {
                this.http.post("hall/member/admin-hall/member-course-card/surplus-value-adjust/cancel", { id: data.id }).then(ret => {
                    this.notification.success("提示信息", "取消成功");
                    this.getPerationsList();
                });
            }
        })
    }

}
