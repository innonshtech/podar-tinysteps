"use client";
import React, { useState, useEffect } from "react";
import { Search, Eye, IndianRupee, AlertCircle, CheckCircle2, Clock, Filter, X, User, Share2, Copy, Send, Check } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

interface StudentFeeCategory {
  _id: string;
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "Paid" | "Partial" | "Unpaid";
  dueDate: string;
}

interface StudentFeeData {
  student: {
    _id: string;
    firstName: string;
    lastName?: string;
    admissionNo?: string;
    classId?: { _id: string; name: string; section: string };
  };
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  categories: StudentFeeCategory[];
  status: "paid" | "partial" | "due";
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  upiId: string;
  upiName: string;
}

export default function StudentFeeManagement() {
  const [students, setStudents] = useState<StudentFeeData[]>([]);
  const [totalClassStudents, setTotalClassStudents] = useState(0);
  const [classes, setClasses] = useState<{ _id: string; name: string; section: string }[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [selectedStudent, setSelectedStudent] = useState<StudentFeeData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFeeId, setPaymentFeeId] = useState<string>("");
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    paymentMethod: "Cash",
    paymentNote: "",
  });

  useEffect(() => {
    fetchClasses();
    fetchStudentFees();
    fetchBankDetails();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) setClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchStudentFees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fees/student-summary");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setTotalClassStudents(data.totalClassStudents || 0);
        
        // Extract unique categories for filter dropdown
        const categories = new Set<string>();
        data.students.forEach((s: StudentFeeData) => {
          s.categories.forEach(c => categories.add(c.categoryName));
        });
        setUniqueCategories(Array.from(categories));
      }
    } catch (error) {
      showToast.error("Failed to fetch student fees");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const res = await fetch("/api/fees/bank-details");
      const data = await res.json();
      if (data.success) {
        setBankDetails(data.bankDetails);
        setSchoolName(data.schoolName);
      }
    } catch (error) {
      console.error("Failed to fetch bank details", error);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentFeeId) return;

    try {
      const res = await fetch(`/api/fees/studentfee/${paymentFeeId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const data = await res.json();
      if (data.success) {
        showToast.success(data.message || "Payment recorded");
        setShowPaymentModal(false);
        fetchStudentFees(); // Refresh data
      } else {
        showToast.error(data.error || data.message || "Failed to record payment");
      }
    } catch (error) {
      showToast.error("Failed to record payment");
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleShareWhatsApp = (student: StudentFeeData) => {
    if (!bankDetails) return;
    
    // Construct message
    const amountStr = student.totalPending > 0 ? `Please note that ₹${student.totalPending} is pending for fee categories.` : "";
    const msg = `Hello from ${schoolName},\n\nHere are our official bank details for fee payments:\n\n*Bank Account*\nName: ${bankDetails.accountName}\nA/c No: ${bankDetails.accountNumber}\nIFSC: ${bankDetails.ifscCode}\nBank: ${bankDetails.bankName}\n\n*UPI Details*\nUPI ID: ${bankDetails.upiId}\nName: ${bankDetails.upiName}\n\n${amountStr}\nThank you!`;
    
    const encodedUrl = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encodedUrl}`, "_blank");
  };

  const filteredStudents = students.filter((studentData) => {
    const student = studentData.student;
    const fullName = `${student.firstName} ${student.lastName || ""}`.toLowerCase();
    
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === "all" || student.classId?._id === selectedClass;
    const matchesStatus = selectedStatus === "all" || studentData.status === selectedStatus;
    
    const matchesCategory = selectedCategory === "all" || 
      studentData.categories.some(c => c.categoryName === selectedCategory);

    return matchesSearch && matchesClass && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "success" | "warning" | "danger" } = {
      paid: "success",
      partial: "warning",
      due: "danger",
    };
    return variants[status] || "info";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalStats = {
    totalStudents: totalClassStudents, // Real count from API
    totalDue: students.reduce((sum, s) => sum + s.totalDue, 0),
    totalPaid: students.reduce((sum, s) => sum + s.totalPaid, 0),
    totalPending: students.reduce((sum, s) => sum + s.totalPending, 0),
    paidCount: students.filter((s) => s.status === "paid").length,
    partialCount: students.filter((s) => s.status === "partial").length,
    dueCount: students.filter((s) => s.status === "due").length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Student Fee Management</h1>
        <p className="text-gray-600 mt-1">Track and collect extra fees (uniform, activity, etc.) for your class</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Total Students</p>
              <p className="text-4xl font-bold text-blue-600">{totalStats.totalStudents}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalPaid)}</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium mb-2">Total Pending</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalStats.totalPending)}</p>
            </div>
            <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Payment Status</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{totalStats.paidCount} Paid</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{totalStats.partialCount} Partial</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{totalStats.dueCount} Due</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - Section {cls.section}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categories Assigned</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Fee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <Clock className="w-6 h-6 animate-spin mr-2" />
                      Loading student fees...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No students found matching your filters
                  </td>
                </tr>
              ) : (
                filteredStudents.map((studentData) => {
                  const student = studentData.student;
                  return (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {student.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {student.firstName} {student.lastName || ""}
                            </div>
                            <div className="text-sm text-gray-500">{student.admissionNo} | {student.classId?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {studentData.categories.length === 0 ? (
                            <span className="text-sm text-gray-400">None</span>
                          ) : (
                            studentData.categories.map((cat, i) => (
                              <div 
                                key={i} 
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200 truncate cursor-pointer hover:bg-gray-200"
                                title={`Pending: ${formatCurrency(cat.pendingAmount)}`}
                                onClick={() => {
                                  if (cat.pendingAmount > 0) {
                                    setPaymentFeeId(cat._id);
                                    setPaymentData({ amountPaid: cat.pendingAmount, paymentMethod: "Cash", paymentNote: "" });
                                    setShowPaymentModal(true);
                                  }
                                }}
                              >
                                {cat.categoryName}
                                {cat.pendingAmount > 0 && <span className="ml-1 text-red-500 font-bold">•</span>}
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {formatCurrency(studentData.totalDue)}
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-600">
                        {formatCurrency(studentData.totalPaid)}
                      </td>
                      <td className="px-6 py-4 font-medium text-red-600">
                        {formatCurrency(studentData.totalPending)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusBadge(studentData.status)} size="sm">
                          {studentData.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(studentData);
                              setShowShareModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium whitespace-nowrap"
                            title="Share Payment Details"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share Bank
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal (Individual Category) */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Fee Payment"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
            <input
              type="number"
              value={paymentData.amountPaid}
              onChange={(e) => setPaymentData({ ...paymentData, amountPaid: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <textarea
              value={paymentData.paymentNote}
              onChange={(e) => setPaymentData({ ...paymentData, paymentNote: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Save Payment</Button>
          </div>
        </div>
      </Modal>

      {/* Share Bank Details Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Payment Details for ${selectedStudent?.student.firstName}`}
        size="md"
      >
        {!bankDetails || (!bankDetails.accountNumber && !bankDetails.upiId) ? (
          <div className="p-6 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Bank Details Found</h3>
            <p className="text-sm">Please ask the admin to configure bank details in School Settings first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedStudent && selectedStudent.totalPending > 0 && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 flex justify-between items-center">
                <span className="font-medium text-sm">Pending Amount:</span>
                <span className="font-bold text-lg">{formatCurrency(selectedStudent.totalPending)}</span>
              </div>
            )}

            {/* Bank Transfer Box */}
            {bankDetails.accountNumber && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">Bank Transfer</div>
                <div className="p-4 space-y-3">
                  {[
                    { label: "Account Name", value: bankDetails.accountName },
                    { label: "Account No.", value: bankDetails.accountNumber },
                    { label: "IFSC Code", value: bankDetails.ifscCode },
                    { label: "Bank Name", value: bankDetails.bankName },
                  ].map((field, idx) => (
                    field.value && (
                      <div key={idx} className="flex justify-between items-center group">
                        <div>
                          <p className="text-xs text-gray-500">{field.label}</p>
                          <p className="font-medium text-gray-800">{field.value}</p>
                        </div>
                        <button 
                          onClick={() => handleCopy(field.value, field.label)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {copiedField === field.label ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* UPI Box */}
            {bankDetails.upiId && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">UPI Payment</div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center group">
                    <div>
                      <p className="text-xs text-gray-500">UPI ID</p>
                      <p className="font-medium text-gray-800 text-lg">{bankDetails.upiId}</p>
                      <p className="text-sm text-gray-500">{bankDetails.upiName}</p>
                    </div>
                    <button 
                      onClick={() => handleCopy(bankDetails.upiId, "UPI")}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {copiedField === "UPI" ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                className="w-full flex justify-center items-center gap-2"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </Button>
              <Button 
                className="w-full flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white border-transparent"
                onClick={() => handleShareWhatsApp(selectedStudent!)}
              >
                <Send className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
