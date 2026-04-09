import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquareHeart } from 'lucide-react';

const SURVEY_URL = 'https://forms.gle/75kEyaNSmNWqvmEy8';

export function SurveyPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('survey_dismissed') === 'true') return;

    const timer = setTimeout(() => setOpen(true), 60_000);
    return () => clearTimeout(timer);
  }, []);

  const handleTakeSurvey = () => {
    window.open(SURVEY_URL, '_blank');
    localStorage.setItem('survey_dismissed', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center justify-center gap-2">
            <MessageSquareHeart className="h-6 w-6 text-primary" />
            Take the Survey!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please take a moment to complete our survey. Your feedback is essential for evaluating and improving this platform!
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleTakeSurvey} className="w-full gap-2">
              <MessageSquareHeart className="h-4 w-4" /> Take Survey
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-muted-foreground">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
