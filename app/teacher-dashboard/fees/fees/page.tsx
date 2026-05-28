"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Modal from "@/components/common/Modal";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Protected from "@/components/common/Protected";
import { IndianRupee, Plus, Search, Filter, RefreshCw, User } from "lucide-react";

interface StudentFee {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    class: { name: string; section: string };
  };
  category: string;
  totalAmount: number;
  paidAmount: number;
  status: "Unpaid" | "Partial" | "Paid";
  dueDate: string;
}

export default function FeesPage() {
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    // Mocking fetch as backend API is not fully implemented yet for the new structure
    setTimeout(() => {
       setFees([
         {
           _id: "f1",
           studentId: { _id: "s1", firstName: "Aarav", lastName: "Patel", class: { name: "Nursery", section: "A" } },
           category: "Uniform Fee",
           totalAmount: 5000,
           paidAmount: 2000,
           status: "Partial",
           dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
         },
         {
           _id: "f2",
           studentId: { _id: "s2", firstName: "Riya", lastName: "Sharma", class: { name: "Jr. KG", section: "B" } },
           category: "Term 1 Tuition",
           totalAmount: 15000,
           paidAmount: 0,
           status: "Unpaid",
           dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
         },
       ]);
       setLoading(false);
    }, 500);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid": return <Badge variant="success">Paid</Badge>;
      case "Partial": return <Badge variant="warning">Partial</Badge>;
      case "Unpaid": return <Badge variant="error">Unpaid</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <Protected module="fees">
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <Breadcrumbs items={[{ label: "Fees" }]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              Student Fees
            </h1>
            <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Manage custom student fee assignments and payments</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 w-full md:w-auto h-12 md:h-10 text-base">
            <Plus className="w-5 h-5" />
            Assign Fee
          </Button>
        </div>

        {alert && (
          <Alert variant={alert.type as any} closable onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search student..." 
                className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-5 h-5 text-gray-400 hidden sm:block" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : fees.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium">No fees assigned</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fees.map((fee) => (
                    <tr key={fee._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                              {fee.studentId.firstName.charAt(0)}
                           </div>
                           <div>
                              <p className="font-semibold text-gray-800">{fee.studentId.firstName} {fee.studentId.lastName}</p>
                              <p className="text-sm text-gray-500">
                                {fee.studentId.class.name} - {fee.studentId.class.section}
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-700">{fee.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">₹{fee.totalAmount}</p>
                        {fee.paidAmount > 0 && <p className="text-sm text-green-600">Paid: ₹{fee.paidAmount}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${new Date(fee.dueDate) < new Date() && fee.status !== 'Paid' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                           {new Date(fee.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(fee.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Button variant="outline" className="px-3 py-1.5 text-sm">
                           Record Payment
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Protected>
  );
}
