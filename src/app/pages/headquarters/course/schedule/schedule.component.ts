import { Component, OnInit } from '@angular/core';
import * as dayjs from 'dayjs';
import { Http } from '@yilu-tech/ny'
import { Collection } from '@yilu-tech/ny/search'
import { NzNotificationService } from 'ng-zorro-antd';
import { Config } from '@/config';

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {

    public buttons = [
        { label: '导出', display: true, click: () => this.exportData() }
    ]

    collection: Collection = new Collection(this.http);

    public exportModalVisible: boolean = false;

    public monthDate: string = null;

    public isConfirmLoading: boolean = false;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
    ) {

    }

    private exportData() {
        this.exportModalVisible = true;
    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.onInit = () => {
            let start_date = dayjs().startOf("month").toDate();
            let end_date = dayjs().endOf("month").toDate();
            // this.collection.where('start_at', [start_date, end_date], '=');
        }
        this.collection.onExportLoad = (body) => {
            const start_at = dayjs(this.monthDate).startOf('month').format('YYYY-MM-DD');
            const start_ed = dayjs(this.monthDate).endOf('month').format('YYYY-MM-DD');
            if (!body.params) {
                body.params = []
            } else {
                body.params = body.params.filter(item => item[0] !== 'start_at');
            }
            body.params.push([['start_at', 'in', [start_at, start_ed]]]);
        }
    }

    public handleCancel() {
        this.exportModalVisible = false;
        this.monthDate = null;
    }

    public async handleOk() {
        this.isConfirmLoading = true;
        if (this.monthDate) {
            const params = await this.collection.serverExport('会馆课表数据', 'all');
            let link = document.createElement('a');
            link.href = Config.baseUrl + '/hall/' + params;
            link.download = '会馆课表数据.xlsx';
            link.click();

            this.handleCancel();
       } else {
            this.notification.info('提示信息', '请选择月份！');
        }
        this.isConfirmLoading = false;
    }
}
