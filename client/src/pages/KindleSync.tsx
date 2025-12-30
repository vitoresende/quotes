import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface KindleHighlight {
  text: string;
  source?: string;
  author?: string;
  pageNumber?: number;
  kindleHighlightId: string;
}

export default function KindleSync() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [csvContent, setCsvContent] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [syncResult, setSyncResult] = useState<any>(null);
  const [parseError, setParseError] = useState("");

  const { data: collections = [] } = trpc.collections.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: lastSync } = trpc.kindle.getLastSync.useQuery(undefined, {
    enabled: !!user,
  });

  const syncMutation = trpc.kindle.sync.useMutation({
    onSuccess: (result) => {
      setSyncResult(result);
      toast.success(`Sync completed: ${result.added} added, ${result.duplicated} duplicated`);
      setCsvContent("");
    },
    onError: (error) => {
      toast.error(error.message || "Sync failed");
    },
  });

  const parseKindleCSV = (csv: string): KindleHighlight[] => {
    try {
      setParseError("");
      const lines = csv.split("\n").filter((line) => line.trim());
      const highlights: KindleHighlight[] = [];

      // Simple CSV parser - expects: text,author,source,pageNumber
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 1 && parts[0]) {
          highlights.push({
            text: parts[0],
            author: parts[1] || undefined,
            source: parts[2] || undefined,
            pageNumber: parts[3] ? parseInt(parts[3]) : undefined,
            kindleHighlightId: `kindle_${Date.now()}_${Math.random()}`,
          });
        }
      }

      if (highlights.length === 0) {
        setParseError("No valid highlights found in the provided text");
        return [];
      }

      return highlights;
    } catch (error) {
      setParseError("Error parsing highlights. Please check the format.");
      return [];
    }
  };

  const handleSync = async () => {
    if (!selectedCollection) {
      toast.error("Please select a collection");
      return;
    }

    const highlights = parseKindleCSV(csvContent);
    if (highlights.length === 0) {
      toast.error("No valid highlights to sync");
      return;
    }

    syncMutation.mutate({
      highlights,
      collectionId: selectedCollection, // collectionId is now string
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sync Kindle Highlights</h1>
          <p className="text-slate-600 mt-2">Import your Kindle highlights and notes</p>
        </div>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Last sync: {new Date(lastSync.syncedAt).toLocaleDateString()} at{" "}
            {new Date(lastSync.syncedAt).toLocaleTimeString()}
            <br />
            Added: {lastSync.quotesAdded} | Duplicated: {lastSync.quotesDuplicated} | Skipped:{" "}
            {lastSync.quotesSkipped}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">How to Export from Kindle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            1. Go to <a href="https://read.amazon.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">read.amazon.com</a>
          </p>
          <p>2. Open the book you want to export highlights from</p>
          <p>3. Click on "Notes" to see all your highlights</p>
          <p>4. Copy all highlights and paste them below, or use the file upload option</p>
          <p className="font-semibold mt-4">Expected Format (one per line):</p>
          <code className="block bg-white p-2 rounded border border-blue-200 text-xs">
            Quote text here,Author Name,Book Title,Page Number
          </code>
        </CardContent>
      </Card>

      {/* Sync Form */}
      <Card>
        <CardHeader>
          <CardTitle>Import Highlights</CardTitle>
          <CardDescription>Paste or upload your Kindle highlights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Selection */}
          <div className="space-y-2">
            <Label htmlFor="collection">Target Collection *</Label>
            {collections.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  You need to create a collection first.{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate("/collections")}
                  >
                    Create a collection
                  </Button>
                </p>
              </div>
            ) : (
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger id="collection">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
            <p className="text-sm text-slate-500">or paste content below</p>
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <Label htmlFor="highlights">Highlights Text</Label>
            <Textarea
              id="highlights"
              placeholder="Paste your Kindle highlights here (one per line)..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={8}
              className="resize-none font-mono text-sm"
            />
            <p className="text-sm text-slate-500">{csvContent.split("\n").filter((l) => l.trim()).length} lines</p>
          </div>

          {/* Parse Error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Sync Result */}
          {syncResult && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold">Sync completed successfully!</p>
                <p>Added: {syncResult.added} quotes</p>
                <p>Duplicated: {syncResult.duplicated} (skipped)</p>
                {syncResult.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-semibold">Errors:</p>
                    {syncResult.errors.map((error: string, i: number) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending || !csvContent.trim() || !selectedCollection || collections.length === 0}
              className="flex-1 gap-2"
            >
              {syncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {syncMutation.isPending ? "Syncing..." : "Sync Highlights"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
