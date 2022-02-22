import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/services/file-service';
import { Observable } from 'rxjs';
import { Config } from '@/config';
import { QuillEditorComponent } from './../../shared/quill-editor/quill-editor';

@Component({
    selector: 'app-video-position',
    templateUrl: './position.component.html',
    styleUrls: ['./position.component.scss']
})

export class VideoPositionComponent implements OnInit {
    // @ViewChild('editor') editor: QuillEditorComponent;
    public buttons: any[] = [
        { name: 'create', label: "添加体位类别", click: () => this.showModal(), }
    ]

    isVisible: boolean;
    ossPath: string;

    params: any = {};
    form: nyForm;

    collection: any = {};
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

    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
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

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.params.imageUrl = this.params.image;
        this.params.image = this.params.image_path;

        this.form.body = { ...data, image: data.image_path };
        this.isVisible = true;
    }

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/position/update";
        } else {
            this.form.action = "mix/video/admin/position/create";
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "新建成功");
            this.isVisible = false;
            this.params = {};
            this.form.body = {};
            this.collection.load();
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除该体位类别吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/position/delete", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
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
