import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { MemberService, FileService} from '@/providers/index';
import * as dayjs from 'dayjs';

import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Config } from '@/config';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import * as printJs from 'print-js';

@Component({
    selector: 'member-open-card-order',
    templateUrl: './open-card-order.html',
    styleUrls: ['./open-card-order.scss']
})
export class MemberOpenCardOrderComponent implements OnInit {
    visible: boolean = false;
    collection: any = {};

    pageIndex: number = 1;
    courseCardList: Array<any> = [];
    courseCardSpecsList: Array<any> = [];

    paymentOptions: Array<any> = [];
    payInfo: Array<any> = [{}];

    paymentMethod: 'one' | 'multiple' = "one";

    isCustomSpecs: boolean = false;
    params: any = {
        start_date: new Date(),
    }

    isApply: boolean = false;
    list: Array<any> = [];

    member: any = {}
    memberList: Array<any> = [];
    keyword: string = "";
    
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;

    payment: any = {};
    courseType: number = 1; // 1-> 次卡 2 -> 期限卡
    
    form: nyForm;
    
    // 销售员
    salesmanList: any[] = [];

    imageList: any[] = [];
    ossPath: string = "";

    today = new Date();

    sureIsLoading = false;
    buttons: any[] = [
        { label: '导出', display: true, click: () => this.export() },
    ]
   
    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private memberService: MemberService,
        private fileService: FileService,
        private modalService: NzModalService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getMemberList(value, true);
        })
        this.getCourseCardList();
        this.getMemberPaymentList();
        
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.getOrderDetail(item);
        this.collection.onSetHeader = () => {
            this.collection.getHeader('courseCard_name').click = (item) => this.getOrderDetail(item);
        }
        
    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);

    }

    getCourseCardList() {
        this.http.get("hall/course/admin/course-card/get-available").then(data => {
            this.courseCardList = data;
        })
    }

    getOrderDetail(item: any, isPrint?: boolean) {
        this.http.get("hall/member/admin-hall/member-course-card-purchase/detail", { id: item.id }).then(ret => {
            if (ret.start_date) {
                ret.start_date = dayjs(ret.start_date).toDate();
            }
            if (ret.payments && ret.payments.length) {
                if (ret.payments.length > 1) {
                    this.paymentMethod = 'multiple';
                    this.payInfo = ret.payments.map(item => {
                        return { mode: item.channel, trade_no: item.trade_no, amount: item.amount };
                    })
                    this.form.setValue("payments", JSON.parse(JSON.stringify(this.payInfo)));
                } else {
                    this.paymentMethod = 'one';
                    this.payment = { mode: ret.payments[0].channel, trade_no: ret.payments[0].trade_no };
                    this.form.setValue("payments", [{ ...this.payment }]);
                }
            }
            this.courseType = ret.course_card_type || ret.courseCard.type;
           
            if (ret.privileges.length) {
                let privileges = [];
                ret.privileges.forEach(item => {
                    if (item.detail && item.detail.length) {
                        item.detail.forEach(coupon => {
                            privileges.push(coupon.id);
                        });
                    }
                })
                ret.privileges = privileges;
            }
            ret.hasPrice = !!parseFloat(ret.actual_price);
            if (ret.unit_price) {
                ret.unit_price = parseFloat(ret.unit_price).toFixed(2);
            }
            this.params = ret;

            if(ret.status == 0){
                this.params.collection_time = new Date();
            }else if(ret.status == 10){
                this.params.collection_time = new Date()
            }
            
            if (ret.course_card_spec_id) {
                let courseCard = this.courseCardList.find(card => card.id == ret.course_card_id);
                this.setCourseCardSpecs(courseCard);
            } else {
                ret.course_card_spec_id = 0;
                this.isCustomSpecs = true;
                this.courseCardSpecsList = [{ label: "自定义", id: 0 , status:1}];
            }

            this.contract = Object.assign({}, ret.contract);

            if (ret.contract) {
                if (ret.contract.electronic_contracts) {
                    let contract = ret.contract.electronic_contracts[ret.contract.electronic_contracts.length - 1];
                    if (contract.contract_status != -1) { // 不是已作废
                        this.contract = Object.assign(ret.contract, contract);
                    } else {
                        if (ret.contract.contract_status == -1) { // 已作废
                            ret.contract.contract_id = null;
                        }
                        this.contract = Object.assign({}, ret.contract);
                    }
                }
                if (ret.contract.paper_contracts) {
                    this.paperContracts = ret.contract.paper_contracts || [];
                    if (isPrint) this.hasGenerateContract();
                }
            }
            
            // console.log("ret.", ret.contract, this.contract);

            if (ret.contract) {
                if (!this.imageList.length) {
                    this.imageList = ret.contract.appendixes || [];
                }
                this.contractType = ret.contract.contract_type || this.defaultType;
            } else {
                if (!this.imageList.length) {
                    this.imageList = [];
                }
                this.contractType = this.defaultType;
            }

            this.isApply = this.visible = true;
            this.getCouponList(true);

            if (!this.memberList.length) {
                this.getMemberList();
            }
            if (!this.salesmanList.length) {
                this.getSalesmanList();
            }
           
        })
    }

    getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            this.salesmanList = data;
        })
    }

    couponList: any[] = [];

    getCouponList(isDetail: boolean = false) {
        if (!this.params.member_id) {
            return ;
        }
        let params: any = {
            member_id: this.params.member_id,
            // expired: 0, // 可使用
            // used: 2, // 未使用
            // status: 1, // 已上线
            use_limit: 3, // 1 -> 团课 2 -> 私教 3 -> 购卡
        }
        if (!isDetail) {
            params.effective = true;
        }
        if (!this.params.id) {
            params.used = 2;
        }

        this.http.get("member/admin-hall/member-coupon/list", params).then(data => {
            this.couponList = data || [];
        })
    }

    showModal() {
        // if (!this.keyword) {
        //     this.notification.success("提示信息", "请输入会员名称或手机号");
        //     return ;
        // }
        this.form.clearError();
        this.visible = true;
        this.isApply = false;
        this.params = {}; 
        this.params.start_date = new Date();
        this.params.collection_time = new Date()
        if (!this.memberList.length) {
            this.getMemberList();
        }
        if (!this.salesmanList.length) {
            this.getSalesmanList();
        }
    }

    courseCardChange() {
        if (!this.params.course_card_id) {
            return;
        }
        let courseCard = this.courseCardList.find(item => item.id == this.params.course_card_id);
        if (courseCard) {
            this.courseType = courseCard.type;
        }
        this.params.price = "";
        this.params.actual_price = "";
        this.params.privilege_total = 0;

        this.setCourseCardSpecs(courseCard, true);
        this.getIsFirstSign(false);
    }
    
    isFirstSign: boolean = false;

    // 是否是首签
    getIsFirstSign(isReset = true) {
        if (isReset && this.isFirstSign) {
            this.isFirstSign = false;
        }
        if (!this.params.member_id) return ;
        let p: any = {
            member_id: this.params.member_id,
        }
        if (this.params.course_card_id) {
            p.course_card_id = this.params.course_card_id;
        }
        this.http.post("hall/member/admin-hall/member-course-card-purchase/is-first-sign", p).then(ret => {
            this.isFirstSign = ret.is_first_sign || false;
        })
    }

    specsChange() {
        if (this.params.course_card_spec_id) {
            this.params.collection_time = new Date();
            this.isCustomSpecs = false;
            let specs = this.courseCardSpecsList.find(specs => specs.id == this.params.course_card_spec_id);
            if (specs) {
                this.params.price = specs.price;
                if (specs.valid_days) {
                    this.params.effective_days = specs.valid_days;
                } else {
                    this.params.effective_days = specs.amount;
                }
                this.params.amount = specs.amount;
                this.params.unit_price = (parseFloat(this.params.price) / this.params.amount).toFixed(2);
            }
        } else {
            this.isCustomSpecs = true;  
            // this.params.price = "";
            if (!this.params.price) this.params.price = 0;
            if (!this.params.effective_days) this.params.price = 0;
            if (!this.params.unit_price) this.params.price = 0;
            this.params.adjust_price = null;
        }
        this.setActualPrice();
    }

    priceChange() {
        if (!this.params.course_card_spec_id) { // 自定义卡规格
            this.setActualPrice();
        }
    }

    adjustPriceChange() {
        this.setActualPrice();
    }

    AdjusetUnitPrice() { // 价格改变
        // this.params.unit_price = (parseFloat(this.params.price || 0) / this.params.amount || 0).toFixed(3);
        this.params.adjust_price = null;
        this.setActualPrice();
    }

    setActualPrice() { // 设置实际支付价格
        let total = 0;
        if (this.params.privileges && this.params.privileges.length) {
            this.couponList.forEach(coupon => {
                if (this.params.privileges.indexOf(coupon.relation_id) >= 0) {
                    total = total + parseFloat(coupon.discount);
                }
            })
        }


        if (this.params.adjust_price || this.params.adjust_price === 0) { // 有调整价格
            // 实际价格 = 调整价格 - 优惠券价格
            let price =  parseFloat(this.params.adjust_price) - total;
            this.params.actual_price = price < 0 ? 0 : price;
        } else if (this.params.price || this.params.price === 0) {
            if (total) { // 有优惠
                if (total > parseFloat(this.params.price)) {
                    total = parseFloat(this.params.price);
                }
                // 实际价格 = 原价 - 优惠卷的总优惠
                this.params.actual_price = parseFloat(this.params.price) - total;
            } else {
                this.params.actual_price = this.params.price;
            }
        }
        let price = this.params.price || 0;
        if (this.params.actual_price || this.params.actual_price == 0) {
            price = this.params.actual_price;
        }
        // 单价 = 总价格 / 数量
        this.params.unit_price = (parseFloat(price) / this.params.amount || 0).toFixed(2) || '';

        this.calcDiscounts();
    }

    calcDiscounts() {
        // 总优惠 = 原价 - 实际支付价格
        if (this.params.price) {
            let price = parseFloat(this.params.price);
            // if (parseFloat(this.params.adjust_price) > price) {
            //     price = parseFloat(this.params.adjust_price);
            // }

            let total =  price - parseFloat(this.params.actual_price);
            if (total < 0) {
                this.params.privilege_total = total || 0;
            } else if (total > price) { // 优惠大于原价
                this.params.privilege_total = price.toFixed(2);
            } else {
                this.params.privilege_total = total.toFixed(2);
            }
            
        }
    }

    couponChange() {
        this.setActualPrice();
    }

    addPaymentInfo() {
        this.payInfo.push({});
    }

    removePaymentInfo(index) {
        this.payInfo.splice(index, 1);
    }

    save() {
        this.sureIsLoading = true;
        let params = Object.assign({}, this.params);
        if (this.params.id && this.params.status === 0) {
            this.notification.info("提示信息", "正在审核中");
            return ;
        }
        if (params.start_date) {
            params.start_date = dayjs(params.start_date).format("YYYY-MM-DD");
        }
        // // actual_price
        // if ((!this.params.adjust_price && !this.isCustomSpecs) || params.id) {
        //     if (this.paymentMethod == 'one') {
        //         // adjust_price
        //         let price = this.params.actual_price === 0 ? 0 : this.params.actual_price;
        //         params.payments = [{ amount: price || 0, ...this.payment }];
        //     } else {
        //         params.payments = this.payInfo.filter(pay => pay.mode && pay.amount);
                
        //         if (!params.payments.length || !params.payments[0].mode) {
        //             this.notification.info("提示信息", "请选择支付方式");
        //         }
        //     }
        // }
        if (params.course_card_spec_id == 0) {
            delete params.course_card_spec_id;
            if (params.amount && this.courseType == 2) { // 期限卡自定义规格 有效期等于自定义天数
                params.effective_days = params.amount;
            }
        }
        if (this.imageList.length) {
            params.appendixes = [...this.imageList];
        }
        if (params.privileges && params.privileges.length) {
            let checkedCoupon = params.privileges;
            let privileges = [];
            this.couponList.forEach(item => {
                if (checkedCoupon.indexOf(item.relation_id) >= 0) {
                    privileges.push({ id: item.relation_id, coupon_id: item.id, name: item.name, amount: item.discount });
                }
            })
            params.privileges = privileges;
        }
        params.collection_time = dayjs(this.params.collection_time).format('YYYY-MM-DD HH:mm:ss');
        this.http.post("hall/member/admin-hall/member-course-card-purchase/create", params).then(ret => {
            this.notification.success("提示信息", "提交成功");
            this.visible = false;
            this.sureIsLoading = false;
            this.collection.load();
            this.restoreDefaultData();
        }).catch(error => {
            this.sureIsLoading = false;
            if (error.error) {
                this.form.setError(error.error.data);
            }
            
        })
    }

    restoreDefaultData() {
        this.paymentMethod = 'one';
        this.payment = {};
        this.payInfo = [{}];
        this.params = {};
        this.isCustomSpecs = false;
        this.courseType = 1;
        this.imageList = [];
        this.form.body = {};
        this.form.clearError();
        this.contractType = this.defaultType; // 默认电子合同
        this.contract = {};
        this.paperContracts = [];
        this.courseCardSpecsList = [];
        this.couponList = [];
        this.openStatusDisable = false;
        this.openStatusEnable = false;
    }

    submit() {
        this.save();
    }

    cancelOpenCard(data) {
        this.modalService.confirm({
            nzTitle: "确定取消？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-hall/member-course-card-purchase/cancel", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "取消成功");
                    this.collection.load();
                })
            }
        })
    }

    cancel() {
        this.visible = false;
        this.sureIsLoading = false;
        this.restoreDefaultData();
        this.params.collection_time = new Date();
    }

    setCourseCardSpecs(card: any, isSetDefault: boolean = false) {
        if (!card) return ;
        let specs = card.specs.map(item => {
            if (card.type == 1) {
                item.label = item.amount + "次/" + parseFloat(item.price) + "元";
            } else {
                item.label = item.amount + "天/" + parseFloat(item.price) + "元";
            }
            return item;
        });
        let specsArray = [];
        if(!isSetDefault) {
            specsArray = specs;
        }else {
            specs.forEach(item=>{
                if(item.status !== 0){
                    specsArray.push(item);
                }
            });
        }
        
        if (specsArray.length && isSetDefault) {
            this.isCustomSpecs = false;
            let currentSpecs = specsArray[0];
            this.params.course_card_spec_id = currentSpecs.id;
            this.params.price = currentSpecs.price;
            if (card.type == 1) { // 次卡
                this.params.effective_days = currentSpecs.valid_days;
            } else {
                this.params.effective_days = currentSpecs.amount;
            }
            this.params.amount = currentSpecs.amount;
            this.setActualPrice();
        } else if (!specsArray.length) {
            this.params.course_card_spec_id = null;
        }
        specs.push({ label: "自定义", id: 0 ,status: 1});
        this.courseCardSpecsList = specs;     
    }

    getMemberPaymentList() {
        this.memberService.getMemberPaymentList().then(ret => {
            this.paymentOptions = ret.data || [];
        })
    }
    
    getMemberList(keyword: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
        };
        if (keyword) {
            params.keyword = keyword;
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

    memberChange() {
        if (this.params.member_id) {
            this.http.get("hall/member/admin-hall/member-course-card-purchase/get-member-salesman", { member_id: this.params.member_id }).then(ret => {
                if (ret && ret.salesman_id) {
                    let found = this.salesmanList.find(sales => sales.id == ret.salesman_id);
                    if (found) {
                        this.params.salesman_id = ret.salesman_id;
                    }
                }
            })
            if (this.params.privileges && this.params.privileges.length) {
                this.params.privileges = [];
                this.setActualPrice();
            } else {
                this.params.privileges = [];
            }
            this.getIsFirstSign();
            this.getCouponList();
        }
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

    refreshMemberList() {
        this.pageIndex = 1;
        this.getMemberList(this.keyword, true);
    }

    removeFile (index) {
        this.imageList.splice(index, 1)
    }

    previewVisible: boolean = false;
    previewImageUrl: string = "";

    previewImage(index: number) {
        this.previewImageUrl = this.ossPath + this.imageList[index];
        this.previewVisible = true;
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

    disabledDate = (current: Date): boolean => {
        // Can not select days before today and today
        return differenceInCalendarDays(current, this.today) < 0;
    };

    disabledPaymentDate = (endValue: Date): boolean => {
        return differenceInCalendarDays(endValue, new Date()) > 0;
    };

    public contractType: number = 0;
    public contract: any = {};
    public paperContracts: any = [];
    public defaultType: number = 1;
    public openStatusDisable: boolean = false;
    public openStatusEnable: boolean = false;

    openStatusChange(type: number) {
        if (type == 1) { // 暂不启用(禁用)改变
            this.openStatusEnable = false;
        } else {
            this.openStatusDisable = false;
        }
    }

    openCardPayment() {
        if (!this.contract.contract_id && this.contractType == 1) {
            this.notification.info("提示信息", "请生成电子合同");
            return ;
        } else if (this.contractType == 1 && !this.imageList.length) {
            this.notification.info("提示信息", "请上传付款截图或者收据");
            return ;
        }
        if (!this.contract.contract_id) {
            this.notification.info("提示信息", "请生成纸质合同模板");
            return ;
        } else if (this.contractType == 2 && !this.imageList.length) {
            this.notification.info("提示信息", "请上传附件（签署合同、付款截图及收据等）");
            return ;
        }
        if (!this.openStatusDisable && !this.openStatusEnable) {
            this.notification.info("提示信息", "请选择启用状态");
            return ;
        }

        this.sureIsLoading = true;
        let params: any = {
            id: this.params.id,
            contract_type: this.contractType,
        }
        if (this.contractType == 1) {
            params.contract_id = this.contract.contract_id;
        }

        if (this.paymentMethod == 'one' && this.params.hasPrice) {
            // adjust_price
            let price = this.params.actual_price === 0 ? 0 : this.params.actual_price;
            params.payments = [{ amount: price || 0, ...this.payment }];
        } else if (this.params.hasPrice) {
            params.payments = this.payInfo.filter(pay => pay.mode && pay.amount);
            
            if (!params.payments.length || !params.payments[0].mode) {
                this.notification.info("提示信息", "请选择支付方式");
            }
        }

        if (this.imageList.length) {
            params.appendixes = [...this.imageList];
        } else {
            params.appendixes = [];
        }
        params.collection_time = dayjs(this.params.collection_time).format('YYYY-MM-DD HH:mm:ss');
        params.disable = this.openStatusDisable ? true : false;

        this.http.post("hall/member/admin-hall/member-course-card-purchase/payment", params).then(ret => {
            if (this.params.status == 10) {
                this.notification.success("提示信息", "支付成功");
            } else {
                this.notification.success("提示信息", "保存成功");
            }
            this.visible = false;
            this.sureIsLoading = false;
            this.collection.load();
            this.restoreDefaultData();
        }).catch(error => {
            this.sureIsLoading = false;
            if (error.error) {
                this.form.setError(error.error.data);
            }
        })
    }

    refresh() {
        this.getOrderDetail({ id: this.params.id });
    }

    generateVisible: boolean = false;
    generateParams: any = {};
    generateType: number = 1; // 1 电子合同 2 纸质合同

    showGenerateModal(type: number = 1) {
        this.generateType = type;
        this.getContractContent();
        this.generateVisible = true;
    }

    closeModal() {
        this.generateVisible = false;
        this.generateParams = {};
    }

    // 审核
    checkContract() {
        let params = {
            contract_id: this.contract.contract_id,
        }
        this.http.post("hall/member/admin-hall/member-course-card-purchase/checked-electronic-contract", params).then(ret => {
            this.getOrderDetail({ id: this.params.id });
            this.notification.success("提示信息", "审核成功");
        })
    }

    /**
     * 获取会员信息和订单备注
     */
    getContractContent() {
        this.http.get("hall/member/admin-hall/member-course-card-purchase/get-contract-content", {order_id: this.params.id}).then(ret => {
            ret.receive_sms == 1 ? ret.receive_sms = true : ret.receive_sms = false;
            this.generateParams = Object.assign({}, ret);
        });
    }


    /**
     * 生成电子合同
     */
    generateContract() {
        if (!this.generateParams['name']) {
            this.notification.info("提示信息", "请填写真实姓名");
            return ;
        }
        if (!this.generateParams['id_card'] && this.generateType == 1) {
            this.notification.info("提示信息", "请填写证件号码");
            return ;
        }
        let params: any = {
            id: this.params.id,
            contract_info: Object.assign({}, this.generateParams),
        }
        if (this.generateType == 2) {
            params.contract_type = 2;
        }

        this.http.post("hall/member/admin-hall/member-course-card-purchase/generate-electronic-contract", params).then(ret => {
            this.getOrderDetail({ id: this.params.id });
            this.closeModal();
        })
    }

    signContract() {
        this.http.post("hall/member/admin-hall/member-course-card-purchase/electronic-contract-sign", { id: this.params.id }).then(ret => {
            this.notification.success("提示信息", "签署成功");
            if (this.params.contract) {
                this.params.contract.is_signed = true;
            }
        })
    }

    cleanContract() {
        this.modalService.confirm({
            nzTitle: "提示信息",
            nzContent: "确定作废电子合同？",
            nzOnOk: () => {
                this.disabledContract();
            }
        })
    }

    disabledContract() {
        let params = {
            id: this.params.id,
            contract_id: this.contract.contract_id || this.params.contract.contract_id,
        }
        this.http.post("hall/member/admin-hall/member-course-card-purchase/clear-electronic-contract", params).then(ret => {
            this.notification.success("提示信息", "作废成功");
            this.getOrderDetail({ id: this.params.id });
            // this.params.contract = null;
            // this.contractType = 1;
            // this.contract = {};
        })
    }

    hasGenerateContract() {
        let paperContract = this.paperContracts.find(item => item.status != 2);
        if (paperContract) {
            if (paperContract.download_url) {
                this.printPdf(paperContract.download_url);
            } else {
                this.notification.info("提示信息", "模板生成中, 请稍后再试！");
            }
        }
    }

    printContract(url?: string) {
        if (!url) {
            this.getOrderDetail({ id: this.params.id }, true);
        } else {
            this.printPdf(url);
        }
        // if (url) {
        //     this.printPdf(url);
        // } else {
        //     let downloadUrl = "";
        //     if (this.contract.electronic_contracts) {
        //         this.contract.electronic_contracts.forEach(item => {
        //             if (item.status != 2 && item.download_url) {
        //                 downloadUrl = item.download_url;
        //             }
        //         })
        //     }
        //     if (downloadUrl) {
        //         this.printPdf(downloadUrl);
        //     }
        // }
    }

    printPdf(url: string) {
        printJs({ printable: url, type:'pdf', });
    }

    export() {
        this.collection.export("开卡订单", "all");
    }
}
