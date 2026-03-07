"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props {
  postToLinkedIn: boolean;
  postToTwitter: boolean;
  dayOfWeek: number;
  postTime: string;
  repeatWeekly: boolean;
  onPostToLinkedInChange: (value: boolean) => void;
  onPostToTwitterChange: (value: boolean) => void;
  onDayOfWeekChange: (value: number) => void;
  onPostTimeChange: (value: string) => void;
  onRepeatWeeklyChange: (value: boolean) => void;
}

export function ScheduleForm(props: Props) {
  const [clockOpen, setClockOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(Number(props.postTime.split(":")[0] ?? 9));
  const [draftMinute, setDraftMinute] = useState(Number(props.postTime.split(":")[1] ?? 0));

  const timeLabel = useMemo(() => {
    const hour = draftHour.toString().padStart(2, "0");
    const minute = draftMinute.toString().padStart(2, "0");
    return `${hour}:${minute}`;
  }, [draftHour, draftMinute]);

  function applyClock() {
    props.onPostTimeChange(timeLabel);
    setClockOpen(false);
  }

  function quickSet(time: string) {
    const [hour, minute] = time.split(":");
    setDraftHour(Number(hour));
    setDraftMinute(Number(minute));
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 transition ${
            props.postToLinkedIn ? "border-[#0a66c2] bg-[#0a66c2]/5 shadow-[0_0_0_3px_rgba(10,102,194,0.2)]" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0a66c2] text-xs font-bold text-white ring-1 ring-black/10">in</span>
            <span className="text-sm font-medium">LinkedIn</span>
          </div>
          <span className={`flex h-5 w-5 items-center justify-center rounded border ${props.postToLinkedIn ? "border-[#0a66c2] bg-[#0a66c2]" : "border-slate-300 bg-white"}`}>
            {props.postToLinkedIn ? <span className="text-xs font-bold text-white">✓</span> : null}
          </span>
          <input type="checkbox" checked={props.postToLinkedIn} onChange={(e) => props.onPostToLinkedInChange(e.target.checked)} className="sr-only" />
        </label>

        <label
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 transition ${
            props.postToTwitter ? "border-slate-900 bg-slate-900/5 shadow-[0_0_0_3px_rgba(15,23,42,0.18)]" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">X</span>
            <span className="text-sm font-medium">X (Twitter)</span>
          </div>
          <span className={`flex h-5 w-5 items-center justify-center rounded border ${props.postToTwitter ? "border-slate-900 bg-slate-900" : "border-slate-300 bg-white"}`}>
            {props.postToTwitter ? <span className="text-xs font-bold text-white">✓</span> : null}
          </span>
          <input type="checkbox" checked={props.postToTwitter} onChange={(e) => props.onPostToTwitterChange(e.target.checked)} className="sr-only" />
        </label>

        <select
          value={props.dayOfWeek}
          onChange={(e) => props.onDayOfWeekChange(Number(e.target.value))}
          className="rounded-xl border border-slate-200 p-3 text-sm"
        >
          <option value={0}>Sunday</option>
          <option value={1}>Monday</option>
          <option value={2}>Tuesday</option>
          <option value={3}>Wednesday</option>
          <option value={4}>Thursday</option>
          <option value={5}>Friday</option>
          <option value={6}>Saturday</option>
        </select>

        <div className="flex gap-2">
          <input
            type="time"
            value={props.postTime}
            onChange={(e) => props.onPostTimeChange(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 p-3 text-sm"
            required
          />
          <Dialog
            open={clockOpen}
            onOpenChange={(open) => {
              if (open) quickSet(props.postTime);
              setClockOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Open clock picker" title="Open clock picker">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6l4 2" />
                </svg>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pick a Time</DialogTitle>
                <DialogDescription>Choose an exact schedule time for your post.</DialogDescription>
              </DialogHeader>

              <div className="mb-5 rounded-xl bg-slate-50 py-5 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-500">Selected Time</p>
                <p className="mt-1 text-4xl font-bold text-primary">{timeLabel}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Hour</span>
                    <span>{draftHour.toString().padStart(2, "0")}</span>
                  </div>
                  <input type="range" min={0} max={23} value={draftHour} onChange={(e) => setDraftHour(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Minute</span>
                    <span>{draftMinute.toString().padStart(2, "0")}</span>
                  </div>
                  <input type="range" min={0} max={59} value={draftMinute} onChange={(e) => setDraftMinute(Number(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {["08:00", "09:00", "12:00", "15:30", "18:00", "21:00"].map((item) => (
                  <Button key={item} type="button" variant="outline" size="sm" onClick={() => quickSet(item)}>
                    {item}
                  </Button>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setClockOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={applyClock}>
                  Apply Time
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 md:col-span-2">
          <input type="checkbox" checked={props.repeatWeekly} onChange={(e) => props.onRepeatWeeklyChange(e.target.checked)} />
          Repeat weekly
        </label>
      </div>

    </>
  );
}
