import { motion } from "framer-motion";

/*
|--------------------------------------------------------------------------
| Position Map
|--------------------------------------------------------------------------
| Every card is positioned relative to the CENTER of AnimatedNetwork.
| Change only these values if you want to move cards.
|--------------------------------------------------------------------------
*/

const positions = {
  top: `
    left-1/2
    top-0
    -translate-x-1/2
  `,

  topLeft: `
    left-[10%]
    top-[14%]
  `,

  topRight: `
    right-[10%]
    top-[14%]
  `,

  left: `
    left-0
    top-1/2
    -translate-y-1/2
  `,

  right: `
    right-0
    top-1/2
    -translate-y-1/2
  `,

  bottomLeft: `
    left-[10%]
    bottom-[14%]
  `,

  bottom: `
    left-1/2
    bottom-0
    -translate-x-1/2
  `,

  bottomRight: `
    right-[10%]
    bottom-[14%]
  `,
};

export default function TechCard({ tech }) {
  const { Icon, name, position, delay } = tech;

  return (
    <motion.div
      className={`
        absolute
        ${positions[position]}
        z-20
      `}
      initial={{
        opacity: 0,
        scale: 0.8,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -8, 0],
      }}
      transition={{
        duration: 0.8,
        delay,
        y: {
          repeat: Infinity,
          duration: 3,
          delay,
          ease: "easeInOut",
        },
      }}
      whileHover={{
        scale: 1.08,
        y: -10,
      }}
    >
      <div
        className="
        w-24
        h-24

        sm:w-28
        sm:h-28

        md:w-32
        md:h-32

        lg:w-36
        lg:h-36

        rounded-3xl

        bg-slate-900/85

        backdrop-blur-xl

        border
        border-cyan-400/20

        shadow-[0_0_25px_rgba(34,211,238,.18)]

        hover:border-cyan-300
        hover:shadow-[0_0_45px_rgba(34,211,238,.40)]

        transition-all
        duration-300

        flex
        flex-col
        justify-center
        items-center

        cursor-pointer
        "
      >
        <Icon
          className="
          text-cyan-300

          w-6
          h-6

          sm:w-7
          sm:h-7

          lg:w-9
          lg:h-9
          "
        />

        <p
          className="
          mt-3

          text-white

          font-semibold

          text-xs

          sm:text-sm

          lg:text-lg
          "
        >
          {name}
        </p>
      </div>
    </motion.div>
  );
}