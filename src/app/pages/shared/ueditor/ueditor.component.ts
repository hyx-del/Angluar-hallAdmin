import {
    Component, Input, forwardRef, OnDestroy, EventEmitter, Output, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
    AfterViewInit, OnChanges, SimpleChanges, NgZone, Inject, 
} from '@angular/core';

import { DOCUMENT } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd';

import { Config } from '@/config';
import { Http } from '@yilu-tech/ny';

import { FileService } from '@/providers/index';
import { UEditorConfig } from './options';


declare const window: any;
declare const UE: any;

export type EventTypes =
    | 'destroy'
    | 'reset'
    | 'focus'
    | 'langReady'
    | 'beforeExecCommand'
    | 'afterExecCommand'
    | 'firstBeforeExecCommand'
    | 'beforeGetContent'
    | 'afterGetContent'
    | 'getAllHtml'
    | 'beforeSetContent'
    | 'afterSetContent'
    | 'selectionchange'
    | 'beforeSelectionChange'
    | 'afterSelectionChange';

@Component({
    selector: 'ueditor',
    templateUrl: './ueditor.component.html',
    styleUrls: ['./ueditor.component.scss'],

    preserveWhitespaces: false,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UEditorComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class UEditorComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor {
    private instance: any;
    private value: string;
    public inited = false;
    private events: any = {};

    private onChange: (value: string) => void;
    private onTouched: () => void;

    loading = true;
    id = `_ueditor-${Math.random()
        .toString(36)
        .substring(2)}`;

    @Input() config: any;
    @Input() ossBucket: string;
    @Input() loadingTip = '加载中...';

    @Input() set disabled(value: boolean) {
        this._disabled = value;
        this.setDisabled();
    }
    private _disabled = false;

    /** 延迟初始化 */
    @Input() delay = 50;
    @Output() readonly onPreReady = new EventEmitter<UEditorComponent>();
    @Output() readonly onReady = new EventEmitter<UEditorComponent>();
    @Output() readonly onDestroy = new EventEmitter();

    public ossPath: string = '';
    isVideoVisible: boolean = false;

    constructor(
        private cd: ChangeDetectorRef,
        private zone: NgZone,
        private http: Http,
        private fileService: FileService,
        private notification: NzNotificationService,
        @Inject(DOCUMENT) private doc: any
    ) {

    }

    ngOnInit() {
        this.inited = true;
        this.fileService.getBucketInfo(this.ossBucket || Config.ossBucket).then((ret: string) => {
            this.ossPath = ret;
        });
    }

    ngAfterViewInit(): void {
        // 已经存在对象无须进入懒加载模式
        if (window.UE) {
            this.initDelay();
            return;
        }
        let scripts = [
            './assets/ueditor/ueditor.config.js',
            './assets/ueditor/ueditor.all.js',
        ]
        this.load(scripts).then(() => {
            this.initDelay();
        })
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.inited && changes.config) {
            this.destroy();
            this.initDelay();
        }
    }

    load(path: string[]) {
        const promises: Promise<any>[] = [];

        path.forEach(script => promises.push(this.loadScript(script)));

        return Promise.all(promises);
    }

    loadScript(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const node = this.doc.createElement('script');

            node.type = 'text/javascript';
            node.src = path;
            node.charset = 'utf-8';

            if (node.readyState) {
                // IE
                node.onreadystatechange = () => {
                    if (node.readyState === 'loaded' || node.readyState === 'complete') {
                        node.onreadystatechange = null;
                        resolve({ loaded: true, });
                    }
                };
            } else {
                node.onload = () => {
                    resolve({ loaded: true, });
                };
            }
            node.onerror = () => {
                resolve({ loaded: false, });
            }
            this.doc.getElementsByTagName('head')[0].appendChild(node);
        });
    }

    private initDelay() {
        setTimeout(() => this.init(), this.delay);
    }

    private init() {

        if (!window.UE) throw new Error('uedito js文件加载失败');

        if (this.instance) return;

        this.onPreReady.emit(this);

        const opt = Object.assign(UEditorConfig, this.config);
        let self = this;

        this.zone.runOutsideAngular(() => {
            const ueditor = UE.getEditor(this.id, opt);

            ueditor.commands['image'] = {
                execCommand: function () {
                    self.selectLocalImage();
                    return true;
                },
                queryCommandState: function () { }
            };

            ueditor.commands['video'] = {
                execCommand: () => {
                    self.showVideoModal();
                    return true;
                },
                queryCommandState: function () { }
            };

            ueditor.ready(() => {
                this.instance = ueditor;
                if (this.value) this.instance.setContent(this.value);
                if (this._disabled) this.setDisabled();
                this.onReady.emit(this);
            });

            ueditor.addListener('contentChange', () => {
                this.value = ueditor.getContent();
                this.zone.run(() => this.onChange(this.value));
            });
        });

        this.loading = false;
        this.cd.detectChanges();
    }

    public selectLocalImage() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('multiple', 'true');
        input.setAttribute('accept', 'image/jpeg,image/jpg,image/png');
        input.click();

        input.onchange = () => {
            this.uploadImage(input.files);
        };
    }

    public uploadImage(files) {
        let formData = new FormData();

        let canUpload = true;
        Array.from(files).forEach((file: any, i) => {
            let isLtMaxSize = file.size / 1024 / 1024 < Config.imageMaxSize;
            if (!isLtMaxSize) {
                canUpload = false;
            }
            formData.set('images[' + i + ']', file);
        });
        
        if (!canUpload) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return ;
        }

        this.http.post('file/upload/image?bucket=' + (this.ossBucket || Config.ossBucket), formData).then(ret => {
            ret.forEach(url => {
                this.instance.execCommand('insertimage', {
                    src: this.ossPath + url
                })
            });
            // this.editor.setSelection(editorIndex + ret.length);

        }).catch(() => {
            // this._uploadingImg.shift();
        });
    }

    videoCollection: any = {};
    videoList: any[] = [];
    checkVideoType: 'radio' | 'checkbox' = 'radio';
    videoLink: string = "";
    videoLinkParams: any = {};

    tabIndex: number = 0;

    setVideoCollection(collection) {
        this.videoCollection = collection;
        this.videoCollection.onLoaded = () => {
            this.videoList = this.videoCollection.data || [];
            this.cd.detectChanges();
        }
    }

    showVideoModal() {
        this.isVideoVisible = true;
        this.videoLinkParams = {};
        this.cd.detectChanges();
    }

    checkVideo(index: number) {
        if (this.checkVideoType == "radio") {
            this.videoList.forEach(item => {
                item.checked = false;
            })
        }
        this.videoList[index].checked = !this.videoList[index].checked;
    }

    closeVideoModal() {
        this.isVideoVisible = false;
        setTimeout(() => {
            this.tabIndex = 0;
        }, 300)
    }

    insertVideo(video: any) {
        //editor 是编辑器实例
        //向编辑器插入单个视频

        //    this.instance.execCommand('insertimage', {
        //        src: "https://fy-dev.oss-cn-hangzhou.aliyuncs.com/admin/e6hBC3BIsMDPdmVnVya.png",
        //        _url: video.video_url_id,
        //        _videoid: video.id,
        //    })

        let src = "https://fy-dev.oss-cn-hangzhou.aliyuncs.com/base/play-bg.png";
        let html = `<p style="position: relative;"><img src="${ video.cover }" _url="${video.video_url_id}" _videoid="${video.id}" _imgurl="${ video.cover }" class="y-video" /><span class="icon icon-play"></span></p>`

        this.instance.execCommand('inserthtml', html);
        //    this.instance.execCommand( 'insertvideo', videoAttr );

    }

    insertVideoLink() {
        if (!this.videoLink) return ;
        let startIndex = this.videoLink.lastIndexOf('\/');
        let endIndex = this.videoLink.lastIndexOf('.html');
        let vid = this.videoLink.substring(startIndex + 1, endIndex);
        // console.log("====>", vid);

        let html = `<iframe src="//v.qq.com/txp/iframe/player.html?vid=${vid}"
        width="${this.videoLinkParams.width || 500}" height="${this.videoLinkParams.height || 300}"
        allowFullScreen="true"></iframe>`;
        
        this.instance.execCommand('inserthtml', html);
    }

    confirmSetLink() {
        if (!this.videoLink) {
            this.notification.info("提示信息", "请输入视频地址");
            return ;
        }
        if (this.videoLink.indexOf("iframe ") > 0) {
            this.notification.error("提示信息", "视频地址错误");
            return ;
        }
        if (this.videoLink.indexOf("v.qq.com")) {
            this.insertVideoLink();
            this.closeVideoModal();
        }
    }

    confirmSelectVideo() {
        let checkedVideoList = this.videoList.filter(item => item.checked);
        if (!checkedVideoList.length) {
            this.notification.info("提示信息", "请选择视频");
            return;
        }
        console.log("checkedVideoList", checkedVideoList);
        this.clearVideoChecked();
        this.insertVideo(checkedVideoList[0]);

        this.closeVideoModal();
    }

    clearVideoChecked() {
        this.videoList.forEach(item => {
            item.checked = false;
        })
    }


    private destroy() {
        if (this.instance) {
            this.zone.runOutsideAngular(() => {
                Object.keys(this.events).forEach(name =>
                    this.instance.removeListener(name, this.events[name]),
                );
                this.instance.removeListener('ready');
                this.instance.removeListener('contentChange');
                this.instance.destroy();
                this.instance = null;
            });
        }
        this.onDestroy.emit();
    }

    private setDisabled() {
        if (!this.instance) return;
        if (this._disabled) {
            this.instance.setDisabled();
        } else {
            this.instance.setEnabled();
        }
    }

    /**
     * 获取UE实例
     *
     * @readonly
     */
    get Instance(): any {
        return this.instance;
    }

    /**
     * 添加编辑器事件
     */
    addListener(eventName: EventTypes, fn: Function): void {
        if (this.events[eventName]) return;
        this.events[eventName] = fn;
        this.instance.addListener(eventName, fn);
    }

    /**
     * 移除编辑器事件
     */
    removeListener(eventName: EventTypes): void {
        if (!this.events[eventName]) return;
        this.instance.removeListener(eventName, this.events[eventName]);
        delete this.events[eventName];
    }

    ngOnDestroy() {
        this.destroy();
    }

    _onReuseInit() {
        this.destroy();
        this.initDelay();
    }

    writeValue(value: string): void {
        this.value = value;
        if (this.instance) {
            if (value) {
                this.instance.setContent(this.value);
            } else {
                this.instance.setContent("");
            }
        }
    }

    registerOnChange(fn: (_: any) => {}): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => {}): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.setDisabled();
    }
}