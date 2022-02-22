import { Component, OnInit } from '@angular/core';
import * as dayjs from 'dayjs';
import { ActivatedRoute } from '@angular/router';
import { Collection, Condition, DateRangeCondition } from "@yilu-tech/ny/search"
import { Http } from '@yilu-tech/ny';
@Component({
    selector: 'app-business-order',
    templateUrl: './business-order.html',
    styleUrls: ['./business-order.scss']
})
export class BusinessOrderComponent implements OnInit {

    public collection: Collection = new Collection(this.http);

    private order_type: string;

    private payment_type: string;

    private start_date: Date;

    private end_date: Date;

    private status: any;

    constructor(
        private activatedRoute: ActivatedRoute,
        private http: Http,
    ) {
        this.activatedRoute.queryParams.subscribe(params => {
            this.order_type = params.order_type; // 订单类型
            this.payment_type = params.paymentType; // 支付类型
            // 开始时间
            if (params.start_at) {
                this.start_date = dayjs(params.start_at).toDate();
            } else {
                this.start_date = dayjs().startOf('day').toDate();
            }
            // 结束时间
            if (params.end_at) {
                this.end_date = dayjs(params.end_at).toDate();
            } else {
                this.end_date = dayjs().endOf('day').toDate();
            }
            this.status = params.status;
        })
    }

    ngOnInit() {
    }

    public setCollection(collection: Collection) {
        this.collection = collection;

        this.collection.onInit = () => {
            let condition = this.collection.conditions.get('created_at');
            if (condition) {
                condition.format = 'Y-m-d H:i:s';
                // condition.checked = true;
                // condition.value = [this.start_date, this.end_date];
            }
            let paymentDateCondition = this.collection.conditions.get("payment.updated_at");
            if (paymentDateCondition) {
                paymentDateCondition.format = 'Y-m-d H:i:s';
                paymentDateCondition.checked = true;
                paymentDateCondition.value = [this.start_date, this.end_date];
            }

            if (this.status) {
                this.collection.where('status', parseInt(this.status), '=');
            }
            if (this.order_type) {
                this.collection.where('type', this.order_type, '=');
            }
            if (this.payment_type) {
                this.collection.where('payment.channel', parseInt(this.payment_type), '=');
            }
        }
    }

}
