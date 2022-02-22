import { Injectable } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { HallService } from "@/providers/services/hall.service";

@Injectable()
export class RoleService {

    private url = 'staff/role/list';

    private roles: { [group: string]: any[] } = {};

    public constructor(private http: Http, private hallService: HallService) {

    }

    public setRoles(roles: any[], group: string = null) {
        return this.getGroup(group).then((group) => {
            this.roles[group] = roles;
            return new RoleManage(roles, group);
        });
    }

    public getRoles(group: string = null, refresh = false): Promise<RoleManage> {
        return this.getGroup(group).then((group) => {
            if (!refresh && this.roles[group]) {
                return Promise.resolve(new RoleManage(this.roles[group], group))
            }
            return this.http.get(this.url, this.makeGroupParams(group)).then((ret) => {
                this.roles[group] = ret;
                return new RoleManage(ret, group);
            })
        });
    }

    public getGroup(group: string = null): Promise<string> {
        return this.hallService.do(() => {
            if (group === 'hall') {
                group += ':' + this.hallService.getCurrentHall().id;
            } else if (group === 'city') {
                group += ':' + this.hallService.getCurrentCity().id;
            }
            return group;
        });
    }

    public makeGroupParams(group: string = null) {
        if (!group) {
            return { group: '' };
        }
        const parts = group.split(':', 2);
        return { group: parts[0], [parts[0] + '_id']: parts[1] };
    }
}

export class RoleManage {
    public readonly items: any[];

    public readonly group: string;

    public onCheck: (role, bool) => void;

    public onDisable: (role, bool) => void;

    constructor(items: any[] = [], group: string = '') {
        this.group = group;
        this.items = items.map((item) => Object.assign({}, item));
        this.items.forEach((item) => item.children = item.child_keys.map((id) => this.items.find((_ => _.id == id))));
    }

    public reset() {
        this.items.forEach((item) => item.checked = item.disabled = false);
        return this;
    }

    public check(role: any, bool = null) {
        const checked = typeof bool === 'boolean' ? bool : !role.checked;
        if (role.diabled || role.checked == checked) return;

        role.checked = checked;
        this.onCheck && this.onCheck(role, checked);

        if (role.is_administrator) {
            this.items.forEach((item) => item !== role && (item.disabled = checked));
        } else {
            role.children.forEach((item) => this.disable(item, checked));
        }
    }

    public disable(role: any, bool = null) {
        const disabled = typeof bool === 'boolean' ? bool : !role.disabled;
        if (role.disabled == disabled) return;

        role.disabled = disabled;
        this.onDisable && this.onDisable(role, disabled);

        role.children.forEach((item) => this.disable(item, disabled));
    }

    public disableParent(role: any, bool = true) {
        this.items.forEach((item) => {
            if (item.children.indexOf(role) >= 0) {
                item.disabled = bool;
                this.disableParent(item, bool);
            }
        });
    }

    public getChecked(filterDisabled: boolean = true) {
        return this.items.filter((item) => item.checked && !(filterDisabled && item.disabled));
    }
}
