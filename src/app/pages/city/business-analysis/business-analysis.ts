import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';

import * as dayjs from 'dayjs';

import { Export } from '@/providers/utils';

@Component({
    selector: 'app-city-business-analysis',
    templateUrl: './business-analysis.html',
    styleUrls: ['./business-analysis.scss']
})

export class CityBusinessAnalysisComponent implements OnInit {
    dayDate: any = new Date();
    weekDate: any = new Date();
    monthDate: any = new Date();

    dayData: any = {
        headers: [],
        dataList: [],
    }
    weekData: any = {
        headers: [],
        dataList: [],
    }
    monthData: any = {
        headers: [],
        dataList: [],
    }


    isLoading: boolean = false;
    isLoading2: boolean = false;
    isLoading3: boolean = false;

    constructor(
        private http: Http,
    ) { }

    ngOnInit() {
        this.getDataByDay();
    }

    getDataByDay() {
        let params: any = {
            type: 'day',
            date: dayjs(this.dayDate).format("YYYY-MM"),
        }

        this.http.get("hall/admin-city/business-analysis", params).then(ret => {
            this.forMatData(params.type, ret);
            this.isLoading = false;
        }).catch(() => this.isLoading = false)
    }

    getDataByWeek() {
        let params: any = {
            type: 'week',
            date: dayjs(this.weekDate).format("YYYY-MM"),
        }

        this.http.get("hall/admin-city/business-analysis", params).then(ret => {
            this.forMatData(params.type, ret);
            this.isLoading2 = false;
        }).catch(() => this.isLoading2 = false)
    }

    getDataByMonth() {
        let params: any = {
            type: 'month',
            date: dayjs(this.monthDate).format("YYYY"),
        }

        this.http.get("hall/admin-city/business-analysis", params).then(ret => {
            this.forMatData(params.type, ret);
            this.isLoading3 = false;
        }).catch(() => this.isLoading3 = false)
    }

    forMatData(type: 'day' | 'week' | 'month' = 'day', data: any = {}) {
        let headers = [{ label: "时间", key: "time" }];
        if (data && data.payment_channels) {
            for (const key in data.payment_channels) {
                if (key != "time") {
                    headers.push({ label: data.payment_channels[key], key: key })
                }
            }
        }

        let dataKey = type + 'Data';

        if (headers.length > 1) {
            this[dataKey].headers = headers;
        }
        if (data && data.data) {
            this[dataKey].dataList = data.data || [];
        }
    }

    tabSelectChange(event) {
        if (event.index == 1) {
            if (this.weekData.dataList.length) {
                return;
            }
            this.getDataByWeek();
        } else if (event.index == 2) {
            if (this.monthData.dataList.length) {
                return;
            }
            this.getDataByMonth();
        }
    }

    refreshDayData() {
        this.isLoading = true;
        this.getDataByDay();
    }

    refreshWeekData() {
        this.isLoading2 = true;
        this.getDataByWeek();
    }

    refreshMonthData() {
        this.isLoading3 = true;
        this.getDataByMonth();
    }

    monthChangeByDay(result: Date): void {
        this.getDataByDay();
    }

    monthChangeByWeek(result: Date): void {
        this.getDataByWeek();
    }

    yearChange(result: Date): void {
        this.getDataByMonth();
    }

    export(type: 'day' | 'week' | 'month' = 'day') {
        let dataKey = type + "Data";
        if (!this[dataKey].headers.length) {
            return;
        }
        let headers = this[dataKey].headers.map(item => item.label);
        let table = [];
        table.push(headers);

        this[dataKey].dataList.forEach(data => {
            let rowData = [];
            this[dataKey].headers.forEach(header => {
                rowData.push(data[header.key] || '0');
            })
            table.push(rowData);
        })

        let typeMap: any = {
            day: '按日',
            week: '按周',
            month: '按月',
        }

        let e = new Export('营业分析-' + typeMap[type]);
        let data = {
            title: '营业分析-' + typeMap[type],
            table: table,
        };

        e.detail(data);
    }
}
