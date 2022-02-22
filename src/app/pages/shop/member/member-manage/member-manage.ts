import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService, CoachService, MemberService } from '@/providers/index';
import * as dayjs from 'dayjs';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-member-manage',
    templateUrl: './member-manage.html',
    styleUrls: ['./member-manage.scss']
})
export class MemberManageComponent implements OnInit {
    
    @ViewChild('searchInput') searchInput;

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
        { label: '批量修改销售', display: true, click: () => this.multipleUpdate() },
    ];
    collection: any = {};
    params: any = {
        type: 10,
    };

    isVisible: boolean = false;
    editorVisible: boolean = false;

    ossPath: string = "";
    detail: any = {};

    memberSourceList: any[] = [];
    coachList: any[] = [];
    // 销售员
    salesmanList: any[] = [];
    // searchSalesmanList: any[] = [];
    // 推荐人
    referrerMember: any[] = [];

    pageIndex: number = 1;
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;
    keyword: string = "";

    form: nyForm;

    // 出行习惯
    tripMode: any[] = [];
    // 课程需求
    requirements: any[] = [];

    isUploadLoading: boolean = false;
    updateVisible: boolean = false;
    salesman_id: number;


    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private coachService: CoachService,
        private memberService: MemberService,
        private activatedRoute: ActivatedRoute,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
        this.tripMode = this.memberService.tripMode;
        this.requirements = this.memberService.requirements;
        this.activatedRoute.queryParams.subscribe(params => {
            if (params && params.id) {
                this.getDetail({ id: params.id });
            }
        })
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getAllMember(value, true);
        })
        this.getMemberSourceList();
        this.getCoachList();
        this.getSalesmanList();
    }

    getMemberSourceList() {
        this.memberService.getMemberSourceList().then(data => {
            this.memberSourceList = data || [];
        })
    }

    getCoachList() {
        this.coachService.getHallCoachList().then(data => {
            this.coachList = data || [];
        })
    }

    getSalesmanList() {
        this.http.get("staff/manage/getsalesmanlist").then(data => {
            if (!data) data = [];
            this.salesmanList = data;
            // this.searchSalesmanList = data.map(item => {
            //     return { label: item.name, value: item.id };
            // })
        })
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.getDetail(item);
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.getDetail(item);
        }

        this.collection.showCheckbox = true;

        // this.collection.onInit = () => {
        //     let data = [{
        //         ctype: "select",
        //         display: true,
        //         itype: "numeric",
        //         label: "销售",
        //         name: "salesman_id",
        //         operator: "=",
        //         options: this.searchSalesmanList,
        //         selectModel: "default",
        //     }]
        //     if (!this.searchSalesmanList.length) {
        //         let timer = setInterval(() => {
        //             if (this.searchSalesmanList.length) {
        //                 clearInterval(timer);
        //                 data[0].options = this.searchSalesmanList;
        //                 this.searchInput.conditions.push(data);
        //             }
        //         }, 100);
        //     } else {
        //         this.searchInput.conditions.push(data);
        //     }
        // }

    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.action = "hall/member/admin-hall/member/create";
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
        this.http.post("hall/member/admin-hall/member/is-member-exists", params).then(ret => {
            ret.contact = params.contact;
            let body = Object.assign(this.form.getBody(), ret);
            this.form.body = { ...body };
        });
    }

    showModal() {
        this.params = {
            gender: 2,
            type: 1,
        };
        this.form.body = {}
        this.form.body = {
            ...this.params
        }
        this.editorVisible = true;
        if (!this.salesmanList.length) {
            this.getSalesmanList();
        }
        if (!this.referrerMember.length) {
            this.getAllMember();
        }
    }

    saveMember() {
        this.form.submit().then(() => {
            this.notification.success("提示信息", "创建成功");
            this.editorVisible = false;
            this.params = {};
            this.form.body = {};
            this.collection.load();
        })
    }

    getDetail(item?: any) {
        this.detail = item;
        this.isVisible = true;
        // this.http.post("hall/member/admin-hall/member/detail", { id: item.id }).then(ret => {
        //     this.detail = ret;
        //     this.params = Object.assign({}, ret);
        //     this.isVisible = true;
        //     this.getMemberLogs();
        //     this.getMemberVisitList();
        //     // this.getMemberCourseCardList();
        // })
    }

    
    multipleUpdate() {
        if (!this.collection.checkedItems.length) {
            this.notification.info("提示信息", "请选择需要修改的数据");
            return ;
        }
        this.updateVisible = true;
    }

    updateSalesman() {
        if (!this.salesman_id) {
            this.notification.info("提示信息", "请选择销售");
            return ;
        }
        let checkData = this.collection.checkedItems || [];
        let params = {
            member_ids: checkData.map(item => item.id),
            salesman_id: this.salesman_id,
        }
        this.http.post("hall/member/admin-hall/member/salesman-batch-update", params).then(ret => {
            this.notification.success("提示信息", "批量修改成功");
            this.collection.load();
            this.updateVisible = false;
            this.salesman_id = null;
        })
    }

    handleCancelUpdate() {
        this.updateVisible = false;
        this.salesman_id = null;
    }



    getAllMember(keyword: string = '', isSearch: boolean = false) {
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

    cancelMemberEditor() {
        this.editorVisible = false;
        this.form.clearError();
    }

    public beforeCrop = (file, fileList) => {
        // this.isUploadLoading = true;
        return true;
    }

    // public uploadImg = (item) => {
    //     let formData = new FormData();
    //     formData.set('images[]', item.file);

    //     const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
    //     if (!isLtMaxSize) {
    //         this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
    //         return;
    //     }
    //     this.isUploadLoading = true;

    //     this.http.post('file/upload/image?bucket=' + Config.ossBucket, formData).then(urls => {
    //         this.params.avatar = urls[0];
    //         this.isUploadLoading = false;
    //     }).catch(() => { 
    //         this.isUploadLoading = false;
    //     });
    // };

    setImage(data) {
        this.params.avatar = data.path;
        this.isUploadLoading = false;
    }
}
