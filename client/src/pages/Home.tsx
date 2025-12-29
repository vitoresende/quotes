import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const isAuthenticated = !!user;
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { data: randomQuote, refetch: refetchQuote } = trpc.quotes.getRandom.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  const markAsReadMutation = trpc.quotes.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Quote marked as read");
    },
    onError: () => {
      toast.error("Failed to mark quote as read");
    },
  });

  // Load initial quote
  useEffect(() => {
    if (isAuthenticated && randomQuote && !currentQuote) {
      setCurrentQuote(randomQuote);
      setQuoteHistory([randomQuote.id]);
      setHistoryIndex(0);
    }
  }, [isAuthenticated, randomQuote, currentQuote]);

  // Update current quote when navigating history
  useEffect(() => {
    if (historyIndex >= 0 && historyIndex < quoteHistory.length && quoteHistory.length > 0) {
      // In a real app, we'd fetch the quote details, but for now we'll use the current quote
      // This is simplified - you might want to cache quotes or fetch them
    }
  }, [historyIndex, quoteHistory]);

  const handleNextQuote = async () => {
    setIsLoadingQuote(true);
    try {
      // If we're not at the end of history, move forward
      if (historyIndex < quoteHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        const quoteId = quoteHistory[nextIndex];
        // Get quote from current quote's data if available, otherwise refetch
        const quote = currentQuote.id === quoteId ? currentQuote : randomQuote;
        if (quote) {
          setCurrentQuote(quote);
          setHistoryIndex(nextIndex);
        }
      } else {
        // Get a new random quote
        const result = await refetchQuote();
        if (result.data) {
          setCurrentQuote(result.data);
          setQuoteHistory([...quoteHistory, result.data.id]);
          setHistoryIndex(quoteHistory.length);
        }
      }
    } catch (error) {
      toast.error("Failed to load next quote");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handlePreviousQuote = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
    }
  };

  const handleMarkAsRead = () => {
    if (currentQuote) {
      markAsReadMutation.mutate({ id: currentQuote.id });
      setCurrentQuote({ ...currentQuote, isRead: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full text-center space-y-6 mx-auto">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Quote Keeper</h1>
            <p className="text-lg text-slate-600">Discover and collect meaningful quotes</p>
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-slate-600 mb-6">
                Sign in with your Google account to start collecting and discovering quotes from your favorite books.
              </p>
              <Button
                onClick={signInWithGoogle}
                size="lg"
                className="w-full"
              >
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentQuote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="max-w-md w-full mx-auto">
          <CardHeader>
            <CardTitle>No Quotes Yet</CardTitle>
            <CardDescription>Start by adding your first quote or syncing from Kindle</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Use the menu to add quotes manually or synchronize your Kindle highlights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Quote Card */}
        <Card className="shadow-xl border-0">
          <CardContent className="pt-12 pb-12">
            <div className="space-y-6">
              {/* Quote Text */}
              <blockquote className="text-2xl md:text-3xl font-serif text-slate-900 italic leading-relaxed">
                "{currentQuote.text}"
              </blockquote>

              {/* Source Information */}
              <div className="space-y-2 border-t pt-6">
                {currentQuote.author && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Author:</span> {currentQuote.author}
                  </p>
                )}
                {currentQuote.source && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Source:</span> {currentQuote.source}
                  </p>
                )}
                {currentQuote.pageNumber && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Page:</span> {currentQuote.pageNumber}
                  </p>
                )}
              </div>

              {/* Read Status */}
              <div className="flex items-center gap-2 pt-4">
                {currentQuote.isRead ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Read {currentQuote.readCount} times</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <EyeOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Not read yet</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-4">
            <Button
            variant="outline"
            size="lg"
            onClick={handlePreviousQuote}
            disabled={historyIndex <= 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleMarkAsRead}
            disabled={currentQuote.isRead || markAsReadMutation.isPending}
            className="flex-1"
          >
            {markAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Mark as Read"
            )}
          </Button>

          <Button
            size="lg"
            onClick={handleNextQuote}
            disabled={isLoadingQuote}
            className="flex-1"
          >
            {isLoadingQuote ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            Next
          </Button>
        </div>

        {/* Stats */}
        <Card className="bg-slate-100 border-0">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{quoteHistory.length}</p>
                <p className="text-sm text-slate-600">Viewed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{currentQuote.readCount || 0}</p>
                <p className="text-sm text-slate-600">Times Read</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{historyIndex + 1}</p>
                <p className="text-sm text-slate-600">Position</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
