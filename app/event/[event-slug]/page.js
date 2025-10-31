import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaClock, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';
import eventsData from '@/data/events.json';

export async function generateStaticParams() {
  return eventsData.map((event) => ({
    'event-slug': event.slug,
  }));
}

export default async function EventPage({ params }) {
  // params uses the segment name 'event-slug' (see generateStaticParams)
  const { 'event-slug': eventSlug } = params;
  const event = eventsData.find((e) => e.slug === eventSlug);

  // Redirect to home page if event not found
  if (!event) {
    redirect('/');
  }

  const eventDate = new Date(event.time);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Image */}
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8 shadow-2xl">
          <Image
            src={event.headingImage}
            alt={event.heading}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {event.heading}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-md bg-white/40 dark:bg-black/40 rounded-2xl p-8 shadow-xl border border-white/20">
          {/* Event Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <FaCalendar className="text-blue-500 w-5 h-5" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <FaClock className="text-green-500 w-5 h-5" />
              <span className="font-medium">{formattedTime}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
              <FaMapMarkerAlt className="text-red-500 w-5 h-5" />
              <span className="font-medium">{event.location}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              About This Event
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Event Highlights
              </h2>
              <ul className="space-y-3">
                {event.highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-3 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-blue-500 font-bold mt-1">✓</span>
                    <span className="text-lg">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              href={event.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {event.cta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}