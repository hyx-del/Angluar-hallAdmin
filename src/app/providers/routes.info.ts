type Route = {
    label: string,
    name: string,
    group?: string,
    actions?: {
        [action: string]: Action
    }
}

type Action = {
    name: string
    label: string
    group?: string,
}

type RoutesInfo = {
    [path: string]: Route
}

export const ROUTES_INFO: RoutesInfo = {
    '/headquarters/venue-home': {
        name: 'hall.hall.list', label: '会馆管理'
    },
    '/headquarters/business-statistics': {
        name: 'hall.business-statistical', label: '营业统计'
    },
    '/headquarters/business-analysis': {
        name: 'hall.business-analysis', label: '营业分析'
    },
    '/member/member-manage': {
        name: 'member.basic.list', label: '会员管理'
    },
    '/member/member-source': {
        name: 'member.source.list', label: '会员来源'
    },
    '/member/recharge-specs': {
        name: 'hall.charge-spec.list', label: '充值规格'
    },
    '/member/course-card': {
        name: 'member.member-course-card.list', label: '会员课程卡'
    },
    '/headquarters/course/course-manage': {
        name: 'course.course.list', label: '课程管理'
    },
    '/headquarters/course/course-card': {
        name: 'course.course-card.list', label: '课程卡管理'
    },
    '/headquarters/coach/coach-manage': {
        name: 'course.coach.list', label: '教练管理'
    },
    '/headquarters/coach/coach-limit': {
        name: 'course.coach.set-class-time-limit', label: '课时限制设置'
    },
    '/headquarters/course/schedule': {
        name: 'course.course-plan.list', label: '课表'
    },
    '/headquarters/auxiliary/coach-group': {
        name: 'course.groups.list', label: '教练组'
    },
    '/headquarters/auxiliary/body': {
        name: 'member.body-indicator-template.list', label: '体测项目'
    },
    '/headquarters/auxiliary/payment-mode': {
        name: 'hall.payment-mode.list', label: '支付方式'
    },
    '/headquarters/course/tags': {
        name: 'course.label.list', label: '课程标签管理'
    },
    '/headquarters/auxiliary/comment-tags': {
        name: 'hall.comment-tag.list', label: '评价标签'
    },
    '/workers/staff-manage': {
        name: 'staff.manage.list', label: '员工管理'
    },
    '/workers/role-manage': {
        name: 'staff.role.list', label: '角色'
    },
    '/member/all-member-manage': {
        name: 'member.member.list', label: '会员管理'
    },
    '/member/short-message-log': {
        name: 'member.sms.send-detail', label: '短信发送记录'
    },
    '/member/coupon': {
        name: 'coupon.coupon.list', label: '优惠券管理'
    },
    '/member/member-coupon': {
        name: 'coupon.member-coupon.list', label: '会员优惠券'
    },
    // '/member/member-promotion': {
    //     name: 'member.promotion.list', label: '梵音——红促宝活动'
    // },
    '/cms/article-manage': {
        name: 'cms.material.list', label: '素材管理'
    },
    '/cms/category': {
        name: 'cms.material-category.list', label: '分组管理'
    },
    '/cms/collection': {
        name: 'cms.collection.list', label: '集合管理'
    },
    '/cms/setting/banner': {
        name: 'cms.app.banner.get', label: 'banner管理'
    },
    '/video/video-manage': {
        name: 'video.video.list', label: '视频管理'
    },
    '/video/library': {
        name: 'video.data.list', label: '视频库'
    },
    '/video/school': {
        name: 'video.genre.list', label: '视频流派'
    },
    '/video/position': {
        name: 'video.position.list', label: '体位类别'
    },
    '/video/category': {
        name: 'video.category.list', label: '视频分类'
    },
    '/video/coach-manage': {
        name: 'video.coach.list', label: '教练管理'
    },
    '/video/member': {
        name: 'video.member.list', label: '会员管理'
    },
    '/video/order': {
        name: 'video.member.recharge.orders', label: '充值订单'
    },
    '/video/recharge-specs': {
        name: 'video.recharge-specs.list', label: '充值规格'
    },
    '/video/comment': {
        name: 'video.comment.list', label: '留言管理'
    },
    '/video/show-setting': {
        name: 'video.about.article.list', label: '文章管理'
    },
    '/city/schedule': {
        name: 'course.course-plan.list', label: '课表', group: 'city'
    },
    '/city/settlement-setting': {
        name: 'course.coach.group-list', label: '课程结算设置', group: 'city'
    },
    '/city/apply-order': {
        name: 'member.member-course-card-purchase.list', label: '开卡申请订单', group: 'city'
    },
    '/city/transform-apply': {
        name: 'member.member-course-card-transform-apply.list', label: '转卡申请', group: 'city'
    },
    '/city/coach/coach-manage': {
        name: 'course.coach.list', label: '教练管理', group: 'city'
    },
    '/city/score-statistice': {
        name: 'hall.coach.score-statistics', label: '教练评分统计', group: 'city'
    },
    '/city/course-comments': {
        name: 'hall.comment.reply', label: '上课评价', group: 'city'
    },
    '/city/business-statistics': {
        name: 'hall.business-statistical', label: '营业统计', group: 'city'
    },
    '/city/course-feee-statistics': {
        name: 'course.course-fee-statistics', label: '课时费统计', group: 'city'
    },
    '/city/business-analysis': {
        name: 'hall.business-analysis', label: '营业分析', group: 'city'
    },
    '/city/hall/staff-manage': {
        name: 'staff.role.list', label: '员工', group: 'city'
    },
    '/city/hall/role-manage': {
        name: 'staff.manage.list', label: '角色', group: 'city'
    },
    '/city/staff-file': {
        name: 'salary.staff-profile.list', label: '员工档案', group: 'city'
    },
    '/city/salary-sheet': {
        name: 'salary.staff-payroll.list', label: '工资条', group: 'city'
    },
    '/shop/dashboard': {
        name: 'course.workbench.course-plan', label: '工作台', group: 'hall'
    },
    '/shop/course/course-plan': {
        name: 'course.course-plan.list', label: '排课', group: 'hall'
    },
    '/shop/business-statistics': {
        name: 'hall.business-statistical', label: '营业统计', group: 'hall'
    },
    '/shop/member/member-manage': {
        name: 'member.basic.list', label: '会员管理', group: 'hall'
    },
    '/shop/member/course-card': {
        name: 'member.member-course-card.list', label: '会员课程卡', group: 'hall'
    },
    '/shop/member/open-card-order': {
        name: 'member.member-course-card-purchase.list', label: '开卡订单', group: 'hall'
    },
    '/shop/course-comments': {
        name: 'hall.comment.comments', label: '上课评价', group: 'hall'
    },
    '/shop/suggest': {
        name: 'hall.suggestion.suggestions', label: '投诉建议', group: 'hall'
    },
    '/shop/hall/staff-manage': {
        name: 'staff.role.list', label: '员工', group: 'hall'
    },
    '/shop/hall/role-manage': {
        name: 'staff.manage.list', label: '角色', group: 'hall'
    },
    '/shop/coach/coach-manage': {
        name: 'course.coach.list', label: '教练', group: 'hall'
    },
    '/shop/course/course-manage': {
        name: 'course.course.list', label: '课程', group: 'hall'
    },
    '/shop/course/course-card': {
        name: 'course.course-card.list', label: '课程卡', group: 'hall'
    },
    '/shop/hall/info': {
        name: 'hall.hall.detail', label: '场馆信息', group: 'hall'
    },
    '/shop/hall/classroom-home': {
        name: 'hall.classroom.list', label: '教室管理', group: 'hall'
    },
    '/shop/presell/activity': {
        name: 'presell.activity.list', label: '预售活动', group: 'hall'
    },
    '/shop/presell/order': {
        name: 'presell.order.list', label: '预售订单', group: 'hall'
    },
    '/shop/business-analysis': {
        name: 'hall.business-analysis', label: '营业分析', group: 'hall'
    },
    '/video/business-statistics': {
        name: 'video.member.business-statistical', label: '营业统计'
    },
    '/headquarters/auxiliary/specs-category': {
        name: 'course.course-card.spec-category.list', label: '规格类别',
    },
    '/video/consumption': {
        name: 'video.member.expenses-record', label: '消费记录',
    },
    '/shop/member/consume-statistics': {
        name: 'member.consumption.statistics', label: '会员消费统计', group: 'hall'
    },
    '/city/sales-commission-rule': {
        name: 'hall.sales-commission-rule.detail', label: '提成规则设置', group: 'city'
    },
    '/shop/sales-performance-staistics': {
        name: 'hall.sales-performance-statistics', label: '销售业绩统计', group: 'hall'
    },
    '/city/shop-commission': {
        name: 'hall.sales-commission-rule.detail', label: '门店提成规则设置', group: 'city'
    },
    '/shop/hall-manage': {
        name: 'staff.manage.getManagerList', label: '提成规则管理', group: 'hall'
    },
    '/shop/hall-commission-statistics': {
        name: 'hall.sales-performance-statistics.manager-statistics', label: '店长提成统计', group: 'hall'
    },
    
    '/city/coach-payroll': {
        name: 'course.coach-salary.statistics', label: '教练工资单', group: 'city'
    },
    '/video/adjust-log':{
        name: 'video.member.adjust-log', label: '余额调整记录'
    },
    '/city/recede-apply': {
        name: 'member.member-course-card.refund.order-list', label: '退卡申请',group: 'city'
    },
    '/shop/staff-file': {
        name: 'salary.staff-profile.list', label: '员工档案', group: 'hall'
    },
    '/shop/salary-sheet': {
        name: 'salary.staff-payroll.list', label: '工资条', group: 'hall'
    },

    '/member/price-adjust': {
        name: 'member.member-course-card.unit-price-change.list', label: '单价调整申请'
    },
    '/video/audio-manage': {
        name: 'video.audio.list', label: '音频管理'
    },
    '/video/audio-library': {
        name: 'video.audio-data.list', label: '音频库'
    },
    '/video/audio-category': {
        name: 'video.audio-category.list', label: '音频分类'
    },
    '/member/dianPing':{
        name: 'member.query-source.DP-list', label: '大众点评'
    },
    '/member/headquarters-service': {
        name: 'member.query-source.HQDP-list', label: '总部客服',
    },
    '/shop/business-order': {
        name: 'hall.business-order', label: '营业订单', group: 'hall'
    },
    '/headquarters/business-order': {
        name: 'hall.business-order', label: '营业订单'
    },
    '/city/surplus-value-apply': {
        name: 'member.member-course-card.surplus-value-adjust.apply-list', label: '剩余价值调整申请', group: 'city'
    },
    '/shop/data-upload': {
        name: 'hall.failed-push-list', label: '营业数据上传', group: 'hall'
    },
    
}
