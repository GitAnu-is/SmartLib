import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, CheckCircleIcon } from 'lucide-react'

const PayFineModal = ({ isOpen, onClose, fine, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('Card')
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value)
    setExpiry(formatted)
  }

  const handleCvvChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').substring(0, 3)
    setCvv(v)
  }

  const handlePay = async () => {
    if (paymentMethod === 'Card' && (!cardholderName || !cardNumber || !expiry || !cvv)) {
      alert('Please fill in all card details')
      return
    }
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setPaymentSuccess(true)
      setIsProcessing(false)
      if (onSuccess) onSuccess(fine.id)
    }, 2000)
  }

  const handleClose = () => {
    setPaymentSuccess(false)
    setCardholderName('')
    setCardNumber('')
    setExpiry('')
    setCvv('')
    setPaymentMethod('Card')
    onClose()
  }

  if (!fine) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-teal text-white p-6 rounded-t-2xl relative">
              <h2 className="text-xl font-bold text-center">
                {paymentSuccess ? 'Payment Successful' : 'Pay Fine'}
              </h2>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              >
                <XIcon size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {paymentSuccess ? (
                // Success Screen
                <div className="text-center">
                  <CheckCircleIcon size={64} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-dark mb-2">Payment Completed!</h3>
                  <p className="text-medium mb-4">
                    Your fine for "{fine.bookTitle}" has been paid successfully.
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount paid: Rs {fine.totalFine.toFixed(2)}
                  </p>
                </div>
              ) : (
                // Payment Form
                <>
                  {/* Fine Details */}
                  <div className="bg-light p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-dark mb-3">Fine Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-medium">Book:</span>
                        <span className="font-semibold text-dark">{fine.bookTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium">Days Late:</span>
                        <span className="font-semibold text-coral">{fine.daysLate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium">Fine per Day:</span>
                        <span className="font-semibold text-dark">Rs {fine.finePerDay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-bold text-dark">Total Amount:</span>
                        <span className="font-bold text-coral">Rs {fine.totalFine.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-dark mb-2">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                    >
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  {/* Card Details */}
                  {paymentMethod === 'Card' && (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-dark mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-dark mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-dark mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={expiry}
                            onChange={handleExpiryChange}
                            placeholder="12/25"
                            maxLength="5"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-dark mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={cvv}
                            onChange={handleCvvChange}
                            placeholder="123"
                            maxLength="3"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full py-3 bg-coral text-white rounded-full font-bold text-lg shadow-lg shadow-coral/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : `Pay Rs ${fine.totalFine.toFixed(2)}`}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PayFineModal