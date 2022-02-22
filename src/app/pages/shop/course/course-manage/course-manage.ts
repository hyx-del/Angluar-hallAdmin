
import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService } from '@/providers/index';

@Component({
    selector: 'app-course-manage',
    templateUrl: './course-manage.html',
    styleUrls: ['./course-manage.scss']
})
export class CourseManageComponent implements OnInit {
    public buttons: any[] = [
        // { name: 'create', click: () => this.showModal() },
    ];

    courseTypes: any[] = [
        { label: "团课", value: 1 },
        { label: "私教课", value: 2 },
        { label: "企业课", value: 3 },
    ]

    form: nyForm;

    collection: any = {};
    params: any = {};
    isVisible: boolean = false;

    ossPath: string = "";
    disabled: boolean = true;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private modalService: NzModalService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;
        
        // this.collection.onDblClick = (item) => this.edit(item);
        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }
    onFormInit(form) {

        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            if (this.params.picture) {
                body.picture = this.params.picture;
            }
        }

    }
    showModal() {
        this.params = {};
        this.form.body = {};
        this.form.clearError();
        this.isVisible = true;
    }

    edit(item) {
        // hall/course/admin/detail 
        this.http.get("hall/course/admin-hall/course/detail", { id: item.id }).then(ret => {
            this.form.clearError();
            this.params = Object.assign({}, ret);
            this.form.body = { ...ret };
            this.isVisible = true;
        })
    }

    close() {
        this.isVisible = false;
        this.form.body = {};
        this.params = {};
        this.form.clearError();
    }

    save() {
        let params: any = Object.assign({}, this.params);
        let url: string = "";
        if (params.id) {
            url = "hall/course/admin/update";
        } else {
            url = "hall/course/admin/create";
        }

        this.form.action = url;
        this.form.submit().then(ret => {
            this.notification.success("提示信息", (params.id ? "修改成功" : "创建成功"));
            this.isVisible = false;
            this.collection.load();
        })
    }

    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个课程",
            nzOnOk: () => {
                this.http.post("hall/course/admin/delete", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    restoreData() {
        this.params = {
            max_number: 1,
            min_number: 1,
        }
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            this.params.picture = urls[0];
            this.form.setValue('picture', urls[0]);
        }).catch(() => { });
    };
}
