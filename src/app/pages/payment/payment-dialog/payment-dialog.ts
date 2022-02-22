import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-payment-dialog',
    templateUrl: './payment-dialog.html',
    styleUrls: ['./payment-dialog.scss']
})

export class PaymentDialogComponent implements OnInit, OnChanges {
    @Input() params: any = {};
    // 修改支付信息
    @Input() paymentList: Array<any> = [];
    // 修改销售
    @Input() salesmanList: Array<any> = [];
    @Input() tag: 'open' | 'open_salesman' | 'transform' | 'transform_salesman' | 'adjust' | 'refund' = "open";

    @Output() onChange: EventEmitter<any> = new EventEmitter();

    isVisible: boolean = false;
    salesmanVisible: boolean = false;


    payInfo: Array<any> = [{}];
    paymentMethod: 'one' | 'multiple' = "one";


    salesmanId: any;

    payment: any = {};

    tagsMap: any =  {
        open: "member_course_card_order_payment_info",
        open_salesman: "member_course_card_order_salesman",
        transform: "member_course_card_transform_order_payment_info",
        transform_salesman: "member_course_card_transform_order_salesman",
        adjust: "member_course_card_adjust_order_payment_info",
        refund: "member_course_card_refund_order_payment_info",
    }

    paymentTime: any;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
    ) { }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.params && changes.params.currentValue) {
            if (this.params.salesman_id || this.params.to_salesman_id) {
                this.salesmanId = this.params.salesman_id || this.params.to_salesman_id;
            }
            if (this.params && this.params.payments && this.params.payments.length > 1) {
                this.paymentMethod = 'multiple';
                this.payInfo = this.params.payments.map(item => {
                    return { channel: item.channel, trade_no: item.trade_no, amount: item.amount };
                })
            } else if (this.params && this.params.payments && this.params.payments.length > 0) {
                this.paymentMethod = 'one';
                this.payment = { channel: this.params.payments[0].channel, trade_no: this.params.payments[0].trade_no };
            }
            this.paymentTime = this.params.collection_time || this.params.payment_time;
        }
    }
    

    showUpdateDialog() {
        this.isVisible = true;
    }

    showSalesmanDialog() {
        this.salesmanVisible = true;
    }

    addPaymentInfo() {
        this.payInfo.push({});
    }

    removePaymentInfo(index) {
        this.payInfo.splice(index, 1);
    }

    disabledPaymentDate = (endValue: Date): boolean => {
        return differenceInCalendarDays(endValue, new Date()) > 0;
    };

    onSave() {
        let params = {
            tag: this.tagsMap[this.tag],
            id: this.params.id,
            update_data: {

            },
        };
        let updateData: any = {};
        if (this.tag == 'open_salesman' || this.tag == 'transform_salesman') {
            if (this.tag == "transform_salesman") {
                updateData.to_salesman_id = this.salesmanId;
            } else {
                updateData.salesman_id = this.salesmanId;
            }
        } else {
            if (this.paymentMethod == 'one') {
                let price;
                if (this.tag == 'open') {
                    price = this.params.actual_price === 0 ? 0 : this.params.actual_price;
                } else {
                    price = this.params.pay_money === 0 ? 0 : this.params.pay_money;
                }
                updateData.payments = [{ amount: price || 0, ...this.payment }];
            } else {
                updateData.payments = this.payInfo.filter(pay => pay.channel && pay.amount);
                if (!updateData.payments.length || !updateData.payments[0].channel) {
                    this.notification.info("提示信息", "请选择支付方式");
                }
            }
            if (this.tag != 'refund' && this.tag != 'adjust') {
                updateData.payment_time = dayjs(this.paymentTime || new Date()).format('YYYY-MM-DD HH:mm:ss');
            }
        }

        params.update_data = updateData;

        this.http.post("hall/data-modify/order-data-modify", params).then(ret => {
            this.onChange.emit(updateData);
            this.notification.success("提示信息", "修改成功");
            this.isVisible = false;
            this.salesmanVisible = false;
        }).catch(error => {
            if (error.error.message) {
                this.notification.error("提示信息", error.error.message);
            }
        })
    }

    onCancel() {
        this.isVisible = false;
        this.salesmanVisible = false;
    }

}
