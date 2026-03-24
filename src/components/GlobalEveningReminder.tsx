import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppTab } from "@/contexts/app-tab-context";
import { useEveningReminderSettings } from "@/contexts/evening-reminder-context";
import { useEveningReminderPopup } from "@/hooks/use-evening-reminder-popup";
import { parseHHmm } from "@/lib/evening-reminder-storage";

function formatReminderTimeLabel(hhmm: string): string {
  const { hour, minute } = parseHHmm(hhmm);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour >= 12 ? "PM" : "AM";
  if (minute === 0) return `${h12}:00 ${period}`;
  return `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

const GlobalEveningReminder = () => {
  const { goToPlan } = useAppTab();
  const { eveningReminderEnabled, eveningReminderTime, eveningReminderImmediateSignal } =
    useEveningReminderSettings();
  const { open, dismiss, setOpen } = useEveningReminderPopup(
    eveningReminderEnabled,
    eveningReminderTime,
    eveningReminderImmediateSignal
  );

  const handleGoToPlan = () => {
    dismiss();
    goToPlan();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        setOpen(next);
      }}
    >
      <AlertDialogContent className="rounded-2xl max-w-xs mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg">
            Daily sleep reminder
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            It&apos;s {formatReminderTimeLabel(eveningReminderTime)} ({eveningReminderTime}) — time
            to set tonight&apos;s bedtime and wake time on the Plan tab. You can change this reminder
            time in Profile anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleGoToPlan();
            }}
            className="rounded-xl w-full"
          >
            Open Plan
          </AlertDialogAction>
          <AlertDialogCancel onClick={dismiss} className="rounded-xl w-full mt-0">
            Later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GlobalEveningReminder;
