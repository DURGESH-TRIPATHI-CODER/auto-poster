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
  const [topSelectedTimes, setTopSelectedTimes] = useState<string[]>([]);

  const timeLabel = useMemo(() => {
    const hour = draftHour.toString().padStart(2, "0");
    const minute = draftMinute.toString().padStart(2, "0");
    return `${hour}:${minute}`;
  }, [draftHour, draftMinute]);

  function applyClock() {
    props.onPostTimeChange(timeLabel);
    setTopSelectedTimes((prev) => {
      const next = [timeLabel, ...prev.filter((item) => item !== timeLabel)];
      return next.slice(0, 2);
    });
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
        <button
          type="button"
          onClick={() => props.onPostToLinkedInChange(!props.postToLinkedIn)}
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 transition ${
            props.postToLinkedIn ? "border-[#0a66c2] bg-[#0a66c2]/10 shadow-[0_0_0_3px_rgba(10,102,194,0.2)]" : "border-zinc-700 bg-zinc-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0a66c2] text-xs font-bold text-white ring-1 ring-black/10">in</span>
            <span className="text-sm font-medium">LinkedIn</span>
          </div>
          <span className={`flex h-5 w-5 items-center justify-center rounded border ${props.postToLinkedIn ? "border-[#0a66c2] bg-[#0a66c2]" : "border-zinc-600 bg-zinc-700"}`}>
            {props.postToLinkedIn ? <span className="text-xs font-bold text-white">✓</span> : null}
          </span>
          <input type="checkbox" checked={props.postToLinkedIn} readOnly className="sr-only" />
        </button>

        <button
          type="button"
          onClick={() => props.onPostToTwitterChange(!props.postToTwitter)}
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 transition ${
            props.postToTwitter ? "border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(80,72,229,0.2)]" : "border-zinc-700 bg-zinc-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">X</span>
            <span className="text-sm font-medium">X (Twitter)</span>
          </div>
          <span className={`flex h-5 w-5 items-center justify-center rounded border ${props.postToTwitter ? "border-primary bg-primary" : "border-zinc-600 bg-zinc-700"}`}>
            {props.postToTwitter ? <span className="text-xs font-bold text-white">✓</span> : null}
          </span>
          <input type="checkbox" checked={props.postToTwitter} readOnly className="sr-only" />
        </button>

        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Week Selector</p>
          <div className="grid grid-cols-7 gap-1">
            {[
              { label: "S", value: 0, title: "Sunday" },
              { label: "M", value: 1, title: "Monday" },
              { label: "T", value: 2, title: "Tuesday" },
              { label: "W", value: 3, title: "Wednesday" },
              { label: "T", value: 4, title: "Thursday" },
              { label: "F", value: 5, title: "Friday" },
              { label: "S", value: 6, title: "Saturday" }
            ].map((day) => (
              <button
                key={day.value}
                type="button"
                title={day.title}
                onClick={() => props.onDayOfWeekChange(day.value)}
                className={`h-9 rounded-md text-xs font-semibold transition ${
                  props.dayOfWeek === day.value ? "bg-primary text-white shadow-sm" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <Dialog
          open={clockOpen}
          onOpenChange={(open) => {
            if (open) quickSet(props.postTime);
            setClockOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm hover:border-primary/40 hover:bg-primary/5 transition"
            >
              <span className="font-semibold text-white">{props.postTime}</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6l4 2" />
              </svg>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pick a Time</DialogTitle>
              <DialogDescription>Choose an exact schedule time for your post.</DialogDescription>
            </DialogHeader>

            <div className="mb-5 rounded-xl bg-zinc-800 py-5 text-center">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Selected Time</p>
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

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Top Selected</p>
              <div className="flex flex-wrap gap-2">
                {topSelectedTimes.length === 0 ? (
                  <span className="text-xs text-zinc-500">No selected times yet</span>
                ) : (
                  topSelectedTimes.map((item) => (
                    <Button key={item} type="button" variant="secondary" size="sm" onClick={() => quickSet(item)}>
                      {item}
                    </Button>
                  ))
                )}
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

        <label className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-300 md:col-span-2">
          <input type="checkbox" checked={props.repeatWeekly} onChange={(e) => props.onRepeatWeeklyChange(e.target.checked)} />
          Repeat weekly
        </label>
      </div>

    </>
  );
}
