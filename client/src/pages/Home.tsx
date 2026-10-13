import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatQuoteText } from "@/lib/utils";
import { APP_VERSION } from "@/constants/version";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const isAuthenticated = !!user;
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const utils = trpc.useUtils();

  const { data: randomQuote } = trpc.quotes.getRandom.useQuery(undefined, {
    enabled: isAuthenticated && !loading && !currentQuote,
  });

  const markAsReadMutation = trpc.quotes.markAsRead.useMutation({
    onSuccess: (data: any) => {
      toast.success("Quote marked as read");
      if (data?.readCount !== undefined) {
        const updatedCount = data.readCount;
        setCurrentQuote((prev: any) =>
          prev ? { ...prev, isRead: true, readCount: updatedCount } : prev
        );
        setQuoteHistory((prev) =>
          prev.map((q) =>
            q.id === currentQuote?.id
              ? { ...q, isRead: true, readCount: updatedCount }
              : q
          )
        );
      }
    },
    onError: () => {
      toast.error("Failed to mark quote as read");
    },
  });

  // Load initial quote
  useEffect(() => {
    if (isAuthenticated && randomQuote && !currentQuote) {
      setCurrentQuote(randomQuote);
      setQuoteHistory([randomQuote]);
      setHistoryIndex(0);
    }
  }, [isAuthenticated, randomQuote, currentQuote]);

  const handleNextQuote = async () => {
    setIsLoadingQuote(true);
    try {
      // If we're not at the end of history, move forward
      if (historyIndex < quoteHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCurrentQuote(quoteHistory[nextIndex]);
      } else {
        // Fetch new quote with readCount-weighted algorithm excluding current quote
        const nextQuote = await utils.quotes.getRandom.fetch(
          currentQuote?.id ? { excludeId: currentQuote.id } : undefined
        );
        if (nextQuote) {
          setCurrentQuote(nextQuote);
          setQuoteHistory((prev) => [...prev, nextQuote]);
          setHistoryIndex((prev) => prev + 1);
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
      setCurrentQuote(quoteHistory[prevIndex]);
    }
  };

  const handleMarkAsRead = () => {
    if (currentQuote) {
      const nextCount = (currentQuote.readCount || 0) + 1;
      const updated = { ...currentQuote, isRead: true, readCount: nextCount };
      markAsReadMutation.mutate({ id: currentQuote.id });
      setCurrentQuote(updated);
      setQuoteHistory((prev) =>
        prev.map((q) => (q.id === currentQuote.id ? updated : q))
      );
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
          <p className="text-xs font-mono text-slate-400">
            v{APP_VERSION}
          </p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        {/* Quote Card */}
        <Card className="shadow-xl border-0">
          <CardContent>
            <div className="space-y-6">
              {/* Quote Text */}
              <blockquote
                className="font-serif text-slate-900 italic leading-relaxed"
                dangerouslySetInnerHTML={formatQuoteText(currentQuote.text)}
              />

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
                    <span className="text-sm font-medium">
                      Read {currentQuote.readCount || 1} {(currentQuote.readCount || 1) === 1 ? "time" : "times"}
                    </span>
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

        {/* Navigation Controls: Responsive grid perfectly aligned on mobile and desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePreviousQuote}
            disabled={historyIndex <= 0}
            className="w-full order-1 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2 shrink-0" />
            Previous
          </Button>

          <Button
            size="lg"
            onClick={handleNextQuote}
            disabled={isLoadingQuote}
            className="w-full order-2 sm:order-3 shadow-xs"
          >
            Next
            {isLoadingQuote ? (
              <Loader2 className="w-4 h-4 animate-spin ml-1 sm:ml-2 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 ml-1 sm:ml-2 shrink-0" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleMarkAsRead}
            disabled={markAsReadMutation.isPending}
            className="col-span-2 sm:col-span-1 order-3 sm:order-2 w-full shadow-xs font-medium"
          >
            {markAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" />
            ) : (
              <Eye className="w-4 h-4 mr-2 shrink-0" />
            )}
            Mark as Read
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
                <p className="text-2xl font-bold text-slate-900">
                  {currentQuote.isRead ? Math.max(currentQuote.readCount || 0, 1) : (currentQuote.readCount || 0)}
                </p>
                <p className="text-sm text-slate-600">Times Read</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{historyIndex + 1}</p>
                <p className="text-sm text-slate-600">Position</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Version Display */}
        <div className="text-center pt-2">
          <span className="text-xs font-mono text-slate-400">
            v{APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}
