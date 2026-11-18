import AppError from "@/shared/errors/AppError";
import { PaymentRepository } from "./payment.repository";

export class PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async getUserPayments(userId: string) {
    const payments = await this.paymentRepository.findPaymentsByUserId(userId);
    return payments;
  }

  async getPaymentDetails(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new AppError(404, "Payment not found");
    }
    if (payment.userId !== userId) {
      throw new AppError(403, "You are not authorized to view this payment");
    }
    return payment;
  }

  async deletePayment(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new AppError(404, "Payment not found");
    }
    if (payment.userId !== userId) {
      throw new AppError(403, "You are not authorized to delete this payment");
    }
    return this.paymentRepository.deletePayment(paymentId);
  }
}
