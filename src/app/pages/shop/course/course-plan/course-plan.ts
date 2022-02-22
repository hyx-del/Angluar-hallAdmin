import { Component, OnInit,ViewChild} from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import * as dayjs from 'dayjs';
import { HallService, MemberService } from '@/providers/index';

import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import * as zhCn from "@fullcalendar/core/locales/zh-cn";
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { arrayToHash } from '@fullcalendar/core/util/object';


enum CourseType {
    group = 1,
    private,
    company
}

@Component({
    selector: 'app-course-plan',
    templateUrl: './course-plan.html',
    styleUrls: ['./course-plan.scss']
})
export class CoursePlanComponent implements OnInit {

    public buttons: any[] = [
        { name: 'create', label: "排团课", click: () => this.showModal() },
        { label: "添加企业课记录", click: () => this.showCompanyRecordModal() },
        { label: "添加私教课记录", click: () => this.showPrivateRecordModal() },

    ];
    isVisible: boolean = false;
    detailVisible: boolean = false

    collection: any = {};

    form: nyForm;
    detailForm: nyForm;

    params: any = {};
    classroomList: any[] = [];
    courseList: any[] = [];
    classroomListCopy: any[] = [];
    courseListCopy: any[] = [];
    coachList: any[] = [];

    cycleData: any[] = [
        { label: "星期一", value: 1 },
        { label: "星期二", value: 2 },
        { label: "星期三", value: 3 },
        { label: "星期四", value: 4 },
        { label: "星期五", value: 5 },
        { label: "星期六", value: 6 },
        { label: "星期日", value: 0 },
    ]

    partSubmit: boolean = false;
    currentHall: any = {};
    dateType: number = 1;
    dateCycle: any[] = [{}];
    maxNumber: number = 0;
    courseTagsList: any[] = [];
    options:any;
    cardId: Map<any, any> = new Map();
    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private modalService: NzModalService,
        private hallService: HallService,
        private memberService: MemberService,

    ) { }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getMemberList(value, true);
        })
        this.currentHall = this.hallService.getCurrentHall();
        this.getClassroomList();
        this.getCourseList();
        this.getCoachByCourse();
        if (!this.courseTagsList.length) {
            this.getCourseTags();
        }
        // 自定义按钮
        this.options={
            columnHeaderHtml:(e)=>{
                let month = e.getMonth();
                let day = e.getDate();
                let week = e.getDay();
                let Day = ['周日','周一','周二','周三','周四','周五','周六'];
                //let a = this.calendar.getApi();
                if(this.calendar){
                    let calendar = this.calendar.getApi();
                   if(calendar.view.type==="dayGridMonth"){
                       return `<span class="weekfont">${Day[week]}</span>`
                   }else{
                       return `<span class="my-but"></span><b class="weekfont">${month + 1}月${day}日${Day[week]}</b>`;
                   }
                }else{
                    return `<span class="my-but"></span><span class="weekfont">${month + 1}月${day}日&nbsp;&nbsp;${Day[week]}</span>`;
                }  
            }
        }
       

    }
    // 周月
    calendarPlugins = [dayGridPlugin] // 设置显示的格式 timeGridPlugin
    calendarWeekends = true;
    limitText = "更多课程";
    moreIsVisible = false;
    moreDate: any = [];
    moreList: any = [];
    active = true;
    zhCn = zhCn;
    events = [];
    defaultView = 'dayGridWeek'
    @ViewChild("calendar") calendar:FullCalendarComponent;
    
    listShow() {
        this.active = false;
    }
    showWeek() {
        this.active = true;
    }

    public getEvents = (e, callback) => {
        if(this.collection.params){
            this.getWeekDate(e, callback);
        }else{
            let time = setInterval(()=>{
                if(this.collection.params){
                    this.getWeekDate(e, callback);
                    clearInterval(time);
                }
            },50)
        }
       
    }

    // 获取周数据
    getWeekDate(date: any, callback) {
        let start_time = dayjs(date.start).format("YYYY-MM-DD");
        let start_end = dayjs(date.end).format("YYYY-MM-DD");
        this.getweekMonth({start_time, start_end}, callback)
        this.collection.onLoad = () => {
            this.getweekMonth({start_time, start_end})
        }
    }

    // 获取周月数据
    getweekMonth(date, callback?) {
        let newParams = this.collection.params;
        let Arr = []
        newParams.forEach(item=>{
          let index = item.indexOf('start_at');
          if(index==-1){
              Arr.push(item)
          }else{
            item.forEach(item2=>{
                if(Array.isArray(item2)){
                    Arr.push(["start_at","in",[date.start_time,date.start_end]])
                }
            })
          }
        })
   
        let eventDate = [];
        let params: any = {
            action: "query",
            fields: ["classroom.name|classroom_name", "course.name|course_name", "course.type|course_type", "coach.name|coach_name", "max_order", "status"],
            params: Arr,
        }
        this.http.post('hall/course/admin-hall/course-plan/list', params).then(res => {
            let colors = ['#1890ff', '#FEE1DD', '#DADEF0', '#CFECFF'];
            this.moreDate = res;
            
            let newDate = res.filter(item=>{
                return item.status !== -1
            })
            newDate.forEach(item => {
                eventDate.push({
                    title: '',
                    start: item.date,
                    end_time: item.end_time,
                    start_time: item.start_time,
                    coach_name: item.coach_name,
                    status:item.status,
                    _id:item.id,
                    course_name:item.course_name,
                    backgroundColor: colors[item.type],
                    id: item.date,
                    textColor:"rgba(0,0,0,0.65)"
                });
            })
       
            if(callback){
                this.calendar.getApi().removeAllEvents()
                callback(eventDate)   
            }else{
                let calendar = this.calendar.getApi()
                calendar.removeAllEvents();
                calendar.addEventSource(eventDate)
            }  
        })
    }

    // 自定义模板
    eventRender(e) {
        let extendedProps = e.event.extendedProps;
            e.el.innerHTML = '<div>'
                            if (extendedProps.status === 0){
                                e.el.innerHTML+='<p style="margin: 0; text-align: center;color: rgba(0,0,0,0.45);">'+extendedProps.course_name+'</p>'+
                                '<p style="margin: 0; text-align: center;color: rgba(0,0,0,0.45);">'+extendedProps.start_time+'-'+extendedProps.end_time+'</p>'+
                                '<p style="margin: 0; text-align: center; color: rgba(0,0,0,0.45);">'+extendedProps.coach_name+'</p>'+
                                 '<span class="unchecked"></span>';
                            }else{
                            e.el.innerHTML+='<p style="margin: 0; text-align: center">'+extendedProps.course_name+'</p>'+
                                '<p style="margin: 0; text-align: center">'+extendedProps.start_time+'-'+extendedProps.end_time+'</p>'+
                                '<p style="margin: 0; text-align: center">'+extendedProps.coach_name+'</p>';
                            }
                            e.el.innerHTML+='</div>';
    }
    // 月的按钮，事件
    datesRender(e){
        let tds = e.el.querySelectorAll("td.fc-day-top");
        Array.from(tds).forEach((td: Element) => {
            td.innerHTML = "<span class='icon'></span>" + td.innerHTML;
        })
        let  icons = e.el.querySelectorAll("td .icon");
        for (let i = 0; i < icons.length; i++) {
            icons[i].addEventListener('click',(e)=>{
                let parent = e.target.parentElement;
                let date = parent.getAttribute('data-date');
                this.showModal(date)
            })        
        }
       
        let mybtn = e.el.querySelectorAll(".fc-day-header .my-but");
        if(mybtn.length !==0){
            for (let i = 0; i < mybtn.length; i++) {
                mybtn[i].addEventListener('click',(e)=>{
                    let parent = e.target.parentElement.parentElement;
                    let date = parent.getAttribute('data-date');
                    this.showModal(date)
                })        
            }
        } 
    }
   
    // 点击月历的更多
    public eventLimitClick = (data) => {
        this.moreIsVisible = true;
        let Date = dayjs(data.date).format('YYYY-MM-DD')
        let newMoreDate = this.moreDate.filter(item => {
            return item.date == Date
        })
        this.moreList = newMoreDate
    }

    // 关闭对话框
    moreHandleCancel() {
        this.moreIsVisible = false;
    }

    moreHandleOk() {
        this.moreIsVisible = false;
    }

    // 详情
    details(item){
        this.showDetail(item);
        this.moreIsVisible = false
    }
    // 点击课程查看详情
    eventClick(model) {
        let item = {
            id:model.event.extendedProps._id
        }
        
        this.showDetail(item);
    }
    // 取消课程
    cancelCourse(item) {   
        this.cancelCoursePlan(item)
        this.showDetail(item)
        this.getEvents = (e, callback) => {
            this.getWeekDate(e, callback)
        }
    }
    

    showModal(date?) {
        this.form.setValue("date_type", 1);
        this.dateType = 1;
        this.maxNumber = 0;
        this.isVisible = true;
        this.recordParams = {};
        this.getCourseList();
        this.getCoachByCourse();
        this.dateCycle[0].date = date;

        if(this.currentHall.id == 58 || this.currentHall.id == 69) { // 判断是否是线上课
            this.classroom_type = '1'
        }else{
            this.classroom_type = '0'
        }
    }

    setCollection(collection) {
        this.collection = collection;

        // this.collection.onDblClick = (item) => this.showDetail(item);
        this.collection.onSetHeader = () => {
            this.collection.getHeader('course_name').click = (item) => this.showDetail(item);
        }

        this.collection.onInit = () => {
            let start_date = dayjs().startOf("month").format("YYYY-MM-DD");
            let end_date = dayjs().endOf("month").format("YYYY-MM-DD");
            this.collection.addWhere('start_at', [start_date, end_date], '=');
        }
      
    }

    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.action = "hall/course/admin-hall/course-plan/create";
        this.form.onSubmit = (body) => {
            body.type = CourseType.group; // 只能排团课
            
            if (this.partSubmit) {
                body.part_submit = true;
            }
            if (this.dateType == 1) { // 单日
                body.dates = this.dateCycle.filter(item => {
                    return item.date && item.start_time && item.end_time
                }).map(item => {
                    let data: any = {};
                    data.date = dayjs(item.date).format("YYYY-MM-DD");
                    data.start_time = dayjs(item.start_time).format("HH:mm");
                    data.end_time = dayjs(item.end_time).format("HH:mm");
                    return data;
                })
            } else if (this.dateType == 2) { // 周期
                if (body.start_date && body.start_date[0] && body.start_date[1]) {
                    let dateRange = body.start_date;
                    body.end_date = dayjs(dateRange[1]).format("YYYY-MM-DD");
                    body.start_date = dayjs(dateRange[0]).format("YYYY-MM-DD");
                }

                if (body.start_time) {
                    body.start_time = dayjs(body.start_time).format("HH:mm");
                }
                if (body.end_time) {
                    body.end_time = dayjs(body.end_time).format("HH:mm");
                }
            }
            if (!body.course_labels_id) {
                body.course_labels_id = [];
            }

            if(this.classroom_type == '1'){
                body.classroom_type = 1;
                body.classroom_id = 0;
            }else if(this.classroom_type == '0'){
                body.classroom_type = 0
            }

            if(!body.auditor_number){
                body.auditor_number = -1;
            }

            console.log("body", body);
        }
    }

    onFormBodyChange(change) {
        if(change.name == "course_id") {
            this.getCoachByCourse(change.value);
            this.setCourseMaxNumber();
            this.setMaxOrder();
        } else if (change.name == "classroom_id") {
            this.setCourseMaxNumber();
            this.setMaxOrder();
        } else if (change.name == "coach_id") {
            this.getCourseList(change.value);
        }
    }

    setCourseMaxNumber(isDetail: boolean = false) {
        let key: 'form' | 'detailForm' = "form";
        if (isDetail) {
            key = "detailForm";
        }
        let body = this[key].getBody();
        let course = this.courseList.find(item => item.id == body.course_id);
        let classroom = this.classroomList.find(item => item.id == body.classroom_id);
        if (body.course_id && body.classroom_id) {
            this.maxNumber = Math.min(course.max_number || 0, classroom.max_number || 0);
        } else if (body.course_id) {
            this.maxNumber = course.max_number;
        } else if (body.classroom_id) {
            this.maxNumber = classroom.max_number;
        }
    }

    setMaxOrder(isDetail: boolean = false) {
        if (isDetail) {
            // let body = this.detailForm.getBody();
            // if (body.max_order && body.max_order > this.maxNumber) {
                this.detailForm.setValue("max_order", this.maxNumber);
            // }
        } else {
            // let body = this.form.getBody();
            // if (body.max_order && body.max_order > this.maxNumber) {
                this.form.setValue("max_order", this.maxNumber);
            // }
        }
    }

    save() {
        this.form.submit().then(ret => {
            this.notification.success("提示信息", "创建成功")
            this.isVisible = false;
            this.collection.load();
            this.form.body = {};
            this.partSubmit = false;
            this.classroom_type = '0'
            this.dateCycle = [{}];
            this.getEvents = (e, callback) => {
                this.getWeekDate(e, callback)
            }
        }).catch((error) => {
            console.log("error", error)
            if (error.error && error.error.data) {
                if (Array.isArray(error.error.data)) {
                    this.confirmPartSubmit(error.error.data || []);
                }
            }
        })
    }

    addDateCycle() {
        this.dateCycle.push({});
    }

    removeDateCycle(index: number) {
        this.dateCycle.splice(index, 1);
    }

    confirmPartSubmit(data: Array<any>) {
        let content = "";
        let is_rest_err = false;
        let len = false;

        if(data.length == 1){
            len = true
        }

        data.forEach((item) => {
            content += `<div style="margin-bottom: 0;">${item.msg}</div>`;
            if(item.is_rest_err){
                is_rest_err = true;
            }
        });

        this.modalService.confirm({
            nzTitle: is_rest_err && len?"存在以下冲突，是否继续排课？":"排课存在以下冲突",
            nzContent: content,
            nzWidth: 520,
            nzCancelText:is_rest_err && len?'取消':null,
            nzOnOk: () => {
                if(is_rest_err && len){
                    this.partSubmit = true;
                    this.save();
                    return;
                }
            },
            nzOnCancel: () => {
                this.partSubmit = false;
            }
        })
    }

    onDetailFormInit() {
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.action = "hall/course/admin-hall/course-plan/update";
        this.detailForm.names = ["id"];

        this.detailForm.onSubmit = (body) => {
            if(body.classroom_type == 1){
                body.classroom_id = 0;
            }

            if(!body.auditor_number){
                body.auditor_number = -1
            }

            if (body.date) {
                body.date = dayjs(body.date).format("YYYY-MM-DD");
            }

            if (body.start_time) {
                body.start_time = dayjs(body.start_time).format("HH:mm");
            }
            if (body.end_time) {
                body.end_time = dayjs(body.end_time).format("HH:mm");
            }
     
        }
    }

    onDetailFormChange(change) {
        if(change.name == "course_id") {
            this.getCoachByCourse(change.value);
            this.setCourseMaxNumber(true);
            this.setMaxOrder(true);
        } else if (change.name == "classroom_id") {
            this.setCourseMaxNumber(true);
            this.setMaxOrder(true);
        } else if (change.name == "coach_id") {
            this.getCourseList(change.value);
        }
    }

    updateSave() {
        this.detailForm.submit().then((ret) => {
            this.notification.success("提示信息", "修改成功");
            this.collection.load();
            this.getEvents = (e, callback) => { 
                this.getWeekDate(e, callback)
            }
            if (ret && ret.has_queue) {
                this.modalService.info({
                    nzTitle: "提示信息",
                    nzContent: "当前排课存在排队情况，请手动处理转预约",
                    nzOnOk: () =>  {
                        this.detailVisible = false;
                    },
                });
            } else {
                this.detailVisible = false;
            }
        })
    }

    cancel() {
        this.isVisible = false;
        this.form.body = {};
        this.form.clearError();
        this.dateCycle = [{}];
        this.coachList = [];
        this.classroom_type = '0';

    }

    disabledDetail: boolean = false;
    showDetail(item: any) {
        this.classroom_type = '0';
        this.tabIndex = 0;
        this.disabledDetail = false;
        this.http.get("hall/course/admin-hall/course-plan/detail", { id: item.id }).then(ret => { 
            ret.date = ret.start_at;
            ret.start_time = dayjs(ret.start_at).toDate();
            ret.end_time = dayjs(ret.end_at).toDate();
            this.detailForm.body = { ...ret }
            this.params = ret;
            //console.log(ret);
            
            if(!(ret.auditor_number !== -1 && ret.classroom_type !== 0)){
                this.detailForm.body.auditor_number = null;
            }


            if (ret.status == 1 || ret.status == -1) {
                this.disabledDetail = true;
            }
            let course = this.courseListCopy.find(item =>item.id == ret.course_id);
            // 判断是否是线上课
            if(this.currentHall.id == 58 || this.currentHall.id == 69) {
                this.maxNumber = course.max_number || 0;
            }else {
                let classroom = this.classroomListCopy.find(item =>item.id == ret.classroom_id);
                if (course && classroom) {
                    this.maxNumber = Math.min(course.max_number || 0, classroom.max_number);
                }
            }

            this.detailVisible = true;
            this.isSetting = false;
            if (!this.courseCardListCopy.length) {
                this.getCourseCardList(true, ret.type);
            } else {
                if (ret.type == 1 || ret.type == 2) {  // 团课 私教课
                    this.courseCardList = this.courseCardListCopy.filter(card => card.course_type == ret.type).map(card => {
                        return Object.assign({}, card);
                    })
                } else { // 企业课 显示团课卡
                    this.courseCardList = this.courseCardListCopy.filter(card => card.course_type == 1).map(card => {
                        return Object.assign({}, card);
                    })
                }
                this.getCoursePlanSetting();
            }
            this.recordParams.type = ret.type;

            this.getCoachByCourse(ret.course_id);
            this.getCourseList(ret.coach_id);
        })
    }

    closeDetail() {
        this.detailVisible = false;
        this.detailForm.body = {};
        this.params = {};
        this.settingParams = {};
        this.isGetPriceSetting = false;
        this.cardId.clear();
    }

    replaceVisible: boolean;
    replaceParams: any = {};
    replace() {
        let params = Object.assign({ id: this.params.id }, this.replaceParams);
        this.http.post("hall/course/admin-hall/course-plan/replace-coach", params).then(ret => {
            this.notification.success("提示信息", "替课成功");
            this.detailForm.setValue("coach_id", params.replace_coach_id);
            this.params.coach_id = params.replace_coach_id;
            this.replaceVisible = false;
        })
    }

    showReplaceModal() {
        this.replaceParams = {};
        this.replaceVisible = true;
    }

    cancelReplace() {
        this.replaceVisible = false;
    }

    // 
    assistantVisible: boolean = false;

    showAssistantModal() {
        this.replaceParams = {
            assistants: this.detailForm.getValue("assistant") || [],
        };
        this.assistantVisible = true;
    }

    replaceAssistant() {
        let params = Object.assign({ id: this.params.id }, this.replaceParams);

        this.http.post("hall/course/admin-hall/course-plan/replace-assistants", params).then(() => {
            this.notification.success("提示信息", "替课助教成功");
            this.detailForm.setValue("assistant", params.assistants);
            this.params.assistant = params.assistants;
            this.assistantVisible = false;
        })
    }




    cancelCoursePlan(item: any) {
        this.http.post("hall/course/admin-hall/course-plan/cancel", { id: item.id }).then(() => {
            this.notification.success("提示信息", "取消成功");
            this.collection.load();
        })
    }

    getClassroomList() {
        let params: any = {
            "action": "query",
            "params": [
                ["status", "=", 1],
            ],
            "fields": ["name", "max_number", "support_group", "support_private"],
            "size": 50,
            "page": 1
        };
        this.http.post("hall/admin-hall/classroom/list", params).then(ret => {
            this.classroomList = ret.data || [];
            if (!this.classroomListCopy.length) {
                this.classroomListCopy = (ret.data || []).map(item => {
                    return item;
                })
            }
        })
    }

    refreshClassroomList() {
        if (this.disabledDetail) return ;
        this.getClassroomList();
    }

    getCourseList(coach_id?: number) {
        let params: any = {
            status: 1 // 启用的课程卡
        };
        if (coach_id) params.coach_id = coach_id;
        if (this.recordParams.type) {
            params.type = this.recordParams.type;
        } else {
            params.type = CourseType.group;
        }

        this.http.get("hall/course/admin-hall/course/get-list", params).then(data => {
            this.courseList = data || [];
            if (!this.courseListCopy.length) {
                this.courseListCopy = data.map(item => {
                    return item;
                })
            }
        })
    }

    getCourseTags() {
        let params: any = {
            action: "query",
            fields: ["name", "name_en", "status"],
            page: 1,
            params: [],
            size: 200,
        }
        this.http.post("hall/course/admin-hall/course-plan/course-label-list", params).then(ret => {
            this.courseTagsList = ret.data || [];
        })
    }

    getCoursePlanSetting() {
        let params = { course_plan_id: this.params.id };
        this.http.get("hall/course/admin-hall/course-plan/settlement/detail", params).then(ret => {
            if (ret) {
                this.isSetting = !!ret.is_setting;
                let checkCard = ret.settlements || [];
                
                if (checkCard && checkCard.length) {
                    let checkCardIds = checkCard.map(item => item.card_id);
                    this.courseCardList.forEach(card => {
                        if (checkCardIds.indexOf(card.id) >= 0) {
                            checkCard.forEach(item => {
                                if (item.card_id == card.id) {
                                    card.checked = true;
                                    card.amount = item.amount;
                                }
                            })
                        }
                    });
                }
            }
        })
    }

    courseCardList: any[] = [];
    courseCardListCopy: any[] = [];
    isSetting: boolean = false;
    tabIndex: number = 0;
    settingParams: any = {};
    isGetPriceSetting: boolean = false;
    tabChange(index) {
        if (index == 1 && this.detailVisible && !this.isGetPriceSetting) {
            this.isGetPriceSetting = true;
            this.getCoursePlanPriceSetting();
        }
    }

    getCourseCardList(isGetSetting = false, type: number = 1) {
        let params = {
            action: "query",
            params: [],
            fields: ["id", "name", "type", "general_type", "max_bind", "weight", "course_type", "status", "created_at"],
            // size: 50,
            // page: 1
        }
        this.http.post("hall/course/admin-hall/course-card/list", params).then(data => {
            this.courseCardList = [...data] || [];
            if (type == 1 || type == 2) {  // 团课 私教课
                this.courseCardList = (data || []).filter(card => card.course_type == type).map(card => {
                    return Object.assign({}, card);
                })
            } else { // 企业课 显示团课卡
                this.courseCardList = (data || []).filter(card => card.course_type == 1).map(card => {
                    return Object.assign({}, card);
                })
            }

            this.courseCardListCopy = (data || []).map(item => {
                return Object.assign({}, item);
            })
            if (isGetSetting) {
                this.getCoursePlanSetting();
            }
        })
    }

    getCoursePlanPriceSetting() {
        let params = {
            course_plan_id: this.params.id,
        }
        this.http.get("hall/course/admin-hall/course-plan/settlement/payment-price/detail", params).then((ret) => {
            this.settingParams = ret || {};
        })
    }

    saveSetting() {
        let params: any = {
            course_plan_id: this.params.id,
            is_setting: this.isSetting,
        }
        
        let data = this.courseCardList.filter(item => item.checked);
        data = data.map(item => {
            let currentData: any = { card_id: item.id };
            if (item.amount) {
                currentData.amount = item.amount;
            }
            return currentData;
        })
        params.settlements = data;
        this.http.post("hall/course/admin-hall/course-plan/settlement/save", params).then(() => {
            this.notification.success("提示信息", "保存成功");
            this.cardId.clear()
        }).catch(error => {
            const err = error.error.data
           
            for (const key in err) {
               let index = key.split('.')[1];
               this.cardId.set(data[index]["card_id"], true);     
            }
        })
    }

    clearStyle(ev){
        if(ev.amount || !ev.checked){
            this.cardId.delete(ev.id)
        }        
    }
    
    savePriceSetting() {
        let params: any = {
            course_plan_id: this.params.id,
            price: this.settingParams.price || "",
            balance_price: this.settingParams.balance_price || "",
        }
        if (this.settingParams.price === 0) {
            params.price = 0;
        }
        if (this.settingParams.balance_price === 0) {
            params.balance_price = 0;
        }

        this.http.post("hall/course/admin-hall/course-plan/settlement/payment-price/save", params).then(() => {
            this.notification.success("提示信息", "保存成功");
        })
    }

    refreshCourseTags() {
        this.getCourseTags();
    }

    getCoachByCourse(course_id?: number) {
        let params: any = {};
        if (course_id) {
            params.course_id = course_id;
        }
        this.http.get("hall/course/admin-hall/coach/get-list",  params).then(data => {
            this.coachList = data || [];
        })
    }

    refreshCoachList() {
        if (this.recordParams.type) {
            this.getCoachByCourse(this.recordParams.course_id);
        } else {
            let course_id = this.form.body.course_id || '';
            this.getCoachByCourse(course_id);
        }
    }

    refreshCourseList() {
        if (this.recordParams.type) {
            this.getCourseList(this.recordParams.coach_id);
        } else {
            let data = this.form.getBody();
            this.getCourseList(data.coach_id);
        }
    }

    // 企业课记录 
    recordVisible: boolean = false;
    recordParams: any = {};
    keyword: string = '';
    pageIndex: number = 1;
    searchChange$ = new Subject<any>();
    isLoading: boolean = false;
    haveMoreMember: boolean = false;

    payment: any = {};
    memberList: any[] = [];

    recordForm: nyForm;

    courseCardType: number = 1;

    showCompanyRecordModal() {
        this.clearFormData();
        this.recordVisible = true;
        this.recordParams.type = CourseType.company; // 企业课
        this.courseCardType = 1; // 次卡
        this.memberCourseCardList = [];
        this.getCourseList();
        this.getCoachByCourse();
        this.getMemberList('', true);
        // this.getCompanyMemberList();
    }

    showPrivateRecordModal() {
        this.clearFormData();
        this.recordVisible = true;
        this.recordParams.type = CourseType.private; // 私教课
        this.courseCardType = 1; // 次卡
        this.memberCourseCardList = [];
        this.getCourseList();
        this.getCoachByCourse();
        this.getMemberList('', true);
    }

    clearFormData() {
        this.recordForm.body = {};
        this.recordForm.clearError();
    }

    cancelAddRecorl() {
        this.recordVisible = false;
        this.recordParams = {};
        this.payment = {};
        this.courseCardType = 1;
        this.clearFormData();
    }

    courseChange(value) {
        this.getCoachByCourse(value);
        if (this.recordParams.member_id) {
            this.getMemberCourseCard();
        }
    }

    coachChange(value) {
        this.getCourseList(value);
    }

    // paymentMethodChange() {
    //     if (this.payment.course_card_id) {
    //         this.recordForm.setValue("payment.member_course_card_id", this.payment.course_card_id);
    //     }
        
    // }

    // getMemberPaymentList() {
    //     this.memberService.getMemberPaymentList().then(ret => {
    //         this.paymentOptions = ret.data || [];
    //     })
    // }

    getMemberList(name: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
        }
        if (name) {
            params.keyword = name;
        }

        this.http.post("hall/member/common/member/list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
            if (isSearch) {
                this.memberList = ret.data || [];
            } else {
                this.memberList = this.memberList.concat(ret.data || []);
            }
            if (ret.last_page > ret.current_page) {
                this.haveMoreMember = true;
            } else {
                this.haveMoreMember = false;
            }
            this.isLoading = false;
            this.pageIndex = ret.current_page;
        })
    }

    getCompanyMemberList() {
        this.http.post("hall/member/admin-hall/company/list").then(data => {
            this.memberList = data;
        })
    }

    memberCourseCardList: any[] = [];
    onMemberChange() {
        this.getMemberCourseCard();
    }
    getMemberCourseCard() {
        if (!this.recordParams.course_id) return ;
        let params = {
            member_id: this.recordParams.member_id,
            course_id: this.recordParams.course_id,
        };
        this.http.get("hall/course/admin-hall/course-plan-order/member-course-cards-available", params).then(data => {
            this.payment.course_card_id = null;
            this.recordForm.setValue("payment.member_course_card_id", null);
            this.memberCourseCardList = data || [];
        })
    }
    
    onSearch(value: string): void {
        this.isLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    loadMore() {
        if (this.isLoading || !this.haveMoreMember) {
            return ;
        }
        this.pageIndex += 1;
        this.isLoading = true;
        this.getMemberList(this.keyword);
    }

    courseCardChange(e) {
        if (this.payment.course_card_id) {
            let currentCard = this.memberCourseCardList.find(item => item.id == this.payment.course_card_id);
            if (currentCard) {
                this.courseCardType = currentCard.type;
            }
        }
    }

    onRecordFormInit() {
        this.recordForm.request = this.http.request.bind(this.http);
        this.recordForm.action = "hall/course/admin-hall/course-plan/record";
        this.recordForm.onSubmit = (body) => {
            body.type = this.recordParams.type;
            if (body.date) {
                body.date = dayjs(body.date).format("YYYY-MM-DD");
            }
            if (body.start_time) {
                body.start_time = dayjs(body.start_time).format("HH:mm");
            }
            if (body.end_time) {
                body.end_time = dayjs(body.end_time).format("HH:mm");
            }
            body.payment = {
                total: body.total || 0,
            }
            
            if (this.courseCardType == 2) { //期限卡
                body.payment.total = 0;
            }
            body.pay_type = 1;
            body.payment.channel = 10; // 卡

            if (this.payment.course_card_id) {
                body.payment.member_course_card_id = this.payment.course_card_id;
                if (this.recordParams.type == CourseType.company) {
                    body.course_card_id = this.payment.course_card_id;
                }
            }
    
        }
    }

    saveRecord() {
        this.recordForm.submit().then(() => {
            this.notification.success("提示信息", "添加成功");
            this.recordVisible = false;
            this.recordParams = {};
            this.recordForm.body = {};
            this.collection.load();
            this.getEvents = (e, callback) => {
                this.getWeekDate(e, callback)
            }
        })
    }

    // 排课类型限制
    classroom_type:any = null;
    // classroom_type:any = 0;
    public isonLine = true;

    classroomTypeChange(ev){
        this.classroom_type = ev
        this.form.body.course_labels_id = null;
        this.form.body.max_order =null;

        if (this.dateType == 1) { 
            this.dateCycle = [{}];
        }else if(this.dateType == 2){ 
            this.form.body.end_date = null;
            this.form.body.start_date = null;
        }
        
        
    }
}
