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
      color: 'hover:text-[#25D366]'
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://www.instagram.com/gdg.scriet',
      color: 'hover:text-[#E4405F]'
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      url: 'https://www.linkedin.com/company/gdg-scriet/',
      color: 'hover:text-[#0A66C2]'
    },
    {
      name: 'Community',
      icon: HiUserGroup,
      url: 'https://gdg.community.dev/gdg-on-campus-sir-chhotu-ram-institute-of-engineering-and-technology-meerut-india/',
      color: 'hover:text-[#4285F4]'
    }
  ];

  return (
    <footer className="bg-black border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center space-y-8">
          
          {/* Brand / Title */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white tracking-wide">
              GDG on Campus SCRIET
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Connecting developers, designers, and tech enthusiasts to learn, share, and grow together.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-8">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 ${social.color} transition-all duration-300 transform hover:-translate-y-1`}
                  aria-label={social.name}
                >
                  <Icon className="w-6 h-6" />
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Copyright */}
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">
              © {new Date().getFullYear()} GDG on Campus SCRIET. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
