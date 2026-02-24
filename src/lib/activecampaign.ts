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

    // Always read the body so we can log it on error or parse failures
    const rawText = await res.text();

    if (!res.ok) {
      // Try to extract a structured message from the AC error body
      let detail = rawText;
      try {
        const parsed = JSON.parse(rawText) as Record<string, unknown>;
        if (parsed.message) detail = String(parsed.message);
        else if (parsed.error) detail = String(parsed.error);
      } catch {
        // Body is not JSON — log the raw text so we can debug it
        console.error(
          `[AC] Non-JSON error response (${res.status}) from ${endpoint}:\n${rawText.slice(0, 500)}`
        );
      }
      throw new Error(
        `AC API error: ${res.status} ${res.statusText} — ${detail.slice(0, 300)}`
      );
    }

    // Parse JSON with a clear error if the success response is malformed
    try {
      return JSON.parse(rawText) as T;
    } catch {
      console.error(
        `[AC] Expected JSON from ${endpoint} but got (${res.status}):\n${rawText.slice(0, 500)}`
      );
      throw new Error(
        `AC API returned non-JSON response from ${endpoint} (status ${res.status})`
      );
    }
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
