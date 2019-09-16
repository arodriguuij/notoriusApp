const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1) Create a transporter

    /* Gmail way
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            password: process.env.EMAIL_PASSWORD
        }

        // Activate in gmail 'less secure app' option
    });
    */

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    // 2) Define the email options
    const mailOptions = {
        from: 'Alejandro Rodriguez <hello@alejandro.io>',
        to: options.email,
        subject: options.subject,
        text: options.message
        //html: options.
    }

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;