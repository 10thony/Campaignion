import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText, Download, AlertCircle, CheckCircle, Eye, MapPin, MousePointer, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as pdfjsLib from "pdfjs-dist/webpack";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  ImportedCharacterData,
  createFormDataFromParsedData,
  mapEquipmentToForm,
  mapActionsToForm
} from "@/lib/characterImport";
import { cn } from "@/lib/utils";
import { uploadPdfViaProxy, getUploadThingToken, setUploadThingToken, type UploadResult } from "@/lib/uploadHandler";
import { PdfDebugPanel } from "./PdfDebugPanel";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.mjs";

// Add error handling for PDF.js
pdfjsLib.GlobalWorkerOptions.workerPort = null;

type AbilityScores = {
  strength: number | null;
  dexterity: number | null;
  constitution: number | null;
  intelligence: number | null;
  wisdom: number | null;
  charisma: number | null;
};

type DetectedSection = {
  id: string;
  title: string;
  pageIndices: number[];
  snippet: string;
  fullText: string;
};

// Enhanced mapping structure for granular text selection
type TextMapping = {
  id: string;
  field: string;
  selectedText: string;
  startIndex: number;
  endIndex: number;
  sectionId: string;
  confidence?: number;
};

const SCHEMA_FIELD_OPTIONS = [
  "name",
  "race",
  "background",
  "class",
  "classes[0].name",
  "classes[0].level",
  "classes[1].name",
  "classes[1].level",
  "subrace",
  "alignment",
  "abilityScores.strength",
  "abilityScores.dexterity",
  "abilityScores.constitution",
  "abilityScores.intelligence",
  "abilityScores.wisdom",
  "abilityScores.charisma",
  "proficiencyBonus",
  "armorClass",
  "maxHitPoints",
  "currentHitPoints",
  "speed",
  "passivePerception",
  "passiveInvestigation",
  "passiveInsight",
  "initiative",
  "skills",
  "traits",
  "racialTraits",
  "languages",
  "spellsKnown",
  "cantripsKnown",
  "features",
  "equipment",
  "weaponProficiencies",
  "armorProficiencies",
  "toolProficiencies",
  "savingThrows",
  "hitDice",
  "experiencePoints",
  "inspiration",
  "deathSaves.successes",
  "deathSaves.failures",
];

interface PdfImportCardProps {
  onImportSuccess: (characterId: string, characterData: ImportedCharacterData) => void;
  onImportError: (error: string) => void;
  disabled?: boolean;
  enableServerImport?: boolean;
}

// Text Selection Mapper Component
function TextSelectionMapper({
  sectionText,
  sectionId,
  onMappingCreate,
  existingMappings,
  onMappingRemove,
}: {
  sectionText: string;
  sectionId: string;
  onMappingCreate: (mapping: TextMapping) => void;
  existingMappings: TextMapping[];
  onMappingRemove: (mappingId: string) => void;
}) {
  const [selectedText, setSelectedText] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      setIsSelecting(false);
    }
  };

  const handleCreateMapping = () => {
    if (!selectedText || !selectedField) return;

    const startIndex = sectionText.indexOf(selectedText);
    if (startIndex === -1) return;

    const mapping: TextMapping = {
      id: editingMappingId || `${sectionId}_${Date.now()}`,
      field: selectedField,
      selectedText,
      startIndex,
      endIndex: startIndex + selectedText.length,
      sectionId,
      confidence: 0.9, // High confidence for manual selection
    };

    if (editingMappingId) {
      // Update existing mapping
      onMappingCreate(mapping);
      setEditingMappingId(null);
    } else {
      // Create new mapping
      onMappingCreate(mapping);
    }
    
    setSelectedText("");
    setSelectedField("");
  };

  const handleEditMapping = (mapping: TextMapping) => {
    setSelectedText(mapping.selectedText);
    setSelectedField(mapping.field);
    setEditingMappingId(mapping.id);
    setIsSelecting(false);
  };

  // Listen for edit mapping events from other components
  useEffect(() => {
    const handleEditMappingEvent = (event: CustomEvent) => {
      const mapping = event.detail;
      handleEditMapping(mapping);
    };

    window.addEventListener('editMapping', handleEditMappingEvent as EventListener);
    return () => {
      window.removeEventListener('editMapping', handleEditMappingEvent as EventListener);
    };
  }, []);

  const handleRemoveMapping = (mappingId: string) => {
    onMappingRemove(mappingId);
  };

  // Highlight existing mappings in the text
  const highlightedText = useMemo(() => {
    if (!sectionText) return "";
    
    let result = sectionText;
    const mappings = existingMappings.filter(m => m.sectionId === sectionId);
    
    // Sort by start index in reverse order to avoid index shifting
    const sortedMappings = [...mappings].sort((a, b) => b.startIndex - a.startIndex);
    
    for (const mapping of sortedMappings) {
      const before = result.substring(0, mapping.startIndex);
      const after = result.substring(mapping.endIndex);
      const highlighted = `<mark class="bg-yellow-200 px-1 rounded border border-yellow-400 cursor-help" title="${mapping.field}: ${mapping.selectedText}" style="display: inline-block; margin: 0 1px;">${mapping.selectedText}</mark>`;
      result = before + highlighted + after;
    }
    
    return result;
  }, [sectionText, existingMappings, sectionId]);

  return (
          <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MousePointer className="w-4 h-4" />
          <Label className="text-sm font-medium">Text Selection & Mapping</Label>
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>How to use:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
              <li>Click "Enable Text Selection" below</li>
              <li>Click and drag to select text in the section</li>
              <li>Choose a character field from the dropdown</li>
              <li>Click "Create Mapping" to save</li>
              <li>Repeat for all the data you want to extract</li>
            </ol>
          </div>
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <strong>Common mapping patterns:</strong>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div><strong>Basic Info:</strong> name, race, class, background, level</div>
              <div><strong>Ability Scores:</strong> strength, dexterity, constitution, intelligence, wisdom, charisma</div>
              <div><strong>Combat:</strong> armorClass, hitPoints, speed, initiative</div>
              <div><strong>Skills:</strong> skills, savingThrows, proficiencies</div>
            </div>
          </div>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Select Text</Label>
          <div className="mt-2 p-3 border rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-2">
              {isSelecting ? (
                <span className="text-blue-600">Click and drag to select text below, then choose a field to map to...</span>
              ) : (
                <span>Click the button below to enable text selection, then select text in the section</span>
              )}
            </div>
            <Button
              variant={isSelecting ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsSelecting(!isSelecting)}
              className="mb-2"
            >
              {isSelecting ? "Cancel Selection" : "Enable Text Selection"}
            </Button>
            
            {isSelecting && (
              <div className="text-xs text-muted-foreground">
                <p>1. Click and drag to select text in the section below</p>
                <p>2. Choose a character field from the dropdown</p>
                <p>3. Click "Create Mapping" to save</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm">Map to Field</Label>
          <div className="mt-2 space-y-2">
            <Select onValueChange={setSelectedField} value={selectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a character field" />
              </SelectTrigger>
              <SelectContent>
                {SCHEMA_FIELD_OPTIONS.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedText && selectedField && (
              <div className="p-2 border rounded bg-green-50">
                <div className="text-xs text-green-800">
                  <strong>Selected:</strong> "{selectedText}"
                </div>
                <div className="text-xs text-green-800">
                  <strong>Field:</strong> {selectedField}
                </div>
                <Button
                  onClick={handleCreateMapping}
                  size="sm"
                  className="mt-2 w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {editingMappingId ? "Update Mapping" : "Create Mapping"}
                </Button>
                {editingMappingId && (
                  <Button
                    onClick={() => {
                      setEditingMappingId(null);
                      setSelectedText("");
                      setSelectedField("");
                    }}
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlighted Text Display */}
      <div>
        <Label className="text-sm">Section Text with Mappings</Label>
        <div 
          className={cn(
            "mt-2 p-3 border rounded-lg max-h-64 overflow-y-auto transition-colors",
            isSelecting 
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" 
              : "bg-background"
          )}
          onMouseUp={isSelecting ? handleTextSelection : undefined}
          style={{ userSelect: isSelecting ? 'text' : 'none' }}
        >
          {isSelecting && (
            <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
              <strong>Text Selection Active:</strong> Click and drag to select text, then choose a field to map to.
            </div>
          )}
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        </div>
      </div>

      {/* Current Mappings for this Section */}
      <div>
        <Label className="text-sm">Current Mappings</Label>
        <div className="mt-2 space-y-2">
          {existingMappings
            .filter(m => m.sectionId === sectionId)
            .map((mapping) => (
              <div key={mapping.id} className="flex items-center justify-between p-2 border rounded bg-blue-50">
                <div className="flex-1">
                  <div className="text-xs font-medium text-blue-800">{mapping.field}</div>
                  <div className="text-xs text-blue-600">"{mapping.selectedText}"</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleEditMapping(mapping)}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleRemoveMapping(mapping.id)}
                    size="sm"
                    variant="outline"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          {existingMappings.filter(m => m.sectionId === sectionId).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No mappings created for this section yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PdfImportCard({ 
  onImportSuccess, 
  onImportError, 
  disabled = false,
  enableServerImport = false
}: PdfImportCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [perPageText, setPerPageText] = useState<string[]>([]);
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  // Enhanced mapping state for granular text selection
  const [textMappings, setTextMappings] = useState<TextMapping[]>([]);
  // Field mapping state
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedFieldText, setSelectedFieldText] = useState<string>("");
  const [isTextSelectionMode, setIsTextSelectionMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [parseLog, setParseLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file selection
  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    setFile(f);
    setUploadResult(null);
    setParseLog([]);
    // Clear all mappings when starting with a new file
    setMappings({});
    setTextMappings([]);
    // Clear field mapping state
    setSelectedField("");
    setSelectedFieldText("");
    setIsTextSelectionMode(false);
    
    // Create object URL for preview
    const url = URL.createObjectURL(f);
    setPdfBlobUrl(url);
    
    // Extract text with timeout
    setParseLog((l) => [...l, `Selected file ${f.name} (${f.size} bytes)`]);
    setIsProcessing(true);
    
    // Add timeout to prevent infinite processing
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      setParseLog((l) => [...l, `Error: PDF processing timed out after 30 seconds. The file may be too large or corrupted.`]);
      onImportError("PDF processing timed out. The file may be too large, corrupted, or the PDF format is not supported.");
    }, 30000); // 30 second timeout
    
    try {
      const ab = await f.arrayBuffer();
      setParseLog((l) => [...l, `Converting file to ArrayBuffer...`]);
      
      const { text, perPage } = await extractTextFromPdf(ab);
      
      // Clear timeout since we succeeded
      clearTimeout(timeoutId);
      
      setExtractedText(text);
      setPerPageText(perPage);
      setParseLog((l) => [...l, `Extracted text from ${perPage.length} page(s)`]);
      setParseLog((l) => [...l, `Total text length: ${text.length} characters`]);
      
      if (text.trim().length === 0) {
        setParseLog((l) => [...l, `Warning: No text extracted from PDF. This might be an image-based PDF.`]);
        onImportError("No text could be extracted from this PDF. It may be an image-based PDF that requires OCR.");
        return;
      }
      
      const sections = detectSectionsInText(text, perPage);
      setDetectedSections(sections);
      setParseLog((l) => [...l, `Detected ${sections.length} sections`]);
      
      if (sections.length > 0) {
        setSelectedSectionId(sections[0].id);
        setSelectedText(sections[0].fullText);
        setParseLog((l) => [...l, `Selected first section: ${sections[0].title}`]);
      } else {
        // If no sections, set whole text as single selectable block
        const fallback: DetectedSection = {
          id: "entire",
          title: "Entire document",
          pageIndices: perPage.map((_, i) => i),
          snippet: text.slice(0, 300),
          fullText: text,
        };
        setDetectedSections([fallback]);
        setSelectedSectionId(fallback.id);
        setSelectedText(fallback.fullText);
        setParseLog((l) => [...l, `No sections detected, using entire document as fallback`]);
      }
    } catch (err: any) {
      // Clear timeout since we got an error
      clearTimeout(timeoutId);
      
      console.error("PDF processing error:", err);
      setParseLog((l) => [...l, `Error extracting text: ${String(err?.message ?? err)}`]);
      setParseLog((l) => [...l, `Stack trace: ${err?.stack || 'No stack trace available'}`]);
      onImportError(`Failed to extract text from PDF: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  }

  // When the user selects a detected section from the UI
  useEffect(() => {
    if (!selectedSectionId) return;
    const sec = detectedSections.find((s) => s.id === selectedSectionId);
    if (sec) setSelectedText(sec.fullText);
  }, [selectedSectionId, detectedSections]);

  // Text mapping handlers
  const handleTextMappingCreate = (mapping: TextMapping) => {
    setTextMappings(prev => [...prev, mapping]);
    setParseLog(prev => [...prev, `Created mapping: ${mapping.field} = "${mapping.selectedText}"`]);
  };

  const handleTextMappingRemove = (mappingId: string) => {
    setTextMappings(prev => prev.filter(m => m.id !== mappingId));
    setParseLog(prev => [...prev, `Removed mapping: ${mappingId}`]);
  };

  const handleClearAllMappings = () => {
    setMappings({});
    setTextMappings([]);
    // Clear field mapping state
    setSelectedField("");
    setSelectedFieldText("");
    setIsTextSelectionMode(false);
    setParseLog(prev => [...prev, `Cleared all mappings`]);
  };

  // Field mapping text selection handler
  const handleFieldMappingTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedFieldText(text);
      setIsTextSelectionMode(false);
    }
  };

  // Create field mapping handler
  const handleCreateFieldMapping = () => {
    if (!selectedField || !selectedFieldText) return;
    
    setMappings(prev => ({ ...prev, [selectedField]: selectedFieldText }));
    setParseLog(prev => [...prev, `Created field mapping: ${selectedField} = "${selectedFieldText}"`]);
    
    // Reset the field mapping state
    setSelectedField("");
    setSelectedFieldText("");
    setIsTextSelectionMode(false);
  };

  // Convert text mappings to character data
  const convertTextMappingsToCharacterData = (mappings: TextMapping[]): ImportedCharacterData => {
    const characterData: any = {
      name: "Unknown Character",
      race: "Unknown Race",
      background: "Unknown Background",
      classes: [{ name: "Unknown Class", level: 1 }],
      level: 1,
      experiencePoints: 0,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      hitPoints: 10,
      armorClass: 10,
      skills: [],
      savingThrows: [],
      proficiencies: [],
      traits: [],
      languages: [],
      speed: "30 ft",
      passivePerception: 10,
      actions: [],
    };

    // Process each mapping
    for (const mapping of mappings) {
      const value = mapping.selectedText.trim();
      
      // Handle nested fields like abilityScores.strength
      if (mapping.field.includes('.')) {
        const parts = mapping.field.split('.');
        let current = characterData;
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
          
          if (arrayMatch) {
            const arrKey = arrayMatch[1];
            const arrIdx = parseInt(arrayMatch[2], 10);
            
            if (!current[arrKey]) current[arrKey] = [];
            if (!current[arrKey][arrIdx]) current[arrKey][arrIdx] = {};
            current = current[arrKey][arrIdx];
          } else {
            if (!current[part]) current[part] = {};
            current = current[part];
          }
        }
        
        const lastPart = parts[parts.length - 1];
        const arrayMatch = lastPart.match(/^([^\[]+)\[(\d+)\]$/);
        
        if (arrayMatch) {
          const arrKey = arrayMatch[1];
          const arrIdx = parseInt(arrayMatch[2], 10);
          
          if (!current[arrKey]) current[arrKey] = [];
          if (!current[arrKey][arrIdx]) current[arrKey][arrIdx] = {};
          current[arrKey][arrIdx] = value;
        } else {
          current[lastPart] = value;
        }
      } else {
        // Handle simple fields
        if (mapping.field === 'level' || mapping.field.includes('level')) {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            characterData[mapping.field] = numValue;
          }
        } else if (mapping.field.includes('abilityScores') || mapping.field.includes('armorClass') || mapping.field.includes('hitPoints')) {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            characterData[mapping.field] = numValue;
          }
        } else if (mapping.field === 'skills' || mapping.field === 'traits' || mapping.field === 'languages') {
          // Handle comma-separated lists
          characterData[mapping.field] = value.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        } else {
          characterData[mapping.field] = value;
        }
      }
    }

    // Post-process to ensure required fields are present
    if (characterData.name === "Unknown Character" && mappings.some(m => m.field === "name")) {
      const nameMapping = mappings.find(m => m.field === "name");
      if (nameMapping) {
        characterData.name = nameMapping.selectedText.trim();
      }
    }

    // Ensure classes array is properly structured
    if (characterData.classes && characterData.classes.length > 0) {
      characterData.classes = characterData.classes.map((cls: any) => ({
        name: cls.name || "Unknown Class",
        level: typeof cls.level === 'number' ? cls.level : 1,
        hitDie: cls.hitDie || 'd8',
        features: cls.features || [],
        subclass: cls.subclass || undefined,
      }));
    }

    // Calculate total level if multiple classes
    if (characterData.classes && characterData.classes.length > 1) {
      characterData.level = characterData.classes.reduce((sum: number, cls: any) => sum + (cls.level || 1), 0);
    }

    return characterData as ImportedCharacterData;
  };

  // Upload to server (server route proxies to UploadThing using UPLOADTHING_TOKEN)
  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    
    try {
      // Use the upload handler with fallback to direct UploadThing
      const result = await uploadPdfViaProxy(file);
      
      if (result.success) {
        setUploadResult(result);
        setParseLog((l) => [...l, `Uploaded file successfully: ${result.message}`]);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      setParseLog((l) => [...l, `Upload error: ${String(err?.message ?? err)}`]);
      onImportError(`Upload failed: ${err?.message || err}`);
    } finally {
      setUploading(false);
    }
  }

  // Map selected section text to a schema field
  function handleMapToField(field: string) {
    if (!selectedText) return;
    setMappings((m) => ({ ...m, [field]: selectedText }));
  }

  // Remove mapping
  function removeMapping(field: string) {
    setMappings((m) => {
      const copy = { ...m };
      delete copy[field];
      return copy;
    });
  }

  // Create character data from mappings
  const previewObject = useMemo(() => {
    const out: any = {};
    for (const [k, v] of Object.entries(mappings)) {
      setDeepValue(out, k, typeof v === "string" ? v.trim() : v);
    }
    return out;
  }, [mappings]);

  // Handle final import
  const handleFinalImport = () => {
    try {
      let characterData: ImportedCharacterData;
      
      // Use text mappings if available, otherwise fall back to old mapping system
      if (textMappings.length > 0) {
        characterData = convertTextMappingsToCharacterData(textMappings);
        setParseLog(prev => [...prev, `Importing character using ${textMappings.length} text mappings`]);
      } else {
        // Convert the preview object to the expected ImportedCharacterData format
        characterData = convertMappingsToCharacterData(previewObject);
        setParseLog(prev => [...prev, `Importing character using legacy mapping system`]);
      }
      
      if (enableServerImport) {
        // TODO: Implement server-side import
        onImportSuccess('', characterData);
      } else {
        // Transform parsed data to form format for preview/editing
        const formData = createFormDataFromParsedData(characterData);
        onImportSuccess('', { ...characterData, formData });
      }
    } catch (error: any) {
      onImportError(`Import failed: ${error?.message || error}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          PDF Character Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePickFile}
              disabled={disabled}
              className="flex-1"
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading || disabled}
              variant="outline"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
          
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              File uploaded successfully! {uploadResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Mapping Summary */}
        {(Object.keys(mappings).length > 0 || textMappings.length > 0) && (
          <Alert className="border-blue-200 bg-blue-50">
            <MapPin className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Mapping Progress:</strong> {textMappings.length} text selections + {Object.keys(mappings).length} legacy mappings
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearAllMappings}
                    size="sm"
                    variant="outline"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleFinalImport}
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import Character
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Token Configuration (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-2">
            <Label>UploadThing Token (Development)</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your UploadThing token"
                defaultValue={getUploadThingToken() || ''}
                onChange={(e) => setUploadThingToken(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const token = getUploadThingToken();
                  if (token) {
                    setParseLog((l) => [...l, `Token configured: ${token.substring(0, 8)}...`]);
                  }
                }}
              >
                Test Token
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your token from <a href="https://uploadthing.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">UploadThing Dashboard</a>
            </p>
          </div>
        )}

        {/* Main Content */}
        {file && (
                      <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview">PDF Preview</TabsTrigger>
                <TabsTrigger value="sections">Text Sections</TabsTrigger>
                <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                <TabsTrigger value="textSelection">Text Selection</TabsTrigger>
              </TabsList>

            {/* PDF Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
                {pdfBlobUrl ? (
                  <iframe
                    title="pdf-preview"
                    src={pdfBlobUrl}
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No PDF selected
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Text Sections Tab */}
            <TabsContent value="sections" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Detected Sections</Label>
                  <ScrollArea className="h-64 border rounded-md p-2">
                    {isProcessing ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-4"></div>
                        <div className="text-muted-foreground text-sm">Processing PDF...</div>
                        <div className="text-xs text-muted-foreground mt-2">This may take a few moments</div>
                      </div>
                    ) : detectedSections.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground text-sm mb-4">No sections detected</div>
                        <div className="text-xs text-muted-foreground mb-4">
                          This could mean:
                          <ul className="mt-2 text-left">
                            <li>• PDF has no extractable text</li>
                            <li>• PDF is image-based (requires OCR)</li>
                            <li>• PDF format is not supported</li>
                          </ul>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (file) {
                              handlePickFile({ target: { files: [file] } } as any);
                            }
                          }}
                        >
                          Retry Processing
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detectedSections.map((s) => (
                          <div key={s.id} className="p-2 border rounded cursor-pointer hover:bg-muted">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="detected"
                                checked={selectedSectionId === s.id}
                                onChange={() => setSelectedSectionId(s.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{s.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  Pages: {s.pageIndices.join(", ")}
                                </div>
                                <div className="text-sm mt-1">{s.snippet}</div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div>
                  <Label>Selected Section Text</Label>
                  <Textarea
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    className="h-64 font-mono text-sm"
                    placeholder="Select a section to view its text content..."
                  />
                </div>
              </div>
            </TabsContent>

                          {/* Field Mapping Tab */}
              <TabsContent value="mapping" className="space-y-6">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                      <strong>Field Mapping Process:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                        <li>Select a character field from the dropdown below</li>
                        <li>Choose a section from the detected sections</li>
                        <li>Select specific text within that section</li>
                        <li>Click "Create Mapping" to save the field-to-text mapping</li>
                      </ol>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedField("");
                        setSelectedFieldText("");
                        setIsTextSelectionMode(false);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Reset Process
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Step 1: Field Selection */}
                  <div>
                    <Label className="text-sm font-medium">Step 1: Select Character Field</Label>
                    <div className="mt-2">
                      <Select onValueChange={(value) => {
                        // Store the selected field for mapping
                        setSelectedField(value);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a character field" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEMA_FIELD_OPTIONS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Step 2: Section Selection */}
                  <div>
                    <Label className="text-sm font-medium">Step 2: Select Section</Label>
                    <div className="mt-2">
                      <Select onValueChange={(sectionId) => {
                        setSelectedSectionId(sectionId);
                        const section = detectedSections.find(s => s.id === sectionId);
                        if (section) {
                          setSelectedText(section.fullText);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {detectedSections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Step 3: Text Selection */}
                  <div>
                    <Label className="text-sm font-medium">Step 3: Select Text</Label>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedField && selectedSectionId) {
                            // Enable text selection mode
                            setIsTextSelectionMode(true);
                          }
                        }}
                        disabled={!selectedField || !selectedSectionId}
                        className="w-full"
                      >
                        <MousePointer className="w-4 h-4 mr-2" />
                        Enable Text Selection
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Text Selection Area */}
                {selectedField && selectedSectionId && selectedText && (
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium">Text Selection Area</Label>
                    <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">
                        {isTextSelectionMode ? (
                          <span className="text-blue-600">Click and drag to select text below, then click "Create Mapping"</span>
                        ) : (
                          <span>Click "Enable Text Selection" above to start selecting text</span>
                        )}
                      </div>
                      
                      <div 
                        className={cn(
                          "p-3 border rounded-lg max-h-64 overflow-y-auto transition-colors",
                          isTextSelectionMode 
                            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" 
                            : "bg-background"
                        )}
                        onMouseUp={isTextSelectionMode ? handleFieldMappingTextSelection : undefined}
                        style={{ userSelect: isTextSelectionMode ? 'text' : 'none' }}
                      >
                        {isTextSelectionMode && (
                          <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
                            <strong>Text Selection Active:</strong> Click and drag to select text, then click "Create Mapping"
                          </div>
                        )}
                        <div className="text-sm leading-relaxed">
                          {selectedText}
                        </div>
                      </div>

                      {selectedFieldText && (
                        <div className="mt-3 p-2 border rounded bg-green-50">
                          <div className="text-xs text-green-800">
                            <strong>Selected Text:</strong> "{selectedFieldText}"
                          </div>
                          <div className="text-xs text-green-800">
                            <strong>Field:</strong> {selectedField}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={handleCreateFieldMapping}
                              size="sm"
                              className="flex-1"
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              Create Mapping
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedFieldText("");
                                setIsTextSelectionMode(false);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Reset Selection
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Mappings Display */}
                <div className="border-t pt-6">
                  <Label className="text-sm font-medium">Current Field Mappings</Label>
                  <div className="mt-2 space-y-2">
                    {Object.keys(mappings).length === 0 ? (
                      <div className="text-muted-foreground text-sm text-center py-4">
                        No field mappings created yet
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {Object.entries(mappings).map(([field, text]) => (
                          <div key={field} className="flex items-center justify-between p-3 border rounded bg-blue-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              </div>
                              <div className="text-sm font-medium">"{text}"</div>
                            </div>
                            <Button
                              onClick={() => removeMapping(field)}
                              size="sm"
                              variant="outline"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Character Preview */}
                {Object.keys(mappings).length > 0 && (
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium">Character Data Preview</Label>
                    <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                      <ScrollArea className="h-48">
                        <pre className="text-xs">
                          {JSON.stringify(previewObject, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {Object.keys(mappings).length > 0 && (
                  <div className="border-t pt-6">
                    <div className="flex justify-end">
                      <Button
                        onClick={handleFinalImport}
                        className="w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Import Character from Field Mappings
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Text Selection Tab */}
              <TabsContent value="textSelection" className="space-y-6">
                {selectedSectionId ? (
                  <TextSelectionMapper
                    sectionText={selectedText}
                    sectionId={selectedSectionId}
                    onMappingCreate={handleTextMappingCreate}
                    existingMappings={textMappings}
                    onMappingRemove={handleTextMappingRemove}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Please select a section from the "Text Sections" tab first</p>
                  </div>
                )}

                {/* All Text Mappings Summary */}
                <div className="border-t pt-6">
                  <Label className="text-sm font-medium">All Text Mappings Summary</Label>
                  <div className="mt-2 space-y-2">
                    {textMappings.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No text mappings created yet
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {textMappings.map((mapping) => {
                          const section = detectedSections.find(s => s.id === mapping.sectionId);
                          return (
                            <div key={mapping.id} className="flex items-center justify-between p-3 border rounded bg-green-50">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {mapping.field}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    from {section?.title || 'Unknown Section'}
                                  </span>
                                </div>
                                <div className="text-sm font-medium">"{mapping.selectedText}"</div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => {
                                    // Switch to text selection tab and edit this mapping
                                    const textSelectionTab = document.querySelector('[value="textSelection"]') as HTMLButtonElement;
                                    if (textSelectionTab) {
                                      textSelectionTab.click();
                                      // Set the section and edit the mapping
                                      setSelectedSectionId(mapping.sectionId);
                                      setTimeout(() => {
                                        const section = detectedSections.find(s => s.id === mapping.sectionId);
                                        if (section) {
                                          setSelectedText(section.fullText);
                                          // Trigger edit mode in the TextSelectionMapper
                                          const event = new CustomEvent('editMapping', { detail: mapping });
                                          window.dispatchEvent(event);
                                        }
                                      }, 100);
                                    }
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleTextMappingRemove(mapping.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Import Button for Text Mappings */}
                  {textMappings.length > 0 && (
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleFinalImport}
                        className="w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Import Character from Text Mappings
                      </Button>
                    </div>
                  )}

                  {/* Character Data Preview */}
                  {textMappings.length > 0 && (
                    <div className="border-t pt-6">
                      <Label className="text-sm font-medium">Character Data Preview</Label>
                      <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                        <ScrollArea className="h-48">
                          <pre className="text-xs">
                            {JSON.stringify(convertTextMappingsToCharacterData(textMappings), null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
          </Tabs>
        )}

        {/* Debug Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && file && (
          <PdfDebugPanel
            file={file}
            extractedText={extractedText}
            perPageText={perPageText}
            detectedSections={detectedSections}
            parseLog={parseLog}
            isProcessing={isProcessing}
            onRetry={() => {
              if (file) {
                handlePickFile({ target: { files: [file] } } as any);
              }
            }}
          />
        )}

        {/* Parse Log */}
        {parseLog.length > 0 && (
          <div className="space-y-2">
            <Label>Parse Log</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              {parseLog.map((l, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  • {l}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Utilities ---------- */

/**
 * Extract text from PDF using pdf.js (per-page and concatenated text).
 */
async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<{ text: string; perPage: string[] }> {
  try {
    console.log("Starting PDF text extraction...");
    
    // Create loading task with error handling
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0, // Reduce console noise
      disableWorker: false, // Ensure worker is enabled
    });
    
    console.log("Loading PDF document...");
    const pdf: PDFDocumentProxy = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    const numPages = pdf.numPages;
    const pageTexts: string[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      try {
        console.log(`Processing page ${i}/${numPages}...`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        if (!content || !content.items) {
          console.warn(`Page ${i} has no content items`);
          pageTexts.push("");
          continue;
        }
        
        const strings = content.items
          .map((it: any) => {
            if (typeof it === "string") return it;
            if (it && typeof it === "object" && it.str !== undefined) return it.str;
            if (it && typeof it === "object" && it.text !== undefined) return it.text;
            return "";
          })
          .filter(str => str && str.trim().length > 0)
          .join(" ");
        
        console.log(`Page ${i} extracted ${strings.length} characters`);
        pageTexts.push(strings);
        
      } catch (pageError: any) {
        console.error(`Error processing page ${i}:`, pageError);
        pageTexts.push(`[Error processing page ${i}: ${pageError.message}]`);
      }
    }
    
    const text = pageTexts.join("\n---PAGE---\n");
    console.log(`Text extraction complete. Total characters: ${text.length}`);
    
    return { text, perPage: pageTexts };
    
  } catch (error: any) {
    console.error("PDF text extraction failed:", error);
    
    // Provide more specific error messages
    if (error.name === "PasswordException") {
      throw new Error("PDF is password protected. Please remove the password and try again.");
    } else if (error.name === "InvalidPDFException") {
      throw new Error("Invalid PDF file. Please check if the file is corrupted.");
    } else if (error.name === "MissingPDFException") {
      throw new Error("PDF file is missing or empty.");
    } else if (error.name === "UnexpectedResponseException") {
      throw new Error("PDF file format is not supported or corrupted.");
    } else {
      throw new Error(`PDF processing failed: ${error.message || error}`);
    }
  }
}

/**
 * Detect logical sections in the extracted text.
 */
function detectSectionsInText(fullText: string, perPage: string[]): DetectedSection[] {
  const sections: DetectedSection[] = [];

  // Search for header patterns across fullText
  const headerPatterns: { regex: RegExp; canonical: string }[] = [
    { regex: /===\s*ACTIONS\s*===/gi, canonical: "ACTIONS" },
    { regex: /FEATURES\s*&\s*TRAITS/gi, canonical: "FEATURES & TRAITS" },
    { regex: /ADDITIONAL\s+FEATURES\s*&\s*TRAITS/gi, canonical: "ADDITIONAL FEATURES & TRAITS" },
    { regex: /EQUIPMENT/gi, canonical: "EQUIPMENT" },
    { regex: /ADDITIONAL\s+EQUIPMENT/gi, canonical: "ADDITIONAL EQUIPMENT" },
    { regex: /===\s*SPELLCASTING\s*===/gi, canonical: "SPELLCASTING" },
    { regex: /CANTRIPS/gi, canonical: "CANTRIPS" },
    { regex: /\b[0-9]{1,2}(?:st|nd|rd|th)\s+LEVEL\b/gi, canonical: "SPELL LEVEL" },
    { regex: /LANGUAGES/gi, canonical: "LANGUAGES" },
    { regex: /SENSES|DARKVISION|BLINDSIGHT/gi, canonical: "SENSES" },
  ];

  const lowered = fullText.toLowerCase();

  for (const pat of headerPatterns) {
    let match: RegExpExecArray | null;
    const idsSeen = new Set<number>();
    
    while ((match = pat.regex.exec(lowered)) !== null) {
      const idx = match.index;
      if (idsSeen.has(idx)) continue;
      idsSeen.add(idx);

      // Capture from the match index up to next header or next 1500 chars
      const nextHeader = findNextHeaderIndex(lowered, pat.regex, idx);
      const sliceEnd = nextHeader !== -1 ? nextHeader : Math.min(lowered.length, idx + 2000);
      const slice = lowered.slice(idx, sliceEnd).trim();

      // Find which pages this header occurs on
      const pages: number[] = [];
      perPage.forEach((p, i) => {
        if (p.toLowerCase().includes(match![0].toLowerCase().replace(/\s+/g, " "))) {
          pages.push(i + 1);
        }
      });

      sections.push({
        id: `${pat.canonical}_${idx}`,
        title: pat.canonical,
        pageIndices: pages.length > 0 ? pages : [1],
        snippet: slice.slice(0, 400) + (slice.length > 400 ? "…" : ""),
        fullText: slice,
      });
    }
  }

  // De-duplicate and sort by first page index
  const uniq: Record<string, DetectedSection> = {};
  for (const s of sections) {
    if (!uniq[s.title + s.pageIndices.join(",")]) {
      uniq[s.title + s.pageIndices.join(",")] = s;
    }
  }
  
  const arr = Object.values(uniq).sort((a, b) => 
    (a.pageIndices[0] - b.pageIndices[0]) || a.title.localeCompare(b.title)
  );

  // Fallback for Actions if not found
  if (!arr.find((s) => s.title === "ACTIONS")) {
    const actionsIndex = lowered.search(/\b(Breath Weapon|Attack|Unarmed Strike|Flurry of Blows|Scimitar|Shortsword|Eldritch Blast)\b/i);
    if (actionsIndex !== -1) {
      const slice = lowered.slice(Math.max(0, actionsIndex - 80), Math.min(lowered.length, actionsIndex + 1200));
      arr.unshift({
        id: `ACTIONS_fallback_${actionsIndex}`,
        title: "ACTIONS (fallback)",
        pageIndices: [1],
        snippet: slice.slice(0, 300),
        fullText: slice,
      });
    }
  }

  return arr;
}

function findNextHeaderIndex(text: string, currentRegex: RegExp, fromIndex: number) {
  const header = /===\s*[A-Z0-9 &()'\/-]+?\s*===/g;
  header.lastIndex = fromIndex + 1;
  const m = header.exec(text);
  return m ? m.index : -1;
}

/* Utility: set nested dotted property into object (handles arrays like classes[0].name) */
function setDeepValue(obj: any, dottedKey: string, value: any) {
  const parts = dottedKey.split(".");
  let cur = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const arrKey = arrayMatch[1];
      const arrIdx = parseInt(arrayMatch[2], 10);
      
      if (!cur[arrKey]) cur[arrKey] = [];
      if (!cur[arrKey][arrIdx]) cur[arrKey][arrIdx] = {};
      
      if (i === parts.length - 1) {
        cur[arrKey][arrIdx] = value;
      } else {
        cur = cur[arrKey][arrIdx];
      }
    } else {
      if (i === parts.length - 1) {
        cur[part] = value;
      } else {
        if (!cur[part]) cur[part] = {};
        cur = cur[part];
      }
    }
  }
}

/**
 * Convert mappings to ImportedCharacterData format
 */
function convertMappingsToCharacterData(mappings: any): ImportedCharacterData {
  // This is a basic conversion - you may want to enhance this based on your needs
  const characterData: ImportedCharacterData = {
    name: mappings.name || "Unknown Character",
    race: mappings.race || "Unknown Race",
    background: mappings.background || "Unknown Background",
    classes: mappings.classes || [{ name: "Unknown Class", level: 1 }],
    level: mappings.level || 1,
    experiencePoints: 0,
    abilityScores: {
      strength: mappings.abilityScores?.strength || 10,
      dexterity: mappings.abilityScores?.dexterity || 10,
      constitution: mappings.abilityScores?.constitution || 10,
      intelligence: mappings.abilityScores?.intelligence || 10,
      wisdom: mappings.abilityScores?.wisdom || 10,
      charisma: mappings.abilityScores?.charisma || 10,
    },
    hitPoints: mappings.maxHitPoints || mappings.currentHitPoints || 10,
    armorClass: mappings.armorClass || 10,
    skills: mappings.skills ? mappings.skills.split(',').map((s: string) => s.trim()) : [],
    savingThrows: [],
    proficiencies: [],
    traits: mappings.traits ? mappings.traits.split(',').map((s: string) => s.trim()) : [],
    languages: mappings.languages ? mappings.languages.split(',').map((s: string) => s.trim()) : [],
    speed: mappings.speed || "30 ft",
    passivePerception: mappings.passivePerception || 10,
    actions: mappings.actions ? mappings.actions.split(',').map((s: string) => s.trim()) : [],
  };

  return characterData;
}
