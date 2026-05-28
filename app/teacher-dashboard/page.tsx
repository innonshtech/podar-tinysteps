"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Link from "next/link";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Bell,
  AlertCircle,
  School,
  UserCheck,
  IndianRupee,
  Headset,
  PartyPopper,
  Mail
} from "lucide-react";

interface TeacherStats {
  myStudents: number;
  todayAttendance: number;
  pendingFees: number;
  newEnquiries: number;
  upcomingEvents: number;
}

interface Class {
  _id: string;
  name: string;
  section: string;
  studentCount: number;
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: Date;
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [stats, setStats] = useState<TeacherStats>({
    myStudents: 0,
    todayAttendance: 0,
    pendingFees: 0,
    newEnquiries: 0,
    upcomingEvents: 0,
  });
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      const userRes = await fetch("/api/auth/profile");
      if (!userRes.ok) throw new Error(`userRes failed`);
      const userData = await userRes.json();
      setTeacherInfo(userData.user);

      if (!userData.user || userData.user.role !== "teacher") {
        setAlert({ type: "error", message: "Unauthorized access" });
        return;
      }

      const teacherId = userData.user.id;

      const classRes = await fetch(`/api/classes?teacherId=${teacherId}`);
      let teacherClasses: Class[] = [];
      if (classRes.ok) {
        const classData = await classRes.json();
        teacherClasses = classData.classes || [];
      }
      setMyClasses(teacherClasses);

      const classIds = teacherClasses.map((c: Class) => c._id);
      let myStudents = 0;
      let todayAttendance = 0;

      if (classIds.length > 0) {
        const studentRes = await fetch(`/api/students?classIds=${classIds.join(",")}&limit=1000`);
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          myStudents = (studentData.students || studentData.data || []).length;
        }

        const today = new Date().toISOString().split("T")[0];
        const attendanceRes = await fetch(`/api/attendance?date=${today}&classIds=${classIds.join(",")}&limit=1000`);
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          const todayAttendanceRecords = attendanceData.data || [];
          todayAttendance = todayAttendanceRecords.filter((a: any) => a.status === "present").length;
        }
      }

      // Mocking New Enquiries, Pending Fees, Upcoming Events until APIs are ready
      setStats({
        myStudents: myStudents,
        todayAttendance: todayAttendance,
        pendingFees: 12, // Mock
        newEnquiries: 3, // Mock
        upcomingEvents: 2, // Mock
      });

      setRecentActivities([
        {
          type: "communication",
          message: "Sent email to Class 1A Parents",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          type: "enquiry",
          message: "Follow-up required for Ananya's admission",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
      ]);

    } catch (error: any) {
      console.error("Failed to fetch teacher data:", error);
      setAlert({ type: "error", message: error.message || "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "communication":
        return <Mail className="w-4 h-4 text-blue-600" />;
      case "enquiry":
        return <Headset className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      {/* Header */}
      <div className="mt-4 md:mt-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {getTimeGreeting()}, {teacherInfo?.name || "Teacher"}!
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Overview of your daily operations</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm self-start">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
          </div>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type as any} closable onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Top Stats Cards */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <p className="text-green-700 text-xs md:text-sm font-semibold mb-2 uppercase tracking-wide">My Students</p>
            <p className="text-3xl md:text-4xl font-bold text-green-600">{stats.myStudents}</p>
          </div>
          <div className="mt-4 flex justify-end">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
             </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <p className="text-purple-700 text-xs md:text-sm font-semibold mb-2 uppercase tracking-wide">Attendance</p>
            <p className="text-3xl md:text-4xl font-bold text-purple-600">{stats.todayAttendance}</p>
          </div>
          <div className="mt-4 flex justify-end">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <UserCheck className="w-6 h-6 md:w-7 md:h-7 text-white" />
             </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <p className="text-red-700 text-xs md:text-sm font-semibold mb-2 uppercase tracking-wide">Pending Fees</p>
            <p className="text-3xl md:text-4xl font-bold text-red-600">{stats.pendingFees}</p>
          </div>
          <div className="mt-4 flex justify-end">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                <IndianRupee className="w-6 h-6 md:w-7 md:h-7 text-white" />
             </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <p className="text-blue-700 text-xs md:text-sm font-semibold mb-2 uppercase tracking-wide">New Enquiries</p>
            <p className="text-3xl md:text-4xl font-bold text-blue-600">{stats.newEnquiries}</p>
          </div>
          <div className="mt-4 flex justify-end">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Headset className="w-6 h-6 md:w-7 md:h-7 text-white" />
             </div>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <p className="text-yellow-700 text-xs md:text-sm font-semibold mb-2 uppercase tracking-wide">Upcoming Events</p>
            <p className="text-3xl md:text-4xl font-bold text-yellow-600">{stats.upcomingEvents}</p>
          </div>
          <div className="mt-4 flex justify-end">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                <PartyPopper className="w-6 h-6 md:w-7 md:h-7 text-white" />
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions (Tablet optimized) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/teacher-dashboard/attendance" className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-purple-100 bg-purple-50 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all active:scale-95">
                <CheckCircle2 className="w-10 h-10 text-purple-600" />
                <span className="text-base font-bold text-purple-900">Mark Attendance</span>
              </Link>
              <Link href="/teacher-dashboard/communications" className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-blue-100 bg-blue-50 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all active:scale-95">
                <Mail className="w-10 h-10 text-blue-600" />
                <span className="text-base font-bold text-blue-900">Send Email</span>
              </Link>
              <Link href="/teacher-dashboard/enquiries" className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-emerald-100 bg-emerald-50 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all active:scale-95">
                <Headset className="w-10 h-10 text-emerald-600" />
                <span className="text-base font-bold text-emerald-900">Add Enquiry</span>
              </Link>
            </div>
          </div>

          {/* Today's Class Summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                Today's Class Summary
              </h2>
            </div>
            {myClasses.length > 0 ? (
              <div className="space-y-4">
                {myClasses.slice(0, 3).map((cls) => (
                  <div key={cls._id} className="p-4 md:p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {cls.name} - Section {cls.section}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                          {cls.studentCount || 0} Students
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No classes assigned yet</p>
            )}
          </div>
          
          {/* Recent Enquiries & Upcoming Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Headset className="w-5 h-5 text-blue-600" />
                Recent Enquiries
              </h2>
              <div className="space-y-3">
                 <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="font-semibold text-gray-800">Aarav Patel (Nursery)</p>
                    <p className="text-sm text-gray-500 mt-1">Follow up on 12th Oct</p>
                 </div>
                 <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="font-semibold text-gray-800">Riya Sharma (Jr. KG)</p>
                    <p className="text-sm text-gray-500 mt-1">New enquiry</p>
                 </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-yellow-600" />
                Upcoming Events
              </h2>
              <div className="space-y-3">
                 <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="font-semibold text-gray-800">Diwali Celebration</p>
                    <p className="text-sm text-gray-500 mt-1">20th Oct • Campus</p>
                 </div>
                 <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="font-semibold text-gray-800">Parents Teacher Meet</p>
                    <p className="text-sm text-gray-500 mt-1">25th Oct • Classrooms</p>
                 </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side */}
        <div className="space-y-6">
          
          {/* Pending Fees */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900 text-lg">Pending Fees</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">You have {stats.pendingFees} students with pending fee dues.</p>
            <Link href="/fees" className="inline-block w-full text-center px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
              View Fee Details
            </Link>
          </div>

          {/* Follow-up Reminders */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900 text-lg">Follow-up Reminders</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-amber-100">
                 <div className="mt-0.5"><Headset className="w-4 h-4 text-amber-500"/></div>
                 <div>
                   <p className="text-sm font-semibold text-gray-800">Call Mrs. Verma</p>
                   <p className="text-xs text-gray-500">Regarding Aarav's admission</p>
                 </div>
              </li>
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-amber-100">
                 <div className="mt-0.5"><Mail className="w-4 h-4 text-amber-500"/></div>
                 <div>
                   <p className="text-sm font-semibold text-gray-800">Email Jr. KG Parents</p>
                   <p className="text-xs text-gray-500">Send Diwali event schedule</p>
                 </div>
              </li>
            </ul>
          </div>

          {/* Recent Communications */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Comm.
            </h2>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}