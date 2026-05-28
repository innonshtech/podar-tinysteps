export const FEATURE_FLAGS = {
  // Required Modules for TinySteps ERP
  dashboard: true,
  attendance: true,
  events: true,
  communications: true, // Bulk Email
  fees: true,
  enquiries: true,

  // Feature Flagged (Disabled) Modules
  classes: false,
  students: false,
  teachers: false,
  timetable: false,
  exams: false,
  leaves: false,
  transport: false,
  gallery: true, // keeping gallery enabled as it pairs with Events & Photos
  settings: true,
};

/**
 * Helper to check if a specific module is enabled.
 * Default is false for unlisted modules to ensure safety.
 */
export const isModuleEnabled = (moduleName: string): boolean => {
  return FEATURE_FLAGS[moduleName as keyof typeof FEATURE_FLAGS] ?? false;
};
