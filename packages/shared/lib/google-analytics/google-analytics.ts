const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

const MEASUREMENT_ID = process.env['CEB_GA_MEASUREMENT_ID'];
const API_SECRET = process.env['CEB_GA_API_SECRET'];
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;
const SESSION_EXPIRATION_IN_MIN = 30;

interface SessionData {
  session_id: string;
  timestamp: number;
}

export class Analytics {
  private debug: boolean;

  constructor(debug = false) {
    this.debug = debug;
  }

  private async getOrCreateClientId(): Promise<string> {
    const result = await chrome.storage.local.get('clientId');
    let clientId: string = result.clientId;
    if (!clientId) {
      clientId = crypto.randomUUID();
      await chrome.storage.local.set({ clientId });
    }
    return clientId;
  }

  private async getOrCreateSessionId(): Promise<string> {
    const result = await chrome.storage.session.get('sessionData');
    let sessionData: SessionData | null = result.sessionData;
    const currentTimeInMs = Date.now();

    if (sessionData && sessionData.timestamp) {
      const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;
      if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
        sessionData = null;
      } else {
        sessionData.timestamp = currentTimeInMs;
        await chrome.storage.session.set({ sessionData });
      }
    }

    if (!sessionData) {
      sessionData = {
        session_id: currentTimeInMs.toString(),
        timestamp: currentTimeInMs,
      };
      await chrome.storage.session.set({ sessionData });
    }
    return sessionData.session_id;
  }

  public async fireEvent(name: string, params: Record<string, any> = {}): Promise<void> {
    if (!params.session_id) {
      params.session_id = await this.getOrCreateSessionId();
    }
    if (!params.engagement_time_msec) {
      params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
    }

    try {
      const response = await fetch(
        `${this.debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
        {
          method: 'POST',
          body: JSON.stringify({
            client_id: await this.getOrCreateClientId(),
            events: [{ name, params }],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (this.debug) {
        console.log(await response.text());
      }
    } catch (e) {
      console.error('Google Analytics request failed with an exception', e);
    }
  }

  public async firePageViewEvent(
    pageTitle: string,
    pageLocation: string,
    additionalParams: Record<string, any> = {},
  ): Promise<void> {
    return this.fireEvent('page_view', {
      page_title: pageTitle,
      page_location: pageLocation,
      ...additionalParams,
    });
  }

  public async fireErrorEvent(error: Record<string, any>, additionalParams: Record<string, any> = {}): Promise<void> {
    return this.fireEvent('extension_error', { ...error, ...additionalParams });
  }
}
