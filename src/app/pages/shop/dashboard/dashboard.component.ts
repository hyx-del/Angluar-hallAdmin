import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { MemberService } from '@/providers/index';
import * as dayjs from 'dayjs';
import { Router } from '@angular/router';
import { Export } from '@/providers/utils';

@Component({
    selector: 'shop-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class ShopDashboardComponent implements OnInit, AfterViewInit {
    visible = false;
    collection: any = { data: [] };

    buttons =  [
        { label: "导出", display: true, click: () => this.export() },
    ]

    list: any[] = [{}];
    isVisible: boolean = false;


    memberList: Array<any> = [];
    memberCourseCardList: Array<any> = [];
    paymentOptions: Array<any> = [];

    keyword: string = "";

    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;
    pageIndex: number = 1;
    params: any = {};
    paymentInfo: any = {};
// TODO  java 调试转换
    addType: 1 | 2 = 1; // 1->预约 2->排队

    detail: any = {
        orderItems: [],
    };

    maxCompanion: number = 0;
    selectedCourseCard: any = {};

    confirmVisible: boolean = false;
    currentPlan: any = {};
    mapOfExpandData: { [key: string]: boolean } = {};
    channelMap: { [key: string]: string } = {
        10: '课程卡',
        20: '余额',
        30: '微信',
        40: '支付宝',
        50: '联卡券',
    }
    isVisiblesSignIn = false;
    signParams = {
        remark: '',
        id: '',
        coach_id: ''

    };
    isVisiblesSignOut = false;
    SignInInputValue?: string;
    SignOutInputValue?: string;
    isAssistant = false;
    assistant = [];

    exportModalIsVisible: boolean = false;
    monthDate: string = null;
    requsetLoading: boolean = false;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private memberService: MemberService,
        private modalService: NzModalService,
        private router: Router,
    ) {
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getMemberList(value, true);
        })
        this.getMemberList();
    }

    export() {
        this.exportModalIsVisible = true;
        // this.collection.export("工作台课表数据", 'all');
    }

    cancelExportModal() {
        this.exportModalIsVisible = false;
        this.monthDate = null;
    }

    exportModalOk() {
        this.requsetLoading = true;
        if (this.monthDate) {
            this.collection.export('会馆课表数据', 'all');    
            this.cancelExportModal();
        }else {
            this.notification.info('提示信息', '请选择月份！');
        }
        this.requsetLoading = false;  
    }

    // 签到
    signIn(id?) {
        if (id) {
            this.signParams.coach_id = id;
        }
        this.isVisiblesSignIn = true;

    }

    // 签出
    signOff(id?) {
        if (id) {
            this.signParams.coach_id = id;
        }
        this.isVisiblesSignOut = true
    }

    // 取消对话框
    handleCancelsignIn() {
        // 关闭对话框
        this.isVisiblesSignIn = false;
        this.SignInInputValue = null;
    }

    // 确认的回调
    handleOksignOff() {
        this.signParams.remark = this.SignInInputValue;
        console.log('success', this.signParams);
        this.http.post('hall/course/admin-hall/workbench/coach-sign-in', this.signParams).then(ret => {
            if (ret.result === 'Success') {
                this.isVisiblesSignIn = false;
                this.getDetail(this.signParams);
                this.SignInInputValue = null;
            }
        });
    }

    handleCancelsignout() {
        this.isVisiblesSignOut = false;
        this.SignOutInputValue = null;
    }

    // 签出的回调
    handleOksignOut() {
        this.signParams.remark = this.SignOutInputValue;
        this.http.post('hall/course/admin-hall/workbench/coach-sign-out', this.signParams).then(ret => {
            if (ret.result === 'Success') {
                this.isVisiblesSignOut = false;
                this.getDetail(this.signParams);
                this.SignOutInputValue = null;
            }
        }).catch(err => {
            this.isVisiblesSignOut = false;
            this.SignOutInputValue = null;
        })
    }
    ngAfterViewInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.onInit = () => {
            let start_time = dayjs().format("YYYY-MM-DD");
            // let end_time = dayjs().format("YYYY-MM-DD");

            this.collection.addWhere('start_at', [start_time, start_time], '=');
        }

        // this.collection.onDblClick = (item) => this.getDetail(item);
        this.collection.onSetHeader = () => {
            this.collection.getHeader('course_id').click = (item) => this.getDetail(item);
        }

        this.collection.onExportLoad = (body) => {
            const start_at = dayjs(this.monthDate).startOf('month').format('YYYY-MM-DD');
            const start_ed = dayjs(this.monthDate).endOf('month').format('YYYY-MM-DD');
            if (!body.params) {
                body.params = []
            }else {
                body.params = this.collection.params.filter(item => item[0] !== 'start_at');
            }         
            body.params.push([['start_at', 'in', [start_at, start_ed]]]);
        }
    }

    getDetail(item: any): void {
        this.detail = {
            orderItems: [],
        }
        this.signParams.id = item.id;
        this.signParams.coach_id = item.coach_id;
        this.mapOfExpandData = {};
        this.visible = true;
        this.http.get("hall/course/admin-hall/workbench/order-detail", { id: item.id }).then(ret => {
            this.detail = ret;
        })
    }

    refreshDetail() {
        this.http.get("hall/course/admin-hall/workbench/order-detail", { id: this.detail.id }).then(ret => {
            this.detail = ret;
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

    getMemberPaymentList(isRefresh: boolean = false) {
        if (!isRefresh && this.paymentOptions.length) {
            return;
        }
        this.memberService.getMemberPaymentList().then(ret => {
            this.paymentOptions = ret.data || [];
        })
    }

    getMemberCourseCard() {
        let params = {
            member_id: this.params.member_id,
            course_plan_id: this.detail.id,
        };
        this.http.get("hall/course/admin-hall/course-plan-order/member-course-cards-available", params).then(data => {
            (data || []).forEach(item => {
                item.label = item.name + " " + item.card_no;
            });
            this.memberCourseCardList = data || [];
        })
    }

    onSearch(value: string): void {
        this.isLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return;
        }
        this.pageIndex += 1;
        this.isLoading = true;
        this.getMemberList(this.keyword);
    }

    refreshMemberList() {
        this.pageIndex = 1;
        this.getMemberList(this.keyword, true);
    }

    close(): void {
        this.visible = false;
    }

    memberDetailNum: number = 0;

    memberDetail(data) {
        this.close();
        setTimeout(() => {
            this.memberDetailNum++;
            this.router.navigate(["/shop/member/member-manage"], {
                queryParams: {
                    id: data.member_id,
                    i: this.memberDetailNum
                }
            })
        }, 300);
    }

    cardNum: number = 0;

    /**
     * 支付方式
     * @param data
     */
    courseCardDetail(data) {
        if (data.is_current_hall) {
            if (!data.course_card_id) return;
            this.close();
            setTimeout(() => {
                this.cardNum++;
                this.router.navigate(['/shop/member/course-card'], {
                    queryParams: {
                        id: data.mCourseCard_id,
                        i: this.cardNum
                    }
                });
            }, 300);
        }

    }

    showModal() {
        this.addType = 1;
        this.isVisible = true;
        this.getMemberPaymentList();
    }

    showQueueUpModal() {
        this.addType = 2;
        this.isVisible = true;
        this.getMemberPaymentList();
    }

    handleCancel() {
        this.isVisible = false;
        this.selectedCourseCard = {};
        this.params = {};
        this.paymentInfo = {};
        this.memberCourseCardList = [];
        this.maxCompanion = 0;
    }

    memberChange() {
        this.getMemberCourseCard();
        this.maxCompanion = 0;
        this.params = { member_id: this.params.member_id };
    }

    courseCardChange() {
        if (!this.paymentInfo.member_course_card_id) return;
        let courseCard = this.memberCourseCardList.find(item => item.id == this.paymentInfo.member_course_card_id);
        this.maxCompanion = courseCard.max_companion - courseCard.has_order || 0;
        this.params.total = 0;
        if (this.params.amount && this.params.amount > this.maxCompanion) {
            this.params.amount = this.maxCompanion;
        }
        this.selectedCourseCard = courseCard;
        if (courseCard.type == 1 && this.params.amount) {
            this.params.total = this.params.amount * courseCard.price;
        }
    }

    amountChange() {
        if (this.selectedCourseCard.type == 1 && this.params.amount) {
            this.params.total = this.params.amount * this.selectedCourseCard.price;
        }
    }

    showConfirmModal(item) {
        this.confirmRecordList = [];
        this.currentPlan = Object.assign({}, item);
        this.confirmVisible = true;
        this.getCourseFee();
        this.getConfirmRecord();

    }

    getCourseFee(isChangeNum: boolean = false) {
        let params: any = {
            id: this.currentPlan.id,
        }
        if (isChangeNum) {
            params.number = this.currentPlan.amount || 0;
        }

        this.http.get("hall/course/admin-hall/workbench/get-course-fee", params).then(ret => {
            this.currentPlan.course_fee = ret.course_fee || '';

            if (this.currentPlan.amount == ret.signInNumber || this.currentPlan.amount == undefined) {
                this.currentPlan.amount = ret.signInNumber || 0
            } else {
                this.currentPlan.amount = this.currentPlan.amount;
            }

            this.currentPlan.assistant = ret.assistant || {};

            if (Array.isArray(ret.assistant)) {
                this.currentPlan.assistant = ret.assistant
            } else {
                this.currentPlan.assistant = Object.values(this.currentPlan.assistant);
            }

            if (Object.keys(this.currentPlan.assistant).length) {
                this.isAssistant = true;
            }
        })
    }

    cancenConfirmModal() {
        this.confirmVisible = false;
    }

    calcCourseFee() {
        // console.log("currentPlan", this.currentPlan);
        this.getCourseFee(true);

    }

    confirmHaveClass() {
        let tip: string = null;
        if (!this.currentPlan.amount && this.currentPlan.amount !== 0) {
            tip = "上课人数";
        } else if (!this.currentPlan.course_fee && this.currentPlan.course_fee != 0) {
            tip = "课时费";
        }
        this.currentPlan.assistant.forEach(item => {
            if (!item.course_fee && item.course_fee !== 0) {
                tip = "助教课时费"
            }
        })

        if (tip) {
            this.notification.info("提示信息", "请输入" + tip);
            return;
        }
        if (this.currentPlan.remark && this.currentPlan.remark.length < 5) {
            this.notification.info("提示信息", "备注内容不能小于5个字符");
            return ;
        }

        let params: any = {
            id: this.currentPlan.id,
            attend_amount: this.currentPlan.amount,
            course_fee: this.currentPlan.course_fee || 0,
            assistant: this.currentPlan.assistant,
        }
        if (this.currentPlan.remark) {
            params.remark = this.currentPlan.remark;
        }

        this.http.post("hall/course/admin-hall/workbench/course-plan-confirm", params).then(ret => {
            this.notification.success("提示信息", "上课确认成功");
            this.collection.load();
            this.cancenConfirmModal();
        })
    }

    confirmRecordList: any[] = [];

    getConfirmRecord() {
        let params = {
            action: "query",
            params: [],
            fields: ["created_at", "attend_amount", "course_fee", "sys_course_fee", 'coach.name|coach_name', "remark"],
        }
        this.http.post("hall/course/admin-hall/workbench/course-plan-confirm-records?id=" + this.currentPlan.id, params).then(data => {
            this.confirmRecordList = data || [];
        })
    }

    expandChange(id: string) {
        this.mapOfExpandData[id] = !this.mapOfExpandData[id];
    }

    // 预约
    confirmReservation() {
        let params: any = Object.assign({}, this.params);
        params.course_plan_id = this.detail.id;
        params.payment = this.paymentInfo;
        params.payment.channel = 10;
        if (this.selectedCourseCard.type == 1) { // 次卡
            if (params.amount && this.selectedCourseCard.price) {
                params.actual_total = params.amount * this.selectedCourseCard.price;
                params.total = params.actual_total;
            }
        } else { // 期限卡
            if (params.amount) {
                params.actual_total = params.total = params.amount;
            }
        }
        if (params.total) {
            params.payment.total = params.total;
        }

        if (this.addType == 1) {
            this.http.post("hall/course/admin-hall/course-plan-order/create", params).then(ret => {
                this.notification.success("提示信息", "预约成功");
                this.refreshDetail();
                this.handleCancel();
            })
        } else {
            this.http.post("hall/course/admin-hall/course-plan-order/queue", params).then(ret => {
                this.notification.success("提示信息", "排队成功");
                this.refreshDetail();
                this.handleCancel();
            })
        }
    }

    queueCancel(data) {
        let params: any = {
            item_id: data.id,
            total: data.amount * parseFloat(data.price),
        };
        this.modalService.confirm({
            nzTitle: "确认取消排队？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-hall/course-plan-order/queue-cancel", params).then(ret => {
                    this.notification.success("提示信息", "排队取消成功");
                    this.refreshDetail();
                })
            }
        })
    }

    orderCancel(data) {
        let params: any = {
            item_id: data.id,
            total: data.amount * parseFloat(data.price),
        };
        this.modalService.confirm({
            nzTitle: "确认取消预约？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-hall/course-plan-order/cancel", params).then(ret => {
                    this.notification.success("提示信息", "预约取消成功");
                    this.refreshDetail();
                })
            }
        })
    }

    queueToOrder(item: any) {
        this.modalService.confirm({
            nzTitle: "确认调整为预约？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-hall/course-plan-order/queue-to-order", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "调整成功");
                    this.refreshDetail();
                })
            }
        })
    }

    attendClass(item) {
        this.modalService.confirm({
            nzTitle: "确认调整为上课？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-hall/course-plan-order/sign-in", { item_id: item.id }).then(ret => {
                    this.notification.success("提示信息", "上课成功");
                    this.refreshDetail();
                })
            }
        })

    }

    unSign(item) { // 爽约
        this.modalService.confirm({
            nzTitle: "确认调整为爽约？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-hall/course-plan-order/un-sign", { item_id: item.id }).then(ret => {
                    this.notification.success("提示信息", "爽约成功");
                    this.refreshDetail();
                })
            }
        })
    }

    orderClass(item) {
        this.modalService.confirm({
            nzTitle: "确认取消上课？",
            nzOnOk: () => {
                this.http.post("hall/course/admin-hall/course-plan-order/sign-in-cancel", {item_id: item.id}).then(ret => {
                    this.notification.success("提示信息", "取消上课成功");
                    this.refreshDetail();
                })
            }
        })
    }
}
