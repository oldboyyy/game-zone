"use client";
import { localizeLabel } from "@/app/lib/i18n/ru";
import Table from "@/app/components/layout/Table";
import { useState } from "react";
import { Trash2, PenLine, ExternalLink } from "lucide-react";
import ConfirmModal from "@/app/components/organisms/ConfirmModal";
import useToast from "@/app/hooks/ui/useToast";
import { usePathname, useRouter } from "next/navigation";
import {
  useDeleteTransactionMutation,
  useGetAllTransactionsQuery,
  useUpdateTransactionStatusMutation,
} from "@/app/store/apis/TransactionApi";
import Modal from "@/app/components/organisms/Modal";
import Dropdown from "@/app/components/molecules/Dropdown";
import { withAuth } from "@/app/components/HOC/WithAuth";

const TransactionsDashboard = () => {
  const { showToast } = useToast();
  const router = useRouter();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState({
    id: "",
    status: "",
  });
  const [newStatus, setNewStatus] = useState("");

  const pathname = usePathname();
  const shouldFetchTransactions = pathname === "/dashboard/transactions";

  const { data, isLoading } = useGetAllTransactionsQuery(undefined, {
    skip: !shouldFetchTransactions,
  });
  const [updateTransactionStatus, { error: updateError }] =
    useUpdateTransactionStatusMutation();
  console.log("Error updating transaction status:", updateError);
  const [deleteTransaction, { error: deleteError }] =
    useDeleteTransactionMutation();
  console.log("Error deleting transaction:", deleteError);

  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const handleDeleteTransaction = (id: string) => {
    setIsConfirmModalOpen(true);
    setTransactionToDelete(id);
  };

  const handleUpdateStatus = (transaction: any) => {
    setSelectedTransaction(transaction);
    setNewStatus(transaction.status);
    setIsStatusModalOpen(true);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/transactions/${id}`);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    setIsConfirmModalOpen(false);
    try {
      await deleteTransaction(transactionToDelete).unwrap();
      setTransactionToDelete(null);
      showToast("Транзакция удалена", "success");
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      showToast("Не удалось удалить транзакцию", "error");
    }
  };

  const confirmStatusUpdate = async () => {
    if (!selectedTransaction || !newStatus) return;
    setIsStatusModalOpen(false);
    try {
      const res = await updateTransactionStatus({
        id: selectedTransaction.id,
        status: newStatus,
      });
      console.log("res => ", res);
      showToast("Статус обновлён", "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("Не удалось обновить статус", "error");
    }
  };

  const TRANSACTION_STATUSES = [
    { label: "В обработке", value: "PENDING" },
    { label: "Обрабатывается", value: "PROCESSING" },
    { label: "Отправлен", value: "SHIPPED" },
    { label: "В пути", value: "IN_TRANSIT" },
    { label: "Доставлен", value: "DELIVERED" },
    { label: "Отменён", value: "CANCELED" },
    { label: "Возвращён", value: "RETURNED" },
    { label: "Возврат средств", value: "REFUNDED" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "IN_TRANSIT":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "RETURNED":
        return "bg-orange-100 text-orange-800";
      case "REFUNDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      key: "id",
      label: "ID транзакции",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm">{row.id.substring(0, 8)}...</span>
        </div>
      ),
    },
    {
      key: "orderId",
      label: "Номер заказа",
      sortable: true,
      render: (row: any) => (
        <span className="font-mono text-sm">
          {row.orderId.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "status",
      label: "Статус",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            row.status
          )}`}
        >
          {localizeLabel(row.status)}
        </span>
      ),
    },
    {
      key: "transactionDate",
      label: "Дата",
      sortable: true,
      render: (row: any) => (
        <span>{new Date(row.transactionDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: "Действия",
      render: (row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(row.id)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ExternalLink size={16} />
            Просмотреть
          </button>
          <button
            onClick={() => handleUpdateStatus(row)}
            className="text-green-600 hover:text-green-800 flex items-center gap-1"
          >
            <PenLine size={16} />
            Обновить
          </button>
          <button
            onClick={() => handleDeleteTransaction(row.id)}
            className="text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <Trash2 size={16} />
            Удалить
          </button>
        </div>
      ),
    },
  ];

  const cancelDelete = () => {
    setIsConfirmModalOpen(false);
  };

  const cancelStatusUpdate = () => {
    setIsStatusModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Транзакции</h1>
        <p className="text-sm text-gray-500">
          История платежей и управление транзакциями
        </p>
      </div>

      <Table
        data={data?.transactions}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Транзакций пока нет"
        onRefresh={() => console.log("refreshed")}
        totalPages={data?.totalPages}
        totalResults={data?.totalResults}
        resultsPerPage={data?.resultsPerPage}
        currentPage={data?.currentPage}
        showHeader={false}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="Удалить транзакцию? Это действие нельзя отменить."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Update Status Modal */}
      <Modal open={isStatusModalOpen} onClose={cancelStatusUpdate}>
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Изменить статус транзакции
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID транзакции
            </label>
            <input
              type="text"
              value={selectedTransaction?.id || ""}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <Dropdown
              options={TRANSACTION_STATUSES}
              value={newStatus}
              onChange={(value) => setNewStatus(value || "")}
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={cancelStatusUpdate}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={confirmStatusUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Изменить статус
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default withAuth(TransactionsDashboard);
