import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';

import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Observable } from 'rxjs';
import { Config } from '@/config';

import * as dayjs from 'dayjs';
import { FileService } from '@/providers/index';
import { log } from 'console';



@Component({
    selector: 'app-all-member',
    templateUrl: './all-member.component.html',
    styleUrls: ['./all-member.component.scss']
})
export class AllMemberManageComponent implements OnInit {
    collection: any = {};
    isVisible: boolean = false;
    detail: any = {};
    params: any = {};
    form: nyForm;
    ossPath: string = "";

    public provinceList: any = [];
    public cityList: any = [];
    public areaList: any = [];
    public isInit: boolean = true;
    serviceList: any[] = [];

    isUploadLoading: boolean = false;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private fileService: FileService,
        private modalService: NzModalService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getList();
    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.getDetail(item);
        }
    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.action = "member/admin/member/update";
        this.form.body = { ...this.params };
        this.form.onSubmit = (body) => {
            if (body.birthday) {
                body.birthday = dayjs(body.birthday).format("YYYY-MM-DD");
            }
            if (this.params.avatar) {
                body.avatar = this.params.avatar;
            }
            if (this.params.id) {
                body.member_id = this.params.id;
            }
            if (this.params.province_id) {
                body.province_id = this.params.province_id;
            }
            if (this.params.city_id) {
                body.city_id = this.params.city_id;
            }
            if (this.params.area_id) {
                body.area_id = this.params.area_id;
            }
        }
    }

    getDetail(item: any) {
        this.serviceList = [];
        this.http.post("member/admin/member/detail", { member_id: item.id }).then(ret => {
            this.params = Object.assign({}, ret);
            this.form.body = { ...ret };
            this.isVisible = true;
            this.serviceList = ret.enable_service || [];
            this.isInit = true;

            if (ret.province_id) {
                this.getList(this.params.province_id, 'province');
            } else if (this.provinceList.length) {
                this.params.province_id = this.provinceList[0].id;
                this.getList(this.provinceList[0].id, 'province');
            }
        })
    }

    public getList(id?: number, type?: string) {
        let params: any = {};
        if (id) {
            params.id = id;
        }
        // region/next
        this.http.get('hall/admin/address-select', params).then(ret => {
            let arr: any = ret || [];
            if (type === 'province') {
                this.cityList = arr;
                if (!this.isInit || !this.params.city_id) {
                    this.params.city_id = arr[0].id;
                }
                this.getList(this.params.city_id, 'city');

            } else if (type === 'city') {
                this.areaList = arr;
                if (!this.isInit || !this.params.area_id) {
                    this.params.area_id = arr[0].id;
                }
            } else {
                this.provinceList = arr;
                if (!this.isInit || !this.params.province_id) {
                    this.params.province_id = arr[0].id;
                }
                this.getList(this.params.province_id, 'province');
            }
        });
    }

    onChange(val, type?: any) {
        this.isInit = false;
        if (!type) {
            return;
        }
        this.getList(val, type);
    }

    wechatUnbind() {
        this.modalService.confirm({
            nzTitle: "确认解绑该会员微信绑定？",
            nzOnOk: () => {
                this.http.post("member/admin/member/wechat-unbundling", { member_id: this.params.id }).then(() => {
                    this.notificationService.success("提示信息", "解绑成功")
                })
            }
        })
    }

    save() {
        this.form.submit().then(() => {
            this.notificationService.success("提示信息", "修改成功");
            this.isVisible = false;
            this.collection.load();
        })
    }
  public  realName() {
        this.http.post(`/hall/member/admin/account-verify-url`,{user_id:this.params.id}).then(res=>{
            this.params.realName=res
            res?this.notificationService.success("提示信息", "修改成功"):this.notificationService.error('提示信息','您之前并没有认证记录')
        })
    }
    close() {
        this.isVisible = false;
        this.params = {};
        this.form.body = {};
        this.form.clearError();
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('image', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notificationService.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isUploadLoading = true;

        return new Observable((observer) => {
            this.http.post('file/upload/image/v1?bucket=' + Config.buckets.admin, formData).then(image => {
                this.params.avatar = image.path;
                this.form.setValue("avatar", image.path);
                observer.next();
            }).catch(() => this.isUploadLoading = false)
        }).subscribe(() => {
            this.isUploadLoading = false;
            item.onSuccess();
        })
    }

    uploadImgComplete(data) {
        this.params.avatar = data.path;
        this.form.setValue("avatar", data.path);
    }
}
