import { get, head, put } from '@vercel/blob';

type CallLog = { id: string; at: string; outcome: string; note: string };
type HistoryItem = { id: string; at: string; action: string; note: string };
type LeadMeta = {
  status: string; followUp: string; note: string; priority: string; nextAction: string;
  propertyType: string; location: string; budget: string; timeline: string;
  dealValue?: string; customerOffer?: string; expectedClosingDate?: string; closingProbability?: string;
  negotiationNotes?: string; closedDate?: string; closedProperty?: string; finalRemarks?: string;
  sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string; commissionStatus?: string;
  commissionDueDate?: string; commissionNotes?: string; sellerPaymentDate?: string; sellerPaymentMode?: string; sellerReceiptNo?: string;
  buyerPaymentDate?: string; buyerPaymentMode?: string; buyerReceiptNo?: string;
  buyerName?: string; buyerPhone?: string; sellerName?: string; sellerPhone?: string;
  propertyId?: string; propertyLocation?: string; propertyArea?: string; propertyBedrooms?: string;
  paymentMode?: string; receiptNo?: string; paymentDate?: string;
  callHistory?: CallLog[]; history?: HistoryItem[];
};
const STATUSES = new Set(['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost']);
const PRIORITIES = new Set(['Very Hot', 'Hot', 'Warm', 'Cold']);
const NEXT_ACTIONS = new Set(['Call', 'WhatsApp', 'Site Visit', 'Meeting', 'Send Property Options', 'Follow-up', 'No Action', 'Confirm Site Visit', 'Handover / Commission', 'Reactivation']);
const COMMISSION_STATUS = new Set(['Pending', 'Partial', 'Received']);
const PAYMENT_MODES = new Set(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other']);
const META_PATH = 'crm/lead-meta.json';
const DUPLICATE_WINDOW_MS = 60000;
const MAX_WRITE_RETRIES = 3;
const DEAL_FIELDS = ['dealValue','customerOffer','expectedClosingDate','closingProbability','negotiationNotes','closedDate','closedProperty','finalRemarks','sellerCommissionRate','buyerCommissionRate','commissionReceived','commissionStatus','commissionDueDate','commissionNotes','sellerPaymentDate','sellerPaymentMode','sellerReceiptNo','buyerPaymentDate','buyerPaymentMode','buyerReceiptNo','buyerName','buyerPhone','sellerName','sellerPhone','propertyId','propertyLocation','propertyArea','propertyBedrooms','paymentMode','receiptNo','paymentDate'];
const blobAuth = { oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID };
function getHeader(request: any, name: string) { const value = request?.headers?.[name.toLowerCase()]; return Array.isArray(value) ? value[0] || '' : value || ''; }
function authorized(request: any) { const expected = process.env.DASHBOARD_PASSWORD || ''; return Boolean(expected && getHeader(request, 'authorization') === `Bearer ${expected}`); }
function send(response: any, status: number, body: unknown) { return response.status(status).setHeader('Cache-Control', 'no-store, no-cache, must-revalidate').setHeader('Pragma', 'no-cache').json(body); }
function makeId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function dedupeRecentHistory(items: HistoryItem[]) {
  const ordered = [...items].sort((a,b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const result: HistoryItem[] = [];
  for (const item of ordered) {
    const last = result[result.length - 1];
    const sameAction = last && last.action === item.action;
    const closeInTime = last && Math.abs(new Date(last.at).getTime() - new Date(item.at).getTime()) <= DUPLICATE_WINDOW_MS;
    if (sameAction && closeInTime) continue;
    result.push(item);
  }
  return result.slice(-50);
}
async function readMeta(): Promise<{ data: Record<string, LeadMeta>; etag?: string }> {
  try {
    const info = await head(META_PATH, blobAuth);
    const result = await get(info.url, { access: 'private', useCache: false, ...blobAuth });
    if (!result || result.statusCode !== 200) return { data: {}, etag: info.etag };
    const data = result.stream ? await new Response(result.stream).json() : null;
    if (!data || typeof data !== 'object') return { data: {}, etag: info.etag };
    const normalized = data as Record<string, LeadMeta>;
    for (const leadId of Object.keys(normalized)) {
      const history = Array.isArray(normalized[leadId]?.history) ? normalized[leadId].history : [];
      normalized[leadId] = { ...normalized[leadId], history: dedupeRecentHistory(history) };
    }
    return { data: normalized, etag: info.etag };
  } catch { return { data: {}, etag: undefined }; }
}
async function writeMeta(data: Record<string, LeadMeta>, etag?: string) {
  await put(META_PATH, JSON.stringify(data), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
    ...(etag ? { ifMatch: etag } : {}), ...blobAuth
  });
}
function mergeById<T extends { id: string }>(base: T[], incoming: T[], limit: number) {
  const map = new Map<string, T>();
  for (const item of [...base, ...incoming]) if (item?.id) map.set(item.id, item);
  return [...map.values()].sort((a,b) => String(a.id).localeCompare(String(b.id))).slice(-limit);
}
function isWriteConflict(error: unknown) {
  const value = error as any;
  return value?.name === 'BlobPreconditionFailedError' || value?.constructor?.name === 'BlobPreconditionFailedError' || /precondition|etag/i.test(String(value?.message || ''));
}
export default async function handler(request: any, response: any) {
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized' });
  try {
    if (request.method === 'GET') return send(response, 200, { meta: (await readMeta()).data });
    if (request.method === 'POST') {
      const body = request.body && typeof request.body === 'object' ? request.body : {};
      const leadId = String(body.leadId || body.id || '').trim();
      if (!leadId) return send(response, 400, { error: 'leadId is required' });
      const incoming = body.meta && typeof body.meta === 'object' ? body.meta : {};
      const hasDealPayload = DEAL_FIELDS.some(field => incoming[field] !== undefined);
      for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt += 1) {
        const snapshot = await readMeta();
        const all = snapshot.data;
        const current = all[leadId] || { status:'New', followUp:'', note:'', priority:'Warm', nextAction:'Call', propertyType:'', location:'', budget:'', timeline:'', callHistory:[], history:[] };
        const status = String(incoming.status ?? current.status);
        const priority = String(incoming.priority ?? current.priority);
        const nextAction = String(incoming.nextAction ?? current.nextAction);
        const rawHistory = hasDealPayload ? (current.history || []) : (Array.isArray(incoming.history) ? incoming.history : (current.history || []));
        const rawCalls = Array.isArray(incoming.callHistory) ? incoming.callHistory : (current.callHistory || []);
        const incomingCalls = rawCalls.slice(-30).map((entry: any) => ({ id:String(entry?.id||makeId('call')), at:String(entry?.at||''), outcome:String(entry?.outcome||'').slice(0,50), note:String(entry?.note||'').slice(0,1000) })).filter((entry:CallLog)=>entry.id && entry.at && entry.outcome);
        const callHistory = mergeById(current.callHistory || [], incomingCalls, 30);
        const incomingHistory = rawHistory.slice(-50).map((entry: any) => ({ id:String(entry?.id||makeId('history')), at:String(entry?.at||''), action:String(entry?.action||'').slice(0,100), note:String(entry?.note||'').slice(0,1000) })).filter((entry:HistoryItem)=>entry.id && entry.at && entry.action);
        let history = dedupeRecentHistory(mergeById(current.history || [], incomingHistory, 50));
        const operational = hasDealPayload ? current : null;
        const normalized: LeadMeta = { ...current,
          status:STATUSES.has(status)?status:'New',
          followUp:operational ? current.followUp : String(incoming.followUp ?? current.followUp ?? '').slice(0,10),
          note:operational ? current.note : String(incoming.note ?? current.note ?? '').slice(0,2000),
          priority:operational ? current.priority : (PRIORITIES.has(priority)?priority:'Warm'),
          nextAction:operational ? current.nextAction : (NEXT_ACTIONS.has(nextAction)?nextAction:'Call'),
          propertyType:operational ? current.propertyType : String(incoming.propertyType ?? current.propertyType ?? '').slice(0,100),
          location:operational ? current.location : String(incoming.location ?? current.location ?? '').slice(0,150),
          budget:operational ? current.budget : String(incoming.budget ?? current.budget ?? '').slice(0,100),
          timeline:operational ? current.timeline : String(incoming.timeline ?? current.timeline ?? '').slice(0,100),
          callHistory, history
        };
        if (!hasDealPayload && incoming.activity) {
          const activity = incoming.activity as any;
          const event: HistoryItem = { id: String(activity.id || makeId('activity')), at: String(activity.at || new Date().toISOString()), action: String(activity.action || 'CRM update').slice(0,100), note: String(activity.note || '').slice(0,1000) };
          history = dedupeRecentHistory([...history, event]);
          normalized.history = history;
        }
        if (!hasDealPayload && incoming.smartFollowupApplied === true) {
          const event: HistoryItem = { id: makeId('smart'), at: new Date().toISOString(), action: `Smart Follow-up: ${normalized.nextAction}`, note: `Recommended action applied${normalized.followUp ? ` for ${normalized.followUp}` : ''}.` };
          normalized.history = dedupeRecentHistory([...(normalized.history || history), event]);
        }
        if (hasDealPayload && current.status !== 'Closed' && normalized.status === 'Closed') {
          const events: HistoryItem[] = [{ id: makeId('deal'), at: new Date().toISOString(), action: 'Deal Closed', note: 'Deal Desk closed the lead.' }];
          if (incoming.propertyId) events.push({ id: makeId('property'), at: new Date().toISOString(), action: `Property selected: ${String(incoming.closedProperty || incoming.propertyId).slice(0,200)}`, note: 'Closing property linked from inventory.' });
          if (incoming.commissionDueDate) events.push({ id: makeId('commission'), at: new Date().toISOString(), action: `Commission due set: ${String(incoming.commissionDueDate).slice(0,20)}`, note: 'Closing commission due date recorded.' });
          normalized.history = dedupeRecentHistory([...(normalized.history || []), ...events]);
        }
        if (normalized.status === 'Closed' && !normalized.closedDate) normalized.closedDate = new Date().toISOString().slice(0,10);
        for (const field of DEAL_FIELDS) if (incoming[field] !== undefined) normalized[field as keyof LeadMeta] = String(incoming[field] ?? '').slice(0,2000) as never;
        if (normalized.commissionStatus && !COMMISSION_STATUS.has(normalized.commissionStatus)) normalized.commissionStatus='Pending';
        if (normalized.sellerPaymentMode && !PAYMENT_MODES.has(normalized.sellerPaymentMode)) normalized.sellerPaymentMode='Other';
        if (normalized.buyerPaymentMode && !PAYMENT_MODES.has(normalized.buyerPaymentMode)) normalized.buyerPaymentMode='Other';
        if (normalized.paymentMode && !PAYMENT_MODES.has(normalized.paymentMode)) normalized.paymentMode='Other';
        all[leadId]=normalized;
        try {
          await writeMeta(all, snapshot.etag);
          return send(response,200,{ok:true,leadId,meta:normalized});
        } catch (error) {
          if (!isWriteConflict(error) || attempt === MAX_WRITE_RETRIES - 1) throw error;
        }
      }
    }
    return send(response,405,{error:'Method not allowed'});
  } catch(error){ console.error('lead-meta error',error); return send(response,500,{error:'Unable to access CRM storage.'}); }
}