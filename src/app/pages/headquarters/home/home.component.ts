import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';
import { NzNotificationService } from 'ng-zorro-antd';
import { Config } from '@/config';
import { FileService, HallService } from '@/providers/index';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-workers-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})

export class WorkersHomeComponent implements OnInit {

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private fileService: FileService,
        private hallService: HallService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ossPath: string = "";
    isVisible: boolean = false;

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];
    collection: any = { data: [] };

    public provinceList: any = [];
    public cityList: any = [];
    public areaList: any = [];

    public params: any = {};
    public form: nyForm;
    location: any = {};

    public isInit: boolean = true;
    isHallChange: boolean = false;

    dataUpload: boolean = false;

    pushAddressList: any[] = [
        { label: "晶品中心", value: 'jingpin', },
    ];

    isShowPwd: boolean = false;

    ngOnInit() {
        // console.log("dayjs======", dayjs().format("YYYY-MM-DD HH:mm:ss"));
        this.getList();
    }

    setCollection(collection) {
        this.collection = collection;

        // this.collection.onDblClick = (item) => this.getDetail(item);
        this.collection.onLoaded = () => {
            if (this.isHallChange) {
                this.isHallChange = false;
            }
        }
        
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.getDetail(item);
        }
    }

    showModal(): void {
        this.form.body = {
            open_time_intro: "周一至周五6:30-21:00，周末及公众假期8:00-18:00",
        };
        this.form.clearError();
        this.params = {
            open_time_intro: "周一至周五6:30-21:00，周末及公众假期8:00-18:00",
        };
        this.dataUpload = false;
        this.images = [];
        this.isVisible = true;
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            body.order_push = this.dataUpload || false; 
            // if (this.params.picture) {
            //     body.picture = this.params.picture;
            // }
            if (this.images.length) {
                body.pictures = this.images.map(url => url);
            } else {
                body.pictures = [];
            }
            body.province_id = this.params.province_id;
            body.city_id = this.params.city_id;
            body.area_id = this.params.area_id;
            if (this.location.lng && this.location.lat) {
                body.map_point = [this.location.lng, this.location.lat];
            }
            if (body.start_time) {
                body.start_time = dayjs(body.start_time).format("HH:mm");
            }
            if (body.end_time) body.end_time = dayjs(body.end_time).format("HH:mm");
        }
    }

    handleOk() {
        if (!this.params.area_id) {
            this.notification.info("提示信息", "请选择地址");
            return;
        }

        let params = Object.assign({}, this.params);
        let url: string = "";
        if (params.id) {
            url = "hall/admin/update";
        } else {
            url = "hall/admin/create";
        }

        this.form.action = url;
        this.getCurrentLocation();
        this.form.submit().then(ret => {
            this.notification.success("提示信息", params.id ? "修改成功" : "创建成功");
            this.isVisible = false;
            this.params = {};
            this.isHallChange = true;
            this.collection.load();
            this.hallService.refresh()
        })
    }

    handleCancel() {
        this.isVisible = false;
    }

    getDetail(item) {
        this.images = [];
        this.http.get("hall/admin/detail", { id: item.id }).then(res => {
            this.isInit = true;
            this.dataUpload = res.order_push || false;
            
            // if (res.picture) {
            //     this.images.unshift(res.picture);
            // }
            if (Array.isArray(res.pictures)) {
                this.images = [...res.pictures];
            }

            console.log("images", this.images);
            if (res.start_time) {
                res.start_time = dayjs(dayjs().format("YYYY-MM-DD") + " " + res.start_time).toDate();
            }
            if (res.end_time) {
                res.end_time = dayjs(dayjs().format("YYYY-MM-DD") + " " + res.end_time).toDate();
            }
            this.params = Object.assign({}, res);
            if (res.order_push_option) {
                this.params.order_push_option = Object.assign({}, this.params.order_push_option);
            }
            this.form.clearError();
            this.form.body = { ...res };
            this.isVisible = true;
            this.getList(this.params.province_id, 'province');
        })
    }

    changeStatus(item) {
        console.log("item=======>", item)
        if (item.status == 10 || item.status == -20) {
            this.http.post("hall/admin/operate", { id: item.id }).then(ret => {
                this.notification.success("提示信息", item.status == 10 ? "开始运营成功" : "恢复运营成功");
                this.collection.load();
            })
        } else if (item.status == 20) {
            this.http.post("hall/admin/suspend", { id: item.id }).then(ret => {
                this.notification.success("提示信息", "暂停运营成功");
                this.collection.load();
            })
        }
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

    pushOrderChange() {
        if (this.dataUpload && this.params.order_push_option) {
            this.form.setValue("order_push_option", Object.assign({}, this.params.order_push_option || {}));
        }
        if (this.params.order_push_service) {
            this.form.setValue("order_push_service", this.params.order_push_service);
        }
    }

    toggleShowPwd() {
        this.isShowPwd = !this.isShowPwd;
    }

    getCurrentLocation() {
        this.areaList.forEach(item => {
            if (item.id == this.params.area_id) {
                this.location = {
                    lng: item.lng,
                    lat: item.lat,
                }
            }
        });
    }
    images: any[] = [];
    isLoading: boolean = false;

    showUploadList = {
        showRemoveIcon: true,
        hidePreviewIconInNonImage: true
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);
        
        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isLoading = true;

        return new Observable((observer) => {
            this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
                // this.params.picture = urls[0];
                // this.form.setValue("picture", urls[0]);
                this.images.push(urls[0]);
                observer.next();
            }).catch(() => this.isLoading = false)
        }).subscribe(() => {
            this.isLoading = false;
            item.onSuccess();
        })
        
    };

    removeFile (index) {
        this.images.splice(index, 1)
    }

}
