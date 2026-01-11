import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendTicketConfirmation(
    email: string,
    name: string,
    event: Event,
    ticket: Ticket,
  ): Promise<void> {
    // Extract base64 data from data URL (format: data:image/png;base64,<base64data>)
    let qrCodeBase64: string;
    if (ticket.qrCode.startsWith('data:')) {
      qrCodeBase64 = ticket.qrCode.split(',')[1];
    } else {
      qrCodeBase64 = ticket.qrCode;
    }
    const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@events.com',
      to: email,
      subject: `Ticket Confirmation - ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ticket Confirmation</h2>
          <p>Dear ${name},</p>
          <p>Thank you for registering for <strong>${event.title}</strong>!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Event Details</h3>
            <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleString()}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <img src="cid:qr-code" alt="QR Code" style="max-width: 200px; border: 2px solid #ddd; padding: 10px; background: white;" />
            <p style="font-size: 12px; color: #666; margin-top: 10px;">Please present this QR code at the venue for check-in.</p>
          </div>

          <p>We look forward to seeing you at the event!</p>
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `,
      attachments: [
        {
          filename: 'qr-code.png',
          content: qrCodeBuffer,
          cid: 'qr-code', // Content ID for inline image
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error - email failure shouldn't break registration
    }
  }

  async sendAnnouncement(
    emails: string[],
    subject: string,
    message: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@events.com',
      to: emails.join(','),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <div style="margin: 20px 0;">
            ${message}
          </div>
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending announcement:', error);
      throw error;
    }
  }

  async sendEventCancellation(
    emails: string[],
    eventTitle: string,
    eventDate: Date,
    eventLocation: string,
  ): Promise<void> {
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@events.com',
      to: emails.join(','),
      subject: `Event Cancelled: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc3545;">Event Cancellation Notice</h2>
          <p>We regret to inform you that the following event has been cancelled:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${eventTitle}</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
          </div>
          <p>We sincerely apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact us.</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      throw error;
    }
  }
}

