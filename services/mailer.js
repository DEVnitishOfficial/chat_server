import sgmailer from "@sendgrid/mail";

sgmailer.setApiKey(process.env.SG_KEY);

const sendSGmail = async ({
  recepient,
  sender,
  subject,
  html,
  text,
  content,
  attachements,
}) => {
  try {
    const from = sender || "hidummymail@gmail.com";

    const msg = {
      to: recepient,
      from: from,
      subject,
      text:text,
      html: html,
      attachements,
    };
    return sgmailer.send(msg);
  } catch (error) {
    console.error(error);
  }
};

export const sendEmail = async(args) => {
    if(process.env.NODE_ENV === 'developement'){
        return new Promise.resolve()
    }else{
        return sendSGmail(args)
    }
}
