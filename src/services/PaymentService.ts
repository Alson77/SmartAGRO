interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  branch: string;
  swiftCode: string;
  ifsc: string;
}

type SupportedBankName =
  | 'Nepal Bank Limited'
  | 'Rastriya Banijya Bank'
  | 'Nepal Investment Bank'
  | 'NABIL Bank'
  | 'Himalayan Bank'
  | 'Kumari Bank'
  | 'Siddhartha Bank'
  | 'Bank of Kathmandu'
  | 'Machhapuchchhare Bank'
  | 'Kathmandu Bank'
  | 'Prime Bank'
  | 'Agriculture Development Bank'
  | 'Citizen Bank'
  | 'Global Bank'
  | 'Laxmi Microfinance Bank';

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentMethod?: string;
  amount?: number;
  config?: any;
  error?: string;
  message?: string;
  bankName?: string;
  bankDetails?: BankDetails | null;
  bookingData?: any;
}

interface BookingData {
  expertId: string;
  farmerId: string;
  farmerName: string;
  farmerEmail: string;
  expertName: string;
  expertise: string;
  consultationFee: number;
  scheduledDate: Date;
  scheduledTime: string;
  topic: string;
  description: string;
  paymentMethod: 'esewa' | 'bank_transfer';
  selectedBank: string | null;
  amount: number;
  paymentTransactionId: string;
  paymentStatus?: string;
  _id?: string;
}

class PaymentService {
  static getBankTransferDetails(bankName: SupportedBankName): BankDetails | null {
    const banks: Record<SupportedBankName, BankDetails> = {
      'Nepal Bank Limited': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10010019001',
        bankCode: 'NBL',
        branch: 'Kathmandu Main Branch',
        swiftCode: 'NBLANET',
        ifsc: 'NBL0001'
      },
      'Rastriya Banijya Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10020055100',
        bankCode: 'RBB',
        branch: 'Kathmandu Downtown',
        swiftCode: 'RBBMNET',
        ifsc: 'RBB0002'
      },
      'Nepal Investment Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10030088400',
        bankCode: 'NIBL',
        branch: 'Kathmandu Branch',
        swiftCode: 'NIBLNET',
        ifsc: 'NIBL0003'
      },
      'NABIL Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10040044001',
        bankCode: 'NABIL',
        branch: 'Kathmandu Metropolitan',
        swiftCode: 'NABILNET',
        ifsc: 'NABIL0004'
      },
      'Himalayan Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10050777001',
        bankCode: 'HBL',
        branch: 'Kathmandu Central',
        swiftCode: 'HBKANET',
        ifsc: 'HBL0005'
      },
      'Kumari Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10060199001',
        bankCode: 'KUMARI',
        branch: 'Kathmandu Branch',
        swiftCode: 'KBKANET',
        ifsc: 'KUMARI0006'
      },
      'Siddhartha Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10070400001',
        bankCode: 'SBL',
        branch: 'Kathmandu Branch',
        swiftCode: 'SBLANET',
        ifsc: 'SBL0007'
      },
      'Bank of Kathmandu': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10080111001',
        bankCode: 'BOK',
        branch: 'Kathmandu Main',
        swiftCode: 'BOKANET',
        ifsc: 'BOK0008'
      },
      'Machhapuchchhare Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10090555001',
        bankCode: 'MBL',
        branch: 'Kathmandu Branch',
        swiftCode: 'MBLKNET',
        ifsc: 'MBL0009'
      },
      'Kathmandu Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10100222001',
        bankCode: 'KATHMANDU',
        branch: 'Kathmandu Main',
        swiftCode: 'KBLNET',
        ifsc: 'KATHMANDU0010'
      },
      'Prime Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10110333001',
        bankCode: 'PRIME',
        branch: 'Kathmandu Branch',
        swiftCode: 'PBLNET',
        ifsc: 'PRIME0011'
      },
      'Agriculture Development Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10120666001',
        bankCode: 'ADB',
        branch: 'Kathmandu Main',
        swiftCode: 'ADBKNET',
        ifsc: 'ADB0012'
      },
      'Citizen Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10130888001',
        bankCode: 'CITIZEN',
        branch: 'Kathmandu Branch',
        swiftCode: 'CIBNNET',
        ifsc: 'CITIZEN0013'
      },
      'Global Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10140444001',
        bankCode: 'GLOBAL',
        branch: 'Kathmandu Main',
        swiftCode: 'GLBLNET',
        ifsc: 'GLOBAL0014'
      },
      'Laxmi Microfinance Bank': {
        accountName: 'SmartAGRO Agriculture',
        accountNumber: '10150999001',
        bankCode: 'LAXMI',
        branch: 'Kathmandu Branch',
        swiftCode: 'LXMINET',
        ifsc: 'LAXMI0015'
      }
    };

    return banks[bankName] ?? null;
  }

  static initiateBankTransfer(
    amount: number,
    bankName: SupportedBankName,
    bookingData: BookingData
  ): PaymentResponse {
    try {
      const bankDetails = this.getBankTransferDetails(bankName);

      if (!bankDetails) {
        return {
          success: false,
          error: `Unsupported bank: ${bankName}`
        };
      }

      const transactionId = this.generateTransactionId();

      return {
        success: true,
        transactionId,
        paymentMethod: 'bank_transfer',
        amount,
        bankName,
        bankDetails,
        bookingData
      };
    } catch (error) {
      console.error('Bank transfer initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async processPayment(
    bookingData: BookingData,
    paymentMethod: string,
    amount: number,
    transactionId: string
  ) {
    try {
      const response = await fetch('/api/experts/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: bookingData.expertId,
          farmerId: bookingData.farmerId,
          farmerName: bookingData.farmerName,
          farmerEmail: bookingData.farmerEmail,
          expertName: bookingData.expertName,
          expertise: bookingData.expertise,
          consultationFee: bookingData.consultationFee,
          scheduledDate: bookingData.scheduledDate,
          scheduledTime: bookingData.scheduledTime,
          topic: bookingData.topic,
          description: bookingData.description,
          paymentMethod,
          amount,
          paymentTransactionId: transactionId,
          selectedBank: bookingData.selectedBank ?? null,
          paymentRef: transactionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static formatAmount(amount: number | bigint): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  static initiateEsewaPayment(
    amount: number,
    transactionId: string,
    bookingData: BookingData
  ): PaymentResponse {
    try {
      const esewaConfig = {
        amount: amount,
        transaction_uuid: transactionId,
        product_name: `Expert Consultation - ${bookingData.expertName}`,
        product_code: 'EXPERT_BOOKING',
        success_url: `${window.location.origin}/payment/success`,
        failure_url: `${window.location.origin}/payment/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        tax_amount: '0',
        shipping_amount: '0'
      };

      return {
        success: true,
        transactionId,
        paymentMethod: 'esewa',
        amount,
        config: esewaConfig,
        bookingData
      };
    } catch (error) {
      console.error('eSewa payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  static getSupportedBanks(): SupportedBankName[] {
    return [
      'Nepal Bank Limited',
      'Rastriya Banijya Bank',
      'Nepal Investment Bank',
      'NABIL Bank',
      'Himalayan Bank',
      'Kumari Bank',
      'Siddhartha Bank',
      'Bank of Kathmandu',
      'Machhapuchchhare Bank',
      'Kathmandu Bank',
      'Prime Bank',
      'Agriculture Development Bank',
      'Citizen Bank',
      'Global Bank',
      'Laxmi Microfinance Bank'
    ];
  }
}

export default PaymentService;