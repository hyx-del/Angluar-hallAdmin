import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Router, ActivatedRoute } from '@angular/router';
import { Export } from '@/providers/utils';

import * as dayjs from 'dayjs';

@Component({
    selector: 'app-caoch-payroll',
    templateUrl: './caoch-payroll.html',
    styleUrls: ['./caoch-payroll.scss']
})
export class CaochPayrollComponent implements OnInit, AfterViewInit {

    dataList: any[] = [];
    height: number = 0;
    viewInit: boolean = false;

    pageSize: number = 50;
    pageIndex: number = 1;
    pageIndexCopy: number = 1;

    total: number = 0;

    currentDate = new Date();
    currentCoach = null;
    coachList: any[] = [];

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private router: Router,
        private modalService: NzModalService,
    ) {
        
    }

    ngOnInit() {
        this.getData();
        this.getCoachList();
    }

    ngAfterViewInit() {
        let dom = document.querySelector("nz-content");
        let containerHeight = dom.clientHeight;
        let tableHeadHeight = 75;
        let height = containerHeight - 40 - 32 - 62 - tableHeadHeight;
        if (height > 0) {
            this.height = height;
        }
        this.viewInit = true;
    }

    getData() {
        let params: any = {
            date: dayjs(this.currentDate).format("YYYY-MM"),
            size: this.pageSize,
            page: this.pageIndex,
        }
        if (this.currentCoach) {
            params.coach_id = this.currentCoach;
        }
        this.http.post("hall/course/admin-city/coach-salary/statistics", params).then(ret => {
            this.dataList = ret.data || [];
            this.total = ret.total;
            
        })
    }

    getCoachList() {
        this.http.get("hall/course/admin-city/coach/get-list").then(data => {
            this.coachList = data || [];
        })
    }

    onChange() {
        this.pageIndex = 1;
        this.getData();
    }

    coachChange() {
        this.pageIndex = 1;
        this.getData();
    }

    pageIndexChange(pageIndex: number) {
        this.modalService.confirm({
            nzTitle: "?????????????????????",
            nzOnOk: () => {
                this.pageIndex = pageIndex;
                this.pageIndexCopy = pageIndex;
                this.getData();
            },
            nzOnCancel: () => {
                this.pageIndex = this.pageIndexCopy;
            }
            
        })
    }

    calcAmount(data) {
        data.isUpdate = true;
        // ??????  ????????? + ???????????? + ?????? + ??????
        let amount = (parseFloat(data.actual_course_fee || 0) || 0)
        + (parseFloat(data.basic_wage || 0) ||0)
        + (parseFloat(data.house_allowances || 0) || 0)
        + (parseFloat(data.bonus || 0) || 0);

        // ??????  ???????????? + ?????? + ?????? + ?????? + ??????
        let deduct = parseFloat(data.social_insurance || 0)
        + (parseFloat(data.casual_leave || 0) || 0)
        + (parseFloat(data.medical_leave || 0) || 0)
        + (parseFloat(data.absenteeism || 0) || 0)
        + (parseFloat(data.fines || 0) || 0);

        // ????????????
        let extra_money = (parseFloat(data.extra_money || 0) || 0);
        if (extra_money > 0) {
            amount = amount + extra_money;
        } else {
            deduct = deduct + (-extra_money);
        }
        data.actual_amount = amount - deduct;
    }

    rowChange(data) {
        data.isUpdate = true;
    }

    confirm() {
        this.modalService.confirm({
            nzTitle: "?????????????????????",
            nzOnOk: () => {
                this.save();
            }
        })
    }

    save() {
        let data = this.dataList.filter(item => {
            // ????????? ???????????? ????????????
            return item.isUpdate && (item.actual_amount || item.actual_amount == 0);
        }).map(item => {
            if (!item.basic_wage) {
                item.basic_wage = 0;
            }
            if (!item.actual_course_fee) item.actual_course_fee = 0;
            return item;
        });

        let keys = ["last_update_time", "operator_id", "is_pay", "coach_mobile", "coach_name", "group_name"];
        data.forEach(item => {
            keys.forEach(key => {
                if (item.hasOwnProperty("key")) {
                    delete item[key];
                } 
            })
        })
        if (!data.length) return ;

        let params = {
            date: dayjs(this.currentDate).format("YYYY-MM"),
            salaries: data || [],
        }
        this.http.post("hall/course/admin-city/coach-salary/update-salary", params).then(() => {
            this.notificationService.success("????????????", "????????????");
            this.getData();
        })
    }
    jumpNum = 0;

    jumpCoachDetail(data) {
        if (!data.coach_id) return ;
        this.jumpNum++;
        this.router.navigate(["/city/coach/coach-manage"], { queryParams: { id: data.coach_id, num: this.jumpNum } })
    }

    jumpCoachCourseFeeDetail(data) {
        if (!data.coach_id) return ;
        this.jumpNum++;
        this.router.navigate(["/city/course-feee-statistics"], { queryParams: { id: data.coach_id, num: this.jumpNum } })
    }
    tableHeader = [
        { name: "????????????", key: "coach_name", merge: "coach_mobile" },
        { name: "??????", key: "group_name", },
        { name: "???????????????", key: "total_course_amount", },
        { name: "?????????????????????", key: "statistics_course_fee", },
        { name: "?????????", key: "actual_course_fee", },
        { name: "????????????", key: "basic_wage", },
        { name: "??????", key: "house_allowances", },
        { name: "??????", key: "bonus", },
        { name: "????????????", key: "social_insurance", },
        { name: "??????", key: "casual_leave", },
        { name: "??????", key: "medical_leave", },
        { name: "??????", key: "absenteeism", },
        { name: "??????", key: "fines", },
        { name: "??????", key: "extra_reason", },
        { name: "??????", key: "extra_money", },
        { name: "????????????", key: "actual_amount", },
        { name: "??????", key: "remark", },
        { name: "?????????", key: "operator_name", },
        { name: "??????????????????", key: "last_update_time", },
    ]

    isExport: boolean = false;
    export() {
        if (this.isExport) return ;
        this.isExport = true;

        let date = dayjs(this.currentDate).format("YYYY-MM");
        let tableHeader = this.tableHeader.map(item => item.name);

        let params = {
            date: dayjs(this.currentDate).format("YYYY-MM"),
        }
        this.http.post("hall/course/admin-city/coach-salary/statistics", params).then(data => {
            let tableContent = [];
            (data || []).forEach(item => {
                let row = [];
                this.tableHeader.forEach(header => {
                    if (header.merge) {
                        let text = item[header.key];
                        if (item[header.merge]) {
                            text += "(" + item[header.merge] + ")";
                        }
                        row.push(text);
                    } else {
                        let text = item[header.key];
                        if (!text && text !== 0) text = "";
                        row.push(text);
                    }
                })
                tableContent.push(row);
            })
            tableContent.unshift(tableHeader);

            let e = new Export('???????????????-' + date);
            let eData = {
                title: '???????????????',
                table: tableContent,
                // table: table,
            };

            e.detail(eData);
            this.isExport = false;
        }).catch(() => this.isExport = false)
        
    }

}
