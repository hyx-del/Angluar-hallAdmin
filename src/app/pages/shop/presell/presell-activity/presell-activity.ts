import { Component, OnInit, ViewChild } from '@angular/core';
import { Http, date } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { FileService } from '@/providers/index';
import { Observable } from 'rxjs';
import { Config } from '@/config';
import * as dayjs from 'dayjs';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

@Component({
    selector: 'app-presell-activity',
    templateUrl: './presell-activity.html',
    styleUrls: ['./presell-activity.scss']
})

export class PresellActivityComponent implements OnInit {
    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];
    collection: any = {};
    isVisible: boolean = false;
    params: any = {};

    ossPath: string = "";

    form: nyForm;
    presellProjectList: any[] = [];
    memberCouponList: any[] = [];
    dateRange = [];
    isUploadLoading: boolean = false;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getCouponList();
    }

    getCouponList() {
        this.http.get("member/admin-hall/coupon/coupon-list", {  access_channel: 4 }).then(ret => {
            this.memberCouponList = ret || [];
        })
    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.getDetail(item);
        }
    }

    onFormInit(form) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            if (Array.isArray(body.start_date)) {
                let date = [...body.start_date];
                body.start_date = dayjs(date[0]).format("YYYY-MM-DD");
                body.end_date = dayjs(date[1]).format("YYYY-MM-DD");
            }
            body.content = this.params.content || "";
        }
    }

    showModal() {
        this.params = {
            page_views: 0,
            orders: 0,
            content: '',
        };
        this.form.clearError();
        this.form.body = { ...this.params };
        this.isVisible = true;
    }

    getDetail(item: any) {
        this.http.get("presell/admin-hall/activity/detail", { id: item.id }).then(ret => {
            if (ret.start_date && ret.end_date) {
                ret.start_date = [ret.start_date, ret.end_date];
            }
            if (Array.isArray(ret.images)) {
                ret.image = ret.images[0];
            }
            this.params = Object.assign({}, ret);
            this.form.body = { ...ret };
            this.isVisible = true;
        })
    }

    save() {
        if (this.params.id) {
            this.form.action = "presell/admin-hall/activity/update";
        } else {
            this.form.action = "presell/admin-hall/activity/create";
        }
        this.form.submit().then((ret) => {
            this.notificationService.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.isVisible = false;
            this.collection.load();
            this.params = {};
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除这个预售活动？",
            nzOnOk: () => {
                this.http.delete("presell/admin-hall/activity/delete", { id: data.id }).then(() => {
                    this.notificationService.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    online(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要上线这个预售活动？",
            nzOnOk: () => {
                this.http.post("presell/admin-hall/activity/online", { id: data.id, status: 1 }).then(() => {
                    this.notificationService.success("提示信息", "上线成功");
                    this.collection.load();
                })
            }
        })
    }

    offline(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要下线这个预售活动？",
            nzOnOk: () => {
                this.http.post("presell/admin-hall/activity/offline", { id: data.id, status: 0 }).then(() => {
                    this.notificationService.success("提示信息", "下线成功");
                    this.collection.load();
                })
            }
        })
    }

    handleCancel() {
        this.isVisible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }

    today = new Date();
    disabledDate = (current: Date): boolean => {
        return differenceInCalendarDays(current, this.today) < 0;
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notificationService.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isUploadLoading = true;

        return new Observable((observer) => {
            this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
                this.params.image = urls[0];
                this.form.setValue("image", urls[0]);
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    }
}
