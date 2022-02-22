import { Component, OnInit } from '@angular/core';
import * as dayjs from 'dayjs';
import { ActivatedRoute } from '@angular/router';
import { Collection, Condition } from "@yilu-tech/ny/search"
import { Http, date } from '@yilu-tech/ny';
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

    selectedIndex: number = 0;

    // 是否是期限卡
    hasTimeCard: boolean = false;

    params: any = {};

    constructor(
        private activatedRoute: ActivatedRoute,
        private http: Http,
    ) {
        this.activatedRoute.queryParams.subscribe(params => {
            this.selectedIndex = params.selectedIndex || 0;
            this.hasTimeCard = params.hasTimeCard || false;
            this.params = params;

            this.order_type = params.order_type; // 订单类型
            this.payment_type = params.paymentType; // 支付类型
            // 开始时间
            if (params.start_at) {
                this.start_date = dayjs(params.start_at).toDate();
            } else {
                this.start_date = dayjs().startOf('date').toDate();
            }
            // 结束时间
            if (params.end_at) {
                this.end_date = dayjs(params.end_at).toDate();
            } else {
                this.end_date = dayjs().endOf('date').toDate();
            }

            this.status = params.status;
        })
    }

    ngOnInit() {
    }

    public setCollection(collection: Collection) {
        this.collection = collection;

        this.collection.onInit = () => {
            if (this.selectedIndex == 1) return ;
            let dateKey = "";
            if (this.hasTimeCard) { // 期限卡是created_at
                dateKey = "created_at";
            } else {
                dateKey = "payment.updated_at";
            }
            ["created_at", "payment.updated_at"].forEach(key => {
                let condition = this.collection.conditions.get(key);
                if (condition) {
                    condition.format = 'Y-m-d H:i:s';
                }
            });

            if (this.params.start_at && this.params.end_at) {
                let condition = this.collection.conditions.get(dateKey);
                if (condition) {
                    condition.format = 'Y-m-d H:i:s';
                    condition.value = [this.start_date, this.end_date];
                    condition.checked = true;
                }
            } else {
                let condition = this.collection.conditions.get("created_at");
                if (condition) {
                    condition.format = 'Y-m-d H:i:s';
                    condition.value = [dayjs().startOf('date').toDate(), dayjs().endOf('date').toDate()];
                    condition.checked = true;
                }
            }

            if (this.status) {
                this.collection.where('status', parseInt(this.status), '=');
            }
            if (this.order_type) {
                this.collection.where('type',parseInt(this.order_type), '=');
            }
            if (this.payment_type) {
                this.collection.where('payment.channel', parseInt(this.payment_type), '=');
            }
            if (this.params.type) {
                this.collection.where('type', this.params.type, '=');
            }

            if (this.params.mCardHallId) {
                this.collection.where('mCard.hall_id', this.params.mCardHallId, '=');
            }
            if (this.params.card_type) {
                this.collection.where('card_type', this.params.card_type, '=');
            }
            if (this.params.hasOwnProperty("is_current_hall_card")) {
                let condition = this.collection.conditions.get("is_current_hall_card");
                if (condition) {
                    condition.value = parseInt(this.params.is_current_hall_card)
                    condition.checked = true;
                } else {
                    this.collection.where('is_current_hall_card', parseInt(this.params.is_current_hall_card), '=');
                }
            }

        }
    }

    public crossHallCollection: Collection = new Collection(this.http);

    public setCrossHallCollection(collection: Collection) {
        this.crossHallCollection = collection;

        this.crossHallCollection.onInit = () => {
            if (this.params.hall_id) {
                this.crossHallCollection.where('hall_id', this.params.hall_id, '=');
            }
            if (this.status) {
                this.crossHallCollection.where('status', parseInt(this.status), '=');
            }
        }
    }

}
