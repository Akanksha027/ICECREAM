export default function OurStory() {
  return (
    <section className="w-full bg-[#faece5] flex flex-col md:flex-row items-stretch">
      
      {/* Left Image */}
      <div className="w-full md:w-[40%] lg:w-[45%] relative min-h-[400px] md:min-h-[650px]">
         <img 
            src="/img15.jpeg" 
            alt="Woman with ice cream" 
            className="absolute inset-6 md:inset-8 lg:inset-12 w-[calc(100%-3rem)] md:w-[calc(100%-4rem)] lg:w-[calc(100%-6rem)] h-[calc(100%-3rem)] md:h-[calc(100%-4rem)] lg:h-[calc(100%-6rem)] object-cover rounded-xl shadow-lg" 
         />
      </div>
      
      {/* Right Content */}
      <div className="w-full md:w-[60%] lg:w-[55%] p-10 md:p-16 lg:p-24 flex flex-col justify-center items-start">
         
         <h2 className="font-script text-4xl md:text-5xl lg:text-6xl text-[#C03B45] mb-4 leading-[1.1] drop-shadow-sm">
           Rooted in Tradition, Raised for the Modern World
         </h2>
         
         <h3 className="font-display text-xl md:text-2xl lg:text-3xl text-[#C03B45] mb-6 leading-tight font-semibold tracking-[-0.02em] max-w-2xl drop-shadow-sm scale-y-110 origin-left">
           At Cafe and Creamery, we see ice cream as more than just a sweet treat—it's a ritual, a vibe, a treasured memory in the making.
         </h3>
         
         <p className="font-body text-sm md:text-[15px] text-[#5A4545] mb-10 leading-relaxed font-medium max-w-2xl">
           Rooted in the heart of local dairy farms, our ice cream is hand-crafted for the wild hearts, the slow savorers, and the soulful storytellers. Whether you're spilling secrets with your sisters or dancing barefoot under moonlit skies, every scoop is an invitation to savor the moment, embrace the adventure, and toast to the magic of now.
         </p>
         
         <button className="group flex items-center gap-2 border-2 border-raspberry text-raspberry px-8 py-3 rounded-full hover:bg-raspberry hover:text-white transition-all duration-300 font-body text-sm font-semibold tracking-wider">
           Our story 
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300">
             <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
           </svg>
         </button>
      </div>
      
    </section>
  );
}
