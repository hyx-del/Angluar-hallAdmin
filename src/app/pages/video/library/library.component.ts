import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/services/file-service';
import { Observable } from 'rxjs';
import { Config } from '@/config';
import { FileUploadService, PageTabs } from '@/providers/index';

@Component({
    selector: 'app-video-library',
    templateUrl: './library.component.html',
    styleUrls: ['./library.component.scss']
})
export class VideoLibraryComponent implements OnInit {

    public buttons: any[] = [
        { name: 'create', label: "添加", click: () => this.showModal(), }
    ]

    collection: any = {};
    isVisible: boolean = false;
    ossPath: string;
    bucket: string = Config.buckets.video;

    videoList: any[] = [];
    params: any = {};
    form: nyForm;

    
    isAutoSave: boolean = false;
    disabledId: boolean = true;

    videoHtmlContent: string = "";

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
        private uploadService: FileUploadService,
        private pageTabs: PageTabs,
    ) {
        this.fileService.getBucketInfo(Config.buckets.video).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {

    }

    setCollection(collection) {
        this.collection = collection;

        this.collection.onLoaded = () => {
            this.videoList = this.collection.data || [];
        }
    }

    showModal() {
        this.isVisible = true;
        this.disabledId = true;
        
        this.videoHtmlContent = "";
    }

    onFormInit(form) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {
            if (this.params.video_url_id) {
                body.video_url_id = this.params.video_url_id;
            }
            
            body.introduction = this.videoHtmlContent || "";
        }
    }

    showDetail(data: any) {
        this.http.get("mix/video/admin/data/detail", { id: data.id }).then(ret => {

            this.params = Object.assign({}, ret);
            this.params.imageUrl = this.ossPath + this.params.cover_path;
            this.params.cover = this.params.cover_path;
            if (ret.vertical_cover_path) {
                this.params.verticalCover = this.ossPath + this.params.vertical_cover_path;
                this.params.vertical_cover = this.params.vertical_cover_path;
            }
           
            this.form.body = { ...ret, cover: ret.cover_path, vertical_cover: ret.vertical_cover_path };
            this.isVisible = true;
            
            this.videoHtmlContent = ret.introduction || "";
        })

    }

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/data/update";
        } else {
            this.form.action = "mix/video/admin/data/create";
        }

        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "添加成功");
            this.isVisible = false;
            this.params = {};
            this.form.body = {};
            this.collection.load();
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除该视频吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/data/delete", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    copyVideoId() {
        if (!this.params.video_url_id) return ;

        let input = document.createElement('input');
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('value', this.params.video_url_id);
        document.body.appendChild(input);
        input.select();
        if (document.execCommand('copy')) {
            document.execCommand('copy');
            this.notification.success("提示信息","复制成功");
        }
        document.body.removeChild(input);
    }

    insertVideoId() {
        this.disabledId = false;
        if (this.isUploadVideo) { // 正在上传 取消上传
            this.cancelUploadVideo();
        }
    }

    cancel() {
        if (this.isUploadVideo) {
            this.notification.info("提示信息", "正在上传视频");
            return;
        }
        this.isVisible = false;
        this.disabledId = true;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
        this.videoHtmlContent = "";
    }
    loading: boolean = false;

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('image', item.file);

        return new Observable((observer) => {
            const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
            if (!isLtMaxSize) {
                this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
                observer.complete();
                return;
            }

            this.loading = true;
            this.http.post('file/upload/image/v1?bucket=' + Config.buckets.video, formData).then(file => {
                this.params.cover = file.path;
                this.params.imageUrl = file.url;
                this.form.setValue("cover", file.path);
                this.loading = false;
                observer.next();
            }).catch(() => {
                this.loading = false;
            })
        }).subscribe(() => {
            this.loading = false;
            item.onSuccess();
        })
    };

    uploadImgComplete(data) {
        this.params.cover = data.path;
        this.params.imageUrl = this.ossPath + data.path;
        this.form.setValue("cover", data.path);
    }

    uploadCoverImgComplete(data) {
        this.params.vertical_cover = data.path;
        this.params.verticalCover = this.ossPath + data.path;
        this.form.setValue("vertical_cover", data.path);
    }

    isUploadVideo: boolean = false;
    uploadTask: any = null;

    public uploadVideo = (item) => {
        this.isUploadVideo = true;
        this.pageTabs.active.deletable = false;

        let task = this.uploadService.upload(item.file.name, item.file);
        this.uploadTask = task;
        task.start();
        return new Observable((observer) => {
            task.onSucceed(() => {
                this.params.video_url_id = task.id();
                this.form.setValue("video_url_id", this.params.video_url_id);
                observer.next();
                this.setCanClose();
            })
            task.onCanceled(() => {
                this.setCanClose();
            })
            task.onFailed(() => {
                this.setCanClose();
            })
        }).subscribe(() => {
            item.onSuccess();
            this.uploadService.clear(task);
        })
    }

    cancelUploadVideo() {
        if (this.uploadTask) {
            this.uploadTask.cancel();
            this.uploadService.clear(this.uploadTask);
        }
        this.setCanClose();
    }

    setCanClose() {
        this.isUploadVideo = false;
        this.pageTabs.active.deletable = true;
    }


    pageIndex: number = 1;
    pageSize: number = 20;
    total: number = 0;

    cateId: any = "";
    cateList: any[] = [];
    tabSelectedIndex: number = 0;
    mediaList: any[] = [];
    isLoading: boolean = false;
    videoStatus: any = {
        Uploading: {
            label: "上传中",
            color: "#52c41a",
        },
        UploadFail: {
            label: "上传失败",
            color: "#f5222d",
        },
        UploadSucc: {
            label: "上传完成",
            color: "",
        },
        Transcoding: {
            label: "转码中",
            color: "#52c41a",
        },
        TranscodeFail: {
            label: "转码失败",
            color: "#f5222d",
        },
        Checking: {
            label: "审核中",
            color: "#52c41a",
        }, 
        Blocked: {
            label: "屏蔽",
            color: "#cccccc",
        },
        Normal: {
            label: "正常",
            color: "",
        },
        ProduceFail: {
            label: "合成失败",
            color: "#f5222d",
        },
    }

    tabChange(index: number) {
        if (index && !this.cateList.length) {
            this.getVideoCateList();
        }
    }

    cateChange() {
        this.getVideoList();
    }

    refreshVideoList() {
        if (!this.cateId) return ;
        this.isLoading = true;
        this.getVideoList();
    }

    getVideoCateList() {
        this.http.get("mix/video/admin/temp-data/cate-list").then(ret => {
            this.cateList = ret || [];
            if (this.cateList.length) {
                this.cateId = this.cateList[0].CateId;
                this.getVideoList();
            }
        })
    }

    getVideoList() {
        let params: any = {
            page: this.pageIndex,
            size: this.pageSize
        }
        if (this.cateId) {
            params.cate_id = this.cateId;
        }
        this.http.get("mix/video/admin/temp-data/video-list", params).then(ret => {
            this.mediaList = ret.mediaList;
            this.total = ret.total || 0;
            this.isLoading = false;
        })
    }

    saveVideo(data: any) {
        this.showModal();
        let title = data.Title;
        let lastIndex = title.lastIndexOf(".");

        this.params = {
            video_url_id: data.VideoId,
            title: lastIndex > 0 ? title.substr(0, lastIndex) : title,
        }
        this.form.body = {
            ...this.params,
        }
    }

    upload(data: any) {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.click();

        input.onchange = () => {
            let file = input.files[0];
            let task = this.uploadService.upload(file.name, file);
            if (data.VideoId != task.id()) {
                this.uploadService.clear(task);
                this.notification.info("提示信息", "请选择正确的文件");
            } else {
                task.start();
                new Observable((observer) => {
                    task.onSucceed(() => {
                        observer.next();
                    })
                }).subscribe(() => {
                    this.uploadService.clear(task);
                })
            }
        };
    }

}
