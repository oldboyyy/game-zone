"use client";
import React, { useState, useEffect } from "react";
import { useLazyGenerateReportQuery } from "@/app/store/apis/ReportsApi";
import Dropdown from "@/app/components/molecules/Dropdown";
import { withAuth } from "@/app/components/HOC/WithAuth";

interface DropdownOption {
  label: string;
  value: string;
}

const ReportsDashboard: React.FC = () => {
  const [generateReport, { isLoading }] = useLazyGenerateReportQuery();
  const [reportType, setReportType] = useState<string | null>("sales");
  const [format, setFormat] = useState<string | null>("pdf");
  const [timePeriod, setTimePeriod] = useState<string | null>("last7days");
  const [year, setYear] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Dropdown options
  const reportTypeOptions: DropdownOption[] = [
    { label: "Sales", value: "sales" },
    { label: "Удержание покупателей", value: "user_retention" },
    { label: "Все отчёты", value: "all" },
  ];

  const formatOptions: DropdownOption[] = [
    { label: "CSV", value: "csv" },
    { label: "PDF", value: "pdf" },
    { label: "XLSX", value: "xlsx" },
  ];

  const timePeriodOptions: DropdownOption[] = [
    { label: "Последние 7 дней", value: "last7days" },
    { label: "Последний месяц", value: "lastMonth" },
    { label: "Последний год", value: "lastYear" },
    { label: "За всё время", value: "allTime" },
    { label: "Custom", value: "custom" },
  ];

  // Generate year options (last 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions: DropdownOption[] = [
    { label: "Выберите год", value: "" },
    ...Array.from({ length: 10 }, (_, i) => ({
      label: `${currentYear - i}`,
      value: `${currentYear - i}`,
    })),
  ];

  // Handle form submission
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!reportType || !format || !timePeriod) {
      setErrorMessage("Выберите тип отчёта, формат и период.");
      return;
    }

    const query: Record<string, string> = {
      type: reportType,
      format,
      timePeriod,
    };
    if (year) query.year = year;
    if (timePeriod === "custom") {
      if (!startDate || !endDate) {
        setErrorMessage(
          "Укажите начало и конец периода."
        );
        return;
      }
      query.startDate = startDate;
      query.endDate = endDate;
    }

    try {
      const response = await generateReport(query).unwrap();
      const blob = response; // Assuming API returns a Blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMessage("Отчёт сформирован!");
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || "Не удалось сформировать отчёт. Попробуйте ещё раз."
      );
    }
  };

  // Clear custom dates when timePeriod changes
  useEffect(() => {
    if (timePeriod !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  }, [timePeriod]);

  // Clear year when allTime is selected
  useEffect(() => {
    if (timePeriod === "allTime") {
      setYear(null);
    }
  }, [timePeriod]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Отчёты
        </h1>

        <form onSubmit={handleGenerateReport} className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип отчёта
            </label>
            <Dropdown
              label="Выберите тип отчёта"
              options={reportTypeOptions}
              value={reportType}
              onChange={setReportType}
              className="w-full"
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Формат
            </label>
            <Dropdown
              label="Выберите формат"
              options={formatOptions}
              value={format}
              onChange={setFormat}
              className="w-full"
            />
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Период
            </label>
            <Dropdown
              label="Выберите период"
              options={timePeriodOptions}
              value={timePeriod}
              onChange={setTimePeriod}
              className="w-full"
            />
          </div>

          {/* Year (optional, disabled for allTime) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Год (необязательно)
            </label>
            <Dropdown
              label="Выберите год"
              options={yearOptions}
              value={year}
              onChange={setYear}
              className="w-full"
              disabled={timePeriod === "allTime"}
            />
          </div>

          {/* Custom Date Range (visible only for custom) */}
          {timePeriod === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Дата начала
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  // max={endDate || format(new Date(), "yyyy-MM-dd")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required={timePeriod === "custom"}
                />
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Дата окончания
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  // max={format(new Date(), "yyyy-MM-dd")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required={timePeriod === "custom"}
                />
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {errorMessage && (
            <div className="text-red-600 text-sm">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="text-green-600 text-sm">{successMessage}</div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-50"
            >
              {isLoading ? "Generating..." : "Сформировать отчёт"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withAuth(ReportsDashboard);
