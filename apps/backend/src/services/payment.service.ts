import { dbStore } from '../repositories/index.js';
import { NotFoundError } from '../core/errors.js';
import type { PaymentRecord, PaymentMethod, PaymentStatus } from '@hotspot/shared';

export interface CreatePaymentInput {
  username?: string;
  packageId?: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  senderPhone?: string;
  notes?: string;
}

export class PaymentService {
  async getAllPayments(): Promise<PaymentRecord[]> {
    await dbStore.initialize();
    return Array.from(dbStore.payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async recordPayment(input: CreatePaymentInput, adminUsername = 'admin'): Promise<PaymentRecord> {
    await dbStore.initialize();
    const pkg = input.packageId ? dbStore.packages.get(input.packageId) : undefined;

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      username: input.username,
      packageId: input.packageId,
      packageName: pkg?.name,
      amount: input.amount,
      currency: 'BDT',
      method: input.method,
      status: input.method === 'CASH' ? 'SUCCESS' : 'PENDING',
      transactionId: input.transactionId,
      senderPhone: input.senderPhone,
      recordedByAdmin: adminUsername,
      notes: input.notes,
      createdAt: new Date().toISOString()
    };

    dbStore.payments.set(payment.id, payment);

    dbStore.logAudit({
      adminUsername,
      action: 'PAYMENT_RECORDED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: {
        amount: payment.amount,
        method: payment.method,
        username: payment.username,
        status: payment.status
      }
    });

    return payment;
  }

  async verifyPayment(id: string, adminUsername = 'admin'): Promise<PaymentRecord> {
    await dbStore.initialize();
    const payment = dbStore.payments.get(id);
    if (!payment) throw new NotFoundError('Payment record not found');

    payment.status = 'SUCCESS';
    dbStore.payments.set(id, payment);

    dbStore.logAudit({
      adminUsername,
      action: 'PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: id,
      metadata: { transactionId: payment.transactionId, amount: payment.amount }
    });

    return payment;
  }
}

export const paymentService = new PaymentService();
