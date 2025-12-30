
import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceItem, ExpenseType } from "../types";

// Convert file to base64 string for API submission
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Use Gemini to scan images and extract structured invoice data
export const scanInvoiceImage = async (base64Images: string[]): Promise<InvoiceItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  // Initialize the Gemini API client using the environment key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define the structured output schema for accounting data
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        expenseType: { type: Type.STRING, description: "AIM (Vendor), BIM (Employee), DIM (Outsource)" },
        projectNo: { type: Type.STRING },
        projectName: { type: Type.STRING },
        customer: { type: Type.STRING },
        bankCode: { type: Type.STRING, description: "3-digit bank code" },
        bankAccount: { type: Type.STRING },
        totalAmount: { type: Type.NUMBER, description: "Total expense amount" },
        payee: { type: Type.STRING },
        description: { type: Type.STRING },
        handledBy: { type: Type.STRING },
        proofDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        invoiceNo: { type: Type.STRING },
        sellerTaxId: { type: Type.STRING, description: "8-digit Tax ID" },
        amountExclTax: { type: Type.NUMBER },
        tax: { type: Type.NUMBER },
        amountInclTax: { type: Type.NUMBER },
        subject: { type: Type.STRING, description: "Accounting subject" },
        paperReceivedDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        paymentDate: { type: Type.STRING, description: "YYYY-MM-DD" }
      },
      required: ["totalAmount", "description"],
    },
  };

  try {
    const imageParts = base64Images.map(base64 => ({
      inlineData: { mimeType: 'image/jpeg', data: base64 }
    }));

    // Use gemini-3-pro-preview for high-quality complex reasoning and extraction tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: `You are a professional accounting assistant. Extract data into the provided JSON schema. 
          Rules:
          1. If data is missing, use 0 for numbers or empty string for text.
          2. For 'BIM' (Employee) requests, the 'payee' and 'handledBy' are usually the same person.
          3. TAX LOGIC: If tax information is not clearly separable or per regulation cannot be claimed, set 'tax' to 0 and 'amountExclTax' equal to 'totalAmount'.
          4. 'amountInclTax' should equal 'totalAmount'.
          5. If multiple documents are present, group them by transaction.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    // Extract the generated text output from the response
    const rawData = JSON.parse(response.text || "[]");
    
    // Process the raw extraction into the final application type
    return rawData.map((item: any) => {
      const id = Math.random().toString(36).substring(2, 9);
      const type = (['AIM', 'BIM', 'DIM'].includes(item.expenseType) ? item.expenseType : 'AIM') as ExpenseType;
      const dateStr = item.proofDate ? item.proofDate.replace(/-/g, '').substring(2) : new Date().toISOString().split('T')[0].replace(/-/g, '').substring(2);
      
      const total = item.totalAmount || 0;
      const taxAmt = item.tax || 0;
      const exclTax = item.amountExclTax || (total - taxAmt);
      
      return {
        id,
        requestNo: `${type}-${dateStr}-${id.substring(0, 4).toUpperCase()}`,
        expenseType: type,
        projectNo: item.projectNo || '0',
        projectName: item.projectName || '',
        customer: item.customer || '',
        bankCode: item.bankCode || '0',
        bankAccount: item.bankAccount || '0',
        totalAmount: total,
        payee: item.payee || (type === 'BIM' ? item.handledBy : ''),
        description: item.description || '',
        handledBy: item.handledBy || (type === 'BIM' ? item.payee : ''),
        proofDate: item.proofDate || '',
        invoiceNo: item.invoiceNo || '0',
        sellerTaxId: item.sellerTaxId || '0',
        amountExclTax: exclTax || total,
        tax: taxAmt,
        amountInclTax: item.amountInclTax || total,
        subject: item.subject || '一般費用',
        paperReceivedDate: item.paperReceivedDate || '',
        paymentDate: item.paymentDate || '',
        isMatched: true
      };
    });

  } catch (error) {
    console.error("Scan Error:", error);
    throw error;
  }
};
