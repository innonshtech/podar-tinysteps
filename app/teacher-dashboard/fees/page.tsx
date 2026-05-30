"use client";
import React, { useState } from "react";
import StudentFeeManagement from "@/components/admin/StudentFeeManagement";
import FeeCategoryManagement from "@/components/admin/FeeCategoryManagement";
import { DollarSign, Layers } from "lucide-react";

export default function DashboardFeesPage() {
  const [activeTab, setActiveTab] = useState<"collections" | "categories">("collections");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 sticky top-0 z-10 shadow-sm">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("collections")}
            className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "collections"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <DollarSign className="w-4 h-4" />
            Fee Collections
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "categories"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <Layers className="w-4 h-4" />
            Fee Categories
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === "collections" && <StudentFeeManagement />}
        {activeTab === "categories" && <FeeCategoryManagement />}
      </div>
    </div>
  );
}
