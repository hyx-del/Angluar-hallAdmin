import { Component, OnInit } from '@angular/core';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/index';
import { Config } from '@/config';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-staff-file',
    templateUrl: './staff-file.component.html',
    styleUrls: ['./staff-file.component.scss']
})
export class StaffFileComponent implements OnInit {
    public group;

    public collection: any = {};

    public listUrl = 'finance/salary/admin-hall/staff-profile/list';

    public roleManage: any;

    public buttons: Array<any> = [
        { label: '档案同步', click: () => this.synchronization(), display: true }
    ];

    public fileModalVisible = false;
    public radioValue = 1;

    // 详情
    public detailsVisible = false;
    public userDetail: any;

    // 同步数据
    public mobile: any;
    public userInfoData: any;

    // 调薪
    public form: nyForm;

    // 薪资调整记录
    public salaryAdjustmentCollection: any;
    public salaryAdjustmentListUrl: string;
    public isTabelList = false;

    public ossPath: string = "";

    public ifrepeat: boolean;

    public today = new Date();

    public isConfirmLoading = false;

    constructor(
        private modalService: NzModalService,
        private http: Http,
        private notification: NzNotificationService,
        private fileService: FileService
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        });
    }

    ngOnInit() {
    }

    public setCollection(collection: object) {
        this.collection = collection;
    }

    // 同步
    public synchronization() {
        this.fileModalVisible = true;
    }

    public async findUserInfo() {
        const data = await this.http.post('finance/salary/admin-hall/staff-profile/search-staff', { mobile: this.mobile });
        if (data) {
            this.userInfoData = data;
        } else {
            this.notification.info('提示', '员工不存在');
        }
    }

    public fileModalCancel() {
        this.fileModalVisible = false;
        this.radioValue = 1;
        this.userInfoData = null;
        this.mobile = null
    }

    public async fileModalOk() {
        this.isConfirmLoading = true;
        let params;
        if (this.radioValue !== 1) {
            if (!this.userInfoData) {
                return;
            }
            params = {
                staff_id: this.userInfoData.id
            };
        }
        try {
            const ret = await this.http.post('finance/salary/admin-hall/staff-profile/sync-staff-info', params);
            this.notification.success('提示信息', '同步成功!');
            this.fileModalCancel();
            this.collection.load();
            this.isConfirmLoading = false;
        } catch (error) {
            this.isConfirmLoading = false;
            // this.notification.error('提示信息', '同步失败!');
        }
    }

    // 详情
    public async edit(item) {
        if (!item) {
            return;
        }
        const data = await this.http.post('finance/salary/admin-hall/staff-profile/detail', { id: item.id });
        if (data) {
            this.userDetail = data;
            
            setTimeout(()=>{
                this.form.body = data;
            })
            
            console.log('this.userDetail====>', this.userDetail);
        }
        this.detailsVisible = true;
    }

    public detailsModalClose() {
        this.detailsVisible = false;
    }

    // 调薪
    public async save() {
        try {
            this.form.action = 'finance/salary/admin-hall/staff-profile/adjust';
            const data = await this.form.submit();

            if(data.ifrepeat) {
                this.modalService.confirm({
                    nzTitle: '提示信息',
                    nzContent: '调薪已存在是否需要覆盖？',
                    nzOnOk: () =>{
                        this.ifrepeat = data.ifrepeat
                        this.save();
                        this.ifrepeat = null;
                    }   
                });
            }else {
                this.notification.success('提示信息', '调薪成功');
                this.form.body.effective_date = null;
            }
        } catch (error) {}
    }

    public onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (body.effective_date) {
                body.effective_date = dayjs(body.effective_date).format('YYYY-MM-DD');
            }

            if(this.ifrepeat) {
                body.ifrepeat = this.ifrepeat;
            }

            body.id = this.userDetail.id;
        };
    }

    public detailsSelectChange(event) {
        if (event.index === 2) {
            this.isTabelList = true;
            // eslint-enable
            this.salaryAdjustmentListUrl = 'finance/salary/admin-hall/adjust-record/list?id=' + this.userDetail.id;
            /*eslint-enable*/
        }
    }

    public salaryAdjustmentSetCollection(collection) {
        this.salaryAdjustmentCollection = collection;
    }

    // 禁用时间
    disabledDate = (current: Date): boolean => {
        return differenceInCalendarDays(current, this.today) < 0;
      };


    // 撤销
    public backOut(item) {
        this.modalService.confirm({
            nzTitle: '提示',
            nzContent: '确定撤销本次调薪?',
            nzOkText: '确定',
            nzCancelText: '取消',
            nzOnOk: async () => {
                const data = await this.http.post('finance/salary/admin-hall/adjust-record/revocation', { id: item.id });
                if (data === 'success') {
                    this.notification.success('提示信息', '撤销成功');
                    this.salaryAdjustmentCollection.load();
                } else {
                    this.notification.success('提示信息', '撤销失败');
                }
            }
        });
    }
}
