import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

interface PdfDebugPanelProps {
  file: File | null;
  extractedText: string;
  perPageText: string[];
  detectedSections: any[];
  parseLog: string[];
  isProcessing: boolean;
  onRetry: () => void;
}

export function PdfDebugPanel({
  file,
  extractedText,
  perPageText,
  detectedSections,
  parseLog,
  isProcessing,
  onRetry
}: PdfDebugPanelProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!file) return null;

  return (
         <Card className="w-full border-orange-200 bg-orange-50">
       <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
         <CardTitle className="flex items-center justify-between text-orange-800">
           <div className="flex items-center gap-2">
             <AlertTriangle className="w-5 h-5" />
             PDF Debug Panel
           </div>
           <Button
             variant="ghost"
             size="sm"
             className="h-6 w-6 p-0 hover:bg-orange-100"
             onClick={(e) => {
               e.stopPropagation();
               setIsCollapsed(!isCollapsed);
             }}
           >
             {isCollapsed ? (
               <ChevronDown className="h-4 w-4" />
             ) : (
               <ChevronUp className="h-4 w-4" />
             )}
           </Button>
                  </CardTitle>
       </CardHeader>
       {!isCollapsed ? (
         <CardContent className="space-y-4">
           {/* File Info */}
           <div className="grid grid-cols-2 gap-4 text-sm">
             <div>
               <Label className="text-orange-800">File Name</Label>
               <div className="font-mono">{file.name}</div>
             </div>
             <div>
               <Label className="text-orange-800">File Size</Label>
               <div className="font-mono">{(file.size / 1024).toFixed(1)} KB</div>
             </div>
             <div>
               <Label className="text-orange-800">File Type</Label>
               <div className="font-mono">{file.type}</div>
             </div>
             <div>
               <Label className="text-orange-800">Processing Status</Label>
               <div className="font-mono">
                 {isProcessing ? (
                   <span className="text-orange-600">Processing...</span>
                 ) : (
                   <span className="text-green-600">Complete</span>
                 )}
               </div>
             </div>
           </div>

        {/* Processing Results */}
        <div className="space-y-2">
          <Label className="text-orange-800">Processing Results</Label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-white rounded border">
              <div className="font-medium">Pages</div>
              <div className="text-2xl font-bold text-blue-600">{perPageText.length}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="font-medium">Total Text</div>
              <div className="text-2xl font-bold text-green-600">{extractedText.length}</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="font-medium">Sections</div>
              <div className="text-2xl font-bold text-purple-600">{detectedSections.length}</div>
            </div>
          </div>
        </div>

        {/* Parse Log */}
        <div className="space-y-2">
          <Label className="text-orange-800">Parse Log</Label>
          <div className="max-h-32 overflow-y-auto bg-white rounded border p-2">
            {parseLog.length === 0 ? (
              <div className="text-muted-foreground text-sm">No log entries yet</div>
            ) : (
              parseLog.map((log, i) => (
                <div key={i} className="text-xs font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Raw Text Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-orange-800">Raw Extracted Text</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
            >
              {showRawText ? "Hide" : "Show"} Raw Text
            </Button>
          </div>
          {showRawText && (
            <Textarea
              value={extractedText || "No text extracted"}
              className="h-32 font-mono text-xs"
              readOnly
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isProcessing}
            className="flex-1"
          >
            Retry PDF Processing
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log("PDF Debug Info:", {
                file: file.name,
                size: file.size,
                extractedText: extractedText.length,
                perPageText: perPageText.length,
                detectedSections: detectedSections.length,
                parseLog
              });
            }}
            className="flex-1"
          >
            Log Debug Info
          </Button>
        </div>

        {/* Troubleshooting Tips */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Troubleshooting Tips:</strong>
            <ul className="mt-2 list-disc list-inside">
              <li>Check browser console for PDF.js errors</li>
              <li>Ensure PDF has selectable text (not just images)</li>
              <li>Try a different PDF to isolate the issue</li>
              <li>Check if PDF is password protected or corrupted</li>
            </ul>
                     </AlertDescription>
         </Alert>
         </CardContent>
       ) : (
         <CardContent className="py-2">
           <div className="text-center text-sm text-orange-700">
             <div className="flex items-center justify-center gap-2">
               <span>Debug panel collapsed</span>
               <span className="text-xs">• Click header to expand</span>
             </div>
           </div>
         </CardContent>
       )}
     </Card>
   );
 }
