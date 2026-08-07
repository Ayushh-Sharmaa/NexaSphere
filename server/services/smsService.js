import logger from "../utils/logger.js";

export const smsService = {
  async sendSMS(userId, phone, body, type) {
    logger.info(
      `[smsService] sendSMS stub user=${userId} phone=${phone} type=${type}`
    );
    return { sid: "stub", status: "sent" };
  },
  async sendSms(to, body) {
    return this.sendSMS(null, to, body, "generic");
  },
  async send(to, body) {
    return this.sendSms(to, body);
  },
};

export default smsService;
