import type { IssueType, ComplaintStatus } from './types';

export type Lang = 'mr' | 'hi' | 'en';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

// Form + UI strings. Marathi is primary (default).
type Dict = Record<string, { mr: string; hi: string; en: string }>;

export const T: Dict = {
  registerComplaint: { mr: 'तक्रार नोंदवा', hi: 'शिकायत दर्ज करें', en: 'Register complaint' },
  photo: { mr: 'फोटो', hi: 'फोटो', en: 'Photo' },
  photoHint: { mr: 'कॅमेरा किंवा गॅलरी', hi: 'कैमरा या गैलरी', en: 'Camera or gallery' },
  issueType: { mr: 'तक्रारीचा प्रकार', hi: 'शिकायत का प्रकार', en: 'Issue type' },
  vasti: { mr: 'वस्ती / भाग', hi: 'बस्ती / क्षेत्र', en: 'Vasti / Area' },
  landmark: { mr: 'खूण (लँडमार्क)', hi: 'लैंडमार्क', en: 'Landmark' },
  landmarkPh: {
    mr: 'गणपती मंदिरासमोर, रेशन दुकानाजवळ',
    hi: 'गणपती मंदिर के सामने, राशन दुकान के पास',
    en: 'Opposite Ganpati temple, near ration shop',
  },
  galli: { mr: 'गल्ली / घर तपशील (ऐच्छिक)', hi: 'गली / घर विवरण (वैकल्पिक)', en: 'Galli / house detail (optional)' },
  description: { mr: 'तपशील (ऐच्छिक)', hi: 'विवरण (वैकल्पिक)', en: 'Description (optional)' },
  name: { mr: 'नाव', hi: 'नाम', en: 'Name' },
  mobile: { mr: 'मोबाईल नंबर', hi: 'मोबाइल नंबर', en: 'Mobile number' },
  submit: { mr: 'तक्रार पाठवा', hi: 'शिकायत भेजें', en: 'Submit complaint' },
  submitting: { mr: 'पाठवत आहे...', hi: 'भेज रहे हैं...', en: 'Submitting...' },
  required: { mr: 'आवश्यक', hi: 'आवश्यक', en: 'Required' },
  selectOne: { mr: 'निवडा', hi: 'चुनें', en: 'Select' },
  checkStatus: { mr: 'स्थिती तपासा', hi: 'स्थिति देखें', en: 'Check status' },
  ticketId: { mr: 'तक्रार क्रमांक', hi: 'टिकट क्रमांक', en: 'Ticket ID' },
  successTitle: { mr: 'तक्रार नोंदवली!', hi: 'शिकायत दर्ज हुई!', en: 'Complaint registered!' },
  successHint: {
    mr: 'हा क्रमांक जपून ठेवा. स्थिती तपासण्यासाठी वापरा.',
    hi: 'यह क्रमांक संभाल कर रखें. स्थिति देखने के लिए उपयोग करें.',
    en: 'Save this number to check the status later.',
  },
  invalidMobile: { mr: '१० अंकी मोबाईल नंबर टाका', hi: '10 अंकों का मोबाइल नंबर डालें', en: 'Enter a valid 10-digit mobile number' },
  locationOn: { mr: 'स्थान जोडले', hi: 'स्थान जोड़ा गया', en: 'Location added' },
  locationOff: { mr: 'स्थानाशिवाय (पत्ता पुरेसा)', hi: 'बिना स्थान (पता पर्याप्त)', en: 'No location (address is enough)' },
};

export const ISSUE_TYPES: { value: IssueType; mr: string; hi: string; en: string }[] = [
  { value: 'garbage', mr: 'कचरा', hi: 'कचरा', en: 'Garbage' },
  { value: 'water_pipeline', mr: 'पाणी-पाईपलाईन गळती', hi: 'पानी-पाइपलाइन रिसाव', en: 'Water-pipeline leak' },
  { value: 'drainage', mr: 'ड्रेनेज', hi: 'ड्रेनेज', en: 'Drainage' },
  { value: 'road_pothole', mr: 'रस्ता-खड्डे', hi: 'सड़क-गड्ढे', en: 'Road-potholes' },
  { value: 'streetlight', mr: 'पथदिवे', hi: 'स्ट्रीट लाइट', en: 'Streetlight' },
  { value: 'other', mr: 'इतर', hi: 'अन्य', en: 'Other' },
];

export function issueLabel(v: IssueType, lang: Lang = 'mr') {
  return ISSUE_TYPES.find((i) => i.value === v)?.[lang] ?? v;
}

export const STATUS_META: Record<
  ComplaintStatus,
  { mr: string; hi: string; en: string; color: string }
> = {
  new: { mr: 'नवीन', hi: 'नई', en: 'New', color: '#dc2626' },
  in_progress: { mr: 'सुरू आहे', hi: 'प्रगति पर', en: 'In Progress', color: '#d97706' },
  resolved: { mr: 'सोडवली', hi: 'हल हुई', en: 'Resolved', color: '#16a34a' },
  rejected: { mr: 'नाकारली', hi: 'अस्वीकृत', en: 'Rejected', color: '#6b7280' },
};

export function tt(key: keyof typeof T, lang: Lang) {
  return T[key]?.[lang] ?? T[key]?.en ?? key;
}
