export interface ClassroomConfig {
  maxParticipants: number;
  allowScreenShare: boolean;
  allowChat: boolean;
  recordSessions: boolean;
}

export interface ClassroomSession {
  id: string;
  name: string;
  instructorId: string;
  participants: string[];
  isActive: boolean;
  createdAt: Date;
  config: ClassroomConfig;
}

export interface ClassroomParticipant {
  id: string;
  name: string;
  role: 'instructor' | 'student' | 'ta';
  isConnected: boolean;
  permissions: {
    canSpeak: boolean;
    canShare: boolean;
    canChat: boolean;
  };
}

export class ClassroomService {
  private sessions = new Map<string, ClassroomSession>();
  private participants = new Map<string, ClassroomParticipant>();

  async createSession(config: Partial<ClassroomConfig> & { name: string; instructorId: string }): Promise<ClassroomSession> {
    const session: ClassroomSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: config.name,
      instructorId: config.instructorId,
      participants: [],
      isActive: true,
      createdAt: new Date(),
      config: {
        maxParticipants: config.maxParticipants || 50,
        allowScreenShare: config.allowScreenShare ?? true,
        allowChat: config.allowChat ?? true,
        recordSessions: config.recordSessions ?? false
      }
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async joinSession(sessionId: string, participant: Omit<ClassroomParticipant, 'id' | 'isConnected'>): Promise<ClassroomParticipant> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.participants.length >= session.config.maxParticipants) {
      throw new Error('Session is full');
    }

    const participantWithId: ClassroomParticipant = {
      id: Math.random().toString(36).substr(2, 9),
      ...participant,
      isConnected: true
    };

    this.participants.set(participantWithId.id, participantWithId);
    session.participants.push(participantWithId.id);

    return participantWithId;
  }

  async leaveSession(sessionId: string, participantId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants = session.participants.filter(id => id !== participantId);
    }

    const participant = this.participants.get(participantId);
    if (participant) {
      participant.isConnected = false;
    }
  }

  async getSession(sessionId: string): Promise<ClassroomSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      
      // Disconnect all participants
      for (const participantId of session.participants) {
        const participant = this.participants.get(participantId);
        if (participant) {
          participant.isConnected = false;
        }
      }
    }
  }
}