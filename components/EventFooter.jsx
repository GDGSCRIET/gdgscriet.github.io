"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EventFooter({ cta, ctaLink, expiryTime, redirectUrl }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryTime) return;
    const now = new Date();
    const expiry = new Date(expiryTime);
    if (now > expiry) {
      setIsExpired(true);
      if (redirectUrl) {
        setTimeLeft(3); // Start 3 second countdown
      }
    }
  }, [expiryTime, redirectUrl]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft === 0) {
      if (redirectUrl) router.push(redirectUrl);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router, redirectUrl]);

  // Determine the link to use: redirectUrl if expired, otherwise ctaLink
  const activeLink = isExpired && redirectUrl ? redirectUrl : ctaLink;

  if (!activeLink) return null;

  return (
    <div
      className=" sticky bottom-4
  w-full z-50
  p-4
  bg-black/30 backdrop-blur-lg
  border border-gray-800
  rounded-2xl
  flex flex-col items-center justify-center
  shadow-2xl">
      {isExpired && timeLeft !== null && timeLeft > 0 ? (
        <div className="mb-2 text-red-500 font-semibold">Redirecting in {timeLeft}...</div>
      ) : (
        <Link
          href={activeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-white to-gray-300 text-black px-12 py-3 rounded text-lg font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          {cta}
        </Link>
      )}
    </div>
  );
}
