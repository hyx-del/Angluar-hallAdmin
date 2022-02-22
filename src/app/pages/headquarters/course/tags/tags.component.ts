import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/index';
import { Observable } from 'rxjs';
import { Config } from '@/config';

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss']
})
export class CourseTagsComponent implements OnInit {
    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];

    collection: any = {};
    params: any = {};
    isVisible: boolean = false;

    ossPath: string = "";
    form: nyForm;
    isUploadLoading: boolean = false;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
        private fileService: FileService,
    ) {

        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;

        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.getDetail(item);
        }
    }
    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {

        }

    }
    showModal() {
        this.params = {};
        this.form.body = {};
        this.form.clearError();
        this.isVisible = true;
    }

    getDetail(data: any) {
        // this.http.get("hall/course/admin/label/detail", { id: data.id }).then(ret => {
        this.params = Object.assign({}, data);
        this.form.body = { ...data };
        this.isVisible = true;
        // })
    }

    save() {
        if (this.params.id) {
            this.form.action = "hall/course/admin/label/update";
        } else {
            this.form.action = "hall/course/admin/label/create";
        }

        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.isVisible = false;
            this.collection.load();
            this.params = {};
        })
    }

    disabled(data: any) {
        this.modalService.confirm({
            nzTitle: "确定禁用这个课程标签？",
            nzOnOk: () => {
                this.http.post("hall/course/admin/label/disable", { id: data.id }).then(ret => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }

    enable(data: any) {
        this.modalService.confirm({
            nzTitle: "确定启用这个课程标签？",
            nzOnOk: () => {
                this.http.post("hall/course/admin/label/enable", { id: data.id }).then(ret => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个课程标签？",
            nzOnOk: () => {
                this.http.post("hall/course/admin/label/delete", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
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

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isUploadLoading = true;

        return new Observable((observer) => {
            this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
                this.params.icon = urls[0];
                this.form.setValue("icon", urls[0]);
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    }
}
