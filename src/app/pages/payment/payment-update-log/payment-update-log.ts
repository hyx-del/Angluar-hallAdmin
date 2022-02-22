import { Component, Input, OnInit } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';

import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-payment-update-log',
    templateUrl: './payment-update-log.html',
    styleUrls: ['./payment-update-log.scss']
})
export class PaymentUpdateLogComponent implements OnInit {

    @Input() tag: 'open' | 'open_salesman' | 'transform' | 'transform_salesman' | 'adjust' | 'refund' = "open";

    @Input() orderId: string;

    isVisible: boolean = false;

    tagsMap: any =  {
        open: "member_course_card_order_payment_info",
        open_salesman: "member_course_card_order_salesman",
        transform: "member_course_card_transform_order_payment_info",
        transform_salesman: "member_course_card_transform_order_salesman",
        adjust: "member_course_card_adjust_order_payment_info",
        refund: "member_course_card_refund_order_payment_info",
    }

    constructor(
        private notification: NzNotificationService,
        private http: Http,
    ) { }
        
    tdWidth: string;

    ngOnInit() {
        // if (this.tag != 'refund' && this.tag != 'adjust') {
        //     this.tdWidth = '20%';
        // } else {
        //     this.tdWidth = '35%';
        // }
        this.tdWidth = '35%';
    }

    logList: Array<any> = [];

    showLogDialog() {
        this.logList = [];
        this.http.post("hall/data-modify/change-log", { tag: this.tagsMap[this.tag], order_id: this.orderId }).then(ret => {
            // 开卡销售与转卡销售
            if (this.tag == 'open_salesman' || this.tag == 'transform_salesman') {
                this.logList = ret || [];
            } else {
                this.logList = ret || [];
            }
        });
        this.isVisible = true;
    }

    onCancel() {
        this.isVisible = false;
    }
}
