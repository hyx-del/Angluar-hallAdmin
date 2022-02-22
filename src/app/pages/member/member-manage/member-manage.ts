import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Config } from '@/config';
import { FileService, CoachService, MemberService } from '@/providers/index';
import { NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as dayjs from 'dayjs';
@Component({
    selector: 'app-member-manage',
    templateUrl: './member-manage.html',
    styleUrls: ['./member-manage.scss']
})
export class MemberManageComponent implements OnInit {
    public buttons: any[] = [
        { name: 'create', click: () => this.addMember() },
    ]

    collection: any = {};

    isVisible: boolean = false;
    detail: any = {};

    public addModalIsVisible: boolean = false;

    public form: nyForm;

    public params: any = {
        type: 10,
    };

    public isUploadLoading: boolean = false;

    public ossPath: string = "";

    // 选择城市
    public provinceList: any = [];

    public cityList: any = [];

    public areaList: any = [];

    public tripMode: any[] = []; // 出行习惯

    public requirements: any[] = [];

    public memberSourceList: any[] = []; //来源

    public salesmanList: any[] = []; // 销售

    public coachList: any[] = []; // 教练

    // 推荐人
    public isLoading: boolean = false;

    public referrerMember: any[] = [];

    private keyword: string = "";

    private searchChange$ = new Subject<any>();

    private haveMoreMember: boolean = false;

    private pageIndex: number = 1;


    constructor(
        private http: Http,
        private fileService: FileService,
        private coachService: CoachService,
        private memberService: MemberService,
        private notification: NzNotificationService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        });
        this.tripMode = this.memberService.tripMode;
        this.requirements = this.memberService.requirements;
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getAllMember(value, true);
        });
        this.getMemberSourceList();
        this.getCoachList();
        this.getSalesmanList();
        this.getList();
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.getDetail(item);

        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.getDetail(item);
        }
    }

    getDetail(item?: any) {
        this.detail = item;
        this.isVisible = true;
    }

    public addMember() {
        this.params = {
            gender: 2,
            type: 1,
        };
        this.form.body = {}
        this.form.body = {
            ...this.params
        }
        this.addModalIsVisible = true;
        if (!this.salesmanList.length) {
            this.getSalesmanList();
        }
        if (!this.referrerMember.length) {
            this.getAllMember();
        }
    }

    public close() {
        this.addModalIsVisible = false;
        this.params = {};
        this.form.clearError();
        this.form.body = {};
    }

    public saveMember() {
        if(!this.params.province_id && !this.params.city_id && !this.params.area_id) {
            this.notification.info('提示信息','请选择地址!');
            return;
        }

        this.form.submit().then(() => {
            this.notification.success("提示信息", "创建成功");
            this.close();
            this.collection.load();
        })
    }

    public onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.action = "hall/member/admin/member/create";
        this.form.onSubmit = (body) => {
            if (body.birthday) {
                body.birthday = dayjs(body.birthday).format("YYYY-MM-DD");
            }

            if (this.params.avatar) {
                body.avatar = this.params.avatar;
            }

            if (!body.coach_ids) {
                body.coach_ids = [];
            }
            if (body.contact) {
                let contact = body.contact.trim();
                if (contact) {
                    body.contact = contact;
                } else {
                    delete body.contact;
                }
            }

            body.province_id = this.params.province_id;
            body.city_id = this.params.city_id;
            body.area_id = this.params.area_id;
        }
    }

    onFormChange(event) {
        if (event.name == "contact") {
            this.memberHasExist();
        }
    }

    memberHasExist() {
        let contact = this.form.getValue("contact");
        if (!contact || contact.length < 11) {
            return ;
        }
        let params = {
            contact: contact,
        }
        this.http.post("hall/member/admin/member/is-member-exists", params).then(ret => {
            ret.contact = params.contact;
            let body = Object.assign(this.form.getBody(), ret);
            this.form.body = { ...body };
            if (ret.province_id) {
                this.params.province_id = ret.province_id;
                this.getList(ret.province_id, "province");
            }
            if (ret.city_id) {
                this.params.city_id = ret.city_id;
            }
            if (ret.area_id) {
                this.params.area_id = ret.area_id;
            }
        });
    }

    disabledMember(item) {
        this.http.post("hall/member/admin/member/disable", { id: item.id }).then(ret => {
            this.notification.success("提示信息", "禁用成功");
            this.collection.load();
        })
    }

    enableMember(item) {
        this.http.post("hall/member/admin/member/enable", { id: item.id }).then(ret => {
            this.notification.success("提示信息", "启用成功");
            this.collection.load();
        })
    }

    public beforeCrop = (file, fileList) => {
        return true;
    }

    public setImage(data) {
        this.params.avatar = data.path;
        this.isUploadLoading = false;
    }

    public getList(id?: number, type?: string, isReset: boolean = false) {
        let params: any = {};
        if (id) {
            params.id = id;
        }

        this.http.get('hall/admin/address-select', params).then(ret => {
            switch (type) {
                case 'province':
                    this.cityList = ret;
                    if (isReset) {
                        this.params.city_id = ret[0].id;
                    }
                    this.getList(this.params.city_id, 'city', isReset);
                    break;
                case 'city':
                    this.areaList = ret;
                    if (isReset) {
                        this.params.area_id = ret[0].id;
                    }
                    break;
                default:
                    this.provinceList = ret;
                    break;
            }
        })
    }

    public onChange(val: number, type?: string) {
        this.getList(val, type, true)
    }

    public getMemberSourceList() {
        this.memberService.getMemberSourceList().then(data => {
            this.memberSourceList = data || [];
        })
    }

    public getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            if (!data) data = [];
            this.salesmanList = data;
        })
    }

    public getCoachList() {
        this.coachService.getAllCoachList().then(data => {
            this.coachList = data || [];
        })
    }

    public onSearch(value: string): void {
        this.isLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    public loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return;
        }
        this.pageIndex += 1;
        this.isLoading = true;
        this.getAllMember(this.keyword);
    }

    private getAllMember(keyword: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
        };
        if (keyword) {
            params.keyword = keyword;
        }

        this.http.post("hall/member/common/member/list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
            if (isSearch) {
                this.referrerMember = ret.data || [];
            } else {
                this.referrerMember = this.referrerMember.concat(ret.data || []);
            }

            if (ret.last_page > ret.current_page) {
                this.haveMoreMember = true;
            } else {
                this.haveMoreMember = false;
            }
            this.isLoading = false;
            this.pageIndex = ret.current_page;
        })
    }

}
