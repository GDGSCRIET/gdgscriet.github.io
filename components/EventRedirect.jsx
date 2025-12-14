'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EventRedirect({ expiryTime, redirectUrl }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryTime || !redirectUrl) return;

    const now = new Date();
    const expiry = new Date(expiryTime);

    if (now > expiry) {
      setIsExpired(true);
      setTimeLeft(3); // 3 seconds countdown
    }
  }, [expiryTime, redirectUrl]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft === 0) {
      router.push(redirectUrl);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router, redirectUrl]);

  if (!isExpired) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 text-white p-4 text-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col items-center justify-center space-y-1">
        <p className="text-lg font-semibold text-red-400">
          Hi How Are you there!
        </p>
        <p className="text-sm text-gray-300">
          Redirecting to the new page in <span className="font-mono font-bold text-white text-lg mx-1">{timeLeft}</span> seconds...
        </p>
      </div>
    </div>
  );
}
