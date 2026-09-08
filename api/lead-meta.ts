import { get, head, put } from '@vercel/blob';

type CallLog = { id: string; at: string; outcome: string; note: string };
type HistoryItem = { id: string; at: string; action: string; note: string };
type LeadMeta = {
  status: string; followUp: string; note: string; priority: string; nextAction: string;
  propertyType: string; location: string; budget: string; timeline: string;
  dealValue?: string; customerOffer?: string; expectedClosingDate?: string; closingProbability?: string;
  negotiationNotes?: string; closedDate?: string; closedProperty?: string; finalRemarks?: string;
  sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string; commissionStatus?: string;
  commissionNotes?: string; sellerPaymentDate?: string; sellerPaymentMode?: string; sellerReceiptNo?: string;
  buyerPaymentDate?: string; buyerPaymentMode?: string; buyerReceiptNo?: string;
  callHistory?: CallLog[]; history?: HistoryItem[];
};
const STATUSES = new Set(['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost']);
const PRIORITIES = new Set(['Very Hot', 'Hot', 'Warm', 'Cold']);
const NEXT_ACTIONS = new Set(['Call', 'WhatsApp', 'Site Visit', 'Meeting', 'Send Property Options', 'Follow-up', 'No Action']);
const COMMISSION_STATUS = new Set(['Pending', 'Partial', 'Received']);
const PAYMENT_MODES = new Set(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other']);
const META_PATH = 'crm/lead-meta.json';
const blobAuth = { oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID };
function getHeader(request: any, name: string) { const value = request?.headers?.[name.toLowerCase()]; return Array.isArray(value) ? value[0] || '' : value || ''; }
function authorized(request: any) { const expected = process.env.DASHBOARD_PASSWORD || ''; return Boolean(expected && getHeader(request, 'authorization') === `Bearer ${expected}`); }
function send(response: any, status: number, body: unknown) { return response.status(status).setHeader('Cache-Control', 'no-store, no-cache, must-revalidate').setHeader('Pragma', 'no-cache').json(body); }
function makeId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
async function readMeta(): Promise<Record<string, LeadMeta>> {
  try {
    const info = await head(META_PATH, blobAuth);
    const result = await get(info.url, { access: 'private', useCache: false, ...blobAuth });
    if (!result || result.statusCode !== 200) return {};
    const data = result.stream ? await new Response(result.stream).json() : null;
    return data && typeof data === 'object' ? data : {};
  } catch { return {}; }
}
async function writeMeta(data: Record<string, LeadMeta>) { await put(META_PATH, JSON.stringify(data), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...blobAuth }); }
function mergeById<T extends { id: string }>(base: T[], incoming: T[], limit: number) {
  const map = new Map<string, T>();
  for (const item of [...base, ...incoming]) if (item?.id) map.set(item.id, item);
  return [...map.values()].sort((a,b) => String(a.id).localeCompare(String(b.id))).slice(-limit);
}
export default async function handler(request: any, response: any) {
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized' });
  try {
    if (request.method === 'GET') return send(response, 200, { meta: await readMeta() });
    if (request.method === 'POST') {
      const body = request.body && typeof request.body === 'object' ? request.body : {};
      const leadId = String(body.leadId || body.id || '').trim();
      if (!leadId) return send(response, 400, { error: 'leadId is required' });
      const all = await readMeta();
      const current = all[leadId] || { status:'New', followUp:'', note:'', priority:'Warm', nextAction:'Call', propertyType:'', location:'', budget:'', timeline:'', callHistory:[], history:[] };
      const incoming = body.meta && typeof body.meta === 'object' ? body.meta : {};
      const status = String(incoming.status ?? current.status);
      const priority = String(incoming.priority ?? current.priority);
      const nextAction = String(incoming.nextAction ?? current.nextAction);
      const rawHistory = Array.isArray(incoming.callHistory) ? incoming.callHistory : (current.callHistory || []);
      const incomingCalls = rawHistory.slice(-30).map((entry: any) => ({ id:String(entry?.id||makeId('call')), at:String(entry?.at||''), outcome:String(entry?.outcome||'').slice(0,50), note:String(entry?.note||'').slice(0,1000) })).filter((entry:CallLog)=>entry.id && entry.at && entry.outcome);
      const callHistory = mergeById(current.callHistory || [], incomingCalls, 30);
      const rawActivity = Array.isArray(incoming.history) ? incoming.history : (current.history || []);
      const incomingHistory = rawActivity.slice(-50).map((entry: any) => ({ id:String(entry?.id||makeId('history')), at:String(entry?.at||''), action:String(entry?.action||'').slice(0,100), note:String(entry?.note||'').slice(0,1000) })).filter((entry:HistoryItem)=>entry.id && entry.at && entry.action);
      let history = mergeById(current.history || [], incomingHistory, 50);
      const normalized: LeadMeta = { ...current, status:STATUSES.has(status)?status:'New', followUp:String(incoming.followUp ?? current.followUp ?? '').slice(0,10), note:String(incoming.note ?? current.note ?? '').slice(0,2000), priority:PRIORITIES.has(priority)?priority:'Warm', nextAction:NEXT_ACTIONS.has(nextAction)?nextAction:'Call', propertyType:String(incoming.propertyType ?? current.propertyType ?? '').slice(0,100), location:String(incoming.location ?? current.location ?? '').slice(0,150), budget:String(incoming.budget ?? current.budget ?? '').slice(0,100), timeline:String(incoming.timeline ?? current.timeline ?? '').slice(0,100), callHistory, history };
      if (incoming.activity) {
        const activity = incoming.activity as any;
        const event: HistoryItem = { id: makeId('activity'), at: new Date().toISOString(), action: String(activity.action || 'CRM update').slice(0,100), note: String(activity.note || '').slice(0,1000) };
        history = [...history, event].slice(-50);
        normalized.history = history;
      }
      if (incoming.smartFollowupApplied === true) {
        const event: HistoryItem = { id: makeId('smart'), at: new Date().toISOString(), action: `Smart Follow-up: ${normalized.nextAction}`, note: `Recommended action applied${normalized.followUp ? ` for ${normalized.followUp}` : ''}.` };
        normalized.history = [...(normalized.history || history), event].slice(-50);
      }
      if (normalized.status === 'Closed' && !normalized.closedDate) normalized.closedDate = new Date().toISOString().slice(0,10);
      const optionalFields = ['dealValue','customerOffer','expectedClosingDate','closingProbability','negotiationNotes','closedDate','closedProperty','finalRemarks','sellerCommissionRate','buyerCommissionRate','commissionReceived','commissionStatus','commissionNotes','sellerPaymentDate','sellerPaymentMode','sellerReceiptNo','buyerPaymentDate','buyerPaymentMode','buyerReceiptNo'];
      for (const field of optionalFields) if (incoming[field] !== undefined) normalized[field as keyof LeadMeta] = String(incoming[field] ?? '').slice(0,2000) as never;
      if (normalized.commissionStatus && !COMMISSION_STATUS.has(normalized.commissionStatus)) normalized.commissionStatus='Pending';
      if (normalized.sellerPaymentMode && !PAYMENT_MODES.has(normalized.sellerPaymentMode)) normalized.sellerPaymentMode='Other';
      if (normalized.buyerPaymentMode && !PAYMENT_MODES.has(normalized.buyerPaymentMode)) normalized.buyerPaymentMode='Other';
      all[leadId]=normalized; await writeMeta(all); return send(response,200,{ok:true,leadId,meta:normalized});
    }
    return send(response,405,{error:'Method not allowed'});
  } catch(error){ console.error('lead-meta error',error); return send(response,500,{error:'Unable to access CRM storage.'}); }
}
