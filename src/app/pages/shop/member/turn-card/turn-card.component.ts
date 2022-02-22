import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HallService, MemberService, FileService } from '@/providers/index';
import { Auth, Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Subject, Observable } from 'rxjs';
import { Config } from '@/config';
import * as dayjs from 'dayjs';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import { debounceTime } from 'rxjs/operators';
@Component({
    selector: 'app-turn-card',
    templateUrl: './turn-card.component.html',
    styleUrls: ['./turn-card.component.scss']
})
export class TurnCardComponent implements OnInit {

    @Input('detail') detail;

    @Input('courseCardType') courseCardType;

    @Output() refresh = new EventEmitter();
    @Output() adjustEvent: EventEmitter<any> = new EventEmitter();

    public user: any = {};

    // 转卡
    public params: any = {};
    public transformParams: any = {};
    public payInfo: any[] = [{}];
    public transformVisible: boolean = false;
    public hallList: any[] = [];
    public courseCardList: any[] = [];
    public courseCardSpecsList: any[] = [];
    public paymentTime = new Date();
    public keyword: string = '';
    public pageIndex: number = 1;
    public searchChange$ = new Subject<any>();
    public isLoading: boolean = false;
    public haveMoreMember: boolean = false;
    public selectCardType: number;
    public ossPath: string = "";
    public tType: any = {
        hall: false,
        member: false,
        card: false,
    }
    public isUploadLoading: boolean = false;

    public paymentMethod: 'one' | 'multiple' = "one";

    public imageList: any[] = [];

    public salesmanListData: any[] = [];
    public isShowDetail: boolean = false;

    public changNewCardPrice: number = null;

    public isCustomSpecs: boolean = true;

    public paymentOptions: Array<any> = [];

    public memberList: Array<any> = [];

    public transformPrice: number = 0; // 后台返回的支付补差

    public isDisableAdjust: boolean = true;

    constructor(
        private http: Http,
        private hallService: HallService,
        private memberService: MemberService,
        private fileService: FileService,
        private modalService: NzModalService,
        private notification: NzNotificationService,
        private auth: Auth,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        });
        this.user = this.auth.user();
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getMemberList(value, true);
        });

    }

    /**
     * 获取会馆数据
     */
    public getHallList() {
        let currentHall = this.hallService.getCurrentHall();
        let params = {
            action: "query",
            fields: ["name", "phone", "full_address", "email", "status"],
            page: 1,
            params: [],
            size: 200,
        }
        this.http.post("hall/admin-hall/list", params).then(ret => {
            this.hallList = (ret.data || []).filter(item => item.id != currentHall.id);
        })
    }

    public getMemberPaymentList(isRefresh: boolean = false) {
        if (!isRefresh && this.paymentOptions.length) {
            return;
        }
        this.memberService.getMemberPaymentList().then(ret => {
            this.paymentOptions = ret.data || [];
        })
    }

    /**
     * 获取会员数据
     * @param name 
     * @param isSearch 是否重置
     */
    private getMemberList(name: string = '', isSearch: boolean = false) {
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

    /**
     * 获取课程卡数据
     */
    private getCourseCardList() {
        let params: any = {};
        if (this.tType.hall && this.transformParams.to_hall_id) {
            params.hall_id = this.transformParams.to_hall_id;
        }
        this.http.get("hall/course/admin/course-card/get-available", params).then(data => {
            data.forEach(card => {
                (card.specs || []).forEach(specs => {
                    if (card.type == 1) {
                        specs.label = specs.amount + "次/" + parseFloat(specs.price) + "元";
                    } else {
                        specs.label = specs.amount + "天/" + parseFloat(specs.price) + "元";
                    }
                })
            });
            this.courseCardList = data;
            if (this.transformParams.to_course_card_id) {
                this.getCourseCardSpecsList();
            }
        })
    }

    refreshDetail() {
        this.transformDetail(this.transformParams, this.isShowDetail);
    }

    private getCourseCardSpecsList() {
        let courseCard = this.courseCardList.find(card => card.id == this.transformParams.to_course_card_id);
        if (courseCard) {
            this.courseCardSpecsList = [...courseCard.specs, { label: "自定义", id: -1, status: 1 }];
            this.selectCardType = courseCard.type;
        }
    }

    /**
     * 获取销售列表
     */
    private getSalesmanListData() {
        let params: any = {};

        if (this.tType.hall && this.transformParams.to_hall_id) {
            params.hall_id = this.transformParams.to_hall_id;
        }

        this.http.get("staff/manage/getsalesmanlist", params).then(data => {
            this.salesmanListData = data;
        })
    }

    public onSearch(value: string): void {
        this.isLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    // 加载更多
    public loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return;
        }
        this.pageIndex += 1;
        this.isLoading = true;
        this.getMemberList(this.keyword);
    }

    /**
     * 转场馆复选框改变
     */
    public hallCheckChange() {
        if (!this.tType.hall && !this.tType.member) {
            this.transformParams.commission = 0;
        }
        if (this.tType.hall) {
            this.rateChange();
            this.calcPrice();
            this.changNewCardPrice = null;
        }
        if (this.tType.hall && this.tType.card && this.transformParams.to_hall_id) {
            this.getCourseCardList();
        }
        if (this.transformParams.to_salesman_id) {
            this.transformParams.to_salesman_id = null;
        }
        this.getSalesmanListData();
        this.resetCardInfo();
    }

    /**
     * 转会员复选框改变
     */
    public memberCheckChange() {
        if (!this.tType.hall && !this.tType.member) {
            this.transformParams.commission = 0;
        }
        if (this.tType.member) {
            this.rateChange();
            this.changNewCardPrice = null;
        }
        this.resetCardInfo();
    }

    /**
     * 转卡种复选框改变
     */
    public cardCheckChange() {
        this.resetCardInfo();
        // 如果没勾选中
        if (!this.tType.card) {
            this.isCustomSpecs = true;
            this.changNewCardPrice = null;
            this.selectCardType = null;
            this.transformParams.valid_days = this.detail.valid_days;
            if (this.transformParams.to_course_card_id) {
                this.transformParams.to_course_card_id = '';
            }
            if (this.transformParams.to_course_card_spec_id) {
                this.transformParams.to_course_card_spec_id = '';
            }
        } else {
            this.getCourseCardList();
        }
    }

    /**
     * 会馆选择发送变化
     */
    public hallChange() {
        this.calcPrice();
        this.getSalesmanListData();
        if (this.transformParams.to_salesman_id) {
            this.transformParams.to_salesman_id = null;
        }
        if (this.tType.card) {
            this.getCourseCardList();
        }
    }

    /**
     * 会员输入框发送变化
     */
    public memberChange() {
        this.resetCardInfo();
        this.changNewCardPrice = null;
    }

    /**
     * 当只选择转会员选项时，重置新卡余额、单价
     */
    private resetCardInfo() {
        // 只勾选转会员
        if (this.tType.member && !this.tType.hall && !this.tType.card) {
            this.transformParams.new_card_price = this.transformParams.actual_price = this.detail.surplus_value || 0
            this.transformParams.new_card_amount = this.detail.balance || 0;
            // 显示调整框
            this.isDisableAdjust = false;
            // 计算补差价
            this.calcAgio();
        }

        // 勾选转场馆、转会员，没勾选转卡种
        if (this.tType.member && this.tType.hall && !this.tType.card) {
            this.calcPrice();
        }

        // 勾选转卡种
        if (this.tType.card) {
            this.specsChange();
        }
    }

    /**
     * 课程卡输入框发送变化
     */
    public courseCardChange() {
        this.transformParams.to_course_card_spec_id = null;
        let courseCard = this.courseCardList.find(card => card.id == this.transformParams.to_course_card_id);
        if (courseCard) {
            this.selectCardType = courseCard.type;
        }
        this.getCourseCardSpecsList();
    }

    /**
     * 转卡种、规格发送变化函数
     */
    public specsChange() {
        // 是否是自定义规格
        if (this.transformParams.to_course_card_spec_id < 0) {
            // 是否显示价格调整框、新卡余额、单价是否可输入
            this.isCustomSpecs = false;
            // 是否禁用价格调整框
            this.isDisableAdjust = true;
            // 清空调整价格值
            this.changNewCardPrice = null;
            // 恢复实际价格
            this.transformParams.actual_price = this.transformParams.new_card_price;
            return;
        }
        this.courseCardSpecsList.forEach(specs => {
            if (specs.id == this.transformParams.to_course_card_spec_id) {
                // 是否显示价格调整框、新卡余额、单价是否可输入
                this.isCustomSpecs = true;
                // 是否禁用价格调整框
                this.isDisableAdjust = false;
                // 新卡价格
                this.transformParams.new_card_price = specs.price;
                // 天数
                this.transformParams.new_card_amount = specs.amount;
                //实际价格
                this.transformParams.actual_price = specs.price;
                // 有效期天数
                this.transformParams.valid_days = specs.valid_days || 0;
            }
        })
        if (this.transformParams.to_course_card_spec_id) {
            // 清空调整价格值
            this.changNewCardPrice = null;
            // 计算转卡补差
            let money = this.transformParams.actual_price - parseFloat(this.detail.surplus_value);
            this.transformParams.agio = money.toFixed(2);
        }
    }

    /**
     * 移除文件函数
     * @param index 索引 
     */
    public removeFile(index) {
        this.imageList.splice(index, 1)
    }

    /**
     * 上传图片函数
     * @param item 
     * @returns 
     */
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

    /**
     * 费率改变函数
     */
    public rateChange() {
        if (this.transformParams.rate) {
            let commission = this.transformParams.rate * parseFloat(this.detail.price);
            this.transformParams.commission = commission.toFixed(2);
        } else {
            this.transformParams.commission = 0;
        }
    }

    /**
     * 手续费改变函数
     */
    public commissionChange() {
        let price = parseFloat(this.detail.price);
        if (!price) {
            this.transformParams.rate = 0;
        } else {
            if (this.transformParams.commission) {
                let rate = this.transformParams.commission / price;
                this.transformParams.rate = rate.toFixed(4);
            } else {
                this.transformParams.rate = 0;
            }
        }

    }

    /**
     * 计算实际价格的函数
     */
    public priceChange() {
        if (this.isCustomSpecs && this.changNewCardPrice) {
            this.transformParams.actual_price = this.changNewCardPrice;
        } else {
            this.transformParams.actual_price = this.transformParams.new_card_price;
        }
        this.calcAgio();
    }

    /**
     * 转卡对话框
     */
    public showTransformModal() {
        this.imageList = []
        this.params = {}
        this.paymentTime = new Date();
        this.transformVisible = true;
        this.transformParams = {
            rate: 0.05,
            actual_price: 0,
            agio: 0,
            valid_days: this.detail.valid_days
        };
        this.transformPrice = 0;
        this.tType = { hall: true, member: false, card: false };
        this.courseCardList = [];
        this.getHallList();
        this.getMemberPaymentList();
        // this.getCourseCardList();
        if (!this.memberList.length) {
            this.getMemberList();
        }
        if (!this.salesmanListData.length) {
            this.getSalesmanListData();
        }
        this.rateChange();
    }

    /**
     * 转卡申请详情函数
     */
    public transformDetail(data, isDetail = false) {
        if (this.paymentOptions.length == 0) {
            this.getMemberPaymentList()
        }

        this.isShowDetail = isDetail;

        // 转卡申请
        this.http.post("hall/member/admin-hall/member-course-card/transform/detail", { id: data.id }).then(ret => {
            this.editTransform(ret);
            this.params = {};
            if (isDetail && ret.payments && ret.payments.length) {
                if (ret.payments.length == 1) {
                    this.paymentMethod = "one";
                    this.params.trade_no = ret.payments[0].trade_no;
                    this.params.payment_id = ret.payments[0].channel;
                } else {
                    this.paymentMethod = "multiple";
                    this.payInfo = ret.payments.map(item => {
                        return { mode: item.channel, amount: item.amount, trade_no: item.trade_no };
                    })
                }
            }
        })
    }

    /**
     * 编辑详情表单相关数据
     */
    public editTransform(data: any) {
        this.tType = {};
        if (data.differences_of_price && data.differences_of_price !== 0) {
            data.agio = data.differences_of_price;
        }
        data.pay_money_copy = parseFloat(data.pay_money || 0);
        this.transformParams = Object.assign({}, data);
        this.changNewCardPrice = data.adjust_price;
        this.transformParams.new_card_amount = data.amount;
        this.transformParams.new_card_price = data.price;
        this.paymentTime = data.payment_time ? new Date(data.payment_time) : new Date();

        if (data.appendixes && data.appendixes.length) {
            this.imageList = data.appendixes || [];
        }
        if (data.is_transform_card) {
            this.tType.card = true;
        }
        if (data.is_transform_hall) {
            this.tType.hall = true;
        }
        if (data.is_transform_member) {
            this.tType.member = true;
        }
        if (!this.transformParams.to_course_card_spec_id) {
            this.transformParams.to_course_card_spec_id = -1; // 自定义
        }
        this.transformPrice = 0;
        this.transformVisible = true;
        this.courseCardList = [];
        this.getHallList();
        this.getMemberPaymentList();
        this.getCourseCardList();
        if (!this.memberList.length) {
            this.getMemberList();
        }
        if (!this.salesmanListData.length) {
            this.getSalesmanListData();
        }
    }

    public addPayInfo() {
        this.payInfo.push({});
    }

    public removePayInfo(index: number) {
        this.payInfo.splice(index, 1);
    }

    /**
     * 获取新卡的天数，以及价格
     */
    private calcPrice() {
        let params: any = {
            member_course_card_id: this.detail.id,
        };

        // 如果没有选中转会馆、并且没有选中会馆
        if (!this.tType.hall || !this.transformParams.to_hall_id) {
            this.transformPrice = 0;
            this.transformParams.agio = 0;
            return;
        }

        // 如果是转卡种
        if (this.tType.card) return;

        // 如果有选中转会馆
        if (this.tType.hall) {
            ["to_hall_id"].forEach(key => {
                if (this.transformParams[key]) params[key] = this.transformParams[key];
            })
        }

        // 如果有选中转会员
        if (this.tType.member) {
            ["to_member_id"].forEach(key => {
                if (this.transformParams[key]) params[key] = this.transformParams[key];
            })
        }

        this.http.get("hall/member/admin-hall/member-course-card/transform/pay-money-compute", params).then(ret => {
            if (ret) {
                this.transformParams.new_card_amount = ret.new_card_amount;
                this.transformParams.new_card_price = ret.new_card_price;
                this.transformParams.actual_price = ret.new_card_price;
                // 显示调整框
                this.isDisableAdjust = false;
                // 计算补差
                this.calcAgio();
            }
        })
    }

    /**
     * 计算补差价函数
     */
    private calcAgio() {
        const result = parseFloat(this.transformParams.actual_price) - parseFloat(this.detail.surplus_value);
        this.transformParams.agio = result.toFixed(2);
    }

    /**
    *  计算总差价函数
    */
    public totalPrice() {
        if (this.transformParams.adjust_shortfall || this.transformParams.adjust_shortfall === 0) {
            let total = parseFloat(this.transformParams.commission || 0) + parseFloat(this.transformParams.adjust_shortfall || 0);
            return total.toFixed(2);
        }
        let total = -parseFloat(this.transformParams.commission || 0) - parseFloat(this.transformParams.agio || 0);
        this.transformParams.pay_money = -total.toFixed(2);
        return -total.toFixed(2);
    }

    /**
     * 转卡申请
     */
    public transformCard() {
        if (!this.tType.hall && !this.tType.member && !this.tType.card) {
            this.notification.info("提示信息", "请选择转卡类型");
            return;
        }

        let params: any = {
            // 会员课程卡的id
            member_course_card_id: this.detail.id,
            // 会员id
            member_id: this.detail.member_id,
            // 新卡数量
            amount: this.transformParams.new_card_amount,
            // 新卡售价
            price: this.transformParams.new_card_price,
            // 老卡余额
            old_balance: this.detail.balance,
            // 老卡剩余价值
            old_surplus_value: this.detail.surplus_value,
            // 操作人的id
            operator_id: this.user.id,
        };

        if (!this.transformParams.actual_price) {
            this.transformParams.actual_price = this.transformParams.new_card_price;
        }
        if (this.transformParams.adjust_shortfall || this.transformParams.adjust_shortfall === 0) {
            params.adjust_shortfall = this.transformParams.adjust_shortfall;
        }

        if (this.changNewCardPrice) {
            // 调整价格
            params.adjust_price = this.changNewCardPrice;
        }

        let valueKey = ["actual_price", "remark", "to_salesman_id"];

        // 转场馆
        if (this.tType.hall) {
            params.is_transform_hall = 1;
            valueKey.push("to_hall_id");
        }

        // 转会员
        if (this.tType.member) {
            params.is_transform_member = 1;
            valueKey.push("to_member_id");
        }

        if (this.tType.hall || this.tType.member) {
            valueKey = [...valueKey, ...["rate", "commission"]];
        }

        // 如果是转卡种
        if (this.tType.card) {
            params.is_transform_card = 1;
            // 卡类id
            valueKey.push("to_course_card_id");
            if (this.transformParams.to_course_card_spec_id > 0) {
                // 规格id
                valueKey.push("to_course_card_spec_id");
            }
        }
        // 次卡设置,有效天数
        if (this.courseCardType == 1 || this.selectCardType == 1) {
            valueKey.push("valid_days");
        }
        // 图片
        if (this.imageList.length) {
            params.appendixes = this.imageList;
        }

        valueKey.forEach(key => {
            if (Boolean(this.transformParams[key]) || this.transformParams[key] === 0) {
                params[key] = this.transformParams[key];
            }
        })
        // 总补差价
        if (this.transformParams.adjust_shortfall || this.transformParams.adjust_shortfall === 0) {
            params.pay_money = parseFloat(this.transformParams.commission || 0) + parseFloat(this.transformParams.adjust_shortfall || 0);
        } else {
            params.pay_money = -(-parseFloat(this.transformParams.commission || 0) - parseFloat(this.transformParams.agio || 0));
        }

        console.log("params===>", params, valueKey);
        this.http.post("hall/member/admin-hall/member-course-card/transform/apply", params).then(() => {
            this.notification.success("提示信息", "转卡申请成功");
            this.transformVisible = false;
            this.isDisableAdjust = true;
            this.transformParams = {};
            this.imageList = [];
            this.selectCardType = null;

            // 刷新相关详情数据
            this.refresh.emit();
        })
    }

    //支付方式
    public transformCardPayment() {
        let params: any;
        params = {
            id: this.transformParams.id,
            payments: [],
            payment_time: dayjs(this.paymentTime).format('YYYY-MM-DD HH:mm:ss'),
        }

        if (this.paymentMethod == 'one') {
            if (!this.params.payment_id) {
                this.notification.info("提示信息", "请选择支付方式");
                return;
            }

            params.payments.push({
                mode: this.params.payment_id,
                amount: this.transformParams.pay_money,
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
        this.http.post("hall/member/admin-hall/member-course-card/transform/payment", params).then(ret => {
            this.notification.success("提示信息", "转卡成功");
            this.transformVisible = false;
            this.params = {};
            this.payInfo = [{}];
            this.transformParams = {};
            // 刷新相关详情数据
            this.refresh.emit();
        })
    }

    public disabledPaymentDate = (endValue: Date): boolean => {
        return differenceInCalendarDays(endValue, new Date()) > 0;
    };

    public cancelTransformCard() {
        this.transformVisible = false;
        this.transformParams = {};
        this.params = {};
        this.payInfo = [{}];
        this.paymentMethod = 'one';
        this.tType = { hall: true, member: false, card: false };
        this.imageList = [];
        this.isShowDetail = false;
        this.isCustomSpecs = true;
        this.isDisableAdjust = true;
        this.changNewCardPrice = null;
        this.selectCardType = null;
    }


}

