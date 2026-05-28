export const PERMISSIONS: any = {
  admin: [
    "dashboard",
    "students",
    "teachers",
    "classes",
    "attendance",
    "fees",
    "timetable",
    "exams",
    "notifications",
    "communications",
    "events",
    "transport",
    "meal-plan",
    "gallery",
    "settings",
    "log-activity",
    "leaves",
    "enquiries"
  ],

  teacher: [
    "dashboard",
    "attendance",
    "timetable",
    "exams",
    "notifications",
    "communications",
    "events",
    "leaves",
    "enquiries",
    "fees"
  ],

  parent: [
    "dashboard",
    "parent-portal",
    "gallery",
    "meal-plan",
    "notifications",
    "communications",
    "fees"
  ]
};

export function canAccess(role: string, module: string) {
  return PERMISSIONS[role]?.includes(module);
}
