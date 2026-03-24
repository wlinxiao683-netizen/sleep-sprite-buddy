import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSleepPlanContext } from "@/contexts/sleep-plan-context";
import { useStandReminderPreview } from "@/contexts/stand-reminder-preview-context";
import { useStandReminderPopup } from "@/hooks/use-stand-reminder-popup";
import { standReminderTimeFromBedtime } from "@/lib/stand-reminder-time";

const STAND_BODY = "Lulu's a bit tired — could you put me on the stand?";

const GlobalStandReminder = () => {
  const { loaded, hasSleepPlanRow, bedtime } = useSleepPlanContext();
  const { standReminderPreviewSignal } = useStandReminderPreview();

  const standTime = standReminderTimeFromBedtime(bedtime);
  const scheduleEnabled = loaded && hasSleepPlanRow;

  const { open, dismiss, setOpen } = useStandReminderPopup(
    scheduleEnabled,
    standTime,
    standReminderPreviewSignal,
    loaded
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(next);
      }}
    >
      <AlertDialogContent className="rounded-2xl max-w-xs mx-auto">
        <AlertDialogHeader className="space-y-0 sm:space-y-0">
          <AlertDialogTitle className="sr-only">{STAND_BODY}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col items-center gap-0 bg-transparent">
              <div className="relative w-full max-w-[280px] px-0.5">
                <div className="relative rounded-2xl border border-border/50 bg-secondary px-4 py-3 shadow-sm">
                  <p className="text-center text-sm font-medium leading-snug text-foreground">
                    {STAND_BODY}
                  </p>
                  <div
                    className="pointer-events-none absolute left-1/2 top-full z-10 -translate-x-1/2"
                    aria-hidden
                  >
                    <div className="h-0 w-0 border-l-[11px] border-r-[11px] border-t-[13px] border-l-transparent border-r-transparent border-t-secondary" />
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-3">
                <img
                  src="/stand-reminder-lulu.png"
                  alt=""
                  className="w-full max-w-[220px] object-contain bg-transparent select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={dismiss} className="rounded-xl w-full">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GlobalStandReminder;
