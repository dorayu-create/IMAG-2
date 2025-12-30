export type ExpenseType = 'AIM' | 'BIM' | 'DIM';

export interface InvoiceItem {
  id: string;
  requestNo: string;           // 請款單編號
  expenseType: ExpenseType;     // 類型 (AIM/BIM/DIM)
  projectNo: string;           // 專案編號
  projectName: string;         // 專案名稱
  customer: string;            // 客戶
  bankCode: string;            // 收款行代碼
  bankAccount: string;         // 收款帳號
  totalAmount: number;         // 支出金額 (總額)
  payee: string;               // 收款人姓名(與帳戶相同)
  description: string;         // 說明
  handledBy: string;           // 經辦人
  proofDate: string;           // 憑證日期
  invoiceNo: string;           // 發票編號
  sellerTaxId: string;         // 賣方統編
  amountExclTax: number;       // 未稅金額
  tax: number;                 // 稅金
  amountInclTax: number;       // 含稅金額
  subject: string;             // 會計科目
  paperReceivedDate: string;   // 財務取得紙本日期
  paymentDate: string;         // 預計出帳日期
  isMatched: boolean;          // 金額核對狀態
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}