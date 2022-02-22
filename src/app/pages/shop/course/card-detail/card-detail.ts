import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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

    tabIndex: number = 0;
    detail: any = {};
    //type 1->次卡 2->期限卡
    params: any = {};

    disabled: boolean = true;

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

    }

    ngOnChanges(val: SimpleChanges) {
        if (val.visible && val.visible.currentValue) {
            this.getDetail();
        }
    }


    getDetail() {
        this.http.get("hall/course/admin-hall/course-card/detail", { id: this.id }).then(ret => {
            this.detail = ret;
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
                this.currentSelected = this.hallNodes[0];
                this.selectedKeys = [ this.hallList[0].id ];
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
    }

    removeSpecs(data: any, index?: number) {
        // this.rules.splice(index, 1);
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

    /**
   *  场馆列表
   */
    hallList: Array<any> = [];
    hallNodes: any[] = [];
    hallSettings: any[] = [];
    getHallList() {
        // this.hallList = this.hallService.getCityHalls();
        this.hallService.getHallList().then(data => {
            this.hallList = data || [];

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
