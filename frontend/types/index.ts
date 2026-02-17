/** JWT payload from backend (userId, orgId, role). Used for tenant isolation in UI. */
export type JwtPayload = {
  userId: string;
  orgId: string;
  role: 'ADMIN' | 'MEMBER';
};

export type User = {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  orgId?: string;
};

export type Org = {
  id: string;
  name: string;
};

export type Group = {
  id: string;
  name: string;
  orgId: string;
  createdAt: string;
};

export type MessageSender = {
  id: string;
  email: string;
};

export type Message = {
  id: string;
  content: string;
  groupId: string;
  createdAt: string;
  user?: MessageSender;
  sender?: MessageSender; // socket receive_message uses sender
};

/** Socket receive_message payload (real-time). */
export type ReceiveMessagePayload = {
  id: string;
  content: string;
  groupId: string;
  sender: MessageSender;
  createdAt: string;
};

export type ApiError = {
  error?: string;
  message?: string;
  errors?: Array< { msg?: string; path?: string } >;
};
