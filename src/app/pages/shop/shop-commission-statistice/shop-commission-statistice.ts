import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { Export } from '@/providers/utils';

import * as dayjs from 'dayjs';


@Component({
    selector: 'app-shop-commission-statistice',
    templateUrl: './shop-commission-statistice.html',
    styleUrls: ['./shop-commission-statistice.scss']
})
export class ShopCommissionStatisticsComponent implements OnInit {

    tableHeaders: any[] = [];
    dataList: any[] = [];

    dateRange = [];
    salesmanList: any[] = [];
    isLoading: boolean = false;

    currentSaleId: any = null;
    formatStr: string = "YYYY-MM-DD";



    detailVisible: boolean = false;
    detailInfo: any = {};
    detailOrders: any[] = [];

    detailIsLoading: boolean = false;

    typeList: any = [
        { label: "开卡", value: 10 },
        { label: "转卡", value: 30 },
        { label: "储值", value: 50 },
        { label: "余额调整", value: 40 },
    ]
    params: any = {};

    constructor(
        private http: Http,
    ) { }

    ngOnInit() {
        let monthStartAt = dayjs().startOf("month").toDate();
        let monthEndAt = dayjs().endOf("month").toDate();
        this.dateRange.push(...[monthStartAt, monthEndAt]);
        this.getSalesmanList();

        this.getDataList();
    }


    getDataList() {
        let params: any = {};
        if (this.dateRange[0] && this.dateRange[1]) {
            params.start_at = dayjs(this.dateRange[0]).format(this.formatStr);
            params.end_at = dayjs(this.dateRange[1]).format(this.formatStr);
        }
        if (this.currentSaleId) {
            params.salesman_id = this.currentSaleId;
        }


        this.http.get("hall/admin-hall/sales-performance-statistics/manager-statistics", params).then(ret => {
            let headers = [];
            if (ret && ret.type) {
                for (const key in ret.type) {
                    if (key == "name") {
                        headers.unshift({ label: ret.type[key], key: key });
                    } else {
                        headers.push({ label: ret.type[key], key: key });
                    }
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

    getSalesmanList() {
        this.http.get("staff/manage/getManagerList").then(data => {
            this.salesmanList = data;
        })
    }

    saleChange() {
        this.getDataList();
    }

    dateChange() {
        this.getDataList();
    }

    refreshData() {
        this.isLoading = true;
        this.getDataList();
    }

    showDetail(data: any) {
        let params: any = {
            salesman_id: data.salesman_id,
        }
        if (this.dateRange[0] && this.dateRange[1]) {
            this.params.date = [...this.dateRange];

            params.start_at = dayjs(this.dateRange[0]).format(this.formatStr);
            params.end_at = dayjs(this.dateRange[1]).format(this.formatStr);
        }
        this.detailInfo = Object.assign({}, data);

        this.http.get("hall/admin-hall/sales-performance-statistics/salesman-detail", params).then(ret => {
            if (ret.detail) {
                if (ret.detail.commission_rate) {
                    ret.detail.commission_rate = parseFloat((parseFloat(ret.detail.commission_rate) * 100).toFixed(2));
                } else {
                    ret.detail.commission_rate = 0;
                }
                ret.detail.id = data.salesman_id;
                this.detailInfo = ret.detail;
                this.detailInfo = Object.assign(this.detailInfo, ret.detail);
            }
            this.detailOrders = ret.orders;
            this.detailVisible = true;
        })
    }

    getDetailData() {
        let params: any = {
            salesman_id: this.detailInfo.id,
        };

        if (this.params.type) {
            params.type = this.params.type;
        }
        if (this.params.member_name) {
            params.member_name = this.params.member_name;
        }
        if (this.params.member_contact) {
            params.member_contact = this.params.member_contact;
        }

        if (this.params.date && this.params.date[0] && this.params.date[1]) {
            params.start_at = dayjs(this.params.date[0]).format(this.formatStr);
            params.end_at = dayjs(this.params.date[1]).format(this.formatStr);
        }

        this.http.get("hall/admin-hall/sales-performance-statistics/salesman-detail", params).then(ret => {
            if (ret.detail) {
                if (ret.detail.commission_rate) {
                    ret.detail.commission_rate = parseFloat((parseFloat(ret.detail.commission_rate) * 100).toFixed(2));
                } else {
                    ret.detail.commission_rate = 0;
                }
                this.detailInfo = Object.assign(this.detailInfo, ret.detail);
            }
            this.detailOrders = ret.orders;
            this.detailIsLoading = false;

        })
    }

    searchDetail() {
        this.detailIsLoading = true;
        this.getDetailData();
    }

    closeModal() {
        this.detailVisible = false;
        this.detailInfo = {};
        this.detailOrders = [];
        this.params = {};
    }

    export() {
        if (!this.tableHeaders.length) {
            return;
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


        let e = new Export('店长提成统计');
        let data = {
            title: '店长提成统计',
            table: table,
        };

        e.detail(data);
    }
}
