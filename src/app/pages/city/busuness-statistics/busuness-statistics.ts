import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';

import { Export } from '../../../providers/utils';

@Component({
    selector: 'app-city-busuness-statistics',
    templateUrl: './busuness-statistics.html',
    styleUrls: ['./busuness-statistics.scss']
})
export class CityBusunessStatisticsComponent implements OnInit {

    dateRange = [];

    dateOptions: any[] = [
        { label: "今日", value: "day" },
        { label: "昨日", value: "yesterday" },
        { label: "本周", value: "week" },
        { label: "本月", value: "month" },
    ]
    dataType: any = "day";
    dataParams: any = {
        start_at: '',
        end_at: '',
    }

    tableHeaders: any[] = [];
    dataList: any[] = [];
    isLoading: boolean = false;

    constructor(
        private http: Http,
    ) { }

    ngOnInit() {
        this.getDateRange();
        this.getData();
    }

    getData() {
        let params = Object.assign({}, this.dataParams);
        this.http.get("hall/admin-city/business-statistical", params).then(ret => {
            let headers = [{ label: "科目", key: "type", }];
            if (ret && ret.payment_channel) {
                for (const key in ret.payment_channel) {
                    headers.push({ label: ret.payment_channel[key], key: key })
                }
            }
            if (headers.length > 1) {
                this.tableHeaders = headers;
            }
            if (ret && ret.count) {
                this.dataList = ret.count || [];
            }
            this.isLoading = false;
        }).catch(() => {
            this.isLoading = false;
        })
    }

    refreshData() {
        this.isLoading = true;
        this.getDateRange();
        this.getData();
    }

    dataTypeChange(type: string) {
        this.dataType = type;
        this.dateRange = [];
        this.getDateRange();
        this.getData();
    }

    getDateRange() {
        let formatStr = "YYYY-MM-DD HH:mm:ss";
        let params: any = {};
        if (this.dateRange[0] && this.dateRange[1]) {
            params.start_at = dayjs(this.dateRange[0]).format(formatStr);
            params.end_at = dayjs(this.dateRange[1]).format(formatStr);
            this.dataParams = params;
            return;
        }
        if (this.dataType == 'yesterday') {
            params.start_at = dayjs().subtract(1, 'day').startOf('day').format(formatStr);
            params.end_at = dayjs().subtract(1, 'day').endOf('day').format(formatStr);
        } else {
            params.start_at = dayjs().startOf(this.dataType).format(formatStr);
            params.end_at = dayjs().endOf(this.dataType).format(formatStr);
        }

        this.dataParams = params;
    }

    dateChange() {
        this.getDateRange();
        this.getData();
    }

    export() {
        if (!this.tableHeaders.length) {
            return ;
        }
        let headers = this.tableHeaders.map(item => item.label);
        let table = [];
        table.push(headers);
        this.dataList.forEach(data => {
            let rowData = [];
            this.tableHeaders.forEach(header => {
                rowData.push(data[header.key] || '0');
            })
            table.push(rowData);
        })


        let e = new Export('营业统计');
        let data = {
            title: '营业统计',
            table: table,
        };
        
        e.detail(data);
    }
}
