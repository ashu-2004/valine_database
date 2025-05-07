const nodemailer = require("nodemailer");
require("dotenv").config();

function sendEmail({ recipient_email, OTP }) {
    return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MY_EMAIL,
                pass: process.env.MY_PASSWORD,
            },
        });

        const mail_configs = {
            from: process.env.MY_EMAIL,
            to: recipient_email,
            subject: "PASSWORD RECOVERY",
            html: `<!DOCTYPE html>
  <html lang="en" >
  <head>
    <meta charset="UTF-8">
    <title>Password Recovery</title> 
  </head>
  <body>
  <!-- partial:index.partial.html -->
  <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Valine Agro</a>
      </div>
      <p style="font-size:1.1em">Hi,</p>
      <p>OTP is valid for 1 minutes</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
      <p style="font-size:0.9em;">Regards,<br />Valine Agro</p>
      <hr style="border:none;border-top:1px solid #eee" />
    </div>
  </div>
  <!-- partial -->
  </body>
  </html>`,
        };
        transporter.sendMail(mail_configs, function (error, info) {
            if (error) {
                console.log(error);
                return reject({ message: `An error has occured` });
            }
            return resolve({ message: "Email sent succesfuly" });
        });
    });
}

module.exports = { sendEmail };