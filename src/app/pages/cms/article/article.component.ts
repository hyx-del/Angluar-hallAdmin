import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService, NzTreeNode } from 'ng-zorro-antd';
import { FileService } from '@/providers/index';
import { Config } from '@/config';
import * as Plyr from 'plyr';

@Component({
    selector: 'app-article',
    templateUrl: './article.component.html',
    styleUrls: ['./article.component.scss']
})
export class ArticleManageComponent implements OnInit {

    @ViewChild('slider') slider: ElementRef;
    @ViewChild('file') fileEl: ElementRef;

    public buttons = [
        { name: 'create', click: () => this.showModal() }
    ]

    public fieldsOptions = {
        'category_id': {
            childNodes: (node) => this.getCategory(node)
        },
    };
    public isVisible: boolean = false;
    public ossPath: string = '';
    public form: any;

    public params: any = {};

    public collection: any = {};
    
    categoryList: any[] = [];

    public currentItem: any = {};
    public showImgList: any[] = [];

    public isAdd = false;
    public active: number = 0;
    public options: any = {
        goods: [],
        group: [],
        current: [],
    };
    public categorys: any = [
        { label: '文章', value: 10 },
        { label: '链接', value: 20 },
        { label: '公众号链接', value: 30 },
    ];

    articleList: any[] = [];

    public urls = {
        create: 'mix/cms/admin/material/create',
        update: 'mix/cms/admin/material/update',
        list: 'mix/cms/admin/material/list',
        detail: 'mix/cms/admin/material/detail',
        delete: 'mix/cms/admin/material/delete',
        category_list: 'mix/cms/admin/material-category/list',
    }
    htmlbody: string = '';
    videoHtml: string = '';
    uploadLoading: boolean = false;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getCategoryList();
        this.getArticleList();
    }

    public setCollection(collection) {
        this.collection = collection;
        
        this.collection.onSetHeader = () => {
            collection.getHeader('title').click = (item) => this.getDetail(item);
        }
    }

    showModal() {
        this.htmlbody = "";
        this.videoHtml = "";
        this.params = {
            type: 1,
            need_open_comment: 1,
            priority: 0,
        }
        this.isVisible = true;
    }

    onFormInit(form) {
        this.form.action = this.params.id ? this.urls.update : this.urls.create;
        this.form.request = this.http.request.bind(this.http);

        if (this.params.id) {
            this.form.body = {...this.params};
        } else {
            this.form.body = { ...this.params };
        }
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            if (this.params.type == 1) {
                body.thumb_media_url = this.params.thumb_media_url || '';
                body.content = this.htmlbody;

            } else if (this.params.type == 2) {
                let config = this.showImgList.map(item => {
                    let data: any = {
                        type: item.type,
                        linkType: item.linkType || 10,
                        link: item.link || '',
                        title: item.title || '',
                        description: item.description || '',
                    }
                    if (item.type == 1) { // 图片
                        data.thumb_url = item.path;
                    } else { // 视频
                        data.video_data_id = item.video_data_id;
                    }
                    return data;
                })
                body.content = config || [];
            } else if (this.params.type == 3) {
                // body.content = this.checkVideoList.map(item => item.id);
                body.content = {
                    video_data_id: this.checkVideoList[0].id,
                    content: this.videoHtml,
                }
                if (body.summary) {
                    body.content.summary = body.summary;
                    delete body.summary;
                }
            }
            body.type = this.params.type;
        }
    }

    getCategoryList() {
        this.http.get(this.urls.category_list).then(ret => {
            // this.categoryList = ret || [];
            this.categoryList = (ret || []).map(item => {
                let data = { title: item.name, key: item.id, children: [], };
                if (item.children && item.children.length) {
                    data.children = item.children.map(child => {
                        return { title: child.name, key: child.id, isLeaf: true }
                    })
                }
                return data;
            })
        });
    }

    getArticleList() {
        let params = { 
            "action": "query", 
            "params": [["type", "=", 1]], 
            "fields": ["id", "title", "category.name|category_name", "author", "type"], 
        }
        this.http.post("mix/cms/admin/material/list", params).then(data => {
            this.articleList = data || [];
        })
    }

    public getCategory(e: any) {
        if (e && (e.node.children.length || !e.node.isExpanded)) return;
        return this.http.get('mix/cms/admin/material-category/list').then((ret) => {
            let nodes = ret.map((item) => {
                item.title = item.name;
                item.key = item.id;
                if (item.children.length) {
                    item.children.map(child => {
                        child.title = child.name;
                        child.key = child.id;
                        child.isLeaf = true;
                    })
                } else {
                    item.isLeaf = true;
                }
                return new NzTreeNode(item);
            });
            if (e) e.node.addChildren(nodes);
            return nodes;
        });
    }

    getDetail(item) {
        this.http.get(this.urls.detail, {id: item.id}).then(ret => {
            this.isVisible = true;
            this.params = ret;
            if (ret.type == 1) {
                setTimeout(() => {
                    this.htmlbody = ret.content;
                }, 0)
            } else if (ret.type == 2) {
                if (ret.content) {
                    let config = ret.content;
                    if (Array.isArray(config)) {
                    } else {
                        config = JSON.parse(config);
                    }
                    config.forEach(item => {
                        if (item.type == 1) {
                            item.path = item.thumb_url;
                            item.image = this.ossPath + item.thumb_url;
                        } else if (item.type == 2) {
                            item.image = item.cover;
                        }
                    });
                    this.showImgList = config || [];
                    if (this.showImgList.length) {
                        this.currentItem = this.showImgList[0];
                    }
                }
            } else if (ret.type == 3) {
                this.checkVideoList = [ret.content.video_info || {}];
                this.params.summary = ret.content.summary;
                this.videoHtml = ret.content.content;
            }
        });
    }

    save() {
        if (this.params.type == 3 && !this.checkVideoList.length) {
            this.notification.info("提示信息", "请选择视频");
            return ;
        }
        this.form.submit().then(ret => {
            // console.log(this.params);
            this.notification.success('提示信息', this.params.id ? '修改成功' : '添加成功');
            this.isVisible = false;
            this.restoreDefaultData();
            this.collection.load();
        });
    }

    delete(item: any) {
        this.modalService.confirm({
            nzTitle: '确定要删除这篇文章？',
            nzOnOk: async () => {
                this.http.post(this.urls.delete, {id: item.id}).then(() => {
                    this.notification.success('提示信息', '删除成功');
                    this.collection.load();
                });
            }
        });
    }

    cancel() {
        this.isVisible = false;
        this.restoreDefaultData();
    }

    restoreDefaultData() {
        this.params = {
            need_open_comment: 1,
            type: 1,
        }
        this.showImgList = [];
        this.active = 0;
        this.currentItem = {};
        this.checkVideoList = [];
        this.videoList.forEach(item => {
            item.checked = false;
        })
        this.htmlbody = "";
        this.videoHtml = "";
    }

    videoVisible: boolean = false;
    videoCollection: any = {};
    videoList: any[] = [];
    previewVisible: boolean = false;
    checkVideoList: any = [];
    checkVideoType: 'radio' | 'checkbox' = 'radio';

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
        this.checkVideoType = "radio";
    }

    showAddVideoModal(isReplace?: boolean) {
        this.videoVisible = true;
        if (isReplace) {
            this.checkVideoType = "radio";
        } else {
            this.checkVideoType = "checkbox";
        }
    }

    setVideoCollection(collection) {
        this.videoCollection = collection;
        this.videoCollection.onLoaded = () => {
            this.videoList = this.videoCollection.data || [];
        }
    }

    checkVideo(index: number) {
        if (this.checkVideoType == "radio") {
            this.videoList.forEach(item => {
                item.checked = false;
            })
        }
        this.videoList[index].checked = !this.videoList[index].checked;
    }

    confirmVideoSelect() {
        let checkedVideoList = this.videoList.filter(item => item.checked);
        if (!checkedVideoList.length) {
            this.notification.info("提示信息", "请选择视频");
            return ;
        }
        if (this.checkVideoType == "radio") {
            if (this.params.type == 2) { // 海报
                let checkData = {
                    video_data_id: checkedVideoList[0].id,
                    type: 2, // 视频
                    linkType: 10, // 文章
                    image: checkedVideoList[0].cover,
                    title: checkedVideoList[0].title,
                }
                this.showImgList.splice(this.active, 1, checkData);
                this.currentItem = checkData;
            } else { // 视频
                this.checkVideoList = [...checkedVideoList];
            }
        } else if (this.params.type == 2) {
            let videoList = this.showImgList.filter(item => item.type == 2);
            let checkedIds = videoList.map(item => item.id);

            checkedVideoList.forEach(video => {
                if (checkedIds.indexOf(video.id) >= 0) {
                    video.isExist = true;
                }
            })
            checkedVideoList = checkedVideoList.filter(item => !item.isExist).map(video => {
                return {
                    video_data_id: video.id,
                    type: 2, // 视频
                    linkType: 10, // 文章
                    image: video.cover,
                    title: video.title,
                }
            })
            this.showImgList.push(...checkedVideoList);
            if (!this.currentItem.type) {
                this.currentItem = this.showImgList[0];
            }
            this.setSliderStyle();
            this.clearVideoChecked();
        }
        this.videoVisible = false;
    }

    clearVideoChecked() {
        this.videoList.forEach(item => {
            item.checked = false;
        })

    }

    cancelVideoSelect() {
        this.videoVisible = false;
    }
    
    showPreviewModal(currentVideo: any) {
        this.http.get("mix/cms/admin/video-data/get-playUrl", { id: currentVideo.id }).then(data => {
            this.previewVisible = true;
            if (data && data.length) {
                let sources = data.map(video => {
                    return { type: 'video/mp4', src: video.PlayURL, size: video.Height }
                })
                setTimeout(() => {
                    this.player = new Plyr('#articlePreviewVideo', this.playerOptions);
                    this.player.source = {
                        type: 'video',
                        title: '视频',
                        poster: currentVideo.cover,
                        sources: sources,
                    }
                })
            }
        })
    }

    removeCheckedVideo(index: number) {
        this.checkVideoList.splice(index, 1);
    }

    cancelPreviewVideo() {
        this.previewVisible = false;
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
    }

    selectedFile() {
        this.fileEl.nativeElement.click();
        this.isAdd = false;
    }

    addFile() {
        // if (this.showImgList.length == 5) {
        //     this.notification.create('info', '提示信息', '小程序轮播最大设置为5个');
        //     return;
        // }
        this.fileEl.nativeElement.click();
        this.isAdd = true;
    }

    selectSourceChange(e: any) {
        this.currentItem.link = "";
    }

    fileChange(event) {
        if (event.target.value) {
            let file = event.target.files[0];
            this.uploadImg({ file: file });
        }
    }

    public remove() {
        let index = this.active;
        let currIndex = this.showImgList.indexOf(this.currentItem);
        if (currIndex == index) {
            this.active = index ? index - 1 : index;
            if (currIndex) {
                this.currentItem = this.showImgList[index - 1];
            } else if (this.showImgList.length > 1) {
                this.currentItem = this.showImgList[index + 1];
            } else {
                this.currentItem = {}
            }
        }
        this.showImgList.splice(index, 1);
    }

    setOptionsCurrent() {
        // if (this.currentItem.type == 1) {
        //     this.options.current = this.options.goods;
        // } else {
        //     this.options.current = this.options.group;
        // }
    }

    setSliderStyle() {
        let length = this.showImgList.length;
        let width = length * 85;
        this.slider.nativeElement.style.width = width + 'px';
        this.setSliderPosition();
    }

    setSliderPosition() {
        if (this.active >= 5) {
            let left = -((this.active + 1 - 5) * 85);
            this.slider.nativeElement.style.left = left + 'px';
        } else if (this.active == 0) {
            if (this.showImgList.length > 5) {
                let left = -(this.active * 85);
                this.slider.nativeElement.style.left = left + 'px';
            }
        }
    }

    onImageClick(e, index) {
        this.currentItem = this.showImgList[index];

        this.setOptionsCurrent();
        this.active = index;
    }

    prev() {
        if (!this.showImgList.length) return ;
        if (this.active == 0)
            this.active = this.showImgList.length - 1;
        else
            this.active--;
        this.currentItem = this.showImgList[this.active];
        if (!this.currentItem) return;
        this.setOptionsCurrent();
        this.setSliderPosition();

    }

    next() {
        if (!this.showImgList.length) return ;
        if (this.active == this.showImgList.length - 1) 
            this.active = 0;
        else
            this.active++;
        this.currentItem = this.showImgList[this.active];
        if (!this.currentItem) return;
        this.setOptionsCurrent();
        this.setSliderPosition();
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.uploadLoading = true;
        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            let path = urls[0];
            if (this.params.type == 1) {
                this.params.thumb_media_url = urls[0];
            } else {
                let item = {
                    image: this.ossPath + path,
                    path: path,
                    type: 1, // 图片
                    linkType: 10, // 文章
                };
                if (this.isAdd) {
                    this.active = this.showImgList.push(item) - 1;
                } else {
                    this.showImgList.splice(this.active, 1, item);
                }

                this.currentItem = this.showImgList[this.active] || {};

                this.setSliderStyle();
                this.isAdd = false;
                this.fileEl.nativeElement.value = "";
            }
            this.uploadLoading = false;
        }).catch(() => this.uploadLoading = false);
    }
}
