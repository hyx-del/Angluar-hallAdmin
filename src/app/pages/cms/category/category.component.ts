import { Component } from '@angular/core';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService } from '@/providers/index';

@Component({
    selector: 'app-category',
    styleUrls: ['category.component.scss'],
    templateUrl: 'category.component.html',
})
export class CategoryComponent {
    public visible: boolean = false;
    public categoryList: any[] = [];
    public params: any = {};
    public nodes: any[] = [];
    public form: nyForm;
    public collection: any = {};

    public ossPath: string = '';

    isLoading: boolean = false;
    isUploadLoading: boolean = false;

    constructor(
        public http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    public urls = {
        create: 'mix/cms/admin/material-category/create',
        update: 'mix/cms/admin/material-category/update',
        list: 'mix/cms/admin/material-category/list',
        delete: 'mix/cms/admin/material-category/delete',
    }

    ngOnInit() {
        this.getGroupList();
    }

    add() {
        this.params = {};
        this.visible = true;
    }

    cancel() {
        this.visible = false;
        this.params = {};
    }

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.visible = true;
    }

    getGroupList() {
        this.http.get(this.urls.list).then(ret => {
            this.categoryList = ret || [];
            this.isLoading = false;
        });
    }

    refreshData() {
        this.isLoading = true;
        this.getGroupList();
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: '确认删除' + data.name + '分组',
            nzOnOk: () => {
                this.http.post(this.urls.delete, {id: data.id}).then(ret => {
                    this.notification.success('提示信息', '删除成功');
                    this.getGroupList();
                });
            }
        });
    }

    save() {
        this.form.action = this.params.id ? this.urls.update : this.urls.create;
        this.form.submit().then(ret => {
            this.notification.success('提示信息', this.params.id ? '修改成功' : '添加成功');
            this.visible = false;
            this.params = {};
            this.getGroupList();
        });
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        if (this.params.id) {
            this.form.body = {...this.params};
        }
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            if (this.params.thumb_url) {
                body.thumb_url = this.params.thumb_url;
            }
        };
    }

    public uploadImg = (item) => {
        console.log(item, Config);
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isUploadLoading = true;

        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            this.params.thumb_url = urls[0];
            this.isUploadLoading = false;
        }).catch(() => {
            this.isUploadLoading = false;
        });
    }
}