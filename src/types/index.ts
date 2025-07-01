export interface ChouseiSanEventData {
  title: string;
  dateCandidates: string[];
  timeFormat?: string;
  memo?: string;
}

export interface ChouseiSanResult {
  success: boolean;
  url?: string;
  message: string;
  error?: string;
}
