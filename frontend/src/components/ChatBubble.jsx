import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

export function ChatBubble() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                            scale: 0.9,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 20,
                            scale: 0.9,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-80 mb-4 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-teal-600 p-4 text-white flex justify-between items-center bg-[#0d9488]">
                            <div className="flex items-center gap-2">
                                <Bot size={20} />
                                <span className="font-bold">Libby AI</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="p-4 h-64 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                            <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-sm text-gray-800 max-w-[85%]">
                                <p>
                                    Hi there! 👋 I'm Libby. Need help finding a book or booking a
                                    study room?
                                </p>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-gray-50 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/50"
                            />
                            <button className="bg-[#fb7185] text-white p-2 rounded-full hover:bg-coral/90 transition-colors flex-shrink-0">
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#facc15] text-gray-900 p-4 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center relative"
                whileHover={{
                    scale: 1.05,
                }}
                whileTap={{
                    scale: 0.95,
                }}
                animate={
                    !isOpen
                        ? {
                            y: [0, -10, 0],
                        }
                        : {}
                }
                transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: 'easeInOut',
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                {!isOpen && (
                    <span className="absolute -top-2 -right-2 bg-[#fb7185] text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        1
                    </span>
                )}
            </motion.button>
        </div>
    )
}
