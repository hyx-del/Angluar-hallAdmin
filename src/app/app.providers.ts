import {
    FileService,
    CoachService,
    CourseService,
    MemberService,
    HandleResponse,
    FileUploadService
} from './providers/index';
import { PacService, GroupResolver } from './providers/permission'
import { HallService } from './providers/index'

import { MenuManager } from './global/menu'

export const providers: any[] = [
    FileService,
    CoachService,
    CourseService,
    MemberService,
    HandleResponse,
    FileUploadService,
    PacService,
    { provide: GroupResolver, useExisting: HallService },
    MenuManager
];
