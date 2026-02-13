'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  compact?: boolean;
}

export default function CountdownTimer({ targetDate, onComplete, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          total: difference
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        onComplete?.();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  if (timeLeft.total <= 0) {
    return (
      <div className={compact ? "countdown-timer-compact expired" : "countdown-timer expired"}>
        <span className="text-red-400 font-bold text-xs">⏰ Time's up!</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="countdown-timer-compact">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-yellow-300">⏰</span>
          {timeLeft.days > 0 && (
            <>
              <span className="text-white font-bold">
                {formatTime(timeLeft.days)}d
              </span>
              <span className="text-white/60">:</span>
            </>
          )}
          <span className="text-white font-bold">
            {formatTime(timeLeft.hours)}h
          </span>
          <span className="text-white/60">:</span>
          <span className="text-white font-bold">
            {formatTime(timeLeft.minutes)}m
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-timer">
      <div className="timer-display">
        <span className="timer-label">⏰ Complete by end of day for points boost!</span>
        <div className="timer-numbers">
          {timeLeft.days > 0 && (
            <>
              <span className="time-unit">
                {formatTime(timeLeft.days)}
                <small>d</small>
              </span>
              <span className="time-separator">:</span>
            </>
          )}
          <span className="time-unit">
            {formatTime(timeLeft.hours)}
            <small>h</small>
          </span>
          <span className="time-separator">:</span>
          <span className="time-unit">
            {formatTime(timeLeft.minutes)}
            <small>m</small>
          </span>
          <span className="time-separator">:</span>
          <span className="time-unit">
            {formatTime(timeLeft.seconds)}
            <small>s</small>
          </span>
        </div>
      </div>
    </div>
  );
}
