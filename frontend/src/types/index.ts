export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  status: string | null;
  lastSeenAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type ChatType = 'DIRECT' | 'GROUP' | 'SUPERGROUP';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM';

export interface ChatMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  topicId: string | null;
  senderId: string;
  type: MessageType;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
  replyToId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sender: User;
  replyTo?: Message | null;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  isSupergroup: boolean;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  members: ChatMember[];
  displayName: string;
  displayAvatarUrl: string | null;
  lastMessage: Message | null;
}

export interface ApiError {
  error: string;
  details?: Array<{ path: string; message: string }>;
}