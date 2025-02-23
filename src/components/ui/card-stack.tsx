"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { styles } from '@/utils/constants';

let interval: any;

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState<Card[]>(items);

  useEffect(() => {
    startFlipping();

    return () => clearInterval(interval);
  }, []);
  const startFlipping = () => {
    interval = setInterval(() => {
      setCards((prevCards: Card[]) => {
        const newArray = [...prevCards]; // create a copy of the array
        newArray.unshift(newArray.pop()!); // move the last element to the front
        return newArray;
      });
    }, 5000);
  };

  return (
    <div className="relative h-60 w-60 md:h-80 md:w-[36rem]">
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className={`absolute h-60 w-60 md:h-80 md:w-[36rem] rounded-3xl p-6 
              ${styles.glassmorph} border border-[#D98324]/20
              shadow-lg backdrop-blur-lg flex flex-col justify-between
              text-[#443627] dark:text-[#EFDCAB]`}
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
              zIndex: cards.length - index, //  decrease z-index for the cards that are behind
            }}
          >
            <div className={styles.secondaryText}>
              {card.content}
            </div>
            <div className="space-y-1">
              <p className={`${styles.primaryText} font-bold`}>
                {card.name}
              </p>
              <p className={styles.secondaryText}>
                {card.designation}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
