import { coreTeamRepository } from '../repositories/coreTeamRepository.js';
import { manageActivityGateSchema } from '../validators/coreTeamSchemas.js';

const fallbackMembers = [
  { name: 'Ayush Sharma', email: 'ayush.sharmaa@hotmail.com', phone: '8923995135' },
  { name: 'Tanishk Bansal', email: 'tb1093612@gmail.com', phone: '8534998412' },
  { name: 'Tushar Goswami', email: 'tushh45@gmail.com', phone: '7253948594' },
  { name: 'Swayam Dwivedi', email: 'swayamdwivedi88@gmail.com', phone: '7307391343' },
  { name: 'Aryan Singh', email: 'aryan.singh2025@glbajajgroup.org', phone: '8423067765' },
  { name: 'Vartika Sharma', email: 'vartika.sharma2025@glbajajgroup.org', phone: '9458030331' },
  { name: 'Vikas Kumar Sharma', email: 'vks184953@gmail.com', phone: '7983419487' },
];

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

export const coreTeamService = {
  async listMembers() {
    return coreTeamRepository.listMembers();
  },

  async addMember(input) {
    const member = manageActivityGateSchema.parse({
      ...input,
      // repurpose schema fields: name/email/phone are validated there
      password: undefined,
    });
    return coreTeamRepository.addMember(member);
  },

  async deleteMember(id) {
    return coreTeamRepository.deleteMember(id);
  },

  async assertCanManageActivityEvent(body) {
    const gate = manageActivityGateSchema.parse(body);
    const expectedPassword = process.env.ADMIN_EVENT_PASSWORD || 'Admin@123';
    if (String(gate.password || '') !== expectedPassword) {
      throw new Error('Unauthorized. Core team details or password did not match.');
    }

    const name = String(gate.name || '').trim().toLowerCase();
    const email = String(gate.email || '').trim().toLowerCase();
    const phone = normalizePhone(gate.phone);

    // Prefer DB if configured; fallback to hardcoded list.
    const dbAllowed = await coreTeamRepository.isMember({ name, email, phone }).catch(() => false);
    if (dbAllowed) return true;

    const allowed = fallbackMembers.some((m) =>
      m.name.toLowerCase() === name &&
      m.email.toLowerCase() === email &&
      normalizePhone(m.phone) === phone
    );

    if (!allowed) throw new Error('Unauthorized. Core team details or password did not match.');
    return true;
  },
};

