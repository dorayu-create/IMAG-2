
import React, { useState } from 'react';
import { InvoiceItem, ExpenseType } from '../types';
import { Copy, Trash2, Plus, Check, Camera, Download, User, FileText, Landmark, ReceiptText, Briefcase } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultTableProps {
  data: InvoiceItem[];
  onDataUpdate: (newData: InvoiceItem[]) => void;
  onClearAll: () => void;
  onScanNext: () => void;
}

const ResultTable: React.FC<ResultTableProps> = ({ data, onDataUpdate, onClearAll, onScanNext }) => {
  const [copied, setCopied] = useState(false);

  // Handle cell data changes and update state
  const handleCellChange = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedData = data.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        
        // Auto-update amountInclTax if total amount changes
        if (field === 'totalAmount') {
          newItem.amountInclTax = value;
        }

        // Regenerate request number if expense type or proof date changes
        if (field === 'expenseType' || field === 'proofDate') {
          const datePart = newItem.proofDate ? newItem.proofDate.replace(/-/g, '').substring(2) : '000000';
          newItem.requestNo = `${newItem.expenseType}-${datePart}-${newItem.id.substring(0, 4).toUpperCase()}`;
        }
        return newItem;
      }
      return item;
    });
    onDataUpdate(updatedData);
  };

  // Add a new empty row to the table
  const handleAddRow = () => {
    const id = Math.random().toString(36).substring(2, 9);
    const today = new Date().toISOString().split('T')[0];
    const newItem: InvoiceItem = {
      id,
      requestNo: `AIM-${today.replace(/-/g, '').substring(2)}-${id.substring(0, 4).toUpperCase()}`,
      expenseType: 'AIM',
      projectNo: '0',
      projectName: '',
      customer: '',
      bankCode: '0',
      bankAccount: '0',
      totalAmount: 0,
      payee: '',
      description: '',
      handledBy: '',
      proofDate: today,
      invoiceNo: '0',
      sellerTaxId: '0',
      amountExclTax: 0,
      tax: 0,
      amountInclTax: 0,
      subject: '一般費用',
      paperReceivedDate: '',
      paymentDate: '',
      isMatched: true
    };
    onDataUpdate([...data, newItem]);
  };

  const exportConfig = [
    { label: '請款單編號', key: 'requestNo' },
    { label: '專案編號', key: 'projectNo' },
    { label: '專案名稱', key: 'projectName' },
    { label: '客戶', key: 'customer' },
    { label: '收款行代碼', key: 'bankCode' },
    { label: '收款帳號', key: 'bankAccount' },
    { label: '支出金額', key: 'totalAmount' },
    { label: '收款人姓名', key: 'payee' },
    { label: '說明', key: 'description' },
    { label: '經辦人', key: 'handledBy' },
    { label: '憑證日期', key: 'proofDate' },
    { label: '發票編號', key: 'invoiceNo' },
    { label: '賣方統編', key: 'sellerTaxId' },
    { label: '未稅金額', key: 'amountExclTax' },
    { label: '稅金', key: 'tax' },
    { label: '含稅金額', key: 'amountInclTax' },
    { label: '會計科目', key: 'subject' },
    { label: '財務取得紙本日期', key: 'paperReceivedDate' },
    { label: '預計出帳日期', key: 'paymentDate' }
  ];

  // Copy data to clipboard in TSV format for Excel pasting
  const copyToClipboard = () => {
    const headers = exportConfig.map(c => c.label).join('\t');
    const rows = data.map(item => exportConfig.map(c => item[c.key as keyof InvoiceItem] ?? '0').join('\t'));
    const text = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export data as an Excel file
  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => {
      const obj: any = {};
      exportConfig.forEach(c => obj[c.label] = item[c.key as keyof InvoiceItem] ?? '0');
      return obj;
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "請款資料匯入");
    XLSX.writeFile(workbook, `請款單匯出_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (data.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-blue-600" />
              請款單明細管理
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              自動識別 20+ 欄位，支援批量 Excel 匯出
            </p>
          </div>
          <button onClick={onScanNext} className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95">
            <Camera className="w-5 h-5" /> 繼續掃描
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClearAll} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> 清除
          </button>
          <div className="flex-grow"></div>
          <button onClick={copyToClipboard} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-2">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "已複製" : "複製內容"}
          </button>
          <button onClick={downloadExcel} className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> 下載 Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 min-w-[140px]">請款單編號/專案</th>
              <th className="px-3 py-3 min-w-[120px]">客戶</th>
              <th className="px-3 py-3 min-w-[150px]">銀行資訊</th>
              <th className="px-3 py-3 min-w-[150px]">收款人/經辦人</th>
              <th className="px-3 py-3 min-w-[120px]">說明</th>
              <th className="px-3 py-3 min-w-[100px]">金額 (總額)</th>
              <th className="px-3 py-3 min-w-[180px]">稅務明細 (未稅/稅/含稅)</th>
              <th className="px-3 py-3 min-w-[140px]">憑證/統編</th>
              <th className="px-3 py-3 min-w-[140px]">會計/日期</th>
              <th className="px-3 py-3 w-[50px]">刪</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-2 space-y-1">
                  <div className="font-mono font-bold text-blue-600">{item.requestNo}</div>
                  <div className="flex gap-1">
                    <input type="text" value={item.projectNo} onChange={(e) => handleCellChange(item.id, 'projectNo', e.target.value)} placeholder="專案#" className="w-16 border-b border-slate-200 outline-none" />
                    <input type="text" value={item.projectName} onChange={(e) => handleCellChange(item.id, 'projectName', e.target.value)} placeholder="專案名稱" className="flex-1 border-b border-slate-200 outline-none" />
                  </div>
                </td>
                <td className="p-2">
                  <input type="text" value={item.customer} onChange={(e) => handleCellChange(item.id, 'customer', e.target.value)} placeholder="客戶" className="w-full bg-transparent outline-none" />
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-slate-400" />
                    <input type="text" value={item.bankCode} onChange={(e) => handleCellChange(item.id, 'bankCode', e.target.value)} placeholder="代碼" className="w-10 border-b border-slate-100 outline-none" />
                    <input type="text" value={item.bankAccount} onChange={(e) => handleCellChange(item.id, 'bankAccount', e.target.value)} placeholder="帳號" className="flex-1 border-b border-slate-100 outline-none font-mono" />
                  </div>
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <input type="text" value={item.payee} onChange={(e) => handleCellChange(item.id, 'payee', e.target.value)} placeholder="收款人" className="flex-1 border-b border-slate-100 outline-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <input type="text" value={item.handledBy} onChange={(e) => handleCellChange(item.id, 'handledBy', e.target.value)} placeholder="經辦人" className="flex-1 border-b border-slate-100 outline-none" />
                  </div>
                </td>
                <td className="p-2">
                  <textarea value={item.description} onChange={(e) => handleCellChange(item.id, 'description', e.target.value)} placeholder="說明" className="w-full bg-transparent outline-none resize-none h-12" />
                </td>
                <td className="p-2">
                  <input type="number" value={item.totalAmount} onChange={(e) => handleCellChange(item.id, 'totalAmount', Number(e.target.value))} className="w-full font-bold text-slate-800 outline-none" />
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex gap-1 text-[10px]">
                    <span className="text-slate-400">未稅:</span>
                    <input type="number" value={item.amountExclTax} onChange={(e) => handleCellChange(item.id, 'amountExclTax', Number(e.target.value))} className="flex-1 border-b border-slate-100 outline-none" />
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <span className="text-slate-400">稅金:</span>
                    <input type="number" value={item.tax} onChange={(e) => handleCellChange(item.id, 'tax', Number(e.target.value))} className="flex-1 border-b border-slate-100 outline-none" />
                  </div>
                  <div className="flex gap-1 font-bold">
                    <span className="text-slate-400">含稅:</span>
                    <input type="number" value={item.amountInclTax} onChange={(e) => handleCellChange(item.id, 'amountInclTax', Number(e.target.value))} className="flex-1 outline-none" />
                  </div>
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <input type="text" value={item.invoiceNo} onChange={(e) => handleCellChange(item.id, 'invoiceNo', e.target.value)} placeholder="發票#" className="flex-1 border-b border-slate-100 outline-none" />
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <input type="text" value={item.sellerTaxId} onChange={(e) => handleCellChange(item.id, 'sellerTaxId', e.target.value)} placeholder="統編" className="flex-1 border-b border-slate-100 outline-none" />
                  </div>
                </td>
                <td className="p-2 space-y-1">
                  <input type="text" value={item.subject} onChange={(e) => handleCellChange(item.id, 'subject', e.target.value)} placeholder="會計科目" className="w-full border-b border-slate-100 outline-none" />
                  <input type="date" value={item.proofDate} onChange={(e) => handleCellChange(item.id, 'proofDate', e.target.value)} className="w-full text-slate-500 outline-none" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => onDataUpdate(data.filter(d => d.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button 
        onClick={handleAddRow}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-semibold">手動新增一行資料</span>
      </button>
    </div>
  );
};

export default ResultTable;
