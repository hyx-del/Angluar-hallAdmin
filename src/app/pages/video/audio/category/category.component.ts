import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService, NzMessageService  } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/services/file-service';
import { Observable, Subject } from 'rxjs';
import { Config } from '@/config';
import * as dayjs from 'dayjs';
import * as xlsx from 'xlsx';

@Component({
    selector: 'app-audio-category',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss']
})
export class AudioCategoryComponent implements OnInit {
    // @ViewChild('editor') editor: QuillEditorComponent;

    isVisible: boolean;
    detailVisible: boolean;

    ossPath: string;

    params: any = {};
    form: nyForm;
    detailForm: nyForm;

    mapOfExpandData: { [key: string]: boolean } = {};

    categoryList = [];

    isLoading: boolean = false;
    isUploadLoading: boolean = false;
    bucket: string = Config.buckets.video;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
        private messageService: NzMessageService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.video).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        // this.listOfData.forEach(item => {
        //     this.mapOfExpandData[item.id] = true;
        // })
        this.getList();
    }

    getList() {
        this.http.get("mix/video/admin/audio-category/list").then(ret => {
            let data = ret || [];
            this.categoryList = data;
            this.isLoading = false;
        })
    }

    refreshData() {
        this.isLoading = true;
        this.getList();
    }

    onFormInit(form: nyForm) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {
            // body.content = this.editor.editor.root.innerHTML;
            if (this.params.parent_id) {
                body.parent_id = this.params.parent_id;
            }
            if (this.params.is_internal) {
                body.is_internal = 1;
            } else {
                body.is_internal = 0;
            }
        }
    }

    tabSelectChange(event) {
        
    }

    showModal() {
        this.isVisible = true;
        this.params = {};
        this.form.body = {
            priority: 0
        }
    }

    showAddChild(data) {
        this.params = {
            parent_id: data.id,
        }
        this.form.body = {
            parent_id: data.id,
            priority: 0
        }
        this.isVisible = true;
    }

    onDetailFormInit(form: nyForm) {
        this.detailForm = form;
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.names = ["id"];
        this.detailForm.onSubmit = (body) => {
            if (this.params.parent_id) {
                body.parent_id = this.params.parent_id;
            }
            if (this.params.is_internal) {
                body.is_internal = 1;
            } else {
                body.is_internal = 0;
            }
        }
    }

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.params.imageUrl = this.params.image;
        this.params.image = this.params.image_path;

        if ("children" in this.params) delete this.params.children;
        this.detailForm.body = { ...data, image: data.image_path };
        this.detailVisible = true;
        // setTimeout(() => {
        //     if (data.content) {
        //         this.editor.editor.root.innerHTML = data.content;
        //     }
        // }, 0)
    }

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/audio-category/update";
        } else {
            this.form.action = "mix/video/admin/audio-category/create";
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "新建成功");
            this.isVisible = false;
            this.params = {};
            this.form.body = {};
            this.getList();
        })
    }
    canSave: boolean = true;

    updateCategory() {
        if (this.params.id) {
            this.detailForm.action = "mix/video/admin/audio-category/update";
        } else {
            this.detailForm.action = "mix/video/admin/audio-category/create";
        }

        if (!this.canSave) return ;
        this.canSave = false;

        this.detailForm.submit().then(() => {
            this.notification.success("提示信息", "修改成功");
            this.detailVisible = false;
            this.canSave = true;
            this.getList();
        }).catch(() => this.canSave = true);
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除该分类吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/audio-category/delete", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.getList();
                })
            }
        })
    }

    cancel() {
        this.isVisible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }

    closeDetailModal() {
        this.detailVisible = false;
        this.params = {};
        this.detailForm.body = {};
        this.detailForm.clearError();
        this.tabIndex = 0;
    }

    tabIndex: number = 0;
   
    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('image', item.file);
        
        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }

        this.isUploadLoading = true;

        return new Observable((observer) => {
            this.http.post('file/upload/image/v1?bucket=' + Config.buckets.video, formData).then(image => {
                if (this.detailVisible) {
                    this.params.image = image.path;
                    this.params.imageUrl = image.url;
                    this.detailForm.setValue("image", image.path);
                } else {
                    this.params.image = image.path;
                    this.params.imageUrl = image.url;
                    this.form.setValue("image", image.path);
                }
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    };


}
