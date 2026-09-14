import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Accordion = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleItem = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between p-5 text-left bg-white focus:outline-none"
          >
            <span className="font-semibold text-text-dark text-lg pr-4">{item.question}</span>
            <motion.div
              animate={{ rotate: activeIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-teal flex-shrink-0"
            >
              <ChevronDown size={24} />
            </motion.div>
          </button>
          
          <AnimatePresence>
            {activeIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-5 pt-0 text-text-muted border-t border-border/50">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
