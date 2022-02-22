import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Http } from '@yilu-tech/ny';
import * as xlsx from 'xlsx';
import { Export } from '@/providers/utils';

@Component({
    selector: 'app-member-coupon',
    templateUrl: './member-coupon.html',
    styleUrls: ['./member-coupon.scss']
})
export class MemberCouponComponentList implements OnInit {
    public buttons = [
       { label: '批量核销', display: true, click: () => this.dispose() },
       { label: '批量作废', display: true, click: () => this.invalidCoupon() },
       { label: '导出', display: true, click: () => this.export() },
    ]
    collection: any = {};
    checkedItems: Array<any> = [];

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.memberPageIndex = 1;
            this.getAllMemberList(value, true);
        })
    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.showCheckbox = true;

        this.collection.onLoaded = () => {
            this.collection.data.forEach((item) => {
                item.$checked = this.checkedItems.indexOf(item.id) >= 0;
            });
        };

        this.collection.onChecked = (item, items) => {
            if (item) {
                if (item.$checked) {
                    this.checkedItems.push(item.id);
                } else {
                    this.checkedItems.splice(this.checkedItems.indexOf(item.id), 1);
                }
            } else {
                if (items.length) {
                    items.forEach((item) => {
                        let index = this.checkedItems.indexOf(item.id);
                        if (index < 0) {
                            this.checkedItems.push(item.id);
                        }
                    });
                } else {
                    this.collection.data.forEach((item) => {
                        let index = this.checkedItems.indexOf(item.id);
                        if (index >= 0) {
                            this.checkedItems.splice(index, 1);
                        }
                    });
                }
            }
        };
    }

    sendVisible: boolean = false;
    allCouponList = [];
    allMemberList = [];
    searchChange$ = new Subject<any>();

    selectMemberList = [];
    shopList = [];

    isLoading: boolean = false;
    memberKeyword: string = "";
    haveMoreMember: boolean = false;
    memberPageIndex: number = 1;

    sendParams: any = {

    };

    selectMember: any = {};
    form: nyForm;
    isSubmitLoading: boolean = false;
    
    showSendCouponModal() {
        this.sendVisible = true;
        // if (!this.allCouponList.length) {
        this.getAllCouponList();
        // }
        if (!this.allMemberList.length) {
            this.getAllMemberList();
        }
        if (!this.shopList.length) {
            this.getShopList();
        }
    }

    confirmSendCoupon() {
        let params = Object.assign({}, this.sendParams);
        // if (!params.coupon_id || !params.hall_id) {
        //     this.notification.info("提示信息", "请将数据填写完整");
        //     return ;
        // }
        // if (!params.member_id && !this.selectMemberList.length) {
        //     this.notification.info("提示信息", "请将数据填写完整");
        //     return ;
        // }
        this.isSubmitLoading = true;
        let ids = [];
        if (this.selectMemberList.length) {
            ids = this.selectMemberList.map(item => item.id);
        } else if (params.member_id) {
            ids.push(params.member_id);
            delete params.member_id;
        }

        if (params.hasOwnProperty("member_id")) {
            delete params.member_id;
        }

        params.member_ids = ids;

        this.http.post("member/admin/coupon/member-coupon/issue-coupon", params).then(() => {
            this.notification.success("提示信息", "优惠券发放成功");
            this.closeSendCoupon();
            this.collection.load();
        }).catch((error)=>{
            console.log("error======>",error)
            this.isSubmitLoading = false;
            this.form.setError(error.error.data)
        })
    }

    selectMemberChange() {
        if (this.sendParams.member_id) {
            this.selectMember = this.allMemberList.find(item => item.id == this.sendParams.member_id) || null;
        }
    }

    addMember() {
        if (!this.sendParams.member_id) {
            this.notification.info("提示信息", "请选择添加的会员");
            return;
        }
        // let member = this.allMemberList.find(item => item.id == this.sendParams.member_id);
        if (this.selectMember) {
            let hasExist = !!this.selectMemberList.find(item => item.id == this.selectMember.id);
            if (!hasExist) {
                this.selectMemberList.push(this.selectMember);
            }
            this.sendParams.member_id = null;
            this.selectMember = {};
        }
    }

    removeAddMember(index: number) {
        this.selectMemberList.splice(index, 1);
    }

    closeSendCoupon() {
        this.sendVisible = false;
        this.sendParams = {};
        this.selectMember = {};
        this.selectMemberList = [];
        this.isSubmitLoading = false;
    }

    getAllCouponList() {
        let params = {
            "action": "query",
            "params": [["status", "=", 1]],
            "fields": ["id", "name", "discount", "type", "access_channel", "effective_days", "amount", "created_at", "status"],
        }

        this.http.post("member/admin/coupon/list", params).then(data => {
            this.allCouponList = data || [];
        })
    }

    onSearch(value: string): void {
        this.isLoading = true;
        this.memberKeyword = value;
        this.searchChange$.next(value);
    }

    loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return;
        }
        this.memberPageIndex += 1;
        this.isLoading = true;
        this.getAllMemberList(this.memberKeyword);
    }

    getAllMemberList(name: string = '', isSearch: boolean = false) {
        let params = {
            action: "query",
            fields: ["name", "email", "gender", "contact", "birthday", "address", "created_at"],
            page: this.memberPageIndex,
            params: [],
            size: 50,
        }
        if (name) {
            params.params.push(["contact", "like", name]);
        }

        this.http.post("member/admin/member/list", params).then(ret => {
            if (isSearch) {
                this.allMemberList = ret.data || [];
            } else {
                this.allMemberList = this.allMemberList.concat(ret.data || []);
            }
            if (ret.last_page > ret.current_page) {
                this.haveMoreMember = true;
            } else {
                this.haveMoreMember = false;
            }
            this.isLoading = false;
            this.memberPageIndex = ret.current_page;
        })
    }

    getShopList() {
        let params = {
            action: "query",
            fields: ["name", "phone", "full_address", "email", "status"],
            // params: [["status", "=", 20]],
        }
        this.http.post("hall/admin/list", params).then(data => {
            this.shopList = data || [];
        })
    }

    public clearChecked() {
        this.checkedItems  = [];
        this.collection.data.forEach((item) => item.$checked = false);
        this.collection.refreshStatus();
    }

    // 批量作废
    invalidCoupon(data?: any) {
        let params: any = {};

        if (!data) { // 批量审核
            if (!this.checkedItems.length) {
                this.notification.info("提示信息", "请选择需要作废的优惠券");
                return;
            }
            params.id = this.checkedItems;
        } else { // 单个审核
            params.id = data.id;

        }

        this.modalService.confirm({
            nzTitle: '提示',
            nzContent: `确定${data?'':'批量'}作废优惠券？`,
            nzCancelText: '取消',
            nzOkText: '确定',
            nzOnOk: async () => {
                this.http.post("member/admin/coupon/member-coupon/invalid-coupon", params).then(ret => {
                    if (ret && ret.coupon_validate) {
                        this.confirm(params);
                    } else {
                        this.clearChecked();
                        this.notification.success("提示信息", "作废成功");
                        this.collection.load();
                    }
                })
            }
        });
    }

    dispose(data?: any) {
        let memberCouponId = [];
        let text = '';
        if (!data) { // 批量审核
            if (!this.checkedItems.length) {
                this.notification.info("提示信息", "请选择需要作废的优惠券");
                return;
            }
            memberCouponId = this.checkedItems;
            text = '存在没有过期或者未被使用的优惠券，确定要批量核销？';
        } else { // 单个审核
            memberCouponId = [data.id];
            text = '该优惠券没有过期或者未被使用，确定要核销？';

        }
        this.modalService.confirm({
            nzContent: text,
            nzCancelText: '取消',
            nzOkText: '确定',
            nzOnOk: async () => {
                this.http.post("member/admin/member-coupon/write-off", {memberCouponId}).then(ret => {
                    this.notification.success("提示信息", "核销成功");
                    if (!data) {
                        this.clearChecked();
                    }
                    this.collection.load();
                })
            }
        })
    }

    confirm(params: any) {
        this.modalService.confirm({
            nzTitle: '提示',
            nzContent: '存在没有过期的优惠券, 确定继续作废？',
            nzCancelText: '取消',
            nzOkText: '确定',
            nzOnOk: async () => {
                params.submit = true;
                this.http.post("member/admin/coupon/member-coupon/invalid-coupon", params).then(ret => {
                    this.clearChecked();
                    this.notification.success("提示信息", "作废成功");
                    this.collection.load();
                })
            }
        });
    }

    // 导出
    export(){
        this.collection.export("会员优惠券","all")
    }


    // 导入
    public file: HTMLInputElement;
    importVisible: boolean = false;
    fileName: string = "";
    pageIndex: number = 1;
    pageSize: number = 20;
    isSubmit: boolean = false;
    isExistErrorData: boolean = false;
    isExportErrorData: boolean = false;

    // 是否批量发券成功
    isSuccess: boolean = false;
    importMemberCoupon = null;
    errorData: any = null;

    submit() {
        this.isSubmit = true;
        let data = [];
        if (this.errorData) {
            let errorData: any[] = this.errorData;
            data = errorData.map(item => {
                let itemData = {};
                this.tableHeadersKeys.forEach(key => {
                    itemData[key] = item[key];
                });
                return itemData;
            });
        } else {
            data = this.importOriginData.map(item => Object.assign({}, item));
        }
        data.forEach(item => {
            if (item.reissue) { // 是否重复发券
                if (item.reissue.trim() == "是" || item.reissue.trim() == 1) {
                    item.reissue = true;
                } else {
                    item.reissue = false;
                }
            } else {
                item.reissue = false;
            }
        });

        this.http.post("member/admin/coupon/member-coupon/import-member-coupon", { data: data }).then(ret => {
            this.isSubmit = false;
            this.importMemberCoupon = ret || null;
            if (ret.false_data && ret.false_data.length) {
                (ret.false_data || []).forEach(item => {
                    item.reissue = item.reissue ? "是" : "否";
                });
                this.errorData = ret.false_data;
                this.isExistErrorData = true;
            } else {
                this.isSuccess = true;
            }
        }).catch(error => {
            this.isSubmit = false;
        })
    }

    downloadTemplate() {
        let link = document.createElement('a');
        link.download = '会员批量发券模板.xlsx';
        link.href = '/assets/download/member-coupon-template.xlsx';
        link.click();
    }

    importData() {
        this.file = document.createElement('input');
        this.file.type = 'file';
        this.file.click();
        this.file.onchange = () => {
            if (this.file.files.length) {
                let fileName = this.file.files[0].name;
                this.fileName = fileName;
                let temp = fileName.split('.');
                let suffix = temp[temp.length - 1].toUpperCase();
                if (suffix !== 'XLSX' && suffix !== 'XLS') {
                    this.notification.warning('提示信息', '请选择文件扩展名为xlsx的文件');
                } else {
                    this.readFileData(suffix);
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

    importOriginData: any[] = [];
    tableHeaders = [];
    tableHeadersNames = ["会员", "手机号", "优惠券", "发券数量", "适用场馆", "是否重复发券"];
    tableHeadersKeys = ["name", "contact", "coupon_name", "coupon_amount", "limit_hall", "reissue"];

    private doXlsx(data: any) {
        let workBook = xlsx.read(data, {type: 'binary'});
        let origin = xlsx.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]], { raw: true, defval: "" });
        if (!origin.length) return;

        this.tableHeaders = this.tableHeadersNames.map((item, i) => {
            return {
                name: item,
                bind: this.tableHeadersKeys[i],
            }
        })

        let dataArray = [];
        origin.forEach((item) => {
            let data = Object.values(item);
            if (data.filter((_) => _).length) {
                dataArray.push(data);
            }
        });

        dataArray = dataArray.map(item => {
            let itemData = {};
            this.tableHeadersKeys.forEach((key, index) => {
                itemData[key] = item[index];
            })
            return itemData;
        });

        this.importOriginData = dataArray;

        this.isSuccess = false;
        this.importVisible = true;
    }

    exportErrorData() {
        if (!this.errorData) return ;
        let name = this.fileName.split('.')[0];

        let e = new Export(`${name}-错误数据`);

        let tableContent = this.errorData.map(item => {
            let itemData = [];
            this.tableHeadersKeys.forEach(key => {
                itemData.push(item[key]);
            })
            return itemData;
        });

        tableContent.unshift(this.tableHeadersNames);
        let eData = {
            table: tableContent,
        };
        this.isExportErrorData = true;

        e.detail(eData);
    }

    afreshImport() {
        this.isSubmit = false;
        this.isExistErrorData = false;
        this.importMemberCoupon = null;
        this.errorData = null;
        this.pageIndex = 1;
        this.importData();
    }

    cancelImport() {
        // 存在错误数据 并且没有导出
        if (this.isExistErrorData && !this.isExportErrorData) {
            this.modalService.confirm({
                nzTitle: "提示信息",
                nzContent: "存在未导出的错误数据，确定直接关闭吗？",
                nzOnOk: () => {
                    this.closeImportModal();
                }
            })
        } else {
            this.closeImportModal();
        }
    }

    closeImportModal() {
        
        this.importVisible = false;
        this.fileName = "";

        this.isSubmit = false;
        this.isExistErrorData = false;
        this.importMemberCoupon = null;
        this.errorData = null;
        this.pageIndex = 1;
    }

}
