"use client";
import React, { useState, useEffect, ReactNode } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/Table";
import Badge from "@/components/common/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { showToast } from "@/lib/toast";
import { exportToCSV } from "@/utils/exportData";
import {
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  Download,
  Receipt,
  Search,
  Calendar,
} from "lucide-react";

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface FeeCategoryStats {
  totalStudents: number;
  totalAmount: number;
  collected: number;
  pending: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
}

interface FeeCategory {
  _id: string;
  name: string;
  description: string;
  amount: number;
  classId: Class;
  dueDate: string;
  frequency: "one-time" | "monthly" | "quarterly" | "yearly";
  active: boolean;
  stats?: FeeCategoryStats;
}

export default function FeeCategoryManagement() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: 0,
    classId: "",
    dueDate: "",
    frequency: "one-time",
  });

  useEffect(() => {
    fetchClasses();
    fetchCategories();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to fetch classes");
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fees/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      showToast.error("Failed to fetch fee categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveCategory = async () => {
    if (!formData.name || !formData.amount || !formData.classId || !formData.dueDate) {
      showToast.error("Please fill in all required fields");
      return;
    }

    try {
      const method = editingCategory ? "PUT" : "POST";
      const url = editingCategory ? `/api/fees/categories/${editingCategory._id}` : "/api/fees/categories";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        showToast.error(data.message || "Failed to save category");
        return;
      }

      showToast.success(
        editingCategory 
          ? "Category updated successfully" 
          : data.message || "Category created and assigned to students"
      );
      
      setModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", amount: 0, classId: "", dueDate: "", frequency: "one-time" });
      fetchCategories();
    } catch (error) {
      showToast.error("Failed to save fee category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this fee category?")) return;
    try {
      const res = await fetch(`/api/fees/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast.success("Category deactivated successfully");
        fetchCategories();
      } else {
        showToast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      showToast.error("Failed to delete fee category");
    }
  };

  const handleEdit = (category: FeeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      amount: category.amount,
      classId: category.classId?._id || "",
      dueDate: new Date(category.dueDate).toISOString().split("T")[0],
      frequency: category.frequency,
    });
    setModalOpen(true);
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.classId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      key: "name",
      label: "Category Name",
      render: (value: unknown, row: Record<string, unknown>) => {
        const cat = row as unknown as FeeCategory;
        return (
          <div>
            <div className="font-semibold text-gray-800">{cat.name}</div>
            {cat.description && <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{cat.description}</div>}
          </div>
        );
      },
    },
    {
      key: "classId",
      label: "Class",
      render: (value: unknown) => {
        const cls = value as Class;
        return cls ? `${cls.name} - ${cls.section}` : "N/A";
      },
    },
    {
      key: "amount",
      label: "Amount",
      render: (value: unknown, row: Record<string, unknown>) => {
        const cat = row as unknown as FeeCategory;
        return (
          <div>
            <div className="font-semibold text-gray-800">{formatCurrency(cat.amount)}</div>
            <div className="text-xs text-gray-500 capitalize">{cat.frequency}</div>
          </div>
        );
      },
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (value: unknown) => (
        <span className="flex items-center gap-1 text-gray-600 text-sm">
          <Calendar className="w-4 h-4" />
          {new Date(value as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "stats",
      label: "Collection Status",
      render: (value: unknown) => {
        const stats = value as FeeCategoryStats;
        if (!stats) return <span className="text-gray-400 text-sm">No data</span>;
        
        const percentCollected = stats.totalAmount > 0 
          ? Math.round((stats.collected / stats.totalAmount) * 100) 
          : 0;

        return (
          <div className="w-full min-w-[150px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-emerald-600 font-medium">{formatCurrency(stats.collected)}</span>
              <span className="text-gray-500">{percentCollected}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${percentCollected}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Pending: {formatCurrency(stats.pending)}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fee Categories</h1>
          <p className="text-gray-600 mt-1">Manage extra fees and custom categories for your classes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToCSV(categories, "fee-categories.csv")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: "", description: "", amount: 0, classId: "", dueDate: "", frequency: "one-time" });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by category name, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCategories as unknown as Record<string, unknown>[]}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(row as unknown as FeeCategory)}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="Edit Category"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory((row as unknown as FeeCategory)._id)}
                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Deactivate Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Edit Fee Category" : "Create New Fee Category"}
        size="md"
      >
        <div className="space-y-4">
          {!editingCategory && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-4">
              <strong>Note:</strong> Creating a new category will automatically assign this fee to 
              <strong> all students</strong> in the selected class and notify parents.
            </div>
          )}
          
          <Input
            label="Category Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Uniform Fee, Trip Fee"
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
              rows={2}
              placeholder="Brief details about this fee..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="one-time">One Time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Class *</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 bg-white"
                disabled={!!editingCategory} // Cannot change class after creation
              >
                <option value="">Select a class...</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name} - {cls.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory}>{editingCategory ? "Update Category" : "Create Category"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
