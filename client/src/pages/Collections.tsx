import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Collections() {
  const { user, loading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Changed to string
  const [formData, setFormData] = useState({ name: "", description: "", color: "#3b82f6" });

  const { data: collections = [], refetch: refetchCollections } = trpc.collections.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.collections.create.useMutation({
    onSuccess: () => {
      toast.success("Collection created successfully");
      setFormData({ name: "", description: "", color: "#3b82f6" });
      setIsCreateOpen(false);
      refetchCollections();
    },
    onError: () => {
      toast.error("Failed to create collection");
    },
  });

  const updateMutation = trpc.collections.update.useMutation({
    onSuccess: () => {
      toast.success("Collection updated successfully");
      setEditingId(null);
      setFormData({ name: "", description: "", color: "#3b82f6" });
      refetchCollections();
    },
    onError: () => {
      toast.error("Failed to update collection");
    },
  });

  const deleteMutation = trpc.collections.delete.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted successfully");
      refetchCollections();
    },
    onError: () => {
      toast.error("Failed to delete collection");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Collection name is required");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
      });
    }
  };

  const handleEdit = (collection: any) => {
    setEditingId(collection.id);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      color: collection.color || "#3b82f6",
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => { // Changed to string
    if (confirm("Are you sure you want to delete this collection?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Collections</h1>
          <p className="text-slate-600 mt-2">Organize your quotes by source, author, or theme</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", description: "", color: "#3b82f6" });
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Collection" : "Create Collection"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update your collection details" : "Create a new collection to organize your quotes"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Stoicism, Science Fiction, Personal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this collection"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <p className="text-slate-600">No collections yet. Create one to get started!</p>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", description: "", color: "#3b82f6" });
                setIsCreateOpen(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: collection.color || "#3b82f6" }}
                      />
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                    </div>
                    {collection.description && (
                      <CardDescription className="mt-2">{collection.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(collection)}
                    className="flex-1 gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(collection.id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 gap-2"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
