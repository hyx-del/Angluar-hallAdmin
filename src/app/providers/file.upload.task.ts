import { FileUploadService } from "./file.upload.service";

declare type UploadAddress = {
    UploadAddress: string;
    VideoId: string;
    RequestId: string;
    UploadAuth: string;
}

declare type UploadItem = {
    file: File;
    state: "Ready" | "Success" | "Uploading" | "Failure" | "Canceled" | "Stoped";
    fileHash: string;
    isImage: boolean;
    loaded: number;
    videoId?: string
    videoInfo?: any
}

declare type Uploader = {
    addFile: (file: File, endpoint?: string, bucket?: string, object?: any, paramData?: string) => boolean;
    cancelFile: (index: number) => boolean;
    resumeFile: (index: number) => boolean;
    deleteFile: (index: number) => boolean;
    cleanList: () => void;
    listFiles: () => Array<UploadItem>;

    startUpload: () => boolean;
    stopUpload: () => boolean;

    getCheckpoint: (file: UploadItem) => any;

    resumeUploadWithAuth: (uploadAuth: string) => void,
    setUploadAuthAndAddress: (uploadItem: UploadItem, uploadAuth: string, uploadAddress: string, videoId: string) => void;
}

export class FileUploadTask {

    protected readonly manager: FileUploadService;

    protected uploader: Uploader;

    protected uploadItem: UploadItem;

    protected options: any = {
        partSize: 1048576,
        parallel: 5,
        retryDuration: 2,
        onUploadstarted: (uploadItem: UploadItem) => {
            this.manager[this.id() ? 'refreshUploadVideo' : 'createUploadVideo'](this).then((info: UploadAddress) => {
                this.uploader.setUploadAuthAndAddress(this.uploadItem, info.UploadAuth, info.UploadAddress, info.VideoId);
                this.emit('onStarted', this)
            }).catch(error => {
                this.emit('onCanceled', this)
            })
        },
        onUploadFailed: (uploadItem: UploadItem) => {
            this.emit('onFailed', this)
        },
        onUploadCanceled: () => {
            this.emit('onCanceled', this)
        },
        onUploadProgress: (uploadItem: UploadItem, totalSize, loadedPercent) => {
            this.emit('onProgress', this, loadedPercent)
        },
        onUploadTokenExpired: (uploadItem: UploadItem) => {
            this.manager.refreshUploadVideo(this).then((info: UploadAddress) => {
                this.uploader.resumeUploadWithAuth(info.UploadAuth);
            });
        },
        onUploadSucceed: (uploadItem: UploadItem) => {
            this.emit('onSucceed', this)
        },
        onUploadEnd: (uploadItem: UploadItem) => {

        }
    };

    private _onStarted: Array<Function> = [];
    private _onSucceed: Array<Function> = [];
    private _onCanceled: Array<Function> = [];
    private _onFailed: Array<Function> = [];
    private _onProgress: Array<Function> = [];

    constructor(manager: FileUploadService, file: File, options?: any) {
        this.manager = manager;

        if (options) {
            this.options = { ...this.options, ...options };
        }

        this.uploader = new window['AliyunUpload'].Vod(this.options);

        this.init(file);
    }

    protected init(file: File) {
        this.cancel();
        this.uploader.addFile(file, null, null, null, '');
        this.uploadItem = this.uploader.listFiles()[0];
    }

    public getOption(key?: string) {
        return key ? this.options[key] : this.options;
    }

    public id() {
        if (this.uploadItem.videoId) {
            return this.uploadItem.videoId;
        }
        const file = this.uploadItem.file;
        const key = ["upload", file.lastModified, file.name, file.size].join("_");
        const content = localStorage.getItem(key);

        if (!content) {
            return null;
        }
        try {
            return JSON.parse(content).videoId;
        } catch (error) {
            return null;
        }
    }

    public loaded() {
        return this.uploadItem.loaded || 0;
    }

    public state() {
        return this.uploadItem.state;
    }

    public fileName() {
        return this.uploadItem.file.name;
    }

    public fileSize() {
        return this.uploadItem.file.size;
    }

    public start() {
        return this.uploader.startUpload();
    }

    public stop() {
        return this.uploader.stopUpload();
    }

    public cancel() {
        return this.uploader.cancelFile(0);
    }

    public resume() {
        return this.uploader.resumeFile(0);
    }

    public onStarted(fn: Function) {
        return this.listen('onStarted', fn)
    }

    public onSucceed(fn: Function) {
        return this.listen('onSucceed', fn)
    }

    public onCanceled(fn: Function) {
        return this.listen('onCanceled', fn)
    }

    public onFailed(fn: Function) {
        return this.listen('onFailed', fn)
    }

    public onProgress(fn: Function) {
        return this.listen('onProgress', fn)
    }

    public listen(event: string, fn: Function) {
        let events = <Array<Function>>this['_' + event];

        if (events.indexOf(fn) < 0) {
            events.push(fn);
        }

        return () => {
            let index = events.indexOf(fn);
            if (index >= 0) {
                events.splice(index, 1);
            }
        }
    }

    private emit(event, ...args) {
        this['_' + event].forEach((fn) => fn(...args));
    }
}
