import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  employeeId: z.string().min(3, "Employee ID required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  role: z.enum(["SUPER_ADMIN","STATE_ADMIN","DISTRICT_ADMIN","MANDAL_ADMIN","VENUE_ADMIN","TEACHER","TRAINER","STAFF"]),
  district: z.string().optional(),
  mandal: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
});

export const programSchema = z.object({
  programName: z.string().min(3, "Program name required"),
  trainingYear: z.string().min(4, "Training year required"),
  department: z.string().min(2, "Department required"),
  district: z.union([z.string().min(1, "District required"), z.array(z.string()).min(1, "At least one district required")]),
  mandal: z.union([z.string().min(1, "Mandal required"), z.array(z.string()).min(1, "At least one mandal required")]),
  venue: z.union([z.string().min(1, "Venue required"), z.array(z.string()).min(1, "At least one venue required")]),
  serviceProvider: z.string().optional(),
  projectCoordinator: z.string().min(2, "Project coordinator name required"),
  venueIncharge: z.string().min(2, "Venue incharge person name required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  status: z.enum(["DRAFT","ACTIVE","COMPLETED","CANCELLED"]).default("DRAFT"),
  description: z.string().optional(),
  expectedParticipants: z.number().min(0).default(0),
});

export const venueSchema = z.object({
  name: z.string().min(3, "Venue name required"),
  address: z.string().min(10, "Full address required"),
  district: z.string().min(1, "District required"),
  mandal: z.string().min(1, "Mandal required"),
  contactPerson: z.string().min(2, "Contact person required"),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  infrastructure: z.object({
    classroomsCount: z.number().min(0).default(0),
    capacity: z.number().min(0).default(0),
    projectors: z.boolean().default(false),
    smartBoards: z.boolean().default(false),
    wifi: z.boolean().default(false),
    drinkingWater: z.boolean().default(true),
    diningHall: z.boolean().default(false),
    parking: z.boolean().default(false),
  }),
  accommodation: z.object({
    isResidential: z.boolean().default(false),
    acRooms: z.number().min(0).default(0),
    nonAcRooms: z.number().min(0).default(0),
    totalRooms: z.number().min(0).default(0),
    totalBeds: z.number().min(0).default(0),
    occupiedBeds: z.number().min(0).default(0),
    availableBeds: z.number().min(0).default(0),
  }),
});

export const participantSchema = z.object({
  employeeId: z.string().min(3, "Employee ID required"),
  name: z.string().min(2, "Name required"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile"),
  email: z.string().email().optional().or(z.literal("")),
  schoolName: z.string().optional(),
  designation: z.string().min(2, "Designation required"),
  category: z.enum(["SGT","SCHOOL_ASSISTANT","GOVERNMENT_TEACHER","HM","CRP","MEO","KRP","DRP","GUEST_FACULTY","SUBJECT_EXPERT","DEO_STAFF","SS_OFFICE_STAFF","VENUE_STAFF","SUPPORT_STAFF"]),
  district: z.string().min(1, "District required"),
  mandal: z.string().optional(),
  program: z.string().min(1, "Program required"),
  isResidential: z.boolean().default(false),
});

export const attendanceSchema = z.object({
  program: z.string().min(1, "Program required"),
  date: z.string().min(1, "Date required"),
  dayNumber: z.number().min(1),
  sgt: z.number().min(0).default(0),
  krp: z.number().min(0).default(0),
  drp: z.number().min(0).default(0),
  deoStaff: z.number().min(0).default(0),
  ssStaff: z.number().min(0).default(0),
  meo: z.number().min(0).default(0),
  hm: z.number().min(0).default(0),
  crp: z.number().min(0).default(0),
  others: z.number().min(0).default(0),
  remarks: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ProgramInput = z.infer<typeof programSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
