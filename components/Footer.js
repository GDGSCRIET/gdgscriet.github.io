'use client';

import Link from 'next/link';
import { FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';

export default function Footer() {
  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: 'https://chat.whatsapp.com/G1IELOpmvYV0tQzFqzjRvK',
      color: 'hover:text-green-500'
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://www.instagram.com/gdg.scriet',
      color: 'hover:text-pink-500'
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      url: 'https://www.linkedin.com/company/gdg-scriet/',
      color: 'hover:text-blue-500'
    },
    {
      name: 'Community',
      icon: HiUserGroup,
      url: 'https://gdg.community.dev/gdg-on-campus-sir-chhotu-ram-institute-of-engineering-and-technology-meerut-india/',
      color: 'hover:text-purple-500'
    }
  ];

  return (
    <footer className="backdrop-blur-md bg-black/80 dark:bg-black/30 border-t border-white/20 shadow-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Social Links */}
          <div className="flex items-center space-x-6">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-100 dark:text-gray-300 ${social.color} transition-colors duration-300`}
                  aria-label={social.name}
                >
                  <Icon className="w-8 h-8" />
                </Link>
              );
            })}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-400 dark:text-gray-400">
              © {new Date().getFullYear()} GDG on Campus SCRIET.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
