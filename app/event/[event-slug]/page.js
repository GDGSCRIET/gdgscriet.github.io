import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaClock, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';
import eventsData from '@/data/events';
import EventRedirect from '@/components/EventRedirect';

export async function generateStaticParams() {
  return eventsData.map((event) => ({
    'event-slug': event.slug,
  }));
}

export default async function EventPage({ params }) {
  // params uses the segment name 'event-slug' (see generateStaticParams)
  const { 'event-slug': eventSlug } = await params;
  const event = eventsData.find((e) => e.slug === eventSlug);

  // Redirect to home page if event not found
  if (!event) {
    redirect('/');
  }

  const formattedDate = event.dateDisplay || (event.time ? new Date(event.time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : null);

  const formattedTime = event.time ? new Date(event.time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }) : null;

  return (
    <div className="min-h-screen py-12 px-4">
      <EventRedirect expiryTime={event.expiryTime} redirectUrl={event.redirectUrl} />
      <div className="max-w-5xl mx-auto">
        {/* Header Image */}
        <div className="relative w-full mb-8 shadow-2xl rounded-2xl overflow-hidden">
          <img
            src={event.headingImage}
            alt={event.heading}
            className="w-full h-auto"
          />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {event.heading}
          </h1>
        </div>

        {/* Content */}
        <div className="backdrop-blur-md shadow-xl p-2 py-4">
          {/* Event Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {formattedDate && (
              <div className="flex items-center space-x-3 text-gray-300">
                <FaCalendar className="text-blue-500 w-5 h-5" />
                <span className="font-medium">{formattedDate}</span>
              </div>
            )}
            {formattedTime && (
              <div className="flex items-center space-x-3 text-gray-300">
                <FaClock className="text-green-500 w-5 h-5" />
                <span className="font-medium">{formattedTime}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center space-x-3 text-gray-300">
                <FaMapMarkerAlt className="text-red-500 w-5 h-5" />
                <span className="font-medium">{event.location}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="flex justify-start my-5">
            <Link
              href={event.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black p-2 rounded text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {event.cta}
            </Link>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              About This Event
            </h2>
            <div
              className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Event Highlights
              </h2>
              <ul className="space-y-3">
                {event.highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-3 text-gray-300"
                  >
                    <span className="text-blue-500 font-bold mt-1">✓</span>
                    <span className="text-lg">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          {event.contact && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Contact Us
              </h2>
              <div className="text-gray-300 space-y-2">
                {event.contact.name && <p><span className="font-bold">Name:</span> {event.contact.name}</p>}
                {event.contact.email && <p><span className="font-bold">Email:</span> <a href={`mailto:${event.contact.email}`} className="text-blue-400 hover:underline">{event.contact.email}</a></p>}
                {event.contact.phone && <p><span className="font-bold">Phone:</span> <a href={`tel:${event.contact.phone}`} className="text-blue-400 hover:underline">{event.contact.phone}</a></p>}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}