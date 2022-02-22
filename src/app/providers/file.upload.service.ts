import { Injectable } from "@angular/core"
import { Http } from "@yilu-tech/ny";
import { FileUploadTask } from "./file.upload.task";
import { Config } from "@/config";
import { NzNotificationService } from "ng-zorro-antd";

@Injectable()
export class FileUploadService {

    public readonly tasks: Array<FileUploadTask> = [];

    private _onDone: Array<Function> = [];

    constructor(private http: Http, private notification: NzNotificationService) {

    }

    public upload(title: string, file: File) {
        let task = new FileUploadTask(this, file, {
            userId: Config['aliyunUserId'],
            region: "cn-shanghai",
            title
        });
        task.onStarted((task) => {
            this.notification.info('文件上传提示', '文件 “' + task.fileName() + '” 已经开始上传，请不要关闭页签或浏览器。');
        });

        task.onSucceed((task) => {
            this.notification.success('文件上传提示', '文件 “' + task.fileName() + '” 已经上传成功。');
            if (this.done()) {
                this._onDone.forEach((fn) => fn());
            }
        });
        task.onFailed((task) => this.notification.error('文件上传提示', '文件 “' + task.fileName() + '” 已经上传失败！'));

        this.tasks.push(task);
        return task;
    }

    public onDone(fn: Function) {
        if (this._onDone.indexOf(fn) < 0) {
            this._onDone.push(fn);
        }
        return () => {
            let index = this._onDone.indexOf(fn);
            if (index >= 0) {
                this._onDone.splice(index, 1);
            }
        }
    }

    public done() {
        for (let task of this.tasks) {
            if (task.loaded() != 1) {
                return false;
            }
        }
        return true;
    }

    public progress() {
        if (!this.tasks.length) {
            return 0;
        }
        let totalSize = 0, totalLoaded = 0;
        for (let task of this.tasks) {
            totalSize += task.fileSize();
            if (['Ready', 'Canceled', 'Failure'].indexOf(task.state()) === -1) {
                totalLoaded += task.fileSize() * task.loaded();
            }
        }
        return totalLoaded / totalSize;
    }

    public clear(task?: FileUploadTask) {
        if (task) {
            if (task.state() === 'Uploading') {
                task.cancel();
            }
            let index = this.tasks.indexOf(task);
            if (index >= 0) {
                this.tasks.splice(index, 1);
            }
        } else {
            this.tasks.forEach((task) => {
                if (task.state() === 'Uploading') {
                    task.cancel();
                }
            });
            this.tasks.length = 0;
        }
    }

    public createUploadVideo(task: FileUploadTask) {
        return this.http.post('file/aliyuncloud/createuploadvideo', {
            Title: task.getOption('title'),
            FileName: task.fileName(),
            FileSize: task.fileSize()
        })
    }

    public refreshUploadVideo(task: FileUploadTask) {
        return this.http.post('file/aliyuncloud/refreshuploadvideo', {
            VideoId: task.id()
        })
    }
}
