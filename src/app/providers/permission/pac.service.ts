import { EventEmitter, Injectable, Optional } from '@angular/core';
import { Http, Auth } from '@yilu-tech/ny';

export class PacName {

    public parent: PacName;

    private _name: string;
    private _group: string;
    private _root: boolean;

    protected constructor(parent?: any) {
        this.parent = parent;
    }

    public setGroup(name: string) {
        this._group = name;
    }

    public getGroup(): string {
        if (this.parent) {
            return this.parent.getGroup();
        }
        return this._group;
    }

    public setName(name: string) {
        this._root = name[0] === '^';
        this._name = this._root ? name.substr(1) : name;
    }

    public getName(): string {
        if (this._root || !this.parent) {
            return this._name;
        }
        let prefix = this.parent.getName();
        return prefix ? prefix + '.' + this._name : this._name;
    }
}

export declare abstract class PacController extends PacName {

    show(): void;

    hide(): void;
}

export class GroupResolver {
    public loaded = true;

    public resolve(group) {
        return group
    };

    public prepared() {
        return Promise.resolve(this);
    }
}

@Injectable({
    providedIn: 'root'
})
export class PacService {
    public readonly permissions: Map<string, any> = new Map<string, any>();

    public readonly controllers: PacController[] = [];

    protected _isAdministrator: boolean;

    public loaded: boolean = false;

    public onLoad: EventEmitter<any> = new EventEmitter();

    public onChange: EventEmitter<any> = new EventEmitter();

    protected _pending: Promise<any>;

    public constructor(private http: Http, private auth: Auth, @Optional() private groupResolver: GroupResolver) {
        this._pending = this.storePermission();
    }

    public registerPermission(items: Array<any>, isAdministrator?: boolean) {
        if (isAdministrator !== undefined) {
            this._isAdministrator = isAdministrator;
        }
        this.permissions.clear();
        items.forEach((item) => this.permissions.set(item.name, item));
        this.loaded = true;

        this.onChange.emit();
    }

    public storePermission() {
        this.loaded = false;
        let check = this.auth.check();
        if (typeof check === 'object') {
            return check.then((bool) => this.storePermission())
        }
        if (check) {
            return this.http.get('staff/info/permissions').then((items) => {
                this.registerPermission(items, (this.auth.user().functions & 1) === 1);
            }).catch(() => this.registerPermission([], false))
        }
        return Promise.resolve(this.registerPermission([], false));
    }

    public isAdministrator() {
        return this._isAdministrator;
    }

    public exists(name: string, group?: string) {
        if (this.isAdministrator()) {
            return true;
        }
        let permission = this.permissions.get(name);
        return permission && (group === undefined || permission.groups.indexOf(this.resolveGroup(group)) >= 0);
    }

    public async stored() {
        if (!this.loaded) {
            await this._pending;
        }
        if (this.groupResolver && !this.groupResolver.loaded) {
            await this.groupResolver.prepared();
        }
        return this;
    }

    public refresh() {
        this.controllers.forEach((controller) => {
            if (this.exists(controller.getName(), controller.getGroup())) {
                controller.show();
            } else {
                controller.hide();
            }
        });
        return this;
    }

    public resolveGroup(group) {
        return this.groupResolver ? this.groupResolver.resolve(group) : group;
    }

    public registerControl(controller: PacController) {
        if (this.controllers.indexOf(controller) < 0) {
            this.controllers.push(controller)
        }
        this.exists(controller.getName(), controller.getGroup()) ? controller.show() : controller.hide();
        return this;
    }

    public destroyControl(controller: PacController) {
        let index = this.controllers.indexOf(controller);
        if (index >= 0) {
            this.controllers.splice(index, 1);
        }
        return this;
    }
}
