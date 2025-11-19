// import nodemailer from 'nodemailer';
// import { config } from '../config';

// const transporter = nodemailer.createTransport({
//   host: config.emailHost,
//   port: config.emailPort,
//   secure: config.emailPort === 465,
//   auth: {
//     user: config.emailUser,
//     pass: config.emailPass,
//   },
// });

// export class EmailService {
//   static async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
//     try {
//       await transporter.sendMail({
//         from: config.emailUser,
//         to,
//         subject,
//         text,
//         html,
//       });
//     } catch (error) {
//       console.error('Email sending failed:', error);
//       throw error;
//     }
//   }
// }
