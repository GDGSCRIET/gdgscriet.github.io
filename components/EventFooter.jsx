'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EventFooter({ 
  cta, 
  ctaLink, 
  expiryTime, 
  redirectUrl, 
  liveTime, 
  liveUrl, 
  liveCta, 
  autoRedirectOnLive 
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('upcoming'); // 'upcoming', 'live', 'expired'

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      );
      
      // Check Expiry first (highest priority)
      if (expiryTime && now > new Date(expiryTime)) {
        if (status !== 'expired') {
          setStatus('expired');
          if (redirectUrl) setTimeLeft(3);
        }
        return;
      }

      // Check Live
      if (liveTime && now > new Date(liveTime)) {
        if (status !== 'live') {
          setStatus('live');
          if (autoRedirectOnLive && liveUrl) setTimeLeft(3);
        }
        return;
      }

      setStatus('upcoming');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [expiryTime, liveTime, redirectUrl, liveUrl, autoRedirectOnLive, status]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft === 0) {
      if (status === 'expired' && redirectUrl) {
        router.push(redirectUrl);
      } else if (status === 'live' && autoRedirectOnLive && liveUrl) {
        router.push(liveUrl);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router, redirectUrl, liveUrl, status, autoRedirectOnLive]);

  // Determine content based on status
  let activeLink = ctaLink;
  let activeCta = cta;
  let message = null;

  if (status === 'expired') {
    activeLink = redirectUrl;
    activeCta = "Event Ended"; 
    if (timeLeft !== null && timeLeft > 0) {
      message = `Event ended. Redirecting in ${timeLeft}...`;
    }
  } else if (status === 'live') {
    activeLink = liveUrl || ctaLink;
    activeCta = liveCta || "Join Now";
    if (autoRedirectOnLive && timeLeft !== null && timeLeft > 0) {
      message = `Event is Live! Redirecting in ${timeLeft}...`;
    }
  }

  if (!activeLink) return null;

  return (
    <div
      className=" sticky bottom-0
  w-full z-50
  p-4
  bg-black/30 backdrop-blur-lg
  border border-gray-800
  rounded-t-2xl
  flex flex-col items-center justify-center
  shadow-2xl">
      {message && (
        <div className="mb-2 text-red-500 font-semibold">
          {message}
        </div>
      )}
      <Link
        href={activeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-white to-gray-300 text-black px-6 py-2 rounded text-lg font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        {activeCta}
      </Link>
    </div>
  );
}
