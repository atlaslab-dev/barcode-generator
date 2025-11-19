import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Archive, Printer, Plus, CheckCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import logoSiloam from "@/assets/siloamlogo.png";

interface LabelData {
  barcodeNumber: string;
  expiryDate: string;
}

declare global {
  interface Window {
    JsBarcode: any;
  }
}

export default function Home() {
  const [archiveDate, setArchiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [labelCount, setLabelCount] = useState("3");
  const [generatedLabels, setGeneratedLabels] = useState<LabelData[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(null);
  const barcodeRefs = useRef<(SVGSVGElement | null)[]>([]);

  const formatDateToBarcode = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return year + month + day;
  };

  const calculateExpiryDate = (inputDate: string): string => {
    const date = new Date(inputDate);
    const expiryDate = addDays(date, 7);
    return format(expiryDate, 'dd/MM/yyyy');
  };

  const generateLabels = () => {
    const baseCode = formatDateToBarcode(archiveDate);
    const count = parseInt(labelCount);
    const labels: LabelData[] = [];
    const expiryDate = calculateExpiryDate(archiveDate);

    for (let i = 1; i <= count; i++) {
      labels.push({
        barcodeNumber: baseCode + i.toString().padStart(2, '0'),
        expiryDate: expiryDate
      });
    }

    setGeneratedLabels(labels);
    setIsGenerated(true);
    setSelectedLabelIndex(null); // Reset selection when new labels are generated
  };

  const generateBarcodes = () => {
    if (window.JsBarcode && generatedLabels.length > 0) {
      generatedLabels.forEach((label, index) => {
        const ref = barcodeRefs.current[index];
        if (ref) {
          window.JsBarcode(ref, label.barcodeNumber, {
            format: "CODE128",
            width: 1,
            height: 30,
            displayValue: false,
            margin: 0
          });
        }
      });
    }
  };

  useEffect(() => {
    if (isGenerated && generatedLabels.length > 0) {
      setTimeout(generateBarcodes, 100);
    }
  }, [isGenerated, generatedLabels]);

  const handlePrint = (printAll: boolean = true) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsToPrint = printAll ? generatedLabels : 
                         (selectedLabelIndex !== null ? [generatedLabels[selectedLabelIndex]] : []);

    if (labelsToPrint.length === 0) {
        alert("Pilih setidaknya satu label untuk dicetak.");
        return;
    }

    let labelsHTML = '';
    labelsToPrint.forEach((label, index) => {
      const actualIndex = printAll ? index : selectedLabelIndex || 0;
      
      labelsHTML += `
        <div class="barcode-label" style="${printAll && index < labelsToPrint.length - 1 ? 'page-break-after: always;' : ''}">
          <div class="registration-date-vertical">
            <span>${format(new Date(archiveDate), "dd/MM/yyyy")}</span>
          </div>
          
          <div class="barcode-container">
            <svg id="print-barcode-${actualIndex}"></svg>
          </div>
          <div class="sample-id-row">
            <span class="sample-id">${label.barcodeNumber}</span>
          </div>
          <div class="sample-info">
            <div class="hospital-name">
              <div class="print-logo"></div>
              <span>Siloam Hospitals</span>
            </div>
            <div class="expiry-details">
              <span>Exp: ${label.expiryDate}</span>
            </div>
          </div>
        </div>
      `;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label Arsip Medis</title>
          <script src="/scripts/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: 4cm 3cm;
              margin: 0;
            } 
            
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            
            .barcode-label {
              width: 4cm;
              height: 3cm;
              position: relative;
              display: flex;
              flex-direction: column;
              padding: 2mm;
              box-sizing: border-box;
              background: white;
            }
            
            .registration-date-vertical {
              position: absolute;
              top: 1mm;
              right: 1mm;
              font-size: 8px;
              font-weight: bold;
            }
            
            .sample-id-row {
              text-align: center;
              margin-top: 1mm;
              margin-bottom: 1mm;
            }
            
            .sample-id {
              font-size: 18px;
              font-weight: bold;
              font-family: monospace;
            }
            
            .barcode-container {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0.5mm 0;
            }
            
            .barcode-container svg {
              max-width: 100%;
              max-height: 15mm;
            }
            
            .sample-info {
              text-align: center;
              font-size: 7px;
              margin-top: auto;
            }
            
            .hospital-name {
              font-weight: bold;
              margin-bottom: 0.5mm;
              font-size: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1mm;
            }
            
            .expiry-details {
              font-size: 7px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${labelsHTML}
          <script>
            window.onload = function() {
              ${labelsToPrint.map((label, index) => {
                const actualIndex = printAll ? index : selectedLabelIndex || 0;
                return `
                  JsBarcode(document.getElementById("print-barcode-${actualIndex}"), "${label.barcodeNumber}", {
                    format: "CODE128",
                    width: 1.2,
                    height: 30,
                    displayValue: false,
                    margin: 0
                  });
                `;
              }).join('')}
              
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getGeneratedFormat = () => {
    if (generatedLabels.length > 0) {
      return generatedLabels.map(label => label.barcodeNumber).join(', ');
    }
    const baseCode = formatDateToBarcode(archiveDate);
    const count = parseInt(labelCount);
    const samples = [];
    for (let i = 1; i <= Math.min(count, 3); i++) {
      samples.push(baseCode + i.toString().padStart(2, '0'));
    }
    if (count > 3) samples.push('...');
    return samples.join(', ');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--medical-gray))]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[hsl(var(--medical-blue))] rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Pembuat Label Medis</h1>
                <p className="text-sm text-gray-500">Sistem Manajemen Label Arsip</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <a href="https://bintangpersada.vercel.app/" target="_blank" rel="noopener noreferrer">
                @bintangprsda
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Control Panel */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontrol Pembuatan Label</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="archiveDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Arsip
                    </Label>
                    <Input
                      type="date"
                      id="archiveDate"
                      value={archiveDate}
                      onChange={(e) => setArchiveDate(e.target.value)}
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">Pilih tanggal untuk pembuatan label arsip</p>
                  </div>

                  <div>
                    <Label htmlFor="labelCount" className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Label
                    </Label>
                    <Select value={labelCount} onValueChange={setLabelCount}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Label</SelectItem>
                        <SelectItem value="2">2 Label</SelectItem>
                        <SelectItem value="3">3 Label</SelectItem>
                        <SelectItem value="4">4 Label</SelectItem>
                        <SelectItem value="5">5 Label</SelectItem>
                        <SelectItem value="6">6 Label</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Informasi yang Dihasilkan</h3> 
                    <div className="space-y-1 text-xs text-blue-700">
                      <p><span className="font-medium">Format Barcode:</span> {getGeneratedFormat()}</p>
                      <p><span className="font-medium">Tanggal Kadaluarsa:</span> {calculateExpiryDate(archiveDate)} (7 hari setelah tanggal arsip)</p>
                      <p><span className="font-medium">Rumah Sakit:</span> Siloam Hospitals Lippo Village</p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Button 
                      onClick={generateLabels}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Buat Label
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            onClick={() => handlePrint(true)}
                            variant="outline"
                            className="no-print"
                            disabled={!isGenerated}
                        >
                            <Printer className="w-4 h-4 mr-1" />
                            Cetak Semua
                        </Button>
                        <Button 
                            onClick={() => handlePrint(false)}
                            className="bg-green-600 hover:bg-green-700 text-white no-print"
                            disabled={selectedLabelIndex === null}
                        >
                            <Printer className="w-4 h-4 mr-1" />
                            Cetak Dipilih
                        </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions Panel */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instruksi</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[hsl(var(--medical-blue))] text-white text-xs font-medium rounded-full flex-shrink-0 mt-0.5">1</span>
                    <p>Pilih <strong>Tanggal Arsip</strong> untuk pembuatan label.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[hsl(var(--medical-blue))] text-white text-xs font-medium rounded-full flex-shrink-0 mt-0.5">2</span>
                    <p>Tentukan <strong>Jumlah Label</strong> berurutan yang akan dibuat.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[hsl(var(--medical-blue))] text-white text-xs font-medium rounded-full flex-shrink-0 mt-0.5">3</span>
                    <p>Klik <strong>"Buat Label"</strong> untuk menghasilkan barcode dengan format YYMMDD01, YYMMDD02, dst.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[hsl(var(--medical-blue))] text-white text-xs font-medium rounded-full flex-shrink-0 mt-0.5">4</span>
                    <p><strong>Klik pada salah satu label</strong> untuk memilihnya, lalu klik <strong>"Cetak Dipilih"</strong>. Gunakan <strong>"Cetak Semua"</strong> untuk mencetak semua label sekaligus.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Labels Preview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Label yang Dihasilkan</h2>
                  {isGenerated && (
                    <span className="px-2 py-1 bg-[hsl(var(--medical-green))] text-white text-xs font-medium rounded-full">
                      Siap Dicetak
                    </span>
                  )}
                </div>

                <div className="print-area grid grid-cols-2 gap-4">
                  {generatedLabels.map((label, index) => (
                    // Use a label element for better accessibility and click area
                    <label 
                      key={index}
                      className={`label-item label-dimensions bg-white border-2 ${selectedLabelIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'} rounded-lg p-2 flex flex-col justify-between relative cursor-pointer hover:border-blue-400 transition-all duration-200`}
                    >
                      {/* Visually Hidden Radio Input for Accessibility */}
                      <input
                        type="radio"
                        name="labelSelection"
                        checked={selectedLabelIndex === index}
                        onChange={() => setSelectedLabelIndex(index)}
                        className="sr-only" // Hide the default radio button
                      />

                      {/* Custom Selection Indicator */}
                      <div className="absolute top-2 right-2 no-print">
                        {selectedLabelIndex === index ? (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full bg-white"></div>
                        )}
                      </div>
                      
                      {/* Nomor urutan untuk preview, tidak akan tercetak */}
                      <div className="absolute -top-2 -left-2 bg-[hsl(var(--medical-blue))] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center no-print">
                        {index + 1}
                      </div>
                      
                      <div className="flex flex-col items-center space-y-1">
                        <div className="barcode-container w-full">
                          <svg 
                            ref={(el) => { barcodeRefs.current[index] = el; }}
                            className="w-full h-8"
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-700">{label.barcodeNumber}</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <img src={logoSiloam} className="w-3 h-3 object-contain" alt="Siloam Logo" />
                          <p className="text-xs font-semibold text-gray-900">Siloam Hospitals</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Exp: {label.expiryDate}</p>
                      </div>
                    </label>
                  ))}

                  {/* Placeholder for additional labels */}
                  {!isGenerated && (
                    <>
                      <div className="label-item label-dimensions bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Plus className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs">Buat label terlebih dahulu</p>
                        </div>
                      </div>
                      <div className="label-item label-dimensions bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Plus className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs">Buat label terlebih dahulu</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg no-print">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Sistem Cetak</p>
                      <p className="mt-1">Pilih satu label untuk mencetak hanya label tersebut, atau gunakan "Cetak Semua" untuk mencetak semua label. Setiap label akan tercetak pada halaman terpisah dengan ukuran 4cm x 3cm.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>&copy; 2025 Atlas laboratory. All rights reserved.</p>
            <p>Sistem Manajemen Label Arsip v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}