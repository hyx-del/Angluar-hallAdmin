import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PermissionGroup } from './permission';
import { NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { RoleManage, RoleService } from "../role.service";
import { HallService } from "@/providers/index";

@Component({
    styleUrls: ['./role.manage.scss'],
    templateUrl: 'role.manage.html',
})
export class RoleManageComponent implements OnChanges, OnInit {
    public permissions: any[];

    public editing: boolean;

    public formData: any;

    public form;

    public confirm = {
        visible: false,
        content: '',
        ok: () => {
            this.confirm.visible = false;
        },
        cancel: () => {
            this.confirm.visible = false;
        },
    };

    public collection: any = {};
    public buttons: any[] = [
        { name: 'create', click: () => this.edit() }
    ];

    public editRole: any;

    public canExtend: boolean;

    public group: string;

    public roleManage: RoleManage;

    public permissionGroup: PermissionGroup = new PermissionGroup([]);

    public roleStatus = [
        { label: '基础角色', value: 2, checked: false },
        { label: '可修改', value: 16, checked: true },
        { label: '可继承', value: 32, checked: true }
    ];

    constructor(private hallService: HallService, public http: Http, public notify: NzNotificationService, public activeRoute: ActivatedRoute, private roleService: RoleService) {
        activeRoute.data.subscribe((value) => {
            this.group = value.group || '';
            this.getPermission().then((items) => this.permissionGroup = new PermissionGroup(items));
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {

    }

    public ngOnInit(): void {

    }

    public setCollection(collection) {
        this.collection = collection;

        this.collection.onLoad = (params) => {
            params.group = this.group;
        };

        this.collection.onLoaded = () => this.roleService.setRoles(this.collection.data, this.group).then((manage) => {
            this.roleManage = manage;
            this.collection.data = manage.items;
        });

        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    public formInit(form) {
        this.form = form;
        this.form.onSubmit = (body) => {
            if (this.editRole) {
                body.role_id = this.editRole.id;
            } else {
                body.status = this.roleStatus.filter((_) => _.checked).map((_) => _.value);
            }
            body.roles = this.roleManage.getChecked(true).map((_) => _.id);
            body.permissions = this.permissionGroup.getChecked((item) => !item.disabled, (item) => item.data.id);
            Object.assign(body, this.roleService.makeGroupParams(this.roleManage.group));
            return body;
        }
    }

    public getPermission(role?: any): Promise<any> {
        let params: any = { 'scope': this.group ? 'admin.' + this.group : 'admin' };
        if (role) {
            if (role.permissions) {
                return Promise.resolve(role.permissions);
            }
            if (role.pendding) {
                return role.pendding;
            }
            params.role_id = role.id;
        }
        let promise = this.http.get('staff/permission/list', params);
        if (role) {
            role.pendding = promise.then((ret) => {
                role.pendding = null;
                role.permissions = ret;
                return ret;
            });
        }
        return promise;
    }

    public roleStateChange(role) {
        let changeState = (role, all = true) => {
            this.getPermission(role).then((items) => items.forEach((item) => {
                this.permissionGroup.changeState(item.id, role.checked, !role.editing && role.checked);
            }));
            all && role.children.forEach((item) => {
                item.checked = role.checked;
                item.disabled = !role.editing && (role.checked || role.disabled);
                changeState(item);
            });
        };
        changeState(role);
        if (!role.checked) {
            this.roleManage.items.forEach((_) => _.checked && changeState(_, !_.editing));
        }
    }

    public removeRole(role) {
        this.confirm.visible = true;
        this.confirm.content = '确认删除角色 “' + role.name + '”';
        this.confirm.ok = () => this.http.post('staff/role/delete', { role_id: role.id }).then((ret) => {
            this.notify.success('提示', '删除成功');
            this.collection.load();
        }).catch((err) => {
            this.notify.error('提示', '删除失败');
        });
    }

    public edit(role?: any) {
        this.editing = true;
        this.editRole = role;
        this.canExtend = !role || !this.isSys(role);
        this.resetState();

        this.formData.name = role ? role.name : '';
        this.formData.description = role ? role.description : '';

        this.roleManage.items.forEach((role) => {
           // TODO  java 调试转换
            if (role.status & 1 || ~role.status & 32) {
                this.roleManage.disable(role, true);
            }
        });
        if (!role) return;

        role.editing = role.checked = role.disabled = true;
        this.roleStateChange(role);
        this.roleManage.disableParent(role);
    }

    public save() {
        this.form.action = 'staff/role/' + (this.editRole ? 'update' : 'create');
        return this.form.submit().then((ret) => {
            this.notify.success('提示', (this.editRole ? '修改' : '创建') + '成功');
            this.collection.load();
            this.editing = false;
        });
    }

    public isSys(item) {
        return item.status & 4;
    }

    private resetState() {
        this.permissionGroup.each((_) => _.checked = _.disabled = false);
        this.roleManage.items.forEach((_) => _.editing = _.checked = _.disabled = false);
    }
}
