"use client";

import React, { useState } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Alert from "@/components/common/Alert";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Protected from "@/components/common/Protected";
import { Mail, Send, Paperclip, Users, AlertCircle, TrendingUp, Inbox } from "lucide-react";

export default function CommunicationsManagement({ isAdmin = false }: { isAdmin?: boolean }) {
  const [formData, setFormData] = useState({
    recipientGroup: "",
    subject: "",
    body: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);
    try {
      let recipients = [];
      if (formData.recipientGroup === "All Parents") recipients = ["parents@tinysteps.com"];
      if (formData.recipientGroup === "All Teachers") recipients = ["teachers@tinysteps.com"];
      if (formData.recipientGroup === "Nursery A") recipients = ["nursery_a_parents@tinysteps.com"];
      if (formData.recipientGroup === "Staff") recipients = ["staff@tinysteps.com"];

      if (recipients.length === 0) {
         throw new Error("Please select a valid recipient group");
      }

      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          subject: formData.subject,
          body: formData.body,
        }),
      });

      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.message || "Failed to send email");
      }

      setAlert({ type: "success", message: "Email sent successfully!" });
      setFormData({ recipientGroup: "", subject: "", body: "" });
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Protected module="communications">
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <Breadcrumbs items={[{ label: "Dashboard", href: isAdmin ? "/dashboard" : "/teacher-dashboard" }, { label: "Communications" }]} />

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-red-600" />
            </div>
            Bulk Communications
          </h1>
          <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Send bulk emails to parents, teachers, and staff</p>
        </div>

        {alert && (
          <Alert variant={alert.type as any} closable onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {/* Admin Insights */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Send className="w-6 h-6 text-red-600" />
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium">Emails Sent This Month</p>
                  <p className="text-2xl font-bold text-gray-800">1,245</p>
               </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-indigo-600" />
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-medium">Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-800">99.2%</p>
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                 <h2 className="text-lg font-bold text-gray-800">Compose Message</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> To (Recipient Group)
                  </label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    value={formData.recipientGroup}
                    onChange={(e) => setFormData({...formData, recipientGroup: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select a group...</option>
                    <option value="All Parents">All Parents</option>
                    <option value="All Teachers">All Teachers</option>
                    <option value="Nursery A">Nursery A (Parents)</option>
                    <option value="Staff">Support Staff</option>
                  </select>
                </div>

                <Input 
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                  placeholder="Enter email subject"
                  className="p-3"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Body</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[200px]"
                    value={formData.body}
                    onChange={(e) => setFormData({...formData, body: e.target.value})}
                    placeholder="Type your message here..."
                    required
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                   <Button type="button" variant="outline" className="flex items-center gap-2 w-full sm:w-auto px-4 py-3">
                     <Paperclip className="w-4 h-4" />
                     Attach Files
                   </Button>
                   <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700">
                     <Send className="w-4 h-4" />
                     {isSubmitting ? "Sending..." : "Send Message"}
                   </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-4">
                 <AlertCircle className="w-5 h-5 text-blue-600" />
                 <h3 className="font-bold text-blue-900 text-lg">Communication Tips</h3>
               </div>
               <ul className="space-y-3 text-sm text-blue-800 list-disc pl-5">
                 <li>Ensure subject lines are clear and concise.</li>
                 <li>Double check the recipient group before sending.</li>
                 <li>Avoid sending emails after 8 PM unless urgent.</li>
                 <li>Attachments must be less than 5MB.</li>
               </ul>
             </div>

             <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Recent Sends</h3>
                <div className="space-y-4">
                   <div className="pb-3 border-b border-gray-100">
                     <p className="font-semibold text-gray-800">Diwali Vacation Notice</p>
                     <div className="flex justify-between items-center mt-1">
                       <span className="text-xs text-gray-500">To: All Parents</span>
                       <span className="text-xs font-medium text-green-600">Sent Today</span>
                     </div>
                   </div>
                   <div className="pb-3 border-b border-gray-100">
                     <p className="font-semibold text-gray-800">Monthly Fees Reminder</p>
                     <div className="flex justify-between items-center mt-1">
                       <span className="text-xs text-gray-500">To: Nursery A</span>
                       <span className="text-xs font-medium text-green-600">Sent Yesterday</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}
