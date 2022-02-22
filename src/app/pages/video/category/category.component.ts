import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService, NzMessageService  } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService } from '@/providers/services/file-service';
import { Observable, Subject } from 'rxjs';
import { Config } from '@/config';
import * as dayjs from 'dayjs';
import * as xlsx from 'xlsx';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss']
})
export class VideoCategoryComponent implements OnInit {
    // @ViewChild('editor') editor: QuillEditorComponent;

    isVisible: boolean;
    detailVisible: boolean;

    ossPath: string;

    params: any = {};
    form: nyForm;
    detailForm: nyForm;

    mapOfExpandData: { [key: string]: boolean } = {};

    categoryList = [];

    isLoading: boolean = false;
    isUploadLoading: boolean = false;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
        private fileService: FileService,
        private messageService: NzMessageService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        // this.listOfData.forEach(item => {
        //     this.mapOfExpandData[item.id] = true;
        // })
        this.getList();
    }

    getList() {
        this.http.get("mix/video/admin/category/list").then(ret => {
            let data = ret || [];
            this.categoryList = data;
            this.isLoading = false;
        })
    }

    refreshData() {
        this.isLoading = true;
        this.getList();
    }

    onFormInit(form: nyForm) {
        this.form = form;
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {
            // body.content = this.editor.editor.root.innerHTML;
            if (this.params.parent_id) {
                body.parent_id = this.params.parent_id;
            }
            if (this.params.is_internal) {
                body.is_internal = 1;
            } else {
                body.is_internal = 0;
            }
        }
    }

    tabSelectChange(event) {
        if (event.index == 1 && !this.shareLinkList.length) {
            this.getShareLinkList();
        }
    }

    showModal() {
        this.isVisible = true;
        this.params = {};
        this.form.body = {
            priority: 0
        }
    }

    showAddChild(data) {
        this.params = {
            parent_id: data.id,
        }
        this.form.body = {
            parent_id: data.id,
            priority: 0
        }
        this.isVisible = true;
    }

    onDetailFormInit(form: nyForm) {
        this.detailForm = form;
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.names = ["id"];
        this.detailForm.onSubmit = (body) => {
            if (this.params.parent_id) {
                body.parent_id = this.params.parent_id;
            }
            if (this.params.is_internal) {
                body.is_internal = 1;
            } else {
                body.is_internal = 0;
            }
        }
    }

    edit(data: any) {
        this.params = Object.assign({}, data);
        this.params.imageUrl = this.params.image;
        this.params.image = this.params.image_path;

        if ("children" in this.params) delete this.params.children;
        this.detailForm.body = { ...data, image: data.image_path };
        this.detailVisible = true;
        // setTimeout(() => {
        //     if (data.content) {
        //         this.editor.editor.root.innerHTML = data.content;
        //     }
        // }, 0)
    }

    save() {
        if (this.params.id) {
            this.form.action = "mix/video/admin/category/update";
        } else {
            this.form.action = "mix/video/admin/category/create";
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "新建成功");
            this.isVisible = false;
            this.params = {};
            this.form.body = {};
            this.getList();
        })
    }

    updateCategory() {
        if (this.params.id) {
            this.detailForm.action = "mix/video/admin/category/update";
        } else {
            this.detailForm.action = "mix/video/admin/category/create";
        }
        this.detailForm.submit().then(() => {
            this.notification.success("提示信息", "修改成功");
            this.getList();
        })
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要删除该分类吗?",
            nzOnOk: () => {
                this.http.post("mix/video/admin/category/delete", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "删除成功");
                    this.getList();
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

    closeDetailModal() {
        this.detailVisible = false;
        this.params = {};
        this.detailForm.body = {};
        this.detailForm.clearError();
        this.shareLinkList = [];
        this.currentLink = {};
        this.tabIndex = 0;
    }

    tabIndex: number = 0;
    shareVisible: boolean = false;
    shareParams: any = {};
    currentDate = new Date();
    shareLinkList: any[] = [];
    currentLink: any = {};
    collection: any = {};

    showShareModal() {
        this.shareParams = {};
        this.shareVisible = true;
    }

    setCollection(collection) {
        this.collection = collection
    }

    getShareLinkList() {
        this.http.get("mix/video/admin/category-share/list", { category_id: this.params.id }).then(data => {
            (data || []).forEach(item => {
                item.expire_at = item.expire_at.split(" ")[0];
                item.url = item.front_url + "/category-apply?id=" + item.share_id
            });
            this.shareLinkList = data || [];
            if (!this.currentLink.id && this.shareLinkList.length) {
                this.currentLink = this.shareLinkList[0];
            }
        })
    }

    disabledDateTime = (endValue: Date): boolean => {
        if (!endValue || !this.currentDate) {
          return false;
        }
        return endValue.getTime() <= this.currentDate.getTime();
    }

    saveShareLink() {
        console.log("params", this.shareParams);
        if (!this.shareParams.name) {
            this.notification.info("提示信息", "请设置分享名称");
            return ;
        } else if (!this.shareParams.share_expire_at) {
            this.notification.info("提示信息", "请设置观看有效期");
            return ;
        } else if (!this.shareParams.expire_at) {
            this.notification.info("提示信息", "请设置链接有效期");
            return ;
        }

        if (this.shareParams && this.shareParams.id) {
            this.updateShareLink();
            return ;
        }
        // let params = Object.ass
        let params: any = Object.assign({}, this.shareParams);
        if (params.expire_at) {
            params.expire_at = dayjs(params.expire_at).format("YYYY-MM-DD");
        }
        if (params.share_expire_at) {
            params.share_expire_at = dayjs(params.share_expire_at).format("YYYY-MM-DD");
        }
        if (this.params.is_internal) {
            params.is_internal = true;
        } else {
            params.is_internal = false;
        }
        params.category_id = this.params.id;
        this.http.post("mix/video/admin/category-share/create", params).then(() => {
            this.notification.success("提示信息", "添加成功");
            this.cancelShareLink();
            this.getShareLinkList();

        })
    }

    linkTapHandle(index) {
        this.currentLink = {};
        setTimeout(() => {
            this.currentLink = this.shareLinkList[index];
        })
    }

    copyLink(event, index) {
        event.stopPropagation();

        let link = this.shareLinkList[index];
        const input = document.createElement('input');
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('value', link.url);
        document.body.appendChild(input);
        input.select();
        if (document.execCommand('copy')) {
            document.execCommand('copy');
            this.messageService.success("复制成功");
        }
        document.body.removeChild(input);
    }

    cancelShareLink() {
        this.shareVisible = false;
        this.shareParams = {};
    }

    showUpdateShareLink(event, link) {
        event.stopPropagation();
        this.shareParams = Object.assign({}, link);
        this.shareVisible = true;
    }

    updateShareLink() {
        let params: any = {
            id: this.shareParams.id,
        }
        if (this.shareParams.expire_at) {
            params.expire_at = dayjs(this.shareParams.expire_at).format("YYYY-MM-DD");
        }
        if (this.shareParams.share_expire_at) {
            params.share_expire_at = dayjs(this.shareParams.share_expire_at).format("YYYY-MM-DD");
        }
        this.http.post("mix/video/admin/category-share/update", params).then(() => {
            this.notification.success("提示信息", "修改成功");
            this.cancelShareLink();
            this.getShareLinkList();
        })
    }

    removeShareLink(event, link) {
        event.stopPropagation();
        this.modalService.confirm({
            nzTitle: `确认删除“${link.name}”?`,
            nzOnOk: () => {
                this.http.post("mix/video/admin/category-share/delete", { id: link.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.getShareLinkList();
                })
            }
        })
    }

    removeMember(item) {
        this.modalService.confirm({
            nzTitle: "删除后该账号不再拥有该专区权限，确定删除？",
            nzOnOk: () => {
                this.http.post("mix/video/admin/category-application/delete", { id: item.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    agree(data) {
        this.modalService.confirm({
            nzTitle: `确定同意会员"${data.name}"的申请?`,
            nzOnOk: () => {
                this.http.post("mix/video/admin/category-application/agree", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "审核成功");
                    this.collection.load();
                })
            }
        })
    }

    refuse(data) {
        this.modalService.confirm({
            nzTitle: `确定驳回会员"${data.name}"的申请?`,
            nzOnOk: () => {
                this.http.post("mix/video/admin/category-application/refuse", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "驳回成功");
                    this.collection.load();
                })
            }
        })
    }

    cancelHandle(data) {
        this.modalService.confirm({
            nzTitle: `确定取消会员"${data.name}"的${data.status == 1 ? '申请' : '驳回'}?`,
            nzOnOk: () => {
                this.http.post("mix/video/admin/category-application/cancel", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "取消成功");
                    this.collection.load();
                })
            }
        })
    }

    // 白名单
    whiteListCollection: any = {};
    addWhiteListVisible: boolean = false;
    addMemberMobile: string = null;
    
    public file: HTMLInputElement;

    setWhiteListCollection(collection) {
        this.whiteListCollection = collection;
    }

    importData() {
        this.file = document.createElement('input');
        this.file.type = 'file';
        this.file.click();
        this.file.onchange = () => {
            if (this.file.files.length) {
                let fileName = this.file.files[0].name;
                let temp = fileName.split('.');
                let suffix = temp[temp.length - 1].toUpperCase();
                if (suffix !== 'XLSX' && suffix !== 'XLS') {
                    this.notification.warning('提示信息', '请选择文件扩展名为xlsx的文件');
                } else {
                    this.readFileData(suffix);
                    // this.goodsImportVisible = true;
                }
            }
        };
    }

    public readFileData(suffix) {
        let fileReader = new FileReader();
        if (suffix === 'CSV') {
            // fileReader.readAsText(this.file.files[0], this.encode);
        } else {
            fileReader.readAsBinaryString(this.file.files[0]);
        }
        fileReader.onload = (ev) => {
            this.doXlsx(ev.target['result']);
        };
    }

    private doXlsx(data: any) {
        let workBook = xlsx.read(data, {type: 'binary'});
        let origin = xlsx.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]], { raw: true, defval: "" });
        if (!origin.length) return;
        
        // this.origin.header = this.makeHeader(Object.keys(origin[0]));
        let dataArray = [];
        origin.forEach((item) => {
            let data = Object.values(item);
            if (data.filter((_) => _).length) {
                dataArray.push(data);
            }
        });
        console.log("origin===>", origin, dataArray);
    }

    addWhiteList() {
        if (!this.addMemberMobile) {
            this.notification.info("提示信息", "请输入会员手机号");
            return ;
        } else if (this.addMemberMobile.length < 11) {
            this.notification.info("提示信息", "手机号格式错误");
            return ;
        }
        let params = {
            share_id: this.currentLink.share_id,
            mobile: this.addMemberMobile,
        }
        this.http.post("mix/video/admin/category-share/whitelist-add", params).then(ret => {
            this.notification.success("提示信息", "添加成功");
            this.addMemberMobile = null;
            this.whiteListCollection.load();
        })
    }

    removeWhiteList(data: any) {
        this.modalService.confirm({
            nzTitle: '确定移除？',
            nzOnOk: () => {
                this.http.post("mix/video/admin/category-share/whitelist-delete", { id: data.id }).then(() => {
                    this.notification.success("提示信息", "移除成功");
                    this.whiteListCollection.load();
                })
            }
        })
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
                if (this.detailVisible) {
                    this.params.image = image.path;
                    this.params.imageUrl = image.url;
                    this.detailForm.setValue("image", image.path);
                } else {
                    this.params.image = image.path;
                    this.params.imageUrl = image.url;
                    this.form.setValue("image", image.path);
                }
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    };

}
