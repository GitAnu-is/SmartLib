const asyncHandler = require('express-async-handler');
const Contact = require('../models/Contact');
const { sendMail } = require('../utils/mailer');
const { logActivity } = require('../utils/activityLogger');

// @desc    Submit a contact form message
// @route   POST /api/contact
// @access  Public
const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Please provide name, email, subject, and message');
  }

  if (name.trim().length < 2) {
    res.status(400);
    throw new Error('Name must be at least 2 characters');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  if (subject.trim().length < 3) {
    res.status(400);
    throw new Error('Subject must be at least 3 characters');
  }

  if (message.trim().length < 10) {
    res.status(400);
    throw new Error('Message must be at least 10 characters');
  }

  // Create contact message
  const contact = await Contact.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    subject: subject.trim(),
    message: message.trim(),
    status: 'new',
  });

  // Send confirmation email to user
  try {
    await sendMail({
      to: email,
      subject: 'We received your message - SmartLib',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Thank you for contacting SmartLib!</h2>
          <p>Hi ${name},</p>
          <p>We have received your message and our team will get back to you within 24 hours.</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Your Message Details:</strong>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong> ${message}</p>
          </div>
          <p>Best regards,<br/>SmartLib Support Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.log('Email notification failed:', error.message);
  }

  // Log activity if user is authenticated
  if (req.user) {
    await logActivity(req, {
      type: 'contact',
      action: 'Submitted contact form',
      meta: { contactId: contact._id, subject },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for your message. We will contact you soon!',
    contact: {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      status: contact.status,
      createdAt: contact.createdAt,
    },
  });
});

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages = asyncHandler(async (req, res) => {
  const messages = await Contact.find()
    .sort({ createdAt: -1 })
    .populate('repliedBy', 'fullname email');

  res.status(200).json(messages);
});

// @desc    Get a single contact message (admin)
// @route   GET /api/contact/:id
// @access  Private/Admin
const getContactMessage = asyncHandler(async (req, res) => {
  const message = await Contact.findById(req.params.id).populate(
    'repliedBy',
    'fullname email'
  );

  if (!message) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  // Mark as read
  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }

  res.status(200).json(message);
});

// @desc    Reply to a contact message (admin)
// @route   PATCH /api/contact/:id/reply
// @access  Private/Admin
const replyToContactMessage = asyncHandler(async (req, res) => {
  const { adminReply } = req.body;

  if (!adminReply || adminReply.trim().length === 0) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  const message = await Contact.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  if (message.adminReply) {
    res.status(400);
    throw new Error('This message has already been replied to');
  }

  message.adminReply = adminReply.trim();
  message.status = 'replied';
  message.repliedAt = new Date();
  message.repliedBy = req.user._id;
  await message.save();

  // Send reply email to customer
  try {
    await sendMail({
      to: message.email,
      subject: `Re: ${message.subject} - SmartLib`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">We've replied to your inquiry!</h2>
          <p>Hi ${message.name},</p>
          <p>Thank you for reaching out to SmartLib. Here's our response to your question:</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
            <strong>Your Original Message:</strong>
            <p style="margin-top: 10px; color: #666;">${message.message}</p>
          </div>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <strong>Our Reply:</strong>
            <p style="margin-top: 10px;">${adminReply}</p>
          </div>
          <p>If you have any further questions, please don't hesitate to reach out.</p>
          <p>Best regards,<br/>SmartLib Support Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.log('Reply email failed:', error.message);
  }

  await logActivity(req, {
    type: 'contact_reply',
    action: `Replied to contact message: ${message.subject}`,
    meta: { contactId: message._id, recipientEmail: message.email },
  });

  const updated = await Contact.findById(message._id).populate(
    'repliedBy',
    'fullname email'
  );

  res.status(200).json({
    success: true,
    message: 'Reply sent successfully!',
    data: updated,
  });
});

// @desc    Delete a contact message (admin)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContactMessage = asyncHandler(async (req, res) => {
  const message = await Contact.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  await message.deleteOne();

  await logActivity(req, {
    type: 'contact_delete',
    action: `Deleted contact message: ${message.subject}`,
    meta: { contactId: message._id },
  });

  res.status(200).json({ success: true, message: 'Contact message deleted' });
});

module.exports = {
  submitContactMessage,
  getContactMessages,
  getContactMessage,
  replyToContactMessage,
  deleteContactMessage,
};
