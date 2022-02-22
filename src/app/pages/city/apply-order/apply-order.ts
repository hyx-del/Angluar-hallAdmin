import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { FileService, HallService } from '@/providers/index';
import { Config } from '@/config';

import * as dayjs from 'dayjs';

@Component({
    selector: 'app-apply-order',
    templateUrl: './apply-order.html',
    styleUrls: ['./apply-order.scss']
})
export class CourseCardApplyOrderComponent implements OnInit {
    list: any[] = [{}];
    collection: any = {};
    isVisible: boolean = false;
    imageList: any[] = [];
    ossPath: string = "";

    detailVisible: boolean = false;
    params: any = {};
    courseType: number = 1; // 1-> 次卡 2 -> 期限卡
    
    courseCardList: Array<any> = [];
    courseCardSpecsList: Array<any> = [];
    
    paymentMethod: 'one' | 'multiple' = "one";
    isCustomSpecs: boolean = false;

    couponList: any[] = [];
    // 销售员
    salesmanList: any[] = [];
    
    payInfo: Array<any> = [{}];
    paymentOptions: Array<any> = [];
    payment: any = {};

    allowPaperContract: boolean = false;
    public contractType: number = 0;
    public contract: any = {};

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
        private hallService: HallService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getCourseCardList();
    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            this.collection.getHeader('courseCard_name').click = (item) => this.showDetail(item);
        }
    }

    showDetail(item: any) {
        this.http.get("hall/member/admin-city/member-course-card-purchase/detail", { id: item.id }).then(ret => {
            if (ret.start_date) {
                ret.start_date = dayjs(ret.start_date).toDate();
            }
            if (ret.payments && ret.payments.length) {
                if (ret.payments.length > 1) {
                    this.paymentMethod = 'multiple';
                    this.payInfo = ret.payments.map(item => {
                        return { mode: item.channel, trade_no: item.trade_no, amount: item.amount };
                    })
                } else {
                    this.paymentMethod = 'one';
                    this.payment = { mode: ret.payments[0].channel, trade_no: ret.payments[0].trade_no }
                }
            }

            this.courseType = ret.course_card_type;
            if (ret.privileges.length) {
                let privileges = [];
                let couponList = [];
                ret.privileges.forEach(item => {
                    if (item.detail && item.detail.length) {
                        item.detail.forEach(coupon => {
                            couponList.push({ id: coupon.id, name: coupon.name });
                            privileges.push(coupon.id);
                        });
                    }
                })
                ret.privileges = privileges;
                this.couponList = couponList;
            }
            if (!this.paymentOptions.length) {
                this.getMemberPaymentList();
            }

            this.params = ret;
            
            if (ret.course_card_spec_id) {
                let courseCard = this.courseCardList.find(card => card.id == ret.course_card_id);
                this.setCourseCardSpecs(courseCard);
            } else {
                ret.course_card_spec_id = 0;
                this.isCustomSpecs = true;
                this.courseCardSpecsList = [{ label: "自定义", id: 0 }];
            }

            this.contract = ret.contract || {};

            if (ret.appendixes && ret.appendixes.length) {
                this.imageList = ret.appendixes || [];
            }
            
            if (ret.contract) {
                this.imageList = ret.contract.appendixes || [];
                this.contractType = ret.contract.contract_type || 1;
            } else {
                this.imageList = [];
                this.contractType = 1;
            }

            this.allowPaperContract = !!ret.allow_paper_contract;

            this.detailVisible = true;
        })
    }
    getMemberPaymentList() {
        let params = {
            "action": "query",
            "params": [["status", "=", 1]],
            "fields": ["name", "status"],
            "size": 200,
            "page": 1
        }
        this.http.post("hall/admin-city/payment-mode/list", params).then(ret => {
            this.paymentOptions = ret.data || [];
        })
    }

    getCourseCardList() {
        let currentHall = this.hallService.getCurrentHall();

        this.http.get("hall/course/admin/course-card/get-available", { hall_id: currentHall.id }).then(data => {
            this.courseCardList = data;
        })
    }

    setCourseCardSpecs(card: any) {
        if (!card) return ;
        let specs = card.specs.map(item => {
            if (card.type == 1) {
                item.label = item.amount + "次/" + parseFloat(item.price) + "元";
            } else {
                item.label = item.amount + "天/" + parseFloat(item.price) + "元";
            }
            return item;
        });
        this.courseCardSpecsList = specs;
    }

    getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            this.salesmanList = data;
        })
    }

    pass(item: any) {
        this.modalService.confirm({
            nzTitle: "确定通过审核？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card-purchase/agree", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "操作成功");
                    this.collection.load();
                })
            }
        })
    }

    noPass(item: any) {
        this.modalService.confirm({
            nzTitle: "确定不通过审核？",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card-purchase/disagree", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "操作成功");
                    this.collection.load();
                })
            }
        })
    }

    invaild(data: any) {
        this.modalService.confirm({
            nzTitle: "确定作废?",
            nzOnOk: () => {
                this.http.post("hall/member/admin-city/member-course-card-purchase/invalid", { id: data.id}).then(() => {
                    this.notification.success("提示信息", "作废成功");
                    this.collection.load();
                })
            }
        })
    }

    updateContractType() {
        let params = {
            id: this.params.id,
            allow_paper_contract: this.allowPaperContract,
        }
        this.http.post("hall/member/admin-city/member-course-card-purchase/update-contract-type", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        });
    }

    showPreview() {
        this.isVisible = true;
    }

    closeModal() {
        this.isVisible = false;
        if (!this.detailVisible) {
            this.imageList = [];
        }
    }

    closeDetailModal() {
        this.detailVisible = false;
        this.imageList = [];
        this.couponList = [];
        this.params = {

        };
        this.allowPaperContract = false;
    }
}
