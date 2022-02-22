export class Permission {
    public set checked(bool) {
        if (bool != this._checked) {
            this.setCheck(bool);
            this.group && this.group.refresh();
        }
    }

    public get checked() {
        return this._checked;
    }

    public set disabled(bool) {
        if (bool != this._disabled) {
            this.setDisable(bool);
            this.group && this.group.refresh();
        }
    }

    public get disabled() {
        return this._disabled;
    }

    public group: PermissionGroup;

    public type = 'item';

    public readonly name: string;
    public readonly data: any;

    protected _checked: boolean = false;
    protected _changed: boolean = false;
    protected _disabled: boolean = false;

    public constructor(name: string, data: any, group?: Permission) {
        this.name = name;
        this.data = data;
        this.setGroup(group);
    }

    public setGroup(group) {
        this.group = group;
        if (!group) {
            return;
        }
        if (group.type === this.type) {
            group.items.push(this);
        } else {
            group.items.unshift(this);
        }
    }

    public setCheck(bool, reset = false) {
        if (bool != this._checked && !this._disabled) {
            this._checked = bool;
            this._changed = reset ? false : !this._changed;
        }
    }

    public setDisable(bool) {
        this._disabled = bool;
    }

    public changed() {
        return this._changed;
    }
}

export class PermissionGroup extends Permission {

    public type = 'group';

    public anyChecked: boolean;
    public anyDisabled: boolean;
    public checkedCount: number = 0;
    public disabledCount: number = 0;

    public permissions: { [key: string]: Permission } = {};

    public readonly items: Array<Permission | Permission> = [];


    public constructor(items: Array<any>, name?: string, data?: any, group?: Permission) {
        super(name, data, group);
        items.forEach((item) => this.append(item));
    }

    public append(item: any) {
        const items = item.name.split('.');
        this.permissions[item.id] = new Permission(items.pop(), item, items.reduce((group: PermissionGroup, name) => {
            let childGroup = group.items.find((_) => _.type === 'group' && _.name === name);
            if (childGroup) {
                return childGroup;
            }
            return new PermissionGroup([], name, null, group);
        }, this));
    }

    public getChecked(filter?: (item: Permission) => boolean, mapper?: (item: Permission) => any) {
        let items = [];
        for (let key in this.permissions) {
            let item = this.permissions[key];
            if (item.checked && (!filter || filter(item))) {
                items.push(mapper ? mapper(item) : item);
            }
        }
        return items;
    }

    public each(fn: (item: Permission) => void) {
        for (let item of this.items) {
            if (item instanceof PermissionGroup) {
                item.each(fn);
            } else {
                fn(item);
            }
        }
        return this;
    }

    public changeState(key: any, checked: boolean = null, disabled: boolean = null) {
        let permission = this.permissions[key];
        if (!permission) {
            return;
        }
        if (permission.disabled && disabled === false) {
            permission.disabled = false;
        }
        if (checked !== null) {
            permission.checked = checked;
        }
        if (disabled !== null) {
            permission.disabled = disabled;
        }
    }

    public setCheck(bool, reset = false) {
        this.items.forEach((item) => item.setCheck(bool, reset));
        this.refresh();
    }

    public setDisable(bool) {
        this.items.forEach((item) => item.setDisable(bool));
        this.refresh();
    }

    public changed(): boolean {
        for (let item of this.items) {
            if (item.changed()) {
                return true;
            }
        }
        return false;
    }

    public refresh() {
        let anyChecked = false, allChecked = true, anyDisabled = false, allDisabled = true;
        this.disabledCount = this.checkedCount = 0;
        for (let item of this.items) {
            if (item instanceof PermissionGroup) {
                this.checkedCount += item.checkedCount;
                this.disabledCount += item.disabledCount;
            } else {
                if (item.checked) {
                    this.checkedCount += 1;
                }
                if (item.disabled) {
                    this.disabledCount += 1;
                }
            }

            if (item.checked || item['anyChecked']) {
                anyChecked = true;
            }
            if (!item.checked) {
                allChecked = false;
            }

            if (item.disabled || item['anyDisabled']) {
                anyDisabled = true;
            }
            if (!item.disabled) {
                allDisabled = false;
            }
        }
        this._checked = allChecked;
        this.anyChecked = anyChecked && !allChecked;

        this._disabled = allDisabled && this.items.length > 0;
        this.anyDisabled = anyDisabled && !allDisabled;

        this.group && this.group.refresh();
    }
}
