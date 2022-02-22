import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';

import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService, HallService, CourseService } from '@/providers/index';
import * as dayjs from 'dayjs';

@Component({
    selector: 'app-coach-manage',
    templateUrl: './coach-manage.html',
    styleUrls: ['./coach-manage.scss']
})
export class CityCoachManageComponent implements OnInit {

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

    currentCity: any = {};

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
        private modalService: NzModalService,
        private hallService: HallService,
        private courseService: CourseService,
        private activatedRoute: ActivatedRoute
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
        this.activatedRoute.queryParams.subscribe(params => {
            if (params && params.id) {
                this.edit({ id: params.id })
            }
        })
    }

    ngOnInit() {
        this.currentCity = this.hallService.getCurrentCity();
        this.getCoachGroupList();
        this.getCityList();
    }

    getCoachGroupList() {
        let parmas: any = { "action": "query", "params": [], "fields": ["id", "name", "grade"], "size": 50, "page": 1 };
        this.http.post("hall/course/admin-city/coach/group-list", parmas).then(ret => {
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
            body.city_id = this.currentCity.id;
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
            body.city_id = this.currentCity.id;
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
        this.http.get("hall/course/admin-city/coach/detail", { id: item.id }).then(ret => {
            this.params = Object.assign({}, ret);
            this.detail = Object.assign({}, ret);
            this.detailForm.body = { ...ret };
            this.detailVisible = true;
            this.getCityHallList(this.params.resident_city_id);
        })
    }

    save() {
        this.form.action = "hall/course/admin-city/coach/create";
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
                this.detailForm.action = "hall/course/admin-city/coach/update";
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
        }
    }

    /**
    * 课程列表
    */
    courseData: Array<any> = [];
    currentCoachCourse: Array<any> = [];
    getCourseList() {
        this.courseService.getCityCourseList().then(ret => {
            let groups: any[] = [];
            let courseTypeMap: any = {
                1: "团课",
                2: "私教课",
                3: "企业课",
            }
            for (let index = 0; index < 3; index++) {
                groups.push({ type: index + 1, title: courseTypeMap[index + 1], children: [] })
            }
            (ret.data || []).forEach(item => {
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
        this.http.get("hall/course/admin-city/coach/courses/get-courses", { id: this.detail.id, city_id: this.currentCity.id }).then(ret => {
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
        this.http.get("hall/course/admin-city/coach/halls/get-halls", { id: this.detail.id, city_id: this.currentCity.id }).then(ret => {
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
            city_id: this.currentCity.id,
        };
        this.http.post("hall/course/admin-city/coach/halls/setting", params).then(ret => {
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
            city_id: this.currentCity.id,
        }

        this.http.post("hall/course/admin-city/coach/courses/setting", params).then(ret => {
            this.notification.success("提示信息", "设置成功");
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
}
