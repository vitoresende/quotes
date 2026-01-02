import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Trash2, Loader2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { formatQuoteText } from "@/lib/utils"; // Adicionar esta linha

interface CollectionDetailProps {
  params: {
    id: string;
  };
}

export default function CollectionDetail({ params }: CollectionDetailProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const collectionId = params.id; // Changed to string
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ name: "", description: "", color: "#3b82f6" });

  const { data: collection, refetch: refetchCollection } = trpc.collections.get.useQuery(
    { id: collectionId },
    { enabled: !!user }
  );

  const { data: quotes = [], refetch: refetchQuotes } = trpc.quotes.listByCollection.useQuery(
    { collectionId },
    { enabled: !!user }
  );

  const updateMutation = trpc.collections.update.useMutation({
    onSuccess: () => {
      toast.success("Collection updated successfully");
      setIsEditOpen(false);
      refetchCollection();
    },
    onError: () => {
      toast.error("Failed to update collection");
    },
  });

  const deleteMutation = trpc.collections.delete.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted successfully");
      navigate("/collections");
    },
    onError: () => {
      toast.error("Failed to delete collection");
    },
  });

  const deleteQuoteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Quote deleted successfully");
      refetchQuotes();
    },
    onError: () => {
      toast.error("Failed to delete quote");
    },
  });

  useEffect(() => {
    if (collection) {
      setEditData({
        name: collection.name,
        description: collection.description || "",
        color: collection.color || "#3b82f6",
      });
    }
  }, [collection]);

  const handleUpdateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    updateMutation.mutate({
      id: collectionId,
      name: editData.name,
      description: editData.description || undefined,
      color: editData.color,
    });
  };

  const handleDeleteCollection = () => {
    if (confirm("Are you sure you want to delete this collection and all its quotes?")) {
      deleteMutation.mutate({ id: collectionId });
    }
  };

  const handleDeleteQuote = (quoteId: string) => { // Changed to string
    if (confirm("Are you sure you want to delete this quote?")) {
      deleteQuoteMutation.mutate({ id: quoteId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/collections")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </Button>
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-slate-600">Collection not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/collections")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: collection.color || "#3b82f6" }}
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{collection.name}</h1>
              {collection.description && (
                <p className="text-slate-600 mt-1">{collection.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Collection</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateCollection} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <input
                      id="color"
                      type="color"
                      value={editData.color}
                      onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                      className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={editData.color}
                      onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Update
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteCollection}
            disabled={deleteMutation.isPending}
            className="gap-2"
          >
            {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-slate-600">{quotes.length} quotes in this collection</p>
        <Button onClick={() => navigate("/add-quote")} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Quote
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <p className="text-slate-600">No quotes in this collection yet</p>
            <Button onClick={() => navigate("/add-quote")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add First Quote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <blockquote
                    className="text-lg font-serif text-slate-900 italic"
                    dangerouslySetInnerHTML={formatQuoteText(quote.text)}
                  />
                  <div className="space-y-1 text-sm text-slate-600">
                    {quote.author && <p><span className="font-semibold">Author:</span> {quote.author}</p>}
                    {quote.source && <p><span className="font-semibold">Source:</span> {quote.source}</p>}
                    {quote.pageNumber && <p><span className="font-semibold">Page:</span> {quote.pageNumber}</p>}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-slate-500">
                      {quote.isRead ? (
                        <span className="text-green-600 font-medium">Read {quote.readCount} times</span>
                      ) : (
                        <span>Not read yet</span>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuote(quote.id)}
                      disabled={deleteQuoteMutation.isPending}
                      className="gap-2"
                    >
                      {deleteQuoteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
