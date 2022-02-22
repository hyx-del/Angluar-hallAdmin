import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';
import { Router } from '@angular/router'

import { Export } from '../../../providers/utils';
declare interface Shop {
    current_hall_consumption: string,
    other_hall_consumption: string,
    total_consumption: string,
    total_duration_consumption: string,
    total_time_consumption: string,
}

declare interface CurrentShop {
    hall_id: number,
    hall_name: string,
    total_consumption: number,
    order_amount: number,
}

declare interface OuterShop extends CurrentShop {}

declare interface headersType {
    key: string,
    label: string,
}
@Component({
    selector: 'app-busuness-statistics',
    templateUrl: './busuness-statistics.html',
    styleUrls: ['./busuness-statistics.scss']
})
export class HallBusunessStatisticsComponent implements OnInit {

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
    table = [];
    dataList: any[] = [];
    isLoading: boolean = false;
    shop: Shop;
    currentShopConsumptionCrad: Array<CurrentShop>;
    outerShopConsumptionCrad: Array<OuterShop>;
    consumptionCradDataHeader: Array<headersType> = [
        { key: 'hall_name', label: '场馆' },
        { key: 'order_amount', label: '单数' },
        { key: 'total_consumption', label: '耗卡金额' },
    ];

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
        this.http.get("hall/admin-hall/business-statistical", params).then(ret => {
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
        const result = await this.http.post('hall/admin-hall/card-consumption-statistics', params);
        this.shop = result.in_store_consumption;
        this.cardDate = result.in_store_consumption.card_date || null;
        
        if (result.in_store_consumption && result.in_store_consumption.count) {
            this.shopNewCardCount = result.in_store_consumption.count.new_card_count;
            this.shopOldCardCount = result.in_store_consumption.count.old_card_count;
            this.shopCount = result.in_store_consumption.count.total;
        }
        this.currentShopConsumptionCrad = result.cross_store_out_consumption;
        this.outerShopConsumptionCrad = result.cross_store_in_consumption;        
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
        // this.getCardStatistics();
    }

    export() {
        if (!this.tableHeaders.length) {
            return;
        }
        this.setTabelData(this.tableHeaders, this.dataList);
        
        //  添加店内消耗数据导出
        // this.shopDataExport();
        // 添加当前门店消耗数据导出
        // this.setTabelData(this.consumptionCradDataHeader, this.currentShopConsumptionCrad, '本店卡跨店消耗')
        // 添加外店卡入店消耗数据导出
        // this.setTabelData(this.consumptionCradDataHeader, this.outerShopConsumptionCrad, '外店卡入店消耗')

        let e = new Export('营业统计');
        let data = {
            title: '营业统计',
            table: this.table,
        };

        e.detail(data);
    }

    // 店内消耗数据导出
    shopDataExport() {
        this.table.push([],['店内耗卡统计']);
        const header  = [
            { key: 'total_consumption', label: '总耗卡金额' },
            { key: 'current_hall_consumption', label: '本店卡' },
            { key: 'other_hall_consumption', label: '外店卡' },
            { key: 'total_duration_consumption', label: '期限卡' },
            { key: 'total_time_consumption', label: '次卡' },
        ];
        let headers = header.map(item => item.label);
        let shopData = header.map(_ => this.shop[_.key]);
        this.table.push(headers);
        this.table.push(shopData);
    }

    private setTabelData(headers: Array<headersType>, data: Array<any>, text?: string, ) {
        if (text) {
            this.table.push([],[text]);
        }
        let header = headers.map(item => item.label);
        this.table.push(header);
        data.forEach(data => {
            let rowData = [];
            headers.forEach(_ => {
                rowData.push(data[_.key] || '0');
            });
            this.table.push(rowData)
        })
    }

    // 跳转到本地订单
    goBusinessOrder(header, data) {
        let paymentType,order_type;
        if (header.key !== 'total') {
            paymentType = header.key.substr(1)
        }

        if (data.order_type !== 'total') {
            order_type = data.order_type;
        }
        let params = {
            paymentType, 
            order_type, 
            start_at: this.dataParams.start_at, 
            end_at: this.dataParams.end_at, 
            status: 10,
        }
        this.router.navigate(['/shop/business-order'], { queryParams: params })
    }

    // 店内耗卡统计 跳转
    jumpShopBusiness(options = {}) {
        let params = {
            start_at: this.dataParams.start_at, 
            end_at: this.dataParams.end_at,
            status: 10,
        }
        Object.assign(params, options);

        this.router.navigate(['/shop/business-order'], { queryParams: params })
    }

    // 本店卡跨店消耗 跳转  跳转到跨店消耗页签
    jumpCurrentShop(hallId) {
        let params = {
            status: 10,
            selectedIndex: 1,
            start_at: this.dataParams.start_at, 
            end_at: this.dataParams.end_at, 
        }
        if (hallId) {
            params["hall_id"] = hallId;
        }

        this.router.navigate(['/shop/business-order'], { queryParams: params })
    }

    // 外店卡入店消耗 跳转 
    jumpOuterShopConsumption(hallId) {
        let params = {
            is_current_hall_card: 0,
            start_at: this.dataParams.start_at, 
            end_at: this.dataParams.end_at, 
        }
        if (hallId) {
            params["mCardHallId"] = hallId;
        }

        this.router.navigate(['/shop/business-order'], { queryParams: params })
    }
}
