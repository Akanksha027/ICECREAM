export default function Footer() {
  return (
    <footer className="relative bg-[#faece5] text-[#5A4545] overflow-hidden">


      <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 pt-10 pb-6 md:pt-16 md:pb-10 flex flex-col md:flex-row items-center md:items-start justify-between">
        


        {/* ─── Right Content (Links Grid) ─── */}
        <div className="w-full md:w-[60%] grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-8 lg:gap-16 relative z-10">
          
          {/* Shop Now */}
          <div>
            <h3 className="font-script text-4xl text-[#C03B45] mb-6 drop-shadow-sm">Shop Now</h3>
            <ul className="space-y-3 font-body text-sm font-medium text-[#5A4545]">
              <li><a href="#" className="hover:text-[#C03B45] transition-colors">Ice Cream Cups</a></li>
              <li><a href="#" className="hover:text-[#C03B45] transition-colors">Cookie Sandwiches</a></li>
              <li><a href="#" className="hover:text-[#C03B45] transition-colors">Seasonal Pints</a></li>
              <li><a href="#" className="hover:text-[#C03B45] transition-colors">Merchandise</a></li>
              <li><a href="#" className="hover:text-[#C03B45] transition-colors">Gift Cards</a></li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="font-script text-4xl text-[#C03B45] mb-6 drop-shadow-sm">Important Links</h3>
            <ul className="space-y-3 font-body text-sm font-medium text-[#5A4545]">
              <li><a href="#home" className="hover:text-[#C03B45] transition-colors">Home</a></li>
              <li><a href="#location" className="hover:text-[#C03B45] transition-colors">Store Locations</a></li>
              <li><a href="#about" className="hover:text-[#C03B45] transition-colors">Our Story</a></li>
              <li><a href="#menu" className="hover:text-[#C03B45] transition-colors">Menu</a></li>
              <li><a href="#blog" className="hover:text-[#C03B45] transition-colors">Blogs</a></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-script text-4xl text-[#C03B45] mb-6 drop-shadow-sm">Help</h3>
            <ul className="space-y-3 font-body text-sm font-medium text-[#5A4545]">
              <li><a href="#contact" className="hover:text-[#C03B45] transition-colors">Contact Us</a></li>
              <li><a href="#terms" className="hover:text-[#C03B45] transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-[#C03B45] transition-colors">Privacy Policy</a></li>
              <li><a href="#refunds" className="hover:text-[#C03B45] transition-colors">Refund Policy</a></li>
              <li><a href="#accessibility" className="hover:text-[#C03B45] transition-colors">Accessibility</a></li>
            </ul>
          </div>

        </div>

        {/* ─── Social Icons (Far Right) ─── */}
        <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-5 z-10 text-[#C03B45]">
          <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><InstagramIcon /></a>
          <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><FacebookIcon /></a>
          <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><TikTokIcon /></a>
          <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><YoutubeIcon /></a>
        </div>
      </div>

      {/* Mobile Socials (hidden on desktop) */}
      <div className="md:hidden flex justify-center gap-6 pb-10 text-[#C03B45]">
        <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><InstagramIcon /></a>
        <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><FacebookIcon /></a>
        <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><TikTokIcon /></a>
        <a href="#" className="hover:text-raspberry transition-colors hover:scale-110 transform"><YoutubeIcon /></a>
      </div>

      {/* ─── Bottom Footer ─── */}
      <div className="border-t border-[#C03B45]/20 mx-6 md:mx-12 py-5 flex flex-col md:flex-row justify-between items-center text-xs font-body font-medium text-[#5A4545]/70">
        <p>&copy; {new Date().getFullYear()} Cafe and Creamery All Rights Reserved</p>
        <p className="mt-2 md:mt-0 flex items-center gap-1.5">
          Created with <span className="text-[#C03B45]">♥</span> by Web Designers
        </p>
      </div>



    </footer>
  );
}

// Simple SVG Icons
function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3.81l.39-4H14V7a1 1 0 011-1h3z"></path>
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.95-.59 3.93-1.8 5.4-1.22 1.48-2.9 2.45-4.8 2.7-1.9.25-3.88-.04-5.54-.95-1.65-.92-2.96-2.4-3.6-4.14-.65-1.74-.63-3.71.05-5.43.68-1.73 2-3.17 3.65-4 1.66-.82 3.62-.98 5.44-.45.02.01.03.01.05.02v4.06c-1.02-.15-2.07.03-2.95.53-.87.5-1.55 1.28-1.87 2.22-.32.93-.24 1.97.23 2.84.46.86 1.25 1.5 2.18 1.75.93.25 1.95.12 2.78-.34.82-.46 1.4-1.25 1.6-2.19.2-.95.03-1.94-.46-2.76-.04-.08-.1-.15-.15-.22V.02z" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon>
    </svg>
  );
}
