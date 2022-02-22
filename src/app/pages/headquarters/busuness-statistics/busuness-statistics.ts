import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';

import { Export } from '../../../providers/utils';
@Component({
    selector: 'app-busuness-statistics',
    templateUrl: './busuness-statistics.html',
    styleUrls: ['./busuness-statistics.scss']
})
export class BusunessStatisticsComponent implements OnInit {

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

    shop: any;

    constructor(
        private http: Http,
        private router: Router,
    ) { }

    ngOnInit() {
        this.getDateRange();
        this.getData();
        this.getCardStatistics();
    }

    getData() {
        let params = Object.assign({}, this.dataParams);
        this.http.get("hall/admin/business-statistical", params).then(ret => {
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
        })
    }

    shopNewCardCount: any = null;
    shopOldCardCount: any = null;
    shopCount: any = null;
    cardDate: any = null;

    async getCardStatistics() {
        let params = Object.assign({}, this.dataParams);
        const result = await this.http.post('hall/admin/card-consumption-statistics', params);
        // this.shop = result;
        this.cardDate = result.card_date || null;

        if (result.count) {
            this.shopNewCardCount = result.count.new_card_count;
            this.shopOldCardCount = result.count.old_card_count;
            this.shopCount = result.count.total;
        }
    }

    refreshData() {
        this.isLoading = true;
        this.getDateRange();
        this.getData();
        this.getCardStatistics();
    }

    dataTypeChange(type: string) {
        this.dataType = type;
        this.dateRange = [];
        this.getDateRange();
        this.getData();
        this.getCardStatistics();
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

    
    goBusinessOrder(header, data) {
        let paymentType,order_type;
        if (header.key !== 'total') {
            paymentType = header.key.substr(1)
        }

        if (data.order_type !== 'total') {
            order_type = data.order_type;
        }
        const start_at = this.dataParams.start_at;
        const end_at = this.dataParams.end_at;
        this.router.navigate(['/headquarters/business-order'], { queryParams: { paymentType, order_type, start_at, end_at,status: 10 } })
    }
}
