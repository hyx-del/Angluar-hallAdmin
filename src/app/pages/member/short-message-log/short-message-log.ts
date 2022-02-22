
import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { NzNotificationService } from 'ng-zorro-antd';
import * as dayjs from 'dayjs';

type SmsSendData = {
    PhoneNum: String,
    SendDate: String,
    ReceiveDate: String,
    Content: String,
    TemplateCode: String,
    SendStatus: number
}
@Component({
    selector: 'app-short-message-log',
    templateUrl: './short-message-log.html',
    styleUrls: ['./short-message-log.scss']
})

export class ShortMessageLogComponent implements OnInit {
    public sendDate: Date;

    public mobile: String;

    public smsSendData: Array<SmsSendData> = [];

    constructor(
        private http: Http,
        private notification: NzNotificationService,
    ) { }

    ngOnInit() {

    }

    public search() {
        if (!this.sendDate) {
            this.notification.info('提示信息', '请选择查询时间!');
            return;
        }

        if (!this.mobile) {
            this.notification.info('提示信息', '请输入查询的手机号!');
            return;
        }

        const params = {
            sendDate: dayjs(this.sendDate).format('YYYYMMDD'),
            mobile: this.mobile
        }

        this.http.post('/member/admin/sms/send/detail', params).then(res => {
            console.log(res);
            this.smsSendData = res.SmsSendDetail;
        })
    }


}
