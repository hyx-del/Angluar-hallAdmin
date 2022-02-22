import { Injectable, EventEmitter } from '@angular/core';
import { NavigationEnd, Route, Router } from '@angular/router';
import { environment } from './../../environments/environment';
import { PacService } from '@/providers/permission';
import { HallService, ROUTES_INFO } from "@/providers/index";

type MenuItem = {
    label: string;
    icon?: string;
    name?: string;
    route?: Route
    group?: string;
    level?: number,
    checked?: Boolean,
    disabled?: Boolean,
    routerLink?: string;
    parent?: MenuItem,
    children?: MenuItem[];
    dropdown?: MenuDropdown
};

type MenuDropdown = {
    options: MenuDropdownOption[],
    selected?: MenuDropdownOption
}

type MenuDropdownOption = {
    name: string,
    checked?: boolean
}

export const MenuDropdown: { [name: string]: MenuDropdown } = {
    city: { options: [] },
    hall: { options: [] },
};

export const Menus: MenuItem[] = [
    {
        label: '总部', level: 0, group: '', children: [
            {
                label: '会馆', level: 1, routerLink: '/headquarters/venue-home', children: [
                    { label: '会馆管理', icon: 'home', routerLink: '/headquarters/venue-home' },
                    { label: "营业统计", icon: "bar-chart", routerLink: '/headquarters/business-statistics' },
                    { label: "营业订单", icon: "profile", routerLink: '/headquarters/business-order' },
                    { label: "营业分析", icon: "line-chart", routerLink: '/headquarters/business-analysis' },
                    {
                        label: '会员管理', icon: 'crown', children: [
                            { label: '会员管理', icon: 'crown', routerLink: '/member/member-manage' },
                            { label: '会员来源', icon: 'compass', routerLink: '/member/member-source' },
                            { label: '大众点评', routerLink: '/member/dianPing' },
                            { label: '总部客服', routerLink: '/member/headquarters-service' },
                            { label: '充值规格', icon: 'account-book', routerLink: '/member/recharge-specs' },
                            { label: '会员课程卡', icon: 'credit-card', routerLink: '/member/course-card' },
                            { label: '单价调整申请', icon:'file-done', routerLink: '/member/price-adjust'}
                        ]
                    },
                    { label: '课程管理', icon: 'read', routerLink: '/headquarters/course/course-manage' },
                    { label: '课程卡管理', icon: 'credit-card', routerLink: '/headquarters/course/course-card' },
                    { 
                        label: '教练管理', icon: 'idcard', children: [
                            { label: '教练列表', routerLink: '/headquarters/coach/coach-manage' },
                            { label: '课时限制设置', routerLink: '/headquarters/coach/coach-limit' },
                        ] 
                    },
                    { label: '课表', icon: 'table', routerLink: '/headquarters/course/schedule' },
                    {
                        label: '辅助资料', icon: 'file-text', children: [
                            { label: '教练组', routerLink: '/headquarters/auxiliary/coach-group' },
                            { label: '体测项目', routerLink: '/headquarters/auxiliary/body' },
                            { label: '支付方式', icon: 'wallet', routerLink: '/headquarters/auxiliary/payment-mode' },
                            { label: '课程标签管理', routerLink: '/headquarters/course/tags' },
                            { label: '评价标签', routerLink: '/headquarters/auxiliary/comment-tags' },
                            { label: '规格类别', routerLink: '/headquarters/auxiliary/specs-category'},
                        ]
                    }
                ]
            },
            {
                label: '员工', level: 1, routerLink: '/workers/staff-manage', children: [
                    { label: '员工管理', icon: 'team', routerLink: '/workers/staff-manage' },
                    { label: '角色', icon: 'user', routerLink: '/workers/role-manage' }
                ]
            },
            {
                label: '会员', level: 1, routerLink: '/member/all-member-manage', children: [
                    { label: '会员管理', icon: 'crown', routerLink: '/member/all-member-manage' },
                    { label: '短信发送记录', icon: 'profile', routerLink: '/member/short-message-log' },
                    // { label: '会员来源', icon: 'compass',routerLink: '/member/member-source'] },
                    // { label: '充值规格', icon: 'account-book',routerLink: '/member/recharge-specs'] },
                    // { label: '会员课程卡', icon: 'credit-card',routerLink: '/member/course-card'] },
                    { label: '优惠券管理', icon: 'tags', routerLink: '/member/coupon' },
                    { label: '会员优惠券', icon: 'tag', routerLink: '/member/member-coupon' },
                    // { label: '梵音——红促宝活动', icon: 'tags', routerLink: '/member/member-promotion' },
                ]
            },
            {
                label: '资讯', level: 1, routerLink: '/cms/article-manage', children: [
                    { label: "素材管理", icon: "profile", routerLink: '/cms/article-manage' },
                    { label: "分组管理", icon: "bars", routerLink: '/cms/category' },
                    { label: "集合管理", icon: "inbox", routerLink: '/cms/collection' },
                ]
            },
            {
                label: '视频', level: 1, routerLink: '/video/video-manage', children: [
                    { label: '视频管理', icon: 'play-circle', routerLink: '/video/video-manage' },
                    { label: '视频库', icon: 'folder-add', routerLink: '/video/library' },
                    { label: '视频流派', icon: 'flag', routerLink: '/video/school' },
                    { label: '音频管理', icon: 'audio', routerLink: '/video/audio-manage' },
                    { label: '音频库', icon: 'folder-add', routerLink: '/video/audio-library' },
                    { label: '音频分类', icon: 'inbox', routerLink: '/video/audio-category' },
                    { label: '体位类别', icon: 'read', routerLink: '/video/position' },
                    { label: '视频分类', icon: 'inbox', routerLink: '/video/category' },
                    { label: "营业统计", icon: "bar-chart",routerLink: '/video/business-statistics' },
                    { label: "消费记录", icon: "ordered-list", routerLink: '/video/consumption' },
                    { label: '教练管理', icon: 'idcard', routerLink: '/video/coach-manage' },
                    { label: '会员管理', icon: 'crown', routerLink: '/video/member' },
                    { label: '充值订单', icon: 'carry-out', routerLink: '/video/order' },
                    { label: '余额调整记录', icon: 'ordered-list', routerLink: '/video/adjust-log' },
                    { label: '充值规格', icon: 'account-book', routerLink: '/video/recharge-specs' },
                    { label: '留言管理', icon: 'message', routerLink: '/video/comment' },
                    {
                        label: '内容设置', icon: 'setting', children: [
                            { label: '文章管理', routerLink: '/video/show-setting' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        label: '城市', group: 'city', level: 1, routerLink: '/city/schedule', children: [
            { label: '课表', icon: 'table', routerLink: '/city/schedule' },
            { label: '课程结算设置', icon: 'setting', routerLink: '/city/settlement-setting' },
            { label: '开卡申请订单', icon: 'file-done', routerLink: '/city/apply-order' },
            { label: "转卡申请", icon: 'credit-card', routerLink: '/city/transform-apply' },
            { label: "退卡申请", icon: 'credit-card', routerLink: '/city/recede-apply' },
            { label: "剩余价值调整申请", icon: 'credit-card', routerLink: '/city/surplus-value-apply' },
            { label: '教练管理', icon: 'idcard', routerLink: '/city/coach/coach-manage' },
            { label: '上课评价', icon: 'smile', routerLink: '/city/course-comments' },
            { label: "营业统计", icon: "bar-chart", routerLink: '/city/business-statistics' },
            { label: "营业分析", icon: "line-chart", routerLink: '/city/business-analysis' },
            { label: "提成规则设置", icon: "setting", routerLink: '/city/sales-commission-rule' },
            { label: "门店提成规则设置", icon: "setting", routerLink: '/city/shop-commission' },

            
            {
                label: '教练统计', icon: 'area-chart', children: [
                    { label: '教练评分统计', icon: 'like', routerLink: '/city/score-statistice' },
                    { label: '课时费统计', icon: 'area-chart', routerLink: '/city/course-feee-statistics' },
                    { label: '教练工资单', routerLink: '/city/coach-payroll' },
                ]
            },
            {
                label: '员工管理', icon: 'team', children: [
                    { label: '员工', routerLink: '/city/hall/staff-manage' },
                    { label: '角色', routerLink: '/city/hall/role-manage' }, 
                ]
            },
            {
                label:'财务管理',icon:'line-chart',children:[
                    { label: '员工档案', routerLink: '/city/staff-file' },
                    { label: '工资条', routerLink: '/city/salary-sheet' },
                ]
            }
        ], dropdown: MenuDropdown.city
    },
    {
        label: '门店', group: 'hall', level: 1, routerLink: '/shop/dashboard', children: [
            { label: "工作台", icon: "dashboard", routerLink: '/shop/dashboard' },
            { label: '排课', icon: 'table', routerLink: '/shop/course/course-plan' },
            { label: "营业统计", icon: "bar-chart", routerLink: '/shop/business-statistics' },
            { label: '营业订单', icon: 'profile', routerLink: '/shop/business-order'},
            { label: '会员管理', icon: 'crown', routerLink: '/shop/member/member-manage' },
            { label: '会员课程卡', icon: 'credit-card', routerLink: '/shop/member/course-card' },
            { label: '开卡订单', icon: 'file-done', routerLink: '/shop/member/open-card-order' },
            { label: '上课评价', icon: 'smile', routerLink: '/shop/course-comments' },
            { label: '投诉建议', icon: 'notification', routerLink: '/shop/suggest' },
            {
                label: '员工管理', icon: 'team', children: [
                    { label: '员工', routerLink: '/shop/hall/staff-manage' },
                    { label: '角色', routerLink: '/shop/hall/role-manage' },
                ]
            },
            {
                label: '会馆管理', icon: 'home', children: [
                    { label: '教练', routerLink: '/shop/coach/coach-manage' },
                    { label: '课程', routerLink: '/shop/course/course-manage' },
                    { label: '课程卡', routerLink: '/shop/course/course-card' },
                    { label: '场馆信息', routerLink: '/shop/hall/info' },
                    { label: '教室管理', routerLink: '/shop/hall/classroom-home' },
                    { label: '提成规则管理', routerLink: '/shop/hall-manage' },
                    { label: '营业数据上传', routerLink: '/shop/data-upload' },
                ]
            }, {
                label: '预售管理', icon: 'shopping', children: [
                    { label: '预售活动', routerLink: '/shop/presell/activity' },
                    { label: '预售订单', routerLink: '/shop/presell/order' },
                ]
            }, {
                label: '报表', icon: "line-chart", children: [
                    { label: "营业分析", routerLink: '/shop/business-analysis' },
                    { label: '会员消费统计', routerLink: '/shop/member/consume-statistics' },
                    { label: "销售业绩统计", routerLink: '/shop/sales-performance-staistics' },
                    { label: "店长提成统计", routerLink: '/shop/hall-commission-statistics' },
                ]
            },{
                label: '财务管理', icon: "line-chart", children: [
                    { label: "员工档案", routerLink: '/shop/staff-file' },
                    { label: '工资条', routerLink: '/shop/salary-sheet' },
                ]
            }
        ], dropdown: MenuDropdown.hall
    }
];

if (!environment.production) {
    Menus[0].children.push({
        label: '测试', level: 1, children: [
            { label: '列表', routerLink: '/test/ny-search-input' }
        ]
    })
}

@Injectable()
export class MenuManager {

    public get list() {
        return this._menus;
    }

    public get childList() {
        return this._childMenus;
    }

    public get active() {
        return this._active;
    }

    public parentLevel: number = 1;

    private _menus: MenuItem[] = [];

    private _childMenus: MenuItem[] = [];

    private _active: MenuItem;

    public _onChange: EventEmitter<any> = new EventEmitter<any>()

    private _changeListener: Function[] = [];

    constructor(public router: Router, private hallService: HallService, private pacService: PacService) {

        this.boot();

        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                let path = this.path();
                if (path === '/forbidden') {
                    return;
                }
                this.setActive(this.match(path));
            }
        });
        this.hallService.onLoaded.subscribe(() => this.boot());
        this.pacService.onChange.subscribe(() => this.refresh());
    }

    protected boot() {
        this.hallService.do(() => {
            MenuDropdown.city.options = this.hallService.getCities();
            MenuDropdown.city.selected = this.hallService.getCurrentCity();
            MenuDropdown.hall.options = this.hallService.getCityHalls();
            MenuDropdown.hall.selected = this.hallService.getCurrentHall();
        }).then(() => this.refresh())
    }

    public path() {
        return this.router.url.split(/[?;#]/, 2)[0];
    }

    public navigate(item: MenuItem) {
        if (!item.routerLink || item.disabled) {
            return;
        }
        if (item.children && !this.check(item)) {
            while (item.children && item.children.length) {
                item = item.children[0];
            }
        }
        this.router.navigateByUrl(item.routerLink);
    }

    public setActive(item: MenuItem) {
        if (this._active) {
            this.changeMenuActive(this._active, false);
        }
        if (item) {
            this.changeMenuActive(item, true);
        }
        if (this._active === item) {
            return false;
        }
        this._active = item;
        this.setChileList();
        this._onChange.emit(item);
        return true;
    }

    public refresh() {
        this._menus = this.filter(Menus);

        let item = this.match(this.path());
        if (!this.setActive(item)) {
            this.setChileList();
        }
    }

    public checkOption(menuItem: MenuItem, option) {
        if (menuItem.dropdown.selected === option) {
            return;
        }
        if (menuItem.dropdown.selected) {
            menuItem.dropdown.selected.checked = false;
        }
        option.checked = true;
        menuItem.dropdown.selected = option;
    }

    public onChange(fn: Function) {
        if (this._changeListener.indexOf(fn) < 0) {
            this._changeListener.push(fn);
        }
        return () => {
            let index = this._changeListener.indexOf(fn);
            if (index >= 0) {
                this._changeListener.splice(index, 1);
            }
        }
    }

    public match(url, items = this._menus) {
        let match = null;
        for (let item of items) {
            if (item.routerLink && item.routerLink === url) {
                if (!item.children) {
                    return item;
                }
                if (!match) {
                    match = item;
                }
            }
            if (item.children) {
                let temp = this.match(url, item.children);
                if (temp) {
                    if (!temp.children) {
                        return temp;
                    }
                    if (!match) {
                        match = temp;
                    }
                }
            }
        }
        return match;
    }

    public matchAll(url, items = this._menus) {
        let match = [];
        for (let item of items) {
            if (item.routerLink && item.routerLink === url) {
                match.push(item);
            }
            if (item.children) {
                match = match.concat(this.matchAll(url, item.children))
            }
        }
        return match;
    }

    public getActiveParent() {
        let item = this.active;
        while (item) {
            if (item.level === this.parentLevel) {
                return item;
            }
            item = item.parent;
        }
        return null;
    }

    public getDefaultParent(items = this._menus) {
        for (let item of items) {
            if (!item.children) {
                continue;
            }
            if (item.level === this.parentLevel) {
                return item;
            }
            let parent = this.getDefaultParent(item.children);
            if (parent) {
                return parent;
            }
        }
        return null;
    }

    protected filter(menus: MenuItem[], parent = null) {
        let items = [];
        for (let item of menus) {
            item.parent = parent;
            if (item.dropdown) {
                if (!item.dropdown.options.length) {
                    continue;
                }
                if (item.children) {
                    item = { ...item };
                    item.children = this.filter(item.children, item);
                }
                items.push(item);
            } else if (item.children) {
                item = { ...item };
                item.children = this.filter(item.children, item);
                if (item.children.length > 0) {
                    items.push(item);
                }
            } else if (this.check(item)) {
                items.push(item);
            }
        }
        return items;
    }

    protected changeMenuActive(menuItem: MenuItem, bool: Boolean) {
        menuItem.checked = bool;
        if (menuItem.parent) {
            this.changeMenuActive(menuItem.parent, bool);
        }
    }

    private setChileList() {
        let parent = this.getActiveParent();
        if (parent && parent.children) {
            this._childMenus = parent.children;
        } else {
            parent = this.getDefaultParent();
            if (parent) {
                this.setActive(parent);
            } else {
                this._childMenus = [];
            }
        }
    }

    private check(item: MenuItem) {
        if (item.name === '#' || !item.routerLink) {
            return true;
        }
        let info = ROUTES_INFO[item.routerLink];

        if (!info) {
            return false;
        }
        return this.pacService.exists(info.name, info.group || '');
    }
}
