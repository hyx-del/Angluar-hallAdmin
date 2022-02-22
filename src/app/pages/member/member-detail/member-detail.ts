import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { NzNotificationService, NzModalService, NzTabChangeEvent } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { FileService, CoachService, MemberService, HallService } from '@/providers/index';
import { Router } from '@angular/router';

import { Config } from '@/config';
import * as dayjs from 'dayjs';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'member-detail',
    templateUrl: './member-detail.html',
    styleUrls: ['./member-detail.scss']
})
export class MemberDetailComponent implements OnInit {
    @Input() visible: boolean;
    @Input() id: number;
    @Input("member") detail: any = {};

    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    ossPath: string = "";

    params: any = {
        type: 10,
    };
    list: any[] = [];
    memberSourceList: any[] = [];
    coachList: any[] = [];
    salesmanList: any[] = [];
    allMember: any[] = [];
    keyword: string = "";
    pageIndex: number = 1;
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;

    currentHall: any = {};

    cardVisible: boolean = false;
    detailForm: nyForm;
    disabled: boolean = true;

    // 出行习惯
    tripMode: any[] = [];
    // 课程需求
    requirements: any[] = [];
    
    hallList: any[] = [];
    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private coachService: CoachService,
        private memberService: MemberService,
        private hallService: HallService,
        private modalService: NzModalService,
        private router: Router,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
        
        this.tripMode = this.memberService.tripMode;
        this.requirements = this.memberService.requirements;
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getAllMember(value, true);
        })
        this.hallService.getAllHalls().then(data => {
            this.hallList = data || [];
        })
        this.getMemberSourceList();
        this.getCoachList();
        this.getSalesmanList();
        this.getAllMember();
    }
    
    ngOnChanges(val: SimpleChanges) {
        if (val.id && val.id.currentValue) {
            this.detail.courseCard = {};
            this.getDetail();
        }
    }

    saveMember() {
        this.detailForm.submit().then(() => {
            this.notification.success("提示信息", "修改成功");
            this.detail.avatar = this.params.avatar;
            // this.collection.load();
        })
    }

    getDetail() {
        this.http.post("hall/member/admin/member/detail", { id: this.id }).then(ret => {
            ret.is_test_account = !!ret.is_test_account;
            this.detail = ret;
            ret.receive_sms = ret.receive_sms == 1 ? true : false;
            this.params = Object.assign({}, ret);
            this.detailForm.body = { ...this.params };
            // this.getMemberLogs();
            this.account = {};
            this.getMemberAccountInfo();
        })
    }

    onDetailFormInit() {
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.action = "hall/member/admin/member/update";
        this.detailForm.body = { ...this.params };
        this.detailForm.names = ["id"];
        this.detailForm.onSubmit = (body) => {
            if (body.birthday) {
                body.birthday = dayjs(body.birthday).format("YYYY-MM-DD");
            }
            if (this.params.avatar) {
                body.avatar = this.params.avatar;
            }
            if (!body.coach_ids) {
                body.coach_ids = [];
            }
            body.type = body.type || 1; // 个人会员
            body.id = this.params.id;
            body.is_test_account == !!this.params.is_test_account;
            if (this.params.receive_sms) {
                body.receive_sms = 1;
            } else {
                body.receive_sms = -1;
            }
        }
    }

    getMemberSourceList() {
        this.memberService.getMemberSourceList().then(data => {
            this.memberSourceList = data || [];
        })
    }

    getCoachList() {
        let params: any = {
            action: "query",
            fields: ["name", "gender", "coach_group_id", "mobile"],
            page: 1,
            params: [],
            size: 50,
        }

        this.http.post("hall/course/admin/coach/list", params).then(ret => {
            this.coachList = ret.data || [];
        })
    }

    getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            this.salesmanList = data;
        })
    }

    getAllMember(keyword: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
        };
        if (keyword) {
            params.keyword = keyword;
        }
        // if (this.id) {
        //     params.value = this.id;
        // }
        
        this.http.post("hall/member/common/member/list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
            if (isSearch) {
                this.allMember = ret.data || [];
            } else {
                this.allMember = this.allMember.concat(ret.data || []);
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

    onSearch(value: string): void {
        this.isLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return ;
        }
        this.pageIndex += 1;
        this.isLoading = true;
        this.getAllMember(this.keyword);
    }

    tabsInit = {};

    tabChange(event: NzTabChangeEvent) {
        if (!this.tabsInit[event.index]) {
            this.tabsInit[event.index] = true;
        }
    }

    wechatUnbind() {
        this.modalService.confirm({
            nzTitle: "确认解绑该会员微信绑定？",
            nzOnOk: () => {
                this.http.post("member/admin/member/wechat-unbundling", { member_id: this.detail.id }).then(() => {
                    this.notification.success("提示信息", "解绑成功")
                })
            }
        })
    }

    // 
    accountLogCollection: any = { data: [] };
    account: any = {};
    accountDetail: any = {};
    accountVisible: boolean = false;
    courseTypes: any = {
        1: '团课',
        2: '私教课',
    }

    setAccountCollection(collection) {
        this.accountLogCollection = collection;
        this.accountLogCollection.onSetHeader = () => {
            this.accountLogCollection.getHeader('course_name').click = (item) => this.getAccountInfo(item);
        }
        this.accountLogCollection.onLoaded = () => {
            this.accountLogCollection.data.forEach(item => {
                if (parseFloat(item.amount) > 0) {
                    item.amount = "+" + item.amount;
                }
            })
        }
    }

    getAccountInfo(item) {
        let params = {
            id: item.relation_id,
        }
        this.http.get("hall/member/admin/member/account/log/course-detail", params).then(data => {
            this.accountDetail = data || {};
            this.accountVisible = true;
        })
    }

    closeAccountDetail() {
        this.accountVisible = false;
    }

    getMemberAccountInfo() {
        this.http.post("member/account/detail", { member_id: this.detail.id  }).then(ret => {
            if (ret.discount_rate) {
                ret.discount_rate = parseFloat(ret.discount_rate);
            }
            this.account = ret;
        })
    }

    /**
     * 体测数据
     */
    public buttons: any[] = [
        // { name: 'create', label: "添加体测数据", click: () => this.showBodyModal() },
    ];
    bodyCollection: any = {};
    bodyVisible: boolean = false;
    bodyList: any[] = [];
    bodyListCopy: any[] = [];

    bodyParams: any = {};

    setBodyCollection(collection) {
        this.bodyCollection = collection;
        this.bodyCollection.onDblClick = (item) => this.editBodyData(item);
        this.getBodyProject();
    }

    showBodyModal() {
        this.bodyParams = {};
        if (this.bodyListCopy.length) {
            this.bodyList = JSON.parse(JSON.stringify(this.bodyListCopy));
        }
        this.bodyVisible = true;
    }

    editBodyData(item) {
        this.http.post("hall/member/admin/member/body-indicator/detail", { member_id: this.detail.id, id: item.id }).then(ret => {
            this.bodyParams = { ...ret };
            // this.bodyList = ret.indicator_data;
            this.bodyList = JSON.parse(JSON.stringify(this.bodyListCopy));
            this.bodyList.forEach(item => {
                ret.indicator_data.forEach(data => {
                    if (data.id == item.id) item.value = data.value;
                });
            });
            this.bodyVisible = true;
        })
    }

    getBodyProject() {
        if (this.bodyListCopy.length) {
            return;
        }
        let params: any = {
            action: "query",
            fields: ["name", "name_en", "unit", "status", "created_by", "updated_by"],
            page: 1,
            params: [["status", "=", 1]],
            size: 200,
        }
        this.http.post("hall/member/common/body-indicator/list", params).then(ret => {
            this.bodyList = ret.data;
            this.bodyListCopy = JSON.parse(JSON.stringify(ret.data));
        })
    }

    cancelEditBody() {
        this.bodyVisible = false;
        this.bodyParams = {};
        if (this.bodyListCopy.length) {
            setTimeout(() => {
                this.bodyList = JSON.parse(JSON.stringify(this.bodyListCopy));
            }, 300);
        }
    }

    /** 
     * 会员跟进日志
     * */
    followCollection: any = {};

    setFollowCollection(collection) {
        this.followCollection = collection;
    }

    /**
     * 到访日志
     */
    visitCollection: any = {};

    setVisitCollection(collection) {
        this.visitCollection = collection;
    }


    // 会员课程卡
    courseCardCollection: any = {
        data: [],
    };
    setCourseCardCollection(collection) {
        this.courseCardCollection = collection;
    }

    memberCourseCardDetail(data) {
        this.router.navigate(['/member/course-card'], { queryParams: { id: data.id } })
    }

    attendClassCollection: any = {};
    setattendClass(collection) {
        this.attendClassCollection = collection;
    }

    close() {
        this.visibleChange.emit(false);
        this.params = {};
    }

    showMemberCard() {
        this.cardVisible = true;
    }

    transformCollection: any = {};

    setTransformCollection(collection) {
        this.transformCollection = collection;
    }

    hallVisible: boolean = false;
    hallParams: any = {};
    showUpdateModal() {
        this.hallParams.hall_id = this.detail.hall_id;
        console.log("show");
        this.hallVisible = true;
    }

    cancelUpdateHall() {
        this.hallParams = {};
        this.hallVisible = false;
    }

    memberBindShop() {
        let params = {
            id: this.detail.id,
            hall_id: this.hallParams.hall_id,
        }
        this.http.post("hall/member/admin/member/binding-hall", params).then(() => {
            this.notification.success("提示信息", "修改成功");
            this.detailForm.setValue("hall_id", params.hall_id);
            this.detail.hall_id = params.hall_id;
            this.hallParams = {};
            this.hallVisible = false;
        })
    }

    isUploadLoading: boolean = false;

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
            this.params.avatar = urls[0];
            this.isUploadLoading = false;
        }).catch(() => {
            this.isUploadLoading = false;
        });
    }

    uploadImgComplete(data: any) {
        this.params.avatar = data.path;
    }
}
