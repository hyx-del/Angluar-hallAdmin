import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService, HallService, CourseService } from '@/providers/index';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-coach-manage',
    templateUrl: './coach-manage.html',
    styleUrls: ['./coach-manage.scss']
})
export class CoachManageComponent implements OnInit {

    public buttons: any[] = [
        // { name: 'create', click: () => this.showModal() },
    ];
    collection: any = {};
    params: any = {};
    detail: any = {};

    isVisible: boolean = false;
    detailVisible: boolean = false;

    ossPath: string = "";
    form: nyForm;
    detailForm: nyForm;
    coachGroup: any[] = [];
    cityList: Array<any> = [];
    hallData: any = {};
    tabIndex: number = 0;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private modalService: NzModalService,
        private hallService: HallService,
        private courseService: CourseService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getCoachGroupList();
        this.getCityList();
    }

    getCoachGroupList() {
        let parmas: any = { "action": "query", "params": [], "fields": ["id", "name", "grade"], "size": 50, "page": 1 };
        this.http.post("hall/course/admin/groups/list", parmas).then(ret => {
            this.coachGroup = ret.data || [];
        });
    }

    getCityList() {
        this.http.get("hall/course/admin/region-used/used-cities").then(ret => {
            this.cityList = ret || [];
        })
    }

    getCityHallList(id: any, isReFresh?: boolean) {
        if (this.hallData[id] && !isReFresh) {
            return;
        }
        let params: any = {
            city_id: id ? id : this.params.resident_city_id
        }
        this.http.get("hall/course/admin/region-used/city-halls", params).then(ret => {
            this.hallData[params.city_id] = ret || [];
        })
    }

    setCollection(collection) {
        this.collection = collection;
        // this.collection.onDblClick = (item) => this.edit(item);
        
        this.collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.photo) {
                body.photo = this.params.photo;
            }
            if (body.hire_date) {
                body.hire_date = dayjs(body.hire_date).format("YYYY-MM-DD");
            }
        }

    }

    detailFormInit(form) {
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.names = ['id'];
        this.detailForm.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            if (this.params.photo || this.detail.photo) {
                body.photo = this.params.photo || this.detail.photo;
            }
            if (body.hire_date) {
                body.hire_date = dayjs(body.hire_date).format("YYYY-MM-DD");
            }
            body.description = this.detail.description || '';
        }
    }

    showModal() {
        this.restoreData();
        this.isVisible = true;
    }

    edit(item) {
        this.http.get("hall/course/admin/coach/detail", { id: item.id }).then(ret => {
            this.params = Object.assign({}, ret);
            this.detail = Object.assign({}, ret);
            this.detailForm.body = { ...ret };
            this.detailVisible = true;

            this.getCityHallList(this.params.resident_city_id);
        })
    }

    save() {
        this.form.action = "hall/course/admin/coach/create";
        this.form.submit().then(ret => {
            this.notification.success("提示信息", "创建成功");
            this.restoreData();
            this.isVisible = false;
            this.collection.load();
        })
    }

    updateCoach() {
        this.modalService.confirm({
            nzTitle: "确定修改教练资料？",
            nzOnOk: () => {
                this.detailForm.action = "hall/course/admin/coach/update";
                this.detailForm.submit().then(ret => {
                    this.notification.success("提示信息", "修改成功");
                    Object.assign(this.detail, this.detailForm.getBody());
                    this.detail.photo = this.params.photo || this.detail.photo;
                    this.collection.load();
                })
            }
        })
    }

    cityChange(event) {
        this.getCityHallList(event);
        this.params.hall_id = "";
        if (this.params.id) {
            this.detailForm.setValue("resident_hall_id", "", true);
        } else {
            this.form.setValue("resident_hall_id", "", true);
        }
    }

    refreshCityHall() {
        this.getCityHallList(this.params.city_id, true);
    }

    close() {
        this.isVisible = false;
        this.tabIndex = 0;
        this.detail = {
            description: '',
        };
        this.detailForm.body = {};
        this.detailForm.clearError();

        this.courseData = [];
        this.currentCoachCourse = [];
        this.hallList = [];

        this.coachCourseLimit = '';
        this.coachCourse = [];
        this.coachLimitData = null;
        this.isRefreshCoachCourse = false;
    }

    restoreData() {
        this.params = {
            gender: 1,
        }

        this.form.body = {};
        this.form.setValue("gender", 1);
        this.form.clearError();
    }

    tabChange(event) {
        if (event.index == 2) {
            if (this.courseData.length) return;
            this.getCourseList();
            this.getCoachCourseList();
        } else if (event.index == 1) {
            if (this.hallList.length) return;
            this.getHallList();
            this.getCoachHallList();
        } else if (event.index == 3) {
            this.getCoachCourses();
        }
    }

    /**
    * 课程列表
    */
    courseData: Array<any> = [];
    currentCoachCourse: Array<any> = [];
    getCourseList() {
        this.courseService.getCourseList().then(data => {
            let groups: any[] = this.generateGroups();
            (data || []).forEach(item => {
                groups[item.type - 1].children.push(item);
            });
            this.courseData = groups;
            
            if (this.currentCoachCourse.length) {
                this.restoreCourseChecked();
            }
        })
    }

    getCoachCourseList() {
        // 教练id
        this.http.get("hall/course/admin/coach/courses/get-courses", { id: this.detail.id}).then(ret => {
            // console.log("可授课程", ret);
            this.currentCoachCourse = ret;
            if (this.courseData.length) {
                this.restoreCourseChecked();
            }
        })
    }

    refreshCourseList() {
        this.getCourseList();
        this.getCoachCourseList();
    }

    restoreCourseChecked() {
        let courseIds = this.currentCoachCourse.map(item => item.course_id);
        if (!courseIds.length) return;
        this.courseData.forEach(item => {
            item.children.forEach(child => {
                if (courseIds.indexOf(child.id) >= 0) {
                    child.checked = true;
                }
            });
        })
    }

    generateGroups() {
        let groups: any[] = [];
        let courseTypeMap: any = {
            1: "团课",
            2: "私教课",
            3: "企业课",
        }
        for (let index = 1; index <= 3; index++) {
            groups.push({ type: index, title: courseTypeMap[index], children: [] })
        }
        return groups;
    }

    /**
    *  场馆列表
    */
    hallList: Array<any> = [];
    currentCoachHall: Array<any> = [];
    getHallList() {
        // this.hallList = this.hallService.getCityHalls();
        this.hallService.getHallList().then(data => {
            this.hallList = data || [];
            if (this.currentCoachHall.length) {
                this.restoreHallChecked();
            }
        })
    }

    refreshHallList() {
        this.getHallList();
        this.getCoachHallList();
    }

    getCoachHallList() {
        this.http.get("hall/course/admin/coach/halls/get-halls", { id: this.detail.id}).then(ret => {
            console.log("教练场馆", ret);
            this.currentCoachHall = ret;
            if (this.hallList.length) {
                this.restoreHallChecked();
            }
        })
    }

    selectAllHall(group) {
        group.checked = !group.checked;
        group.children.forEach(item => {
            item.checked = group.checked;
        })
    }

    restoreHallChecked() {
        let hallIds = this.currentCoachHall.map(item => item.hall_id);
        if (!hallIds.length) return;
        this.hallList.forEach(item => {
            item.children.forEach(child => {
                if (hallIds.indexOf(child.id) >= 0) {
                    child.checked = true;
                }
            });
        })
    }
    /**
     * 教练场馆设置
     */
    hallSetting() {
        let ids = [];
        this.hallList.forEach(item => {
            item.children.forEach(child => {
                if (child.checked) {
                    ids.push(child.id);
                }
            });
        });
        let params: any = {
            id: this.detail.id,
            halls_id: ids,
        };
        this.http.post("hall/course/admin/coach/halls/setting", params).then(ret => {
            this.notification.success("提示信息", "设置成功");
        })
    }

    // 可授课程设置
    setCourse() {
        let courses: any[] = [];
        this.courseData.forEach(item => {
            item.children.forEach(child => {
                if (child.checked) {
                    courses.push({ course_id: child.id, course_type: child.type });
                }
            });
        })
        if (!courses.length) {
            this.notification.info("提示信息", "请选择课程");
            return;
        }
        let params: any = {
            id: this.detail.id,
            courses: courses,
        }

        this.http.post("hall/course/admin/coach/courses/setting", params).then(ret => {
            this.notification.success("提示信息", "设置成功");
            this.isRefreshCoachCourse = true;
        })
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            this.params.photo = urls[0];
            this.form.setValue("photo", urls[0]);
        }).catch(() => { });
    };

    display(item){
        this.http.post("hall/course/admin/coach/display", { 
            id: item.id,
            display: item.display ? false : true 
        }).then(ret => {
            this.notification.success("提示信息", "教练已在小程序" + (item.display ? "隐藏" : "显示"));
            this.collection.load();
        })
    }

    displayWeb(item) {
        let params = {
            id: item.id,
            display:  item.show_on_web ? false : true 
        }
        this.http.post("hall/course/admin/coach/show-on-web", params).then(() => {
            this.notification.success("提示信息", "教练已在官网" + (params.display ? "显示" : "隐藏"));
            this.collection.load();
        })
    }

    coachCourse: any[] = [];
    coachCourseLimit: any;
    coachLimitData: any = null;
    isRefreshCoachCourse: boolean = false;
    isLoadingCoachCourse: boolean = false;

    async getCoachCourses() {
        if (this.coachCourse.length && !this.isRefreshCoachCourse) {
            return ;
        }
        let coachCourse = await this.http.get("hall/course/admin/coach/courses/get-courses", { id: this.detail.id});
        this.currentCoachCourse = coachCourse;
        
        let courseIds = coachCourse.map(item => item.course_id);
        // if (!courseIds.length) return;

        let allCourse: any[] = await this.courseService.getCourseList();
        allCourse = allCourse.filter(course => courseIds.indexOf(course.id) >= 0);

        let groups: any[] = this.generateGroups();
        (allCourse || []).forEach(item => {
            groups[item.type - 1].children.push(item);
        });

        this.isLoadingCoachCourse = true;
        if (courseIds.length) {
            this.coachCourse = groups;
            if (this.isRefreshCoachCourse) {
                this.isRefreshCoachCourse = false;
                this.restoreCoachCourseCheck();
            } else {
                this.getCoachCourseLimit();
            }
        }
    }

    getCoachCourseLimit() {
        if (this.coachLimitData) return ;
        this.http.get("hall/course/admin/coach/get-coach-class-time-limit", { coach_id: this.detail.id }).then(ret => {
            this.coachLimitData = ret || null;
            if (!ret) return ;
            this.coachCourseLimit = ret.time_limit || '';
            this.restoreCoachCourseCheck();
        })
    }

    // 课时限制 恢复教练选中课程
    restoreCoachCourseCheck() {
        if (!this.coachLimitData) return ;
        let courseIds: any[] = this.coachLimitData.limit_courses || [];
        if (!courseIds.length) return ;

        this.coachCourse.forEach(item => {
            item.children.forEach(child => {
                if (courseIds.indexOf(child.id) >= 0) {
                    child.checked = true;
                }
            });
        })
    }

    getCheckCourseIds() {
        let ids = [];
        this.coachCourse.forEach(item => {
            item.children.forEach(child => {
                if (child.checked) {
                    ids.push(child.id);
                }
            });
        });
        return ids;
    }

    saveCoachCourseLimit() {
        let params: any = {
            coach_id: this.detail.id,
            time_limit: this.coachCourseLimit,
            limit_courses: this.getCheckCourseIds(),
        };

        this.http.post("hall/course/admin/coach/set-coach-class-time-limit", params).then(ret => {
            this.notification.success("提示信息", "保存成功");
            this.coachLimitData = null;
            this.getCoachCourseLimit();
        });
    }

    removeSetting() {
        this.modalService.confirm({
            nzTitle: "确定删除设置?",
            nzOnOk: () => {
                this.http.delete("hall/course/admin/coach/delete-coach-class-time-limit", { coach_id: this.detail.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.coachLimitData = null;
                    this.coachCourseLimit = "";
                    this.coachCourse.forEach(item => {
                        item.children.forEach(child => {
                            child.checked = false;
                        });
                    })
                })
            }
        });
    }

}
