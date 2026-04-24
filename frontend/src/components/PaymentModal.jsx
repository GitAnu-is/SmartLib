import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Loader } from 'lucide-react'

export function PaymentModal({ isOpen, onClose, fineData, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(value)
  }

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4)
    }
    setExpiryDate(value)
  }

  const handleCvvChange = (e) => {
    setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))
  }

  const validateForm = () => {
    setError('')

    if (paymentMethod === 'card') {
      if (!cardholderName.trim()) {
        setError('Please enter cardholder name')
        return false
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setError('Card number must be 16 digits')
        return false
      }
      if (!expiryDate || expiryDate.length !== 5) {
        setError('Please enter valid expiry date (MM/YY)')
        return false
      }
      if (cvv.length !== 3) {
        setError('CVV must be 3 digits')
        return false
      }
    }

    return true
  }

  const handlePay = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Call success handler
      if (onSuccess) {
        onSuccess({
          paymentMethod,
          lastFourDigits: paymentMethod === 'card' ? cardNumber.slice(-4) : null,
          amount: fineData?.totalAmount,
        })
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        handleReset()
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCardholderName('')
    setCardNumber('')
    setExpiryDate('')
    setCvv('')
    setPaymentMethod('card')
    setError('')
    setIsSuccess(false)
  }

  const handleClose = () => {
    if (!isProcessing && !isSuccess) {
      handleReset()
      onClose()
    }
  }

  if (!fineData) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal to-teal/80 p-6 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-2xl font-extrabold text-white">Payment Details</h2>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Success State */}
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                    >
                      <Check size={32} className="text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-dark mb-2">Payment Successful!</h3>
                    <p className="text-medium text-center">
                      Your fine of <span className="text-teal font-bold">Rs {fineData.totalAmount.toFixed(2)}</span> has been paid.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Fine Summary */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between">
                        <span className="text-medium">Book:</span>
                        <span className="font-bold text-dark">{fineData.bookName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium">Days Late:</span>
                        <span className="font-bold text-dark">{fineData.daysLate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium">Fine per Day:</span>
                        <span className="font-bold text-dark">Rs {fineData.finePerDay}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between">
                        <span className="font-bold text-dark">Total Due:</span>
                        <span className="text-xl font-bold text-teal">Rs {fineData.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-bold text-dark mb-3">Payment Method</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['card', 'bank', 'cash'].map((method) => (
                          <button
                            key={method}
                            onClick={() => {
                              setPaymentMethod(method)
                              setError('')
                            }}
                            className={`p-3 rounded-lg font-semibold transition-all border-2 ${
                              paymentMethod === method
                                ? 'border-teal bg-teal/10 text-teal'
                                : 'border-gray-200 text-medium hover:border-teal'
                            }`}
                          >
                            {method === 'card' && '💳'} {method === 'bank' && '🏦'} {method === 'cash' && '💰'}{' '}
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Payment Form */}
                    {paymentMethod === 'card' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 bg-gray-50 p-4 rounded-xl"
                      >
                        <div>
                          <label className="block text-sm font-bold text-dark mb-2">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-dark mb-2">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength="19"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-dark mb-2">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              placeholder="12/26"
                              value={expiryDate}
                              onChange={handleExpiryChange}
                              maxLength="5"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-dark mb-2">CVV</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={cvv}
                              onChange={handleCvvChange}
                              maxLength="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Bank Transfer Info */}
                    {paymentMethod === 'bank' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 p-4 rounded-xl border border-blue-200"
                      >
                        <p className="text-sm text-blue-800 font-semibold mb-2">Bank Transfer Details:</p>
                        <p className="text-sm text-blue-700 space-y-1">
                          <div>Account: SmartLib Library</div>
                          <div>Account Number: 1234567890</div>
                          <div>Bank: National Bank</div>
                          <div className="mt-2 font-bold">Amount: Rs {fineData.totalAmount.toFixed(2)}</div>
                        </p>
                      </motion.div>
                    )}

                    {/* Cash Payment Info */}
                    {paymentMethod === 'cash' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-50 p-4 rounded-xl border border-yellow-200"
                      >
                        <p className="text-sm text-yellow-800">
                          Please pay <span className="font-bold">Rs {fineData.totalAmount.toFixed(2)}</span> in cash at the library counter and mention the book name <span className="font-bold">{fineData.bookName}</span>.
                        </p>
                      </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-dark font-bold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader size={18} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Pay Rs {fineData.totalAmount.toFixed(2)}</>
                        )}
                      </button>
                    </div>

                    {/* Security Badge */}
                    <p className="text-xs text-center text-medium">🔒 Your payment information is secure</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
