import industries from "../../data/industries";
import IndustryCard from "./IndustryCard";

import { Swiper, SwiperSlide } from "swiper/react";

import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Industries() {
  return (
    <section className="py-24 bg-slate-50">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">

          <p className="uppercase tracking-[4px] text-cyan-600 font-semibold">
            Industries
          </p>

          <h2 className="text-5xl font-bold text-slate-900 mt-4">
            Industries We Serve
          </h2>

          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
            We provide engineering simulation, product development,
            AI solutions and technical consultancy across diverse industries.
          </p>

        </div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          loop={true}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            768: {
              slidesPerView: 2,
            },
            1200: {
              slidesPerView: 3,
            },
          }}
        >
          {industries.map((industry) => (
            <SwiperSlide key={industry.id}>
              <div className="pb-14">
                <IndustryCard industry={industry} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

      </div>

    </section>
  );
}