import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AddQuote() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    text: "",
    source: "",
    author: "",
    pageNumber: "",
    collectionId: "",
  });

  const { data: collections = [] } = trpc.collections.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: () => {
      toast.success("Quote added successfully!");
      setFormData({
        text: "",
        source: "",
        author: "",
        pageNumber: "",
        collectionId: "",
      });
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add quote");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      toast.error("Quote text is required");
      return;
    }

    if (!formData.collectionId) {
      toast.error("Please select a collection");
      return;
    }

    createMutation.mutate({
      text: formData.text,
      source: formData.source || undefined,
      author: formData.author || undefined,
      pageNumber: formData.pageNumber ? parseInt(formData.pageNumber) : undefined,
      collectionId: parseInt(formData.collectionId),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Quote</h1>
          <p className="text-slate-600 mt-2">Add a new quote to your collection</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
          <CardDescription>Fill in the quote information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quote Text */}
            <div className="space-y-2">
              <Label htmlFor="text">Quote Text *</Label>
              <Textarea
                id="text"
                placeholder="Enter the quote text here..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={5}
                required
                className="resize-none"
              />
              <p className="text-sm text-slate-500">
                {formData.text.length} characters
              </p>
            </div>

            {/* Collection */}
            <div className="space-y-2">
              <Label htmlFor="collection">Collection *</Label>
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
                <Select value={formData.collectionId} onValueChange={(value) => setFormData({ ...formData, collectionId: value })}>
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

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="e.g., Marcus Aurelius, Jane Austen"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g., Meditations, Pride and Prejudice, Personal"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>

            {/* Page Number */}
            <div className="space-y-2">
              <Label htmlFor="pageNumber">Page Number</Label>
              <Input
                id="pageNumber"
                type="number"
                placeholder="e.g., 42"
                value={formData.pageNumber}
                onChange={(e) => setFormData({ ...formData, pageNumber: e.target.value })}
                min="1"
              />
            </div>

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
                type="submit"
                disabled={createMutation.isPending || collections.length === 0}
                className="flex-1"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Quote
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
