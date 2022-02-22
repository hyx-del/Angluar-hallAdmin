import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/services/file-service';
import { Observable } from 'rxjs';
import { Config } from '@/config';
import { QuillEditorComponent } from './../../shared/quill-editor/quill-editor';

@Component({
    selector: 'app-school',
    templateUrl: './school.component.html',
    styleUrls: ['./school.component.scss']
})
export class VideoSchoolComponent implements OnInit {

    // @ViewChild('editor') editor: QuillEditorComponent;

    public buttons = [
        { name: 'create', label: "添加流派", click: () => this.showModal() }
    ]

    isVisible: boolean;
    ossPath: string;

    params: any = {};
    form: nyForm;

    genreList = [];
    isLoading: boolean = false;
    isUploadLoading: boolean = false;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getList();
    }

    getList() {
        this.http.get("mix/video/admin/genre/list").then(ret => {
            this.genreList = ret || [];
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
        }
    }

    showModal() {
        this.isVisible = true;
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

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.params.imageUrl = this.params.image;
        this.params.image = this.params.image_path;

        if ("children" in this.params) delete this.params.children;
        this.form.body = { ...data, image: data.image_path };
        this.isVisible = true;
    }

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/genre/update";
        } else {
            this.form.action = "mix/video/admin/genre/create";
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "添加成功");
            this.isVisible = false;
            this.params = {};
            this.form.body = {};
            this.getList();
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除该流派吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/genre/delete", { id: data.id }).then(() => {
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
                this.params.image = image.path;
                this.params.imageUrl = image.url;
                this.form.setValue("image", image.path);
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    };
}
