import { Component, OnInit, ViewChild } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzModalService, NzNotificationService, NzTreeNode, NzTreeComponent } from 'ng-zorro-antd';

@Component({
    selector: 'app-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit {

    public visible = false;
    public editItem: any = {};
    public collection: any = { data: [], headers: [] };
    public relations: any[] = [
        // { name: '商品名称', type: '商品', id: 123 }
    ];
    public buttons = [
        { name: 'create', click: () => this.add() }
    ];
    public form: any;
    public newsVisible: boolean = false;
    productSelectedVisible: boolean = false;

    newsCollection: any = {};
    news: any[] = [];

    allChecked = false;
    indeterminate = false;

    categoryVisible: boolean = false;
    categoryList: any[] = [];
    selectGroup: any[] = [];
    @ViewChild('tree') tree: NzTreeComponent;
    checkCategoryList: any[] = [];

    public fieldsOptions = {
        'category_id': {
            childNodes: (node) => this.getCategory(node)
        },
    };

    constructor(
        private http: Http,
        private modalService: NzModalService,
        private notificationService: NzNotificationService
    ) {

    }
    ngOnInit() {

    }

    setCollection(e) {
        this.collection = e;
    }

    setNewsCollection(newsCollection) {
        this.newsCollection = newsCollection;
        this.newsCollection.showCheckbox = true;
        // this.newsCollection.onInit = () => {
        //     this.newsCollection.addWhere('type', 1 ,'=');
        // }

        this.newsCollection.onLoaded = () => {
            this.news = this.newsCollection.data;
        }

    }

    onFormInit() {
        this.form.action = this.editItem.id ? 'mix/cms/admin/collection/update' : 'mix/cms/admin/collection/create';
        this.form.request = this.http.request.bind(this.http);
        this.form.names = [];

        if (this.editItem.id) {
            this.form.names.push("id");
            this.form.body = { ...this.editItem };
        }
        this.form.onSubmit = (body) => {
            body.materials_id = this.relations.map(item => {
                // let data: any = {
                //     type: item.item_type || item.type,
                // };
                // if (item.item_type == 2 || item.type == 2) {
                //     data.item_id = item.relation_id || item.item_id || item.id;
                // } else {
                //     data.item_id = item.id;
                // }

                return item.id;
            });
            if (this.checkCategoryList.length) {
                body.categories_id = this.checkCategoryList.map(item => item.id);
            }
        }
    }

    edit(item) {
        this.http.get("mix/cms/admin/collection/detail", { id: item.id }).then(ret => {
            this.checkCategoryList = ret.categories || [];
            this.visible = true;
            this.editItem = ret;
            this.relations = ret.materials || [];
        });
    }

    add() {
        this.editItem = {};
        this.visible = true;
    }

    addMaterial() {
        this.newsVisible = true;
    }

    selectedMaterials(materials) {
        this.relations = [...this.relations, ...materials];
    }

    closeModal() {
        this.visible = false;
        this.relations = [];
        this.checkCategoryList = [];
        this.selectGroup = [];
        this.form.clear();
        this.form.clearError();
    }
    save() {
        if (!this.relations.length && !this.checkCategoryList.length) {
            this.notificationService.info("提示信息", "请添加素材或分组");
            return;
        }
        this.form.submit().then(ret => {
            this.notificationService.success('提示信息', (this.editItem.id ? '修改' : '创建') + '成功');
            this.collection.load();
            this.closeModal();
        })
    }

    disable(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要禁用这个集合吗？",
            nzOnOk: () => {
                let url = "mix/cms/admin/collection/disable";
                this.http.post(url, { id: data.id }).then(ret => {
                    this.notificationService.success('提示信息', '禁用成功');
                    this.collection.load();
                })
            },
        });
    }

    enable(data: any) {
        this.modalService.confirm({
            nzTitle: "确定要启用这个集合吗？",
            nzOnOk: () => {
                let url = "mix/cms/admin/collection/enable";
                this.http.post(url, { id: data.id }).then(ret => {
                    this.notificationService.success('提示信息', '启用成功');
                    this.collection.load();
                })
            },
        });
    }

    delete(item) {
        if (item.system) {
            this.notificationService.success("提示信息", "系统集合不能删除!");
            return;
        }
        this.modalService.confirm({
            nzTitle: "确定要删除这个集合吗？",
            nzOnOk: async () => {
                this.http.post("mix/cms/admin/collection/delete", { id: item.id }).then(() => {
                    this.notificationService.success("提示信息", "删除成功");
                    this.collection.load();
                });
            },
        });
    }

    removeRow(index) {
        this.relations.splice(index, 1);
        this.relations = [...this.relations];
    }

    
    refreshStatus(): void {
        const allChecked = this.news.filter(value => !value.disabled).every(value => value.checked === true);
        const allUnChecked = this.news.filter(value => !value.disabled).every(value => !value.checked);
        this.allChecked = allChecked;
        this.indeterminate = (!allChecked) && (!allUnChecked);
    }

    checkAll(value: boolean): void {
        this.news.forEach(data => {
            if (!data.disabled) {
                data.checked = value;
            }
        });
        this.refreshStatus();
    }
    public trHandle(item) {
        if (item.checked) {
            item.checked = false;
        } else {
            item.checked = true;
        }
        this.refreshStatus();
    }

    confirmSelect() {
        let data = this.news.filter(value => value.checked === true);
        if (!data.length) {
            this.notificationService.info("提示信息", "请选择素材");
            return ;
        }
        this.selectedMaterials(data);
        
        this.news.forEach(item => {
            item.checked = false;
        });
        this.newsVisible = false;
    }

    cancelSelect() {
        this.news.forEach(item => {
            item.checked = false;
        });
        this.newsVisible = false;
    }

    showCategoryModal() {
        if (!this.categoryList.length) {
            this.getGroupList();
        }
        if (this.checkCategoryList.length) {
            this.selectGroup = this.checkCategoryList.map(item => item.id);
        }
        this.categoryVisible = true;
    }

    getGroupList() {
        this.http.get("mix/cms/admin/material-category/list").then(ret => {
            let categoryList = [];
            ret.forEach(item => {
                categoryList.push(this.parseNode(item));
            });
            this.categoryList = categoryList.map(item => {
                return new NzTreeNode(Object.assign({}, item));
            })
        });
    }

    public getCategory(e: any) {
        if (e && (e.node.children.length || !e.node.isExpanded)) return;
        return this.http.get('mix/cms/admin/material-category/list').then((ret) => {
            let nodes = ret.map((item) => {
                item.title = item.name;
                item.key = item.id;
                if (item.children.length) {
                    item.children.map(child => {
                        child.title = child.name;
                        child.key = child.id;
                        child.isLeaf = true;
                    })
                } else {
                    item.isLeaf = true;
                }
                return new NzTreeNode(item);
            });
            if (e) e.node.addChildren(nodes);
            return nodes;
        });
    }

    private parseNode(obj: any) {
        let child = [];
        if (obj.hasOwnProperty('children')) {
            for (let item of obj.children) {
                item.isLeaf = true;
                child.push(this.parseNode(item));
            }
        }
        obj.title = obj.name;
        obj.key = obj.id;
        obj.children = child;
        return obj;
    }

    confirmSelectCategory() {
        let checkNode = this.tree.getCheckedNodeList();
        if (!checkNode.length) {
            return ;
        }
        let checkData = checkNode.map(item => {
            return {
                id: item.origin.id,
                name: item.origin.title,
            }
        })

        this.checkCategoryList = checkData;
        this.closeCategorySelect();
        
    }

    removeGroupRow(index) {
        this.checkCategoryList.splice(index, 1);
    }

    closeCategorySelect() {
        this.categoryVisible = false;
    }
}
