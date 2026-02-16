export interface ACContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  cdate: string;
  udate: string;
}

export interface ACDeal {
  id: string;
  contact: string;
  title: string;
  stage: string;
  group: string;
  cdate: string;
  mdate: string;
}

class ActiveCampaignClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AC_API_URL || "";
    this.apiKey = process.env.AC_API_KEY || "";
  }

  async get<T = Record<string, unknown>>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`/api/3/${endpoint}`, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: { "Api-Token": this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`AC API error: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async getContacts(
    offset: number = 0,
    limit: number = 100
  ): Promise<{ contacts: ACContact[]; meta: { total: string } }> {
    return this.get("contacts", {
      limit: String(limit),
      offset: String(offset),
    });
  }

  async getContact(id: string): Promise<{ contact: ACContact }> {
    return this.get(`contacts/${id}`);
  }

  async getContactDeals(
    contactId: string
  ): Promise<{ deals: ACDeal[] }> {
    return this.get(`contacts/${contactId}/deals`);
  }

  async getDeals(
    offset: number = 0,
    limit: number = 100
  ): Promise<{ deals: ACDeal[]; meta: { total: string } }> {
    return this.get("deals", {
      limit: String(limit),
      offset: String(offset),
    });
  }

  async getDealsByPipeline(
    groupId: number,
    offset: number = 0,
    limit: number = 100
  ): Promise<{ deals: ACDeal[]; meta: { total: string } }> {
    return this.get("deals", {
      "filters[group]": String(groupId),
      limit: String(limit),
      offset: String(offset),
    });
  }

  async *getAllContacts(): AsyncGenerator<ACContact[]> {
    let offset = 0;
    const limit = 100;
    while (true) {
      const data = await this.getContacts(offset, limit);
      if (data.contacts.length === 0) break;
      yield data.contacts;
      if (data.contacts.length < limit) break;
      offset += limit;
      // Rate limiting - 100ms delay between pages
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  async *getAllDeals(): AsyncGenerator<ACDeal[]> {
    let offset = 0;
    const limit = 100;
    while (true) {
      const data = await this.getDeals(offset, limit);
      if (data.deals.length === 0) break;
      yield data.deals;
      if (data.deals.length < limit) break;
      offset += limit;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

export const acClient = new ActiveCampaignClient();
