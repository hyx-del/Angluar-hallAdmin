import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/services/file-service';
import { Observable } from 'rxjs';
import { Config } from '@/config';
import { FileUploadService, PageTabs } from '@/providers/index';
import * as Plyr from 'plyr';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-audio-manage',
    templateUrl: './audio.component.html',
    styleUrls: ['./audio.component.scss']
})

export class AudioManageComponent implements OnInit {

    @ViewChild('searchInput') searchInput;

    public buttons: any[] = [
        { name: 'create', label: "发布音频", click: () => this.showModal(), }
    ]

    isVisible: boolean;
    ossPath: string;

    params: any = {};
    form: nyForm;

    collection: any = {};
    categoryList: any[] = [];
    coachList: any[] = [];
    genreList: any[] = [];
    positionList: any[] = [];

    searchCoachList: any[] = [];
    isAutoSave: boolean = false;
    disabledId: boolean = true;

    currentVideo: any = {};
    videoBucket: string = Config.buckets.video;
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
    }


    getCategoryList() {
        this.http.get("mix/video/admin/audio-category/list").then(ret => {
            this.categoryList = ret || [];
            if (this.params.id) {
                this.restoreCategoryChecked();
            }
        })
    }

    getInitList() {
        if (!this.categoryList.length) {
            this.getCategoryList();
        }
    }

    onFormInit(form: nyForm) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {
            ["is_show_front", "is_free"].forEach(key => {
                if (this.params[key]) {
                    body[key] = 1;
                } else {
                    body[key] = 0;
                }
            })
            if (this.currentVideo.id) {
                body.video_data_id = this.currentVideo.id;
            }
            // if (this.params.video_url_id) {
            //     body.video_url_id = this.params.video_url_id;
            // }
            let categoryIds = [];
            this.categoryList.forEach(item => {
                item.children.forEach(child => {
                    if (child.checked) {
                        categoryIds.push(child.id);
                    }
                });
            })
            body.video_category_ids = categoryIds;
            body.content = this.videoHtmlContent || "";
            if (body.created_at) {
                body.created_at = dayjs(body.created_at).format("YYYY-MM-DD HH:mm:ss");
            }
        }
    }

    showModal() {
        this.isVisible = true;
        this.disabledId = true;
        this.form.body = {
            play_count: 0, // 播放次数 || 浏览次数
            praise_count: 0, //点赞人数
            points: 0, // 积分
            priority: 0,
        }
        this.videoHtmlContent = "";
        this.form.clearError();
        this.getInitList();
    }

    showDetail(data: any) {
        this.http.get("mix/video/admin/audio/detail", { id: data.id }).then(ret => {
            if (!ret.priority) {
                ret.priority = 0;
            }
            this.currentVideo = ret.data || {};
            this.params = Object.assign({}, ret);
            this.params.imageUrl = this.params.image;
            this.params.image = this.params.image_path;

            ["is_show_front", "is_free"].forEach(key => {
                ret[key] ? this.params[key] = true : this.params[key] = false;
            })
            this.restoreCategoryChecked();
            this.form.body = { ...ret, image: ret.image_path };
            this.isVisible = true;
            this.videoHtmlContent = ret.content;
            this.getInitList();
        })

    }

    videoVisible: boolean = false;
    videoCollection: any = {};
    videoList: any[] = [];
    selectVideo: any = {};
    previewVisible: boolean = false;
    public player;
    playerOptions = {
        fullscreen: { enabled: false },
        controls: [
            'play-large',
            'play', // 播放
            'progress', // 进度条
            'current-time',
            'volume', // 初始音量
            'settings', // 设置
            'fullscreen', // 全屏
        ],
        tooltips: {
            controls: true,
            seek: true
        },
        ratio: "16:9",
        i18n: {
            play: "播放",
            pause: "暂停",
            mute: "静音",
            unmute: '取消静音',
            settings: "设置",
            enterFullscreen: '全屏',
            exitFullscreen: '退出全屏',
            speed: '播放速度',
            normal: '正常',
            quality: '清晰度',
        },
    }

    showVideoModal() {
        this.videoVisible = true;
        if (this.videoCollection['load']) {
            this.videoCollection.load();
        }
    }

    setVideoCollection(collection) {
        this.videoCollection = collection;
        this.videoCollection.onLoaded = () => {
            this.videoList = this.videoCollection.data || [];
        }
    }

    checkVideo(video: any) {
        this.selectVideo = video;
    }

    confirmVideoSelect() {
        if (!this.selectVideo.id) {
            this.notification.info("提示信息", "请选择音频");
            return ;
        }
        this.videoVisible = false;
        this.currentVideo = Object.assign({}, this.selectVideo);
        this.form.setValue("title", this.currentVideo.title);
        this.videoHtmlContent = this.currentVideo.introduction || "";
    }

    cancelVideoSelect() {
        this.videoVisible = false;
    }
    sources = [];
    
    showPreviewModal() {
        this.http.get("mix/video/admin/audio/get-playUrl", { id: this.currentVideo.id }).then(data => {
            this.previewVisible = true;
            if (data && data.length) {
                let sources = data.map(video => {
                    return { type: 'video/mp3', src: video.PlayURL, size: video.Height }
                })
                this.sources = sources;
                setTimeout(() => {
                    this.player = new Plyr('#previewAudio', this.playerOptions);
                    // this.player.source = {
                    //     type: 'audio',
                    //     title: '音频',
                    //     poster: this.params.image,
                    //     sources: sources,
                    // }
                    // console.log("======",sources, this.player);
                })
            }
        })
    }

    cancelPreviewVideo() {
        this.previewVisible = false;
        if (this.player) {
            this.player.destroy();
            this.player = null;
            console.log("destroy");
            this.sources = [];
        }
    }
    canSave: boolean = true;

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/audio/update";
        } else {
            this.form.action = "mix/video/admin/audio/create";
        }
        if (!this.currentVideo.id) {
            this.notification.info("提示信息", "请选择音频");
            return ;
        }
        if (!this.canSave) return ;
        this.canSave = false;

        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "新建成功");
            this.isVisible = false;
            this.params = {};
            this.currentVideo = {};
            this.form.body = {};
            this.clearCategoryChecked();
            this.collection.load();
            this.canSave = true;
        }).catch(() => {
            this.canSave = true;
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除该音频吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/audio/delete", { id: data.id }).then((ret) => {
                    if (typeof ret == "object" && !ret.result) {
                        this.confirmRemoveVideo(data);
                    } else {
                        this.notification.success("提示信息", "删除成功");
                        this.collection.load();
                    }
                })
            }
        })
    }

    confirmRemoveVideo(data: any) {
        this.modalService.confirm({
            nzTitle: "该音频已经被用户购买，是否继续删除？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/audio/delete", { id: data.id, confirm: true }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    enableVideo(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要启用该音频吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/audio/enable", { id: data.id }).then((ret) => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }

    disabledVideo(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要禁用该音频吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/audio/disable", { id: data.id }).then((ret) => {
                    if (typeof ret == "object" && !ret.result) {
                        this.confirmDisibleVideo(data);
                    } else {
                        this.notification.success("提示信息", "禁用成功");
                        this.collection.load();
                    }
                })
            }
        })
    }

    confirmDisibleVideo(data: any) {
        this.modalService.confirm({
            nzTitle: "该音频已经被用户购买，是否继续禁用？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/audio/disable", { id: data.id, confirm: true }).then(() => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }

    restoreCategoryChecked() {
        this.categoryList.forEach(item => {
            item.children.forEach(child => {
                if (this.params.video_category_ids.indexOf(child.id) >= 0) {
                    child.checked = true;
                }
            });
        })
    }

    clearCategoryChecked() {
        this.categoryList.forEach(item => {
            item.children.forEach(child => {
                child.checked = false;
            });
        })
    }

    cancel() {
        this.isVisible = false;
        this.disabledId = true;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
        this.clearCategoryChecked();
        this.videoHtmlContent = "";
        this.currentVideo = {};
    }
}
