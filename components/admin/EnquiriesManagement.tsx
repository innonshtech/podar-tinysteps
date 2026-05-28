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
import { Headset, Plus, Search, Calendar, Phone, User, Filter, RefreshCw, TrendingUp, CheckCircle, Clock } from "lucide-react";

interface Enquiry {
  _id: string;
  parentName: string;
  childName: string;
  age: number;
  phoneNumber: string;
  interestedClass: string;
  status: "New" | "Follow-up Pending" | "Converted" | "Rejected";
  followUpDate?: string;
  notes?: string;
  createdAt: string;
}

export default function EnquiriesManagement({ isAdmin = false }: { isAdmin?: boolean }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    parentName: "",
    childName: "",
    age: "",
    phoneNumber: "",
    interestedClass: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const url = statusFilter !== "All" ? `/api/enquiries?status=${statusFilter}` : `/api/enquiries`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch enquiries");
      const data = await res.json();
      setEnquiries(data.enquiries || []);
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
      };

      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create enquiry");
      
      setAlert({ type: "success", message: "Enquiry added successfully!" });
      setIsModalOpen(false);
      setFormData({
        parentName: "",
        childName: "",
        age: "",
        phoneNumber: "",
        interestedClass: "",
        notes: "",
      });
      fetchEnquiries();
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      fetchEnquiries();
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New": return <Badge variant="blue">New</Badge>;
      case "Follow-up Pending": return <Badge variant="warning">Follow-up Pending</Badge>;
      case "Converted": return <Badge variant="success">Converted</Badge>;
      case "Rejected": return <Badge variant="error">Rejected</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const stats = {
    total: enquiries.length,
    converted: enquiries.filter(e => e.status === "Converted").length,
    pending: enquiries.filter(e => e.status === "Follow-up Pending" || e.status === "New").length,
  };

  return (
    <Protected module="enquiries">
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <Breadcrumbs items={[{ label: "Dashboard", href: isAdmin ? "/dashboard" : "/teacher-dashboard" }, { label: "Enquiries" }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Headset className="w-6 h-6 text-blue-600" />
              </div>
              Enquiry Management
            </h1>
            <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Track and manage prospective admissions</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 w-full md:w-auto h-12 md:h-10 text-base">
            <Plus className="w-5 h-5" />
            Add Enquiry
          </Button>
        </div>

        {alert && (
          <Alert variant={alert.type as any} closable onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {/* Admin Insights KPI Cards */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium">Total Enquiries</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
               </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium">Converted</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.converted}</p>
               </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium">Pending Follow-ups</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
               </div>
            </div>
          </div>
        )}

        {/* Filters and List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search parent or child name..." 
                className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-5 h-5 text-gray-400 hidden sm:block" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Follow-up Pending">Follow-up Pending</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : enquiries.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <Headset className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium">No enquiries found</p>
                <p className="text-sm">Try adjusting your filters or add a new enquiry.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                    <th className="px-6 py-4">Parent & Child</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                              {enq.parentName.charAt(0)}
                           </div>
                           <div>
                              <p className="font-semibold text-gray-800">{enq.parentName}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" /> Child: {enq.childName} ({enq.age} yrs)
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                           <Phone className="w-4 h-4 text-gray-400" />
                           {enq.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-700">{enq.interestedClass}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                           <Calendar className="w-4 h-4 text-gray-400" />
                           {new Date(enq.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(enq.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <select 
                            value={enq.status}
                            onChange={(e) => updateStatus(enq._id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                         >
                            <option value="New">Mark New</option>
                            <option value="Follow-up Pending">Follow-up</option>
                            <option value="Converted">Converted</option>
                            <option value="Rejected">Rejected</option>
                         </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add Enquiry Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title="New Enquiry"
          size="md"
        >
          <form onSubmit={handleCreateEnquiry} className="space-y-5 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <Input 
                 label="Parent Name"
                 value={formData.parentName}
                 onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                 required
                 className="p-3" // larger touch target
               />
               <Input 
                 label="Child Name"
                 value={formData.childName}
                 onChange={(e) => setFormData({...formData, childName: e.target.value})}
                 required
                 className="p-3"
               />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <Input 
                 label="Child Age"
                 type="number"
                 value={formData.age}
                 onChange={(e) => setFormData({...formData, age: e.target.value})}
                 required
                 className="p-3"
               />
               <Input 
                 label="Phone Number"
                 type="tel"
                 value={formData.phoneNumber}
                 onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                 required
                 className="p-3"
               />
            </div>

            <Select 
              label="Interested Class"
              options={[
                { value: "Playgroup", label: "Playgroup" },
                { value: "Nursery", label: "Nursery" },
                { value: "Jr. KG", label: "Jr. KG" },
                { value: "Sr. KG", label: "Sr. KG" },
              ]}
              value={formData.interestedClass}
              onChange={(e) => setFormData({...formData, interestedClass: e.target.value})}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
              <textarea 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special requests or follow-up details..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-6 py-3">
                 Cancel
               </Button>
               <Button type="submit" disabled={isSubmitting} className="px-6 py-3">
                 {isSubmitting ? "Saving..." : "Save Enquiry"}
               </Button>
            </div>
          </form>
        </Modal>

      </div>
    </Protected>
  );
}
