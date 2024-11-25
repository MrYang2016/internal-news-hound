export type TokenSource = 'chat' | 'subtitle' | 'summary' | 'doc' | 'search' | 'study' | 'translate';
export type Product = 'qa' | 'clip' | 'liveSubtitle';
export interface Messages { role: 'system' | 'user' | 'assistant' | 'function', content: string }