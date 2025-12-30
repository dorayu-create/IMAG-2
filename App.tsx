import React, { useState, useRef } from 'react';
import { scanInvoiceImage, fileToBase64 } from './services/geminiService';
import { InvoiceItem, ProcessingStatus } from './types';
import ImageUploader from './components/ImageUploader';
import ResultTable from './components/ResultTable';
import { Loader2, AlertCircle, FileStack } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [invoiceData, setInvoiceData] = useState<InvoiceItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleImagesSelect = async (files: File[]) => {
    try {
      setStatus(ProcessingStatus.SCANNING);
      setErrorMsg(null);
      
      const base64Array = await Promise.all(files.map(f => fileToBase64(f)));
      
      setCurrentImages(base64Array);

      // Process all images together to let Gemini pair them
      const extractedData = await scanInvoiceImage(base64Array);
      
      setInvoiceData(prevData => [...prevData, ...extractedData]);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      console.error(error);
      if (invoiceData.length > 0) {
        setStatus(ProcessingStatus.SUCCESS);
        alert(`掃描核對失敗: ${error.message || "無法識別圖片組合"}`);
      } else {
        setStatus(ProcessingStatus.ERROR);
        setErrorMsg(error.message || "無法分析圖片，請確保同時上傳請款單與發票。");
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("確定要清除所有資料嗎？")) {
      setInvoiceData([]);
      setCurrentImages([]);
      setStatus(ProcessingStatus.IDLE);
      setErrorMsg(null);
    }
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImagesSelect(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const showResults = invoiceData.length > 0 || (status === ProcessingStatus.SUCCESS && invoiceData.length === 0);
  const isScanning = status === ProcessingStatus.SCANNING;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <input 
        type="file" 
        ref={hiddenInputRef} 
        onChange={handleHiddenInputChange} 
        className="hidden" 
        accept="image/*" 
        multiple 
      />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
              <FileStack className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">請款稽核系統</h1>
              <p className="text-xs text-slate-500 font-medium">AI 金額核對 • 請款單 vs 憑證</p>
            </div>
          </div>
          {showResults && (
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
               系統連動中
             </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        
        {isScanning && showResults && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in max-w-sm text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800">正在執行 AI 金額核對...</h3>
              <p className="text-sm text-slate-500 mt-2">我們正在比對請款單與發票上的數字是否完全一致，這需要幾秒鐘。</p>
            </div>
          </div>
        )}

        {!showResults && !isScanning && status !== ProcessingStatus.ERROR && (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in-up pt-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">建立嚴謹的請款流程</h2>
              <p className="text-slate-600 leading-relaxed">
                同時上傳「請款單」與「憑證圖片」，AI 將自動提取雙方金額進行比對。<br/>
                <span className="text-blue-600 font-bold">金額完全相同才可通過核對。</span>
              </p>
            </div>
            
            <ImageUploader 
              onImagesSelected={handleImagesSelect} 
              isProcessing={false} 
              className="min-h-[250px]"
            />
            
            <p className="text-center text-xs text-slate-400">提示：您可以一次選取多張圖片進行批量核對。</p>
          </div>
        )}

        {isScanning && !showResults && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">AI 正在審核您的單據</h3>
            <p className="text-slate-500 mt-3 text-center max-w-xs">這包含文字識別、金額擷取以及兩者間的邏輯核對...</p>
          </div>
        )}

        {status === ProcessingStatus.ERROR && !showResults && (
          <div className="max-w-xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">核對啟動失敗</h3>
              <p className="text-red-700 mt-1">{errorMsg}</p>
              <button 
                onClick={() => setStatus(ProcessingStatus.IDLE)}
                className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                返回重新上傳
              </button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-3 space-y-6">
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">新增待對帳單據</h3>
                  <ImageUploader 
                    onImagesSelected={handleImagesSelect} 
                    isProcessing={isScanning}
                    className="p-4"
                  />
               </div>

              {currentImages.length > 0 && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                   <div className="mb-3 px-1 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">最近上傳預覽 ({currentImages.length})</span>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     {currentImages.map((img, i) => (
                       <div key={i} className="aspect-square rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                         <img 
                           src={`data:image/jpeg;base64,${img}`} 
                           alt={`Scan ${i}`} 
                           className="w-full h-full object-cover" 
                         />
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-9">
              <ResultTable 
                data={invoiceData} 
                onDataUpdate={setInvoiceData} 
                onClearAll={handleReset} 
                onScanNext={() => hiddenInputRef.current?.click()}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;