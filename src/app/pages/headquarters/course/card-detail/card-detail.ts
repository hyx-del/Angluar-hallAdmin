import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService, NzFormatEmitEvent } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/index';
import * as dayjs from 'dayjs';

@Component({
    selector: 'course-card-detail',
    templateUrl: './card-detail.html',
    styleUrls: ['./card-detail.scss']
})

export class CourseCardDetailComponent implements OnInit, OnChanges {
    @Input() visible: boolean;
    @Input() id: number;

    @Output() visibleChange: EventEmitter<any> = new EventEmitter();
    @ViewChild("specsSearchInput") specsSearchInput;

    public buttons: any[] = [
        { name: 'create', label: "添加规格", click: () => this.showSpecsModal() },
    ];

    tabIndex: number = 0;
    detail: any = {};
    //type 1->次卡 2->期限卡
    params: any = {};

    cardUseType: Array<any> = [
        { label: "全国通", value: 1 },
        { label: "城市通", value: 2 },
        { label: "单店", value: 3 },
        { label: "通店", value: 4 },
    ]
    limitChecked: any = {
        max_companion: false,
        max_order: false,
        class_limit: false,
        max_purchase: false,
        time_limit: false,
    }
    classLimit: any = {
        cycle_type: 'day'
    }
    timeLimit: any = {
        type: 'day',
    };

    monthDays: Array<any> = [];
    weeks: Array<any> = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

    generalType: number = 0;

    templateList: any[] = [];
    contractTemplate: any = {
        electronic_id: '',
        paper_id: '',
    };

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private hallService: HallService,
        private modalService: NzModalService,
    ) {
        for (let index = 1; index <= 31; index++) {
            this.monthDays.push({ name: index + "号", value: index })
        }
    }

    ngOnInit() {
        this.getTemplate();
    }

    ngOnChanges(val: SimpleChanges) {
        if (val.visible && val.visible.currentValue) {
            this.getDetail();
        }
    }

    getTemplate() {
        this.http.get("hall/admin/contract/contract-template-list").then(ret => {
            this.templateList = ret || [];
        })
    }

    // 禁用，启用
    changeStatus(data) {
        if(data.status == 1){
            this.modalService.confirm({
                nzTitle: "确定禁用",
                nzOnOk: () => {
                    this.http.post('hall/course/admin/course-card/specs/disable',{id: data.id}).then(res=>{
                        this.specsCollection.load();
                    })
                }
            }) 
        }else {
            this.modalService.confirm({
                nzTitle: "确定启用",
                nzOnOk: () => {
                    this.http.post('hall/course/admin/course-card/specs/enable',{id: data.id}).then(res=>{
                        this.specsCollection.load();
                    })
                }
            })
        }
    }


    getDetail() {
        this.http.get("hall/course/admin/course-card/detail", { id: this.id }).then(ret => {
            ret.is_experience_card = !!ret.is_experience_card;
            this.detail = ret;
            this.contractTemplate = ret.contract_template_id || {};
            Object.keys(this.limitChecked).forEach(key => {
                if (ret[key]) {
                    this.limitChecked[key] = true;
                } else {
                    this.limitChecked[key] = false;
                }
            })
            if (ret.class_limit) {
                this.classLimit = JSON.parse(ret.class_limit);
            }
            if (ret.time_limit) {
                let timeLimit = JSON.parse(ret.time_limit);
                timeLimit.type = timeLimit.cycle_type;
                if (timeLimit.start_time) {
                    timeLimit.start_time = dayjs(dayjs().format("YYYY-MM-DD") + " " + timeLimit.start_time).toDate();
                }
                if (timeLimit.end_time) {
                    timeLimit.end_time = dayjs(dayjs().format("YYYY-MM-DD") + " " + timeLimit.end_time).toDate();
                }
                this.timeLimit = timeLimit;
            }
            if (this.hallList.length) {
                this.selectedKeys = [ this.hallList[0].id ];
                this.currentSelected = this.hallNodes[0];
            }
            this.generalType = ret.general_type;
            this.showCardDetail();
        })
    }

    showCardDetail() {
        if (!this.hallList.length) {
            this.getHallList();
        }
        this.getCardSetting();
        this.getCourseCardHallSetting();
    }

    closeDetail() {
        this.visibleChange.emit(false);
        this.detail = {};
        this.tabIndex = 0;
        this.generalType = 0;
        this.currentSelected = {};
        Object.keys(this.limitChecked).forEach(key => {
            this.limitChecked[key] = false;
        })
        this.classLimit = {
            cycle_type: 'day'
        }
        this.timeLimit = {
            type: 'day',
        };
        this.specsCollection = { data: [] }
        this.selectedKeys = [];
    }

    tabChange() {
        if (this.tabIndex == 2) {
            if (!this.currentSelected.id && this.hallNodes.length) {
                this.currentSelected = this.hallNodes[0];
            }
            this.getCurrentHallSetting();
        }
    }

    saveCourseCard() {
        let params: any = Object.assign({}, this.detail);
        if (!this.limitChecked.max_companion) params.max_companion = null;
        if (!this.limitChecked.max_order) params.max_order = null;
        if (!this.limitChecked.max_purchase) params.max_purchase = null;

        let timeLimit = Object.assign({}, this.timeLimit);
        timeLimit.cycle_type = timeLimit.type;
        delete timeLimit.type;

        if (timeLimit.cycle_type == "week") {
            if (timeLimit.month_day) delete timeLimit.month_day;
        } else if (timeLimit.cycle_type == "month") {
            if (timeLimit.week_day) delete timeLimit.week_day;
        } else if (timeLimit.cycle_type == "day") {
            if (timeLimit.month_day) delete timeLimit.month_day;
            if (timeLimit.week_day) delete timeLimit.week_day;
        }

        if (timeLimit.start_time) timeLimit.start_time = dayjs(timeLimit.start_time).format("HH:mm");
        if (timeLimit.end_time) timeLimit.end_time = dayjs(timeLimit.end_time).format("HH:mm");

        if (this.limitChecked.time_limit) {
            params.time_limit = timeLimit;
            params.time_limit.cycle_type = timeLimit.cycle_type;
            if (timeLimit.cycle_type == "week") {
                params.time_limit.week_day = timeLimit.week_day;
            }
        } else {
            params.time_limit = null;
        }

        if (this.limitChecked.class_limit) {
            params.class_limit = this.classLimit;
        } else {
            params.class_limit = null;
        }

        if (this.contractTemplate.electronic_id || this.contractTemplate.paper_id) {
            params.contract_template_id = {};
            if (this.contractTemplate.electronic_id) {
                params.contract_template_id.electronic_id = this.contractTemplate.electronic_id;
            }
            if (this.contractTemplate.paper_id) {
                params.contract_template_id.paper_id = this.contractTemplate.paper_id;
            }
        }

        this.http.post("hall/course/admin/course-card/update", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        })
    }

    saveCardHall() {
        let hallIds: any[] = [];
        this.hallNodes.forEach(item => {
            item.children.forEach(child => {
                if (child.checked) hallIds.push(child.id);
            });
        })
        // console.log("hallList", this.hallList);
        // if (!hallIds.length) {
        //     this.notification.info("提示信息", "请选择场馆");
        //     return;
        // }
        let params: any = {
            id: this.detail.id,
            halls_id: hallIds,
        }

        this.http.post("hall/course/admin/course-card/apply-range/setting", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
        })
    }

    currentHallSetting: any[] = [];
    getCardSetting() {
        this.http.get("hall/course/admin/course-card/apply-range/get-halls", { course_card_id: this.detail.id }).then(ret => {
            this.currentHallSetting = ret || [];
            if (this.hallList.length) {
                this.restoreHallChecked();
            }
        })
    }
    checkedKeys: any[] = [];
    selectedKeys: any[] = [];
    restoreHallChecked() {
        let hallIds = this.currentHallSetting.map(item => item.hall_id);
        this.checkedKeys = hallIds;
    }

    specsCollection: any = { data: [] };
    specsList: any[] = [];
    setSpecsCollection(event) {
        this.specsCollection = event;
        this.specsCollection.onLoaded = () => {
            this.specsList = JSON.parse(JSON.stringify(this.specsCollection.data || []));
        }
        this.specsCollection.onInit = () => {
            this.removeSpecsConditions();
        }
    }

    removeSpecsConditions() {
        if (this.detail.type == 1 && this.specsSearchInput.conditions.length) {
            let removeIndex = null;
            this.specsSearchInput.conditions.forEach((item, index) => {
                if (item[0].name == "category_id") {
                    removeIndex = index;
                }
            });
            if (removeIndex || removeIndex === 0) {
                this.specsSearchInput.conditions.splice(removeIndex, 1);
            }
            // console.log("specsSearchInput", this.specsSearchInput);
        }
    }

    specsVisible: boolean = false;
    specs: any = {};
    specsValue: number = 0;
    specsCategoryList: any[] = [];

    showSpecsModal() {
        this.specs = {};
        this.specsVisible = true;
        if (!this.specsCategoryList.length) {
            this.getSpescCategoryList();
        }
    }

    getSpescCategoryList() {
        let params = {
            action: "query",
            fields: ["name", "days"],
            params: [],
        }
        this.http.post("hall/course/admin/course-card/spec-category/list", params).then(data => {
            this.specsCategoryList = data || [];
        })
    }

    closeSpecsModal() {
        this.specsVisible = false;
    }

    saveSpecs() {
        if (this.detail.type == 1) {
            if (!this.specs.amount || !this.specs.valid_days) {
                this.notification.info("提示信息", "请填写完整");
                return;
            }
            if (!this.specs.price && this.specs.price !== 0) {
                this.notification.info("提示信息", "请填写完整");
                return;
            }
        } else {
            if (!this.specs.category_id) {
                this.notification.info("提示信息", "请填写完整");
                return;
            }
            if (!this.specs.price && this.specs.price !== 0) {
                this.notification.info("提示信息", "请填写完整");
                return;
            }
        }
        if (this.specs.id) {
            let params: any = { 
                id: this.specs.id,
                price: this.specs.price,
            }
            if (this.detail.type == 1) { // 次卡
                params.amount = this.specs.amount;
            } else if (this.detail.type == 2) { // 期限卡
                params.category_id = this.specs.category_id;
            }
            if (this.specs.valid_days) {
                params.valid_days = this.specs.valid_days;
            }

            this.http.post("hall/course/admin/course-card/specs/update", params).then(ret => {
                this.notification.success("提示信息", "修改成功");
                this.closeSpecsModal();
                this.specsCollection.load();
                this.specs = {};
            })
        } else {
            let params: any = {
                course_card_id: this.detail.id,
                ...this.specs
            }
            this.http.post("hall/course/admin/course-card/specs/add", params).then(ret => {
                this.notification.success("提示信息", "添加成功");
                this.closeSpecsModal();
                this.specsCollection.load();
                this.specs = {};
            })
        }

    }

    showUpdateModal(data: any) {
        this.specs = Object.assign({}, data);
        this.specsVisible = true;
        if (!this.specsCategoryList.length) {
            this.getSpescCategoryList();
        }
    }

    removeSpecs(data: any) {
        this.modalService.confirm({
            nzTitle: "确定删除",
            nzOnOk: () => {
                let params = {
                    id: data.id,
                    course_card_id: this.detail.id,
                }
                this.http.post("hall/course/admin/course-card/specs/delete", params).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.specsCollection.load();
                })
            }
        })
    }

    saveSpecsPrice() {
        if (!this.specsList.length) {
            this.notification.info("提示信息", "请先创建规格");
            return;
        }
        let params: any = {
            id: this.detail.id,
            levels: [],
        }
        if (this.currentSelected.isShop) {
            params.hall_id = this.currentSelected.key;
        } else {
            params.city_id = this.currentSelected.id;
        }

        params.levels = this.specsList.filter(item => item.current_price || item.current_price === 0).map(specs => {
            return { course_card_spec_id: specs.id, price: specs.current_price }
        })
        this.http.post("hall/course/admin/course-card/price-level/setting", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
            this.getCourseCardHallSetting();
        })
    }

    /**
   *  场馆列表
   */
    hallList: Array<any> = [];
    hallNodes: any[] = [];
    hallSettings: any[] = [];
    getHallList() {
        // this.hallList = this.hallService.getCityHalls();
        this.hallService.getHallList().then(data => {
            this.hallList = data;
            this.hallNodes = this.hallList.map(item => {
                let children = [];
                if (item.children && item.children.length) {
                    children = item.children.map(child => {
                        return { isShop: true, key: child.id, id: child.id, title: child.name };
                    })
                }
                return { title: item.name, isCity: true, key: item.id, id: item.id, children }
            })

            if (this.currentHallSetting.length) {
                this.restoreHallChecked();
            }
        })
    }

    getCourseCardHallSetting() {
        this.http.get("hall/course/admin/course-card/price-level/get-levels", { course_card_id: this.detail.id }).then(ret => {
            this.hallSettings = ret || [];
        })
    }

    currentSelected: any = {};

    treeNodeHandle(event: NzFormatEmitEvent) {
        this.currentSelected = event.node.origin;
        // if (event.node.parentNode) {
        //     this.currentSelected.city_id = event.node.parentNode.origin.key;
        // }
        this.specsList = JSON.parse(JSON.stringify(this.specsCollection.data || []));
        this.getCurrentHallSetting();
    }

    getCurrentHallSetting() {
        let specsData: any = null;
        if (this.currentSelected.isShop) {
            specsData = this.hallSettings.filter(item => item.hall_id == this.currentSelected.id)
        } else {
            specsData = this.hallSettings.filter(item => item.city_id == this.currentSelected.id)
        }
        if (specsData && specsData.length) {
            this.specsList.forEach(specs => {
                let setting = specsData.find(item => item.course_card_spec_id == specs.id);
                if (setting) {
                    specs.current_price = setting.price;
                }
            })
        }
    }

}
