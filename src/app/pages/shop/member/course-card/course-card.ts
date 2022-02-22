import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/index';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'member-course-card',
    templateUrl: './course-card.html',
    styleUrls: ['./course-card.scss']
})
export class MemberCourseCardComponent implements OnInit {
    public buttons: any[] = [
        { label: '批量调整有效期', display: true, click: () => this.showAdjustModal() },
        { label: '批量修改销售', display: true, click: () => this.showAlterMarketModal() },
    ];

    collection: any = {};
    currentHall: any = {};
    isVisible: boolean = false;
    detail: any = {
        courseCard: {},
    };
    adjustParams: any = {};
    adjustVisible: boolean = false;

    options = [
        { label: "正常", value: 1, checked: false },
        { label: "停卡", value: 2, checked: false },
        { label: "请假", value: 3, checked: false },
        { label: "已过期", value: 4, checked: false },
    ];

    form: nyForm;
    public marketVisible = false;
    public salesman_id = null;
    public salesmanList: any[] = [];
    public AlterMarketId: any[] = [];

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private hallService: HallService,
        private modalService: NzModalService,
        private activeRoute: ActivatedRoute,

    ) {
        this.activeRoute.queryParams.subscribe(params => {
            if (params && params.id) {
                this.getDetail({ id: params.id })
            }
        })
    }

    ngOnInit() {
        this.currentHall = this.hallService.getCurrentHall();

    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.showCheckbox = true;

        // this.collection.onDblClick = (item) => this.getDetail(item);
        this.collection.onSetHeader = () => {
            collection.getHeader('course_card_name').click = (item) => this.getDetail(item);
        }
    }

    getDetail(item?: any) {
        // let card = item;
        item.courseCard = {};
        this.detail = Object.assign({}, item);
        this.isVisible = true;
        // this.http.post("hall/member/admin-hall/member/detail", { id: card.member_id }).then(ret => {
        //     this.isVisible = true;
        //     ret.course_card_id = card.course_card_id;
        //     this.detail = ret;
        // })
    }
    showAdjustModal() {
        if (!this.collection.checkedItems.length) {
            this.notification.info("提示信息", "请选择需要调整的数据");
            return;
        }
        // console.log("===>", this.collection.checkedItems);
        let ids = this.collection.checkedItems.map(item => item.id);
        this.adjustParams.id = ids;
        this.adjustVisible = true;
    }

    adjustValidity() {
        let params = Object.assign({}, this.adjustParams);
        let types = this.options.filter(item => item.checked).map(item => item.value);
        params.contain_type = types;
        if (!types.length) {
            this.notification.info("提示信息", "请选择包含类型");
            return;
        }
        this.http.post("hall/member/admin-hall/member-course-card/validate-batch-adjust", params).then(ret => {
            this.adjustParams = {};
            this.adjustVisible = false;
            this.collection.load();
            this.options.forEach(item => {
                item.checked = false;
            })
        })
    }

    // continueAdjust() {
    //     let params = Object.assign({}, this.adjustParams);
    //     params.continue = true;
    //     this.modalService.confirm({
    //         nzTitle: "存在请假或者停卡的卡，这部分卡将被忽略，是否继续？",
    //         nzOnOk: () => {
    //             this.http.post("hall/member/admin-hall/member-course-card/validate-batch-adjust", params).then(ret => {
    //                 this.adjustParams = {};
    //                 this.adjustVisible = false;
    //                 this.collection.load();
    //             })
    //         }
    //     })
    // }

    closeAdjust() {
        this.adjustVisible = false;
        this.adjustParams = {};
        this.options.forEach(item => {
            item.checked = false;
        })
    }

    public showAlterMarketModal() {
        if (!this.collection.checkedItems.length) {
            this.notification.info("提示信息", "请选择需要调整的数据");
            return;
        }
        let ids = this.collection.checkedItems.map(item => item.id);
        this.AlterMarketId = ids;
        this.getSalesmanList();
        this.marketVisible = true;
    }

    public closeMarket() {
        this.marketVisible = false;
        this.AlterMarketId = [];
        this.form.body = {};
        this.form.clearError()
    }

    public async marketValidityOK() {
        let params: any = {
            id: this.AlterMarketId,
            salesman_id: this.form.body.salesman_id
        };
        try {
            const data = await this.http.post('hall/member/admin-hall/member-course-card/update-salesman', params);
            if (data == 'success') {
                this.notification.success("提示信息", "修改销售成功");
            }
            this.closeMarket();
            this.collection.load();
        } catch (error) {
            this.form.setError(error.error.data)
            
        }
    }

    // 获取下拉的选框数据转会
    public async getSalesmanList() {
        const data = await this.http.get("staff/manage/getsalesmanlist");
        this.salesmanList = data;

    }

    enableCourseCard(item: any) {
        this.modalService.confirm({
            nzTitle: `确认启用会员卡（${item.member_name}-${item.course_card_name}）？`,
            nzOnOk: () => {
                this.http.post("hall/member/admin-hall/member-course-card/enable", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }
}
