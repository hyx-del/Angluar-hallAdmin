import { Component, Input, Output, OnChanges, OnInit, SimpleChanges, EventEmitter, HostBinding, HostListener, Renderer2, OnDestroy } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { HallService } from '@/providers/services/hall.service';

@Component({
    selector: 'role-selection',
    styleUrls: ['./role.selection.scss'],
    templateUrl: 'role.selection.html',
})
export class RoleSelectionComponent implements OnChanges, OnInit, OnDestroy {
    public loading: boolean;
    public loaded: boolean;

    public group: string;

    @Input() public checked: any[] = [];
    @Output() public checkedChange: EventEmitter<any[]> = new EventEmitter<any[]>();

    public groupValue: any;

    public root: any;
    public groups: any[] = [];

    public checkedRoles: any[] = [];

    public roles: Map<string, any> = new Map<string, any>();


    private _originalRoles: any[] = [];

    private _closeListener;

    constructor(public http: Http, public hallService: HallService, private render: Renderer2) {

    }

    @HostBinding('class.focus') focus;

    @HostListener('click', ['$event']) click(event: Event) {
        if (!this.focus) {
            this.focus = true;
            this._closeListener = this.render.listen('window', 'click', (event) => {
                this.focus = false;
                if (this._closeListener) {
                    this._closeListener();
                    this._closeListener = null;
                }
            })
        }
        event.stopPropagation();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if ('checked' in changes) {
            this.initCheckedRoles(this.checked);
        }
    }

    public ngOnInit(): void {
        this.loading = true;
        this.hallService.do(() => {
            if (this.group === 'hall') {
                const hall = this.hallService.getCurrentHall();
                this.groupValue = hall ? hall.id : null;
            }
            if (this.group === 'city') {
                const city = this.hallService.getCurrentCity();
                this.groupValue = city ? city.id : null;
            }
            return this.getRoles().then(() => this.getPermission());
        }).then(() => this.initGroupRoles());
    }

    public ngOnDestroy(): void {
        this._closeListener && this._closeListener();
    }

    public initGroupRoles() {
        this.root = {name: '总部'};
        this.root.roles = this.getGroupRoles(null, this.root);

        this.groups.push({title: this.root.name, items: this.root.roles, check: (item, index) => this.checkRole(item, index)});

        this.root.items = this.hallService.getCities().map((city) => {
            city = Object.assign({type: 'city'}, city);
            city.items = this.hallService.getCityHalls(city).map((hall) => {
                hall = Object.assign({type: 'hall', parent: city}, hall);
                hall.roles = this.getGroupRoles('hall:' + hall.id, hall);
                hall.hasSub = hall.roles.length > 0;
                return hall;
            });
            city.hasSub = city.items.length > 0;
            city.roles = this.getGroupRoles('group:' + city.id, city);


            return city;
        });

        this.groups.push({title: '城市', items: this.root.items, check: (item, index) => this.checkCity(item, index)});

        this.loading = false;
        this.loaded = true;

        this.initCheckedRoles(this.checked);
    }

    public getGroupRoles(group: string, parent) {
        return this._originalRoles.filter((role) => {
            if (group == role.group) {
                return true;
            }
            return group ? group.split(':', 2)[0] == role.group : false;
        }).map((role) => {
            role = Object.assign({}, role, {group, parent});
            role.label = this.getRoleLabel(role);
            this.roles.set((group || '') + ':' + role.id, role);
            return role;
        });
    }

    public getGroup() {
        if (this.groupValue) {
            return this.group + ':' + this.groupValue;
        }
        return this.group;
    }

    public getRoles() {
        return this.http.get('staff/role/list').then((items: any) => {
            items.forEach((item) => item.children = item.child_keys.map((id) => items.find((_ => _.id == id))));
            this._originalRoles = items;
        });
    }

    public getPermission(role?: any): Promise<any> {
        let params: any = {group: this.group};
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

    public checkCity(city, index) {
        const prev = this.groups[index].item;
        if (prev) {
            prev.checked = prev.expand = prev.showSub = false;
            this.groups.splice(index + 1);
            if (city === prev) {
                return this.groups[index].item = null;
            }
        }
        if (city.hasSub) {
            city.showSub = true;
            city.items.forEach((item) => item.checked = item.expand = item.showSub = false);
            this.groups.push({title: '门店', items: city.items, check: (item, index) => this.checkHall(item, index)});
        } else {
            this.groups.push({title: '角色', items: city.roles, check: (item, index) => this.checkRole(item, index)});
        }
        city.expand = city.checked = !city.checked;
        this.groups[index].item = city;
    }

    public checkHall(hall, index) {
        const prev = this.groups[index].item;
        if (prev) {
            prev.checked = prev.expand = prev.showSub = false;
            this.groups.splice(index + 1);
            if (hall === prev) {
                return this.groups[index].item = null;
            }
        }
        this.groups.push({title: '角色', items: hall.roles, check: (item, index) => this.checkRole(item, index)});
        hall.expand = hall.checked = !hall.checked;
        this.groups[index].item = hall;
    }

    public checkRole(role, any = null) {
        const checked = typeof any === 'boolean' ? any : !role.checked;
        if (checked == role.checked || (role.disabled && checked)) return;

        role.checked = checked;
        this.disableChildRoles(role, checked);

        if (checked) {
            this.checkedRoles.push(role);
        } else {
            this.checkedRoles.splice(this.checkedRoles.indexOf(role), 1);
            this.checkedRoles.forEach((item) => this.disableChildRoles(item, true))
        }

        if (typeof any === 'number') {
            this.checkedChange.emit(this.getCheckedRoles(this.root))
        }
    }

    public initCheckedRoles(roles) {
        if (!Array.isArray(roles) || !this.loaded) {
            return;
        }
        roles.forEach((item) => {
            item = this.roles.get((item.group || '') + ':' + item.id);
            if (item) {
                this.checkRole(item, true);
            }
        })
    }

    public getCheckedRoles(group: any) {
        let roles = [];
        group.roles.forEach((role) => {
            if (role.checked && !role.disabled) {
                roles.push({id: role.id, group: role.group});
            }
        });
        group.items && group.items.forEach((item) => {
            roles = roles.concat(this.getCheckedRoles(item));
        });
        return roles;
    }

    private getRoleLabel(role) {
        return role.parent ? this.getRoleLabel(role.parent) + '/' + role.name : role.name;
    }

    private disableChildRoles(role, bool) {
        if (role.is_administrator) {
            this.disableGroupRoles(role.parent, bool);
            role.disabled = false;
        } else {
            role.child_keys.map((id) => {
                const item = role.parent.roles.find((_) => _.id == id);
                if (!item) return;
                item.disabled = bool;
                this.disableChildRoles(item, bool);
            });
        }
    }

    private disableGroupRoles(group, bool) {
        group.roles.forEach((_) => _.disabled = bool);
        group.items && group.items.forEach((item) => this.disableGroupRoles(item, bool));
    }
}
