import { Component, OnInit, ViewChild } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService, HallService, CourseService } from '@/providers/index';

@Component({
    selector: 'app-coach-manage',
    templateUrl: './coach-manage.html',
    styleUrls: ['./coach-manage.scss']
})
export class CoachManageComponent implements OnInit {

    public buttons: any[] = [
        // { name: 'create', click: () => this.showModal() },
    ];

    ossPath: string = "";
    detailVisible: boolean = false;

    collection: any = {};
    detail: any = {};
    params: any = {};
    
    coachGroup: any[] = [];
    cityList: Array<any> = [];
    hallData: any = {};
    
    tabIndex: number = 0;
    disabledDetail: boolean = true;

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
        this.http.post("hall/course/admin-hall/coach/group-list", parmas).then(ret => {
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
    edit(item) {
        this.http.get("hall/course/admin-hall/coach/detail", { id: item.id }).then(ret => {
            this.params = Object.assign({}, ret);
            this.detail = Object.assign({}, ret);
            // this.detailForm.body = { ...ret };
            this.detailVisible = true;
            this.getCityHallList(this.params.resident_city_id);
        })
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

    close() {
        this.tabIndex = 0;
        this.detail = {
            description: '',
        };
        this.detailVisible = false;
        this.courseData = [];
        this.hallList = [];
    }

    /**
    * 课程列表
    */
    courseData: Array<any> = [];
    currentCoachCourse: Array<any> = [];
    getCourseList() {
        this.courseService.getShopCourseList().then(ret => {
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
        let currentCity = this.hallService.getCurrentCity();
        // 教练id
        this.http.get("hall/course/admin-hall/coach/courses/get-courses", { id: this.detail.id, city_id: currentCity.id }).then(ret => {
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
        let currentCity = this.hallService.getCurrentCity();
        this.http.get("hall/course/admin-hall/coach/halls/get-halls", { id: this.detail.id, city_id: currentCity.id }).then(ret => {
            console.log("教练场馆", ret);
            this.currentCoachHall = ret;
            if (this.hallList.length) {
                this.restoreHallChecked();
            }
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
}
