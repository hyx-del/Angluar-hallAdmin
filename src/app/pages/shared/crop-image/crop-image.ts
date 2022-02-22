import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Input, EventEmitter, Output, ContentChild } from '@angular/core';
import { NzNotificationService, NzUploadComponent } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Observable } from 'rxjs';

// import * as Cropper from 'cropperjs';
import Cropper from 'cropperjs/dist/cropper.esm.js';

import { Config } from '@/config';

interface ImageCropperSetting {
    width: number;
    height: number;
}

export interface ImageCropperResult {
    imageData?: Cropper.ImageData;
    cropData?: Cropper.CropBoxData;
    blob?: Blob;
    dataUrl?: string;
    path?: string;
}

interface buttonOptions {
    method: string,
    icon: string,
    value: number | string,
    secondValue?: number | string,
    tipTitle?: string,
}

@Component({
    selector: 'crop-image',
    templateUrl: './crop-image.html',
    styleUrls: ['./crop-image.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CropImageComponent implements OnInit {

    @ViewChild('image') image: ElementRef;
    @ViewChild('inputImage') inputImage: ElementRef;
    @ContentChild(NzUploadComponent) uploadComponent: NzUploadComponent;

    @Input() imageUrl: any;

    @Input() settings: ImageCropperSetting;
    @Input() cropbox: Cropper.CropBoxData;

    @Input() loadImageErrorText: string = "图片加载错误";

    @Input() cropperOptions: any = {};

    @Input() buttonSize: 'default' | 'small' | 'large' = 'default';
    @Input() autoUpload: boolean = true;

    @Input() ossBucket: string;
    @Input() aspectRatio: number;

    // 在弹出框打开之前调用，如果返回false，将不会打开
    @Input() beforeCrop?: (file, fileList: any[]) => boolean | Observable<boolean>;


    @Output() onComplete = new EventEmitter<ImageCropperResult>();
    @Output() onCancel = new EventEmitter();
    @Output() ready = new EventEmitter();

    public isVisible: boolean = false;
    public isLoading: boolean = true;
    public cropper: Cropper;
    public imageElement: HTMLImageElement;
    public loadError: any;
    public isUpload: boolean = false;

    buttonGroups: any[] = [
        [
            { method: "zoom", icon: "zoom-in", value: 0.1, tipTitle: "放大", },
            { method: "zoom", icon: "zoom-out", value: -0.1, tipTitle: "缩小" },
        ],
        [
            { method: "move", icon: "arrow-left", value: -10, secondValue: "0", tipTitle: "向左移动", },
            { method: "move", icon: "arrow-right", value: 10, secondValue: "0", tipTitle: "向右移动", },
            { method: "move", icon: "arrow-up", value: 0, secondValue: -10, tipTitle: "向上移动", },
            { method: "move", icon: "arrow-down", value: 0, secondValue: 10, tipTitle: "向下移动", },
        ],
        [
            { method: "rotate", icon: "undo", value: -45, tipTitle: "向左旋转", },
            { method: "rotate", icon: "redo", value: 45, tipTitle: "向右旋转", },
        ],
        // [
        //     { method: "scaleX", icon: "arrows-alt", value: -1, },
        //     { method: "scaleY", icon: "undo", value: -1, },
        // ]
    ]
    defaultOptions: any = {
        viewMode: 1, 
        movable: false, // 移动
        scalable: false, // 旋转
        zoomable: false, // 缩放
        checkCrossOrigin: true,
        autoCropArea: 1,// 自动裁剪区域的大小 (百分百)
        preview: '.img-preview',
        guides: false, // 在裁剪框上方显示虚线
        background: false, // 网格背景
    }

    uploadFileType: string;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
    ) { }

    ngOnInit() {
        // console.log("uploadComponent", this.uploadComponent);
        // 设置裁剪比例    
        let aspectRatio = this.aspectRatio;

        if (this.settings) {
            const { width, height } = this.settings;
            aspectRatio = width / height;
        }

        // 使用自定义配置扩展默认值
        this.cropperOptions = Object.assign({ ...this.defaultOptions, aspectRatio }, this.cropperOptions);


        if (!this.uploadComponent) return;

        if (!this.uploadComponent.nzAccept) {
            this.uploadComponent.nzAccept = "image/*";
        }
        this.uploadComponent.nzBeforeUpload = (file, fileList) => {
            return new Observable((observer) => {
                if (this.beforeCrop && !this.beforeCrop(file, fileList)) {
                    observer.error();
                    return;
                }
                this.uploadFileType = file.type;

                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    this.image.nativeElement.src = reader.result;
                    this.showModal();
                });
                reader.readAsDataURL(<any>file);
            })
        }

    }

    showModal() {
        this.isVisible = true;
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = undefined;
        }

        this.cropper = new Cropper(this.image.nativeElement, this.cropperOptions);
    }

    /**
     * 设置图片裁剪比例
     * @param { Number } ratio 
     */
    setAspectRatio(ratio: number) {
        if (!this.cropper) return ;
        this.cropper.setAspectRatio(ratio);
    }

    /**
     * 图片加载
     * @param ev
     */
    imageLoaded(ev: Event) {
        this.loadError = false;

        const image = ev.target as HTMLImageElement;
        this.imageElement = image;

        // Add crossOrigin?
        if (this.cropperOptions.checkCrossOrigin) image.crossOrigin = 'anonymous';

        // Image on ready event
        image.addEventListener('ready', () => {

            this.ready.emit(true);

            this.isLoading = false;

            if (this.cropbox) {
                // 设置裁切框数据
                this.cropper.setCropBoxData(this.cropbox);
            }
        });

        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = undefined;
        }

        // console.log("Cropper===>",Cropper);
        this.cropper = new Cropper(image, this.cropperOptions);
    }

    /**
     * 操作按钮处理
     * @param button
     */
    handleButton(button: buttonOptions) {
        if (!this.cropper) {
            return;
        }
        let result = this.cropper[button.method](button.value, button.secondValue || undefined);
    }

    /**
     * 重置图像和裁剪框
     */
    cropperReset() {
        if (!this.cropper) {
            return;
        }
        this.cropper.reset();
    }

    cropperClear() {
        if (!this.cropper) {
            return;
        }
        this.cropper.clear();
    }

    public onClick() {
        this.inputImage.nativeElement.click();
    }

    uploadedImageURL;

    fileChange(event) {
        let inputImage = event.target;
        let files = event.target.files;
        let file;

        if (files && files.length) {
            file = files[0];
            this.uploadFileType = file.type;

            if (/^image\/\w+/.test(file.type)) {
                if (this.uploadedImageURL) {
                    URL.revokeObjectURL(this.uploadedImageURL);
                }
                if (this.imageElement) {
                    this.imageElement.src = this.uploadedImageURL = URL.createObjectURL(file);
                } else {
                    this.image.nativeElement.src = this.uploadedImageURL = URL.createObjectURL(file);
                }

                if (this.cropper) {
                    this.cropper.destroy();
                }

                this.cropper = new Cropper(this.imageElement || this.image.nativeElement, this.cropperOptions);
                inputImage.value = null;
                if (!this.isVisible) {
                    this.isVisible = true;
                }

            } else {
                this.notificationService.warning('提示信息', '请选择正确的文件格式');
            }
        }
    }

    cropImage() {
        this.isUpload = true;
        this.exportCanvas().then((res: ImageCropperResult) => {
            if (this.autoUpload) {
                let file = this.blobToFile(res.blob, "file.png");
                this.uploadImage(file);
            } else {
                this.isVisible = false;
                this.isUpload = false;
                this.onComplete.emit(res);
            }
        })
    }

    uploadImage(file) {
        // const isLtMaxSize = file.size / 1024 / 1024 < Config.imageMaxSize;
        // if (!isLtMaxSize) {
        //     this.notificationService.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
        //     return;
        // }
        let formData = new FormData();
        formData.set('images[]', file);

        this.http.post('file/upload/image?bucket=' + (this.ossBucket || Config.ossBucket), formData).then(urls => {
            this.isVisible = false;
            this.isUpload = false;
            if (Array.isArray(urls)) {
                this.onComplete.emit({ path: urls[0] });
            } else {
                this.onComplete.emit({ path: urls });
            }
        }).catch(error => {
            this.isUpload = false;
        })
    }

    /**
     * blobToFile
     * @param blod Blod类型 
     * @param fileName 文件名
     */
    blobToFile(blod: Blob, fileName: string): File {
        let b: any = blod;

        // 一个Blob 几乎就是一个File —— 它只是缺少了下面要添加的两个属性
        b.lastModifiedDate = new Date();
        b.name = fileName;

        return <File>blod;
    }

    /**
     * Export canvas
     * @param base64
     */
    exportCanvas(base64?: any): Promise<any> {

        // 获取和设置图像、裁剪数据
        const imageData = this.cropper.getImageData();
        const cropData = this.cropper.getCropBoxData();
        const canvas = this.cropper.getCroppedCanvas();
        const data = { imageData, cropData };

        const promise = new Promise(resolve => {

            if (base64) {
                return resolve({
                    dataUrl: canvas.toDataURL('image/png'),
                    ...data
                });
            }
            canvas.toBlob(blob => resolve({ blob, ...data }), this.uploadFileType, 0.8);
        });

        return promise;
    }

    cancelCrop() {
        this.isVisible = false;
        this.isUpload = false;
        this.onCancel.emit();
    }
}