import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { ActivatedRoute } from '@angular/router';
import * as dayjs from 'dayjs';
import { Export } from '../../../providers/utils';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
@Component({
    selector: 'app-course-fee',
    templateUrl: './course-fee.component.html',
    styleUrls: ['./course-fee.component.scss']
})
export class CourseFeeStatisticsComponent implements OnInit {
    date: any = new Date();

    collection: any = {};
    detailCollection: any = {};

    currentData: any = {};
    isVisible: boolean = false;

    buttons: any[] = [
        { label: '批量审核', display: true, click: () => this.multipleCheck() },
        { label: '导出', display: true, click: () => this.export() },
        { label: '导出明细', display: true, click: () => this.exportManager() }
    ]

    detailButtons: any[] = [
        { label: '导出', display: true, click: () => this.exportDetail() },
    ]

    constructor(
        private http: Http,
        private activatedRoute: ActivatedRoute,
        private cd: ChangeDetectorRef,
        private modalService: NzModalService,
        private notification: NzNotificationService,
    ) {
        this.activatedRoute.queryParams.subscribe(params => {
            if (params && params.id) {
                this.getDetailById({ id: params.id })
            }
        })
    }

    ngOnInit() {

    }
    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            this.collection.getHeader('coach_id').click = (item) => this.getDetail(item);
        }
        this.collection.showCheckbox = true;
        this.collection.onInit = () => {
            let day = dayjs().get("date");
            console.log(day);

            let date = "";
            if (day > 7) {
                date = dayjs().format("YYYY-MM");
            } else {
                date = dayjs().subtract(1, "month").format("YYYY-MM");
            }
            this.collection.addWhere('coursePlan.start_at', date, '=');
        }
    }

    getDetail(data: any) {
        this.currentData = Object.assign({}, data);
        let listParams = this.collection.params;
        let date = "";
        listParams.forEach(p => {
            if (p[0] == "coursePlan.start_at") {
                date = p[2];
            }
        })
        let params: any = {
            coach_id: data.coach_id,
        }
        if (date) {
            params.start_at = date;
        }

        this.http.get("hall/course/admin-city/course-fee-statistics/coach-detail", params).then(ret => {
            this.currentData = Object.assign(this.currentData, ret);
            this.isVisible = true;
        })
    }

    getDetailById(data) {
        this.currentData = { coach_id: data.id };
        let params: any = {
            coach_id: data.id,
        }
        params.start_at = dayjs().format("YYYY-MM");

        this.http.get("hall/course/admin-city/course-fee-statistics/coach-detail", params).then(ret => {
            this.currentData = Object.assign(this.currentData, ret);
            this.isVisible = true;
        })
    }


    detailInit: boolean = false;
    setDetailCollection(collection) {
        this.detailCollection = collection;
        this.detailInit = true;
        this.detailCollection.onInit = () => {
            let listParams = this.collection.params;
            let date = "";
            listParams.forEach(p => {
                if (p[0] == "coursePlan.start_at") {
                    date = p[2];
                }
            })
            if (date) {
                this.detailCollection.addWhere('start_at', date, '=');
            }
        }

        this.detailCollection.onLoad = () => {
            if (this.detailInit) {
                this.detailInit = false;
                return;
            }
            let listParams = this.detailCollection.params;
            let date = "";
            listParams.forEach(p => {
                if (p[0] == "start_at") {
                    date = p[2];
                }
            })
            this.refreshDetail(date);
        }

    }

    refreshDetail(date?: string) {
        let params: any = {
            coach_id: this.currentData.coach_id,
        }
        if (date) {
            params.start_at = date;
        }

        this.http.get("hall/course/admin-city/course-fee-statistics/coach-detail", params).then(ret => {
            this.currentData = Object.assign(this.currentData, ret);
        })
    }

    isUpdateVisible: boolean = false;
    courseFee: any = {};
    showUpdateModal(item: any) {
        this.courseFee = {};
        let params = {
            coach_id: this.currentData.coach_id,
            course_plan_id: item.id
        };
        this.http.get("hall/course/admin-city/course-fee-statistics/get-coach-course-fee", params).then(ret => {
            this.isUpdateVisible = true;
            this.courseFee = Object.assign({ course_plan_id: item.id }, ret);
        });
    }

    updateCourseFee() {
        let params: any = Object.assign({}, { course_fee: this.courseFee.course_fee });
        if (!params.course_fee && params.course_fee !== 0) {
            this.notification.info("提示信息", "请填写课时费");
            return ;
        }
        params.coach_id = this.currentData.coach_id;
        params.course_plan_id = this.courseFee.course_plan_id;

        this.http.post("hall/course/admin-city/course-fee-statistics/course-fee-adjust", params).then(() => {
            this.notification.success("提示信息", "修改成功");
            this.isUpdateVisible = false;
            this.detailCollection.load();
        })
    }

    close() {
        this.isVisible = false;
    }

    export() {
        this.collection.export("课时费统计", "all");
    }
    // 导出教练
    exportManagerIsVisible = false;
    size = "20";
    pages = 1;
    total = null;
    params = {};
    isConfirmLoading = false;

    // 计算最大的pages
    maxpages() {
        this.cd.detectChanges();
        if (this.pages > Math.ceil(this.total / parseInt(this.size))) {
            this.pages = Math.ceil(this.total / parseInt(this.size));
        }

    }
    exportManager() {
        this.exportManagerIsVisible = true;
        this.total = this.collection.total;

        let newParams = [];
        this.collection.params.forEach(item => {
            if (item.indexOf('coursePlan.start_at') != -1) {
                newParams.push(['start_at', '=', item[2]]);
            } else if (item.indexOf('coursePlan.hall_id') != -1) {
                newParams.push(['hall_id', '=', item[2]]);
            } else if (item.indexOf('coach_id') == -1) {
                newParams.push(item);
            }
        });

        this.params = newParams;

    }

    async exportManagerHandleOk() {
        this.isConfirmLoading = true;
        let params = {
            action: "query",
            page: this.pages,
            size: parseInt(this.size),
            params: this.collection.params,
            fields: ["coach_id"]
        }
        const { data: res } = await this.http.post('hall/course/admin-city/course-fee-statistics', params);
        if (!res) {
            return;
        }
        let tableDataS = [];
        let arr = [];
        let coachName = []
        res.forEach((item) => {
            let params = {
                action: "query",
                params: this.params,
                fields: ["hall.name|hall_name ", " course.name|course_name", "type", "coachSigninLog.is_late", "attend_amount", "coachSigninLog.course_fee"],
            }

            if (coachName.indexOf(item.coach_name) !== -1) {
                coachName.push(item.coach_name + '-' + item.mobile);
            } else {
                coachName.push(item.coach_name)
            }

            let request = this.http.post('hall/course/admin-city/course-fee-statistics/class-detail?coach_id=' + item.coach_id, params);
            arr.push(request);
        });
        Promise.all(arr).then(ret => {

            ret.forEach((dataList, i) => {
                this.getArrData(coachName[i], dataList, tableDataS);
            })

            let e = new Export('教练课时费详情第' + this.pages + '批');
            e.detailMultiple(tableDataS);
            this.isConfirmLoading = false;
        }).catch(error => {
            console.log(error);

            this.isConfirmLoading = false;
        })
    }

    getArrData(coachName, dataList, tableDataS) {
        //delete dataList.footer
        let arrData = Object.values(dataList);
        let newArrData = [];
        arrData.forEach(item => {
            if (Array.isArray(item)) {
                item.forEach(arrItem => {
                    newArrData.push({
                        hall_name: arrItem.hall_id,
                        course_fee: arrItem.course_fee,
                        attend_amount: arrItem.attend_amount,
                        course_name: '',
                        course_type: '',
                        course_date: '',
                        sign_in_person: '',
                        sign_out_person: '',
                        is_late: '',
                    })
                });
            } else {
                if (item["is_late"] == 1) {
                    item["is_late"] = '否'
                } else if (item["is_late"] == 0) {
                    item["is_late"] = '是'
                }
                newArrData.push(item)
            }
        })
        this.getTableXlsl(newArrData, coachName, tableDataS)
    }

    // 获取xlsl数据
    getTableXlsl(newArrData, coachName, tableDataS) {

        let header = [
            { label: '场馆', key: 'hall_name' },
            { label: '课程', key: 'course_name' },
            { label: '类型', key: 'course_type' },
            { label: '课程日期', key: 'course_date' },
            { label: '签到人', key: 'sign_in_person' },
            { label: '签出人', key: 'sign_out_person' },
            { label: '是否迟到', key: 'is_late' },
            { label: '上课人数', key: 'attend_amount' },
            { label: '课时费', key: 'course_fee' }
        ];

        let headers = header.map(item => item.label);

        let table = [];
        table.push(headers);

        newArrData.forEach(item => {
            let rowData = [];
            header.forEach(data => {
                rowData.push(item[data.key]);
            })
            table.push(rowData);
        });
        var data = {
            title: '课时费详情-' + coachName,
            table: table,
            coach_name: coachName,
        }
        tableDataS.push(data);
    }


    exportManagerHandleCancel() {
        this.size = "20";
        this.pages = 1;
        this.exportManagerIsVisible = false;
    }

    exportDetail() {
        this.detailCollection.export("课时费详情", "all");
    }
    //签到签出
    signAtIsVisible = false;
    signOutIsVisible = false;
    signAtModelDate = {
        sign_at: '',
        sign_in_remark: ''
    };
    signOutModelDate = {
        sign_out_at: '',
        sign_out_remark: ''
    };

    signAt(item) {
        this.signAtModelDate.sign_at = item.sign_at;
        this.signAtModelDate.sign_in_remark = item.sign_in_remark;
        this.signAtIsVisible = true;
    }

    signAtHandleCancel() {
        this.signAtIsVisible = false;
    }

    signAtHandleOk() {
        this.signAtIsVisible = false;
    }

    signOut(item) {
        this.signOutModelDate.sign_out_at = item.sign_out_at;
        this.signOutModelDate.sign_out_remark = item.sign_out_remark;
        this.signOutIsVisible = true;
    }

    signOutHandleCancel() {
        this.signOutIsVisible = false;
    }

    signOutHandleOk() {
        this.signOutIsVisible = false;
    }

    // 获取筛选时间
    public getparamsTime() {
        const time = this.collection.params;
        return time.map(item => {
            let index = item.indexOf('coursePlan.start_at');
            if (index !== -1) {
                return item[2];
            }
        })
    }

    // 批量审核
    public multipleCheck(data?) {
  
        const month = this.getparamsTime();
        let params: any = {
            month: month[0]
        }

        if (!data) { // 批量审核
            if (!this.collection.checkedItems.length) {
                this.notification.info("提示信息", "请选择需要修改的数据");
                return;
            }
            let checkData = this.collection.checkedItems || [];
            params.coach_id = checkData.map(item => item.coach_id);
        } else { // 单个审核
            params.coach_id = data.coach_id;

        }
        this.modalService.confirm({
            nzTitle: '提示',
            nzContent: `确定${data?'':'批量'}审批工资？`,
            nzCancelText: '取消',
            nzOkText: '确定',
            nzOnOk: async () => {
                const data = await this.http.post('hall/course/admin-city/course-fee-statistics/check', params);
                console.log(data);
                this.showPromptDialog(data)
            }
        });
    }

    // 提示框
    public showPromptDialog(data) {
        if (data.status == '420') {
            this.modalService.error({
                nzTitle: '以下员工没有薪酬档案,请先同步档案',
                nzContent: data.coach_names.join()
            });
        } else {
            this.notification.success('提示信息', '审批成功')
        }
    }
}
