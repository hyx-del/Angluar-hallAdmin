
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
        { name: 'create', click: () => this.showModal() },
    ];

    courseTypes: any[] = [
        { label: "团课", value: 1 },
        { label: "私教课", value: 2 },
        { label: "企业课", value: 3 },
    ]

    form: nyForm;
    detailForm: nyForm;

    collection: any = {};
    params: any = {};
    isVisible: boolean = false;
    detailVisible: boolean = false;

    ossPath: string = "";
    courseCardList: any = [];
    courseCardListCopy: any = [];
    isSetting: boolean = false;
    tabIndex: number = 0;
    isUploadLoading: boolean = false;
    cardId: Map<any, any> = new Map();

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
        this.getCourseCardList();
    }

    setCollection(collection) {
        this.collection = collection;

        // this.collection.onDblClick = (item) => this.edit(item);
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    getCourseCardList() {
        let params = {
            action: "query",
            params: [],
            fields: ["id", "name", "type", "general_type", "max_bind", "weight", "course_type", "status", "created_at"],
            // size: 50,
            // page: 1,
        }
        this.http.post("hall/course/admin/course-card/list", params).then(data => {
            this.courseCardList = [...data] || [];
            this.courseCardListCopy = (data || []).map(item => {
                return Object.assign({}, item);
            })
        })
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

    onDetailFormInit(form) {
        this.detailForm = form;
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.onSubmit = (body) => {
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
        this.tabIndex = 0;
        this.courseCardList = [];
        this.isSetting = false;
        this.http.get("hall/course/admin/detail", { id: item.id }).then(ret => {
            this.detailForm.clearError();
            this.params = Object.assign({}, ret);
            this.detailForm.body = { ...ret };
            this.detailVisible = true;
        })

        if (item.type == 1 || item.type == 2) { // 团课 私教课
            this.courseCardList = this.courseCardListCopy.filter(card => card.course_type == item.type).map(card => {
                return Object.assign({}, card);
            })
        } else { // 企业课 显示团课卡
            this.courseCardList = this.courseCardListCopy.filter(card => card.course_type == 1).map(card => {
                return Object.assign({}, card);
            })
        }
        
        this.http.get("hall/course/admin/course-settlement/detail", { course_id: item.id }).then(ret => {
            if (ret) {
                this.isSetting = !!ret.is_setting;
                let checkCard = ret.settlements || [];
                
                if (checkCard && checkCard.length) {
                    let checkCardIds = checkCard.map(item => item.card_id);
                    this.courseCardList.forEach(card => {
                        if (checkCardIds.indexOf(card.id) >= 0) {
                            checkCard.forEach(item => {
                                if (item.card_id == card.id) {
                                    card.checked = true;
                                    card.amount = item.amount;
                                }
                            })
                        }
                    });
                }
            }
        })
        
    }

    close() {
        this.isVisible = false;
        this.form.body = {};
        this.params = {};
        this.form.clearError();
    }

    closeDetailModal() {
        this.detailForm.body = {};
        this.detailForm.clearError();
        this.params = {};
        this.detailVisible = false;
        this.cardId.clear()
    }

    save() {
        let params: any = Object.assign({}, this.params);
        let url: string = "";
        if (params.id) {
            url = "hall/course/admin/update";
            this.detailForm.action = url;
            this.detailForm.submit().then(ret => {
                this.notification.success("提示信息", "修改成功");
                this.collection.load();
            })
        } else {
            url = "hall/course/admin/create";
            
            this.form.action = url;
            this.form.submit().then(ret => {
                this.notification.success("提示信息", "创建成功");
                this.isVisible = false;
                this.collection.load();
            })
        }

    }

    saveSetting() {
        let params: any = {
            is_setting: this.isSetting,
            course_id: this.params.id,
        }
        let data = this.courseCardList.filter(item => item.checked);
        data = data.map(item => {
            let currentData: any = { card_id: item.id };
            if (item.amount) {
                currentData.amount = item.amount;
            }
            return currentData;
        })
        params.settlements = data;
        this.http.post("hall/course/admin/course-settlement/save", params).then(() => {
            this.notification.success("提示信息", "保存成功");
            this.cardId.clear()
        }).catch(error => {
            const err = error.error.data
           
            for (const key in err) {
               let index = key.split('.')[1];
               this.cardId.set(data[index]["card_id"], true);     
            }

        })
    }

    clearStyle(ev){
        if(ev.amount || !ev.checked){
            this.cardId.delete(ev.id)
        }        
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
        
        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        
        this.isUploadLoading = true;

        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            this.params.picture = urls[0];
            if (this.params.id) {
                this.detailForm.setValue('picture', urls[0]);
            } else {
                this.form.setValue('picture', urls[0]);
            }
            this.isUploadLoading = false;
        }).catch(() => {
            this.isUploadLoading = false;
        });
    };

    display(item){
        this.http.post("hall/course/admin/display", { 
            id: item.id,
            display: item.display ? false : true 
        }).then(ret => {
            this.notification.success("提示信息", "课程已" + item.display ? "隐藏" : "显示");
            this.collection.load();
        })
    }

    enabledCourse(item: any) {
        this.modalService.confirm({
            nzTitle: "确定启用这个课程",
            nzOnOk: () => {
                this.http.post("hall/course/admin/enable", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }

    disabledCourse(item: any) {
        this.modalService.confirm({
            nzTitle: "确定禁用这个课程",
            nzOnOk: () => {
                this.http.post("hall/course/admin/disable", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }
}
