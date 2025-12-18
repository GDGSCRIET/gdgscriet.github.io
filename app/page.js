import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';

export default function Home() {
  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: 'https://chat.whatsapp.com/G1IELOpmvYV0tQzFqzjRvK',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://www.instagram.com/gdg.scriet',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      url: 'https://www.linkedin.com/company/gdg-scriet/',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Community',
      icon: HiUserGroup,
      url: 'https://gdg.community.dev/gdg-on-campus-sir-chhotu-ram-institute-of-engineering-and-technology-meerut-india/',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 group">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-white dark:text-white">
            Welcome to <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">GDG on Campus SCRIET</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 dark:text-gray-300 max-w-2xl mx-auto">
            Building a community of passionate developers and tech enthusiasts
          </p>
        </div>
        <Link
          href="/event/techsprint2025"
          className="
          group block max-w-sm mx-auto
          bg-blue-900 rounded-3xl
          shadow-sm transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl
      ">
          <div className="relative max-w-sm mx-auto w-full shadow-2xl rounded-3xl overflow-hidden">
            <img
              src={"/events/TechSprint AP.png"}

              className="transition-all duration-300 w-full h-auto"
            />
          </div>

          <div className='group-hover:text-blue-200 font-bold py-2 text-xl text-white flex justify-center items-center gap-2'>Register Now <ArrowRight /></div>


        </Link>

        {/* Social Links */}
        {/* <div className="mx-auto flex flex-wrap items-center justify-center gap-4">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <Link
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} text-white px-8 py-4 rounded-full flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-semibold">{social.name}</span>
              </Link>
            );
          })}
        </div> */}
      </div>

    </div>
  );
}
